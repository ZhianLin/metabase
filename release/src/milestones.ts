import _ from "underscore";
import 'zx/globals';

import { findMilestone, getMilestoneIssues, getMilestones } from "./github";
import { getLinkedIssues, getPRsFromCommitMessage, getBackportSourcePRNumber } from "./linked-issues";
import type { Issue, GithubProps, Milestone } from "./types";
import {
  getMajorVersion,
  getVersionFromReleaseBranch,
} from "./version-helpers";

function isBackport(pullRequest: Issue) {
  return pullRequest.title.includes('backport') ||
    (
      Array.isArray(pullRequest.labels) &&
      pullRequest.labels.some((label) => label.name === 'was-backported')
    );
}

// for auto-setting milestones, we don't ever want to auto-set a patch milestone
// which we release VERY rarely
function ignorePatches(version: string) {
  return version.split('.').length < 4;
}

function versionSort(a: string, b: string) {
  const [aMajor, aMinor] = a.split('.').map(Number);
  const [bMajor, bMinor] = b.split('.').map(Number);

  if (aMajor !== bMajor) {
    return aMajor - bMajor;
  }

  if (aMinor !== bMinor) {
    return aMinor - bMinor;
  }

  return 0;
}

const isNotNull = <T>(value: T | null): value is T => value !== null;

const excludedLabels = [
  '.CI & Tests',
  '.Building & Releasing',
  'Type:Documentation',
];

function shouldExcludeIssueFromMilestone(issue: Issue) {
  if (!Array.isArray(issue.labels)) {
    return false;
  }

  const excludedLabel = issue.labels?.find((label) => label.name && excludedLabels.includes(label.name));

  if (excludedLabel) {
    console.log(`  Issue ${issue.number} has excluded label ${excludedLabel?.name}`);
  }

  return !!excludedLabel;
}

async function getIssuesWithExludedTags({
  github,
  owner,
  repo,
  issueNumbers,
  releaseMilestone,
}: GithubProps & { issueNumbers: number[], releaseMilestone: Milestone }) {
  const issues = await Promise.all(
    issueNumbers.map((issueNumber) => getIssueWithCache({
      github,
      owner,
      repo,
      issueNumber,
    }))
  );

  return new Set(issues
    .filter(isNotNull)
    .filter((issue) => shouldExcludeIssueFromMilestone(issue))
    .map((issue) => issue.number));
}

async function getIssuesWithOlderMilestones({
  github,
  owner,
  repo,
  issueNumbers,
  releaseMilestone,
}: GithubProps & { issueNumbers: number[], releaseMilestone: Milestone }) {
  const issues = await Promise.all(
    issueNumbers.map((issueNumber) =>  getIssueWithCache({
      github,
      owner,
      repo,
      issueNumber,
    }))
  );

  return new Set(issues
    .filter(isNotNull)
    .filter((issue) => {
      if (issue.milestone) {
        if (versionSort(issue.milestone.title, releaseMilestone.title) < 0) {
          console.log(`  Issue #${issue.number} is in an older milestone`, issue.milestone.title);
          return true;
        }
      }

      return false;
    }).map((issue) => issue.number));
}

const _issueCache: Record<number, Issue> = {};

const getIssueWithCache = async({
  github,
  owner,
  repo,
  issueNumber,
}: GithubProps & { issueNumber: number }) => {
  if (_issueCache[issueNumber]) {
    return _issueCache[issueNumber];
  }

  const issue = await github.rest.issues.get({
    owner,
    repo,
    issue_number: issueNumber,
  }).catch((err) => {
    console.log(err);
    return null;
  });

  if (issue?.data) {
    _issueCache[issueNumber] = issue.data as Issue;
  }

  return issue?.data as Issue | null;
}

async function getOriginalIssues({
  github,
  repo,
  owner,
  issueNumber,
}: GithubProps & { issueNumber: number }) {
  // every PR in the release branch should have a pr number
  // it could be a backport PR or an original PR
  const issue = await getIssueWithCache({
    github,
    owner,
    repo,
    issueNumber,
  });

  if (!issue) {
    console.log(`Issue ${issueNumber} not found`);
    return [];
  }

  if (issue.body && isBackport(issue)) {
    const sourcePRNumber = getBackportSourcePRNumber(issue.body);
    if (sourcePRNumber && sourcePRNumber !== issueNumber) {
      console.log('found backport PR', issue.number, 'source PR', sourcePRNumber);
      return getOriginalIssues({
        github,
        repo,
        owner,
        issueNumber: sourcePRNumber,
      });
    }
  }

  const linkedIssues = await getLinkedIssues(issue.body ?? '');

  if (issue.pull_request && linkedIssues) {
    console.log('found linked issues for', issue.number, linkedIssues);
    return linkedIssues.map(Number);
  }
  console.log("no linked issues found in body", issue.number);
  return [issue.number];
}

async function setMilestone({ github, owner, repo, issueNumber, milestone }: GithubProps & { issueNumber: number, milestone: Milestone }) {
  // we can use this for both issues and PRs since they're the same for many purposes in github
  const issue = await github.rest.issues.get({
    owner,
    repo,
    issue_number: issueNumber,
  });

  if (!issue.data.milestone) {
    return github.rest.issues.update({
      owner,
      repo,
      issue_number: issueNumber,
      milestone: milestone.number,
    });
  }

  const existingMilestone = issue.data.milestone;

  if (existingMilestone.number === milestone.number) {
    console.log(`Issue ${issueNumber} is already tagged with this ${milestone.title} milestone`);
    return;
  }

  const existingMilestoneIsNewer = versionSort(existingMilestone.title, milestone.title) > 0;

  // if existing milestone is newer, change it
  if (existingMilestoneIsNewer) {
    console.log(`Changing milestone from ${existingMilestone.title} to ${milestone.title}`);

    await github.rest.issues.update({
      owner,
      repo,
      issue_number: issueNumber,
      milestone: milestone.number,
    });
  }

  const commentBody = existingMilestoneIsNewer
    ? `🚀 This should also be released by [v${existingMilestone.title}](${existingMilestone.html_url})`
    : `🚀 This should also be released by [v${milestone.title}](${milestone.html_url})`;

  console.log(`Adding comment to issue ${issueNumber} that already has milestone ${existingMilestone.title}`);

  return github.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body: commentBody,
  });
}

// get the next open milestone (e.g. 0.57.8) for the given major version (e.g 57)
export function getNextMilestone(
  { openMilestones, majorVersion }:
  { openMilestones: Milestone[], majorVersion: number | string }
): Milestone | undefined {
  const milestonesForThisMajorVersion = openMilestones
    .filter(milestone => milestone.title.startsWith(`0.${majorVersion}`))
    .filter(milestone => ignorePatches(milestone.title))
    .sort((a, b) => versionSort(a.title, b.title));

  const nextMilestone = milestonesForThisMajorVersion[0];

  return nextMilestone;
}

export async function setMilestoneForCommits({
  github,
  owner,
  repo,
  branchName,
  commitMessages,
}: GithubProps & { commitMessages: string[], branchName: string}) {
  // figure out milestone
  const branchVersion = getVersionFromReleaseBranch(branchName);
  const majorVersion = getMajorVersion(branchVersion);
  const openMilestones = await getMilestones({ github, owner, repo });
  const nextMilestone = getNextMilestone({ openMilestones, majorVersion });

  if (!nextMilestone) {
    throw new Error(`No open milestone found for major version ${majorVersion}`);
  }

  console.log('Next milestone:', nextMilestone.title);

  // figure out issue or PR
  const PRsToCheck = _.uniq(
    commitMessages
      .flatMap(getPRsFromCommitMessage)
      .filter(isNotNull)
  );
  if (!PRsToCheck.length) {
    throw new Error('No PRs found in commit messages');
  }

  console.log(`Checking ${PRsToCheck.length} PRs for issues to tag`);

  const issuesToTag = [];

  for (const prNumber of PRsToCheck) { // for loop to avoid rate limiting
    issuesToTag.push(...(await getOriginalIssues({
      github,
      owner,
      repo,
      issueNumber: prNumber,
    })));
  }

  const uniqueIssuesToTag = _.uniq(issuesToTag);

  console.log(`Tagging ${uniqueIssuesToTag.length} issues with milestone ${nextMilestone.title}`)

  for (const issueNumber of uniqueIssuesToTag) { // for loop to avoid rate limiting
    await setMilestone({ github, owner, repo, issueNumber, milestone: nextMilestone });
  }
}

const issueLink = (
  { owner, repo, issueNumber }:
  { owner: string, repo: string, issueNumber: number }
) => `https://github.com/${owner}/${repo}/issues/${issueNumber}`;

export async function checkMilestoneForRelease({
  github,
  owner,
  repo,
  version,
  commitHash,
}: GithubProps & { version: string, commitHash: string }) {
  const releaseMilestone = await findMilestone({ github, owner, repo, version });

  if (!releaseMilestone) {
    throw new Error(`No open milestone found for ${version}`);
  }

  const closedMilestoneIssues = await getMilestoneIssues({ github, owner, repo, version });

  const lastTag = `v0.50.6`; // TODO: figure out how to get this

  const commits = await github.rest.repos.compareCommitsWithBasehead({
    owner,
    repo,
    basehead: `${lastTag}...${commitHash}`,
  });

  console.log(`Found ${commits.data.commits.length} commits in release branch`);
  console.log(`Found ${closedMilestoneIssues.length} issues in milestone`);

  const milestoneIssueSet = new Set(closedMilestoneIssues.map(issue => issue.number));
  const commitIssueSet = new Set<number>();

  // make sure every commit in the release branch has a corresponding issue in the milestone
  const commitIssueMap: Record<string, number[]> = {};
  const issueCommitMap: Record<number, string> = {};

  for (const commit of commits.data.commits) {
    const prNumbers = getPRsFromCommitMessage(commit.commit.message);
    if (!prNumbers) {
      console.log('No PRs found in commit message', commit.commit.message);
      continue;
    }

    const issueNumbers: number[] = [];

    for (const prNumber of prNumbers) {
      if (issueNumbers.includes(prNumber)) {
        continue;
      }
      issueNumbers.push(...(await getOriginalIssues({
        github,
        owner,
        repo,
        issueNumber: prNumber,
      })));
    }

    const uniqueIssues = _.uniq(issueNumbers.filter(isNotNull));
    commitIssueMap[commit.sha] = uniqueIssues;

    uniqueIssues.forEach(issueNumber => {
      commitIssueSet.add(issueNumber);
      issueCommitMap[issueNumber] = commit.sha;
    });
  }

  for (const hash in commitIssueMap) {
    console.log(chalk.blue(`${hash}`));
    commitIssueMap[hash].forEach(issueNumber => {
      if (milestoneIssueSet.has(issueNumber)) {
        console.log(chalk.green(`  Issue #${issueNumber} is in milestone`));
      } else {
        console.log(
          chalk.red(`  Issue #${issueNumber} is not in milestone`),
          `(${issueLink({ owner, repo, issueNumber })})`
        );
      }
    });
  }

  // node 22 come quickly so we can just use A.difference(B) 🙏
  const issuesInMilestoneNotInCommits = closedMilestoneIssues
    .filter(issue => !commitIssueSet.has(issue.number));

  const issuesInOlderMilestones = await getIssuesWithOlderMilestones({
    github,
    owner,
    repo,
    issueNumbers: Array.from(commitIssueSet),
    releaseMilestone,
  });

  const issuesWithExcludedTags = await getIssuesWithExludedTags({
    github,
    owner,
    repo,
    issueNumbers: Array.from(commitIssueSet),
    releaseMilestone,
  });

  const issuesInCommitsNotInMilestone = Array.from(commitIssueSet)
    .filter(issueNumber => (
      !milestoneIssueSet.has(issueNumber) &&
      !issuesInOlderMilestones.has(issueNumber) &&
      !issuesWithExcludedTags.has(issueNumber)
    ));

  console.log('Closed Issues in milestone but not in commits:',
    issuesInMilestoneNotInCommits.map(
      issue => `\n  #${issue.number} (${issueLink({ owner, repo, issueNumber: issue.number })})`).join('')
  );

  for (const issue of issuesInMilestoneNotInCommits) {
    await addIssueToProject({
      github,
      owner: 'metabase',
      repo: 'metabase',
      issueNumber: issue.number,
      version: 'v0.50.7',
      comment: 'Issue in milestone, cannot find commit'
    });
  }

  console.log('Issues in commits but not in milestone:',
    issuesInCommitsNotInMilestone.map(
      issueNumber => `\n  #${issueNumber} (${issueLink({ owner, repo, issueNumber })})`).join('')
  );

  for (const issueNumber of issuesInCommitsNotInMilestone) {
    await addIssueToProject({
      github,
      owner,
      repo,
      issueNumber: issueNumber,
      version,
      comment: 'Issue in release branch, needs milestone'
    });
  }
};

function githubGraphQLQuery(query: string) {
  return fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    },
    body: JSON.stringify({ query }),
  }).then((res) => res.json());
}

const releaseIssueProject = {
  id: 'PVT_kwDOAKCINc4Ajw5A',
  commentColId: 'PVTF_lADOAKCINc4Ajw5AzgcE7NA',
  versionColId: 'PVTF_lADOAKCINc4Ajw5AzgcE7PY',
}

async function addIssueToProject({
  github,
  owner,
  repo,
  issueNumber,
  comment,
  version,
}: GithubProps & { issueNumber: number, comment: string, version: string }) {

  console.log(`Adding issue #${issueNumber} to project`)

  const issue = await getIssueWithCache({
    github,
    owner,
    repo,
    issueNumber,
  });

  if (!issue) {
    console.log(`Issue ${issueNumber} not found`);
    return;
  }

  const response = await githubGraphQLQuery(`mutation {
    addProjectV2ItemById(input: {
      projectId: "${releaseIssueProject.id}",
      contentId: "${issue?.node_id}"
    })
    { item { id } }
  }`);

  const itemId = response.data.addProjectV2ItemById.item.id;

  await github.graphql(`mutation {
    updateProjectV2ItemFieldValue( input: {
      projectId: "${releaseIssueProject.id}"
      itemId: "${itemId}"
      fieldId: "${releaseIssueProject.commentColId}"
      value: { text: "${comment}" } }
    )
    { projectV2Item { id } }
  }`);

  await github.graphql(`mutation {
    updateProjectV2ItemFieldValue( input: {
      projectId: "${releaseIssueProject.id}"
      itemId: "${itemId}"
      fieldId: "${releaseIssueProject.versionColId}"
      value: { text: "${version}" } }
    )
    { projectV2Item { id } }
  }`);
}

// FIXME Test Code
import 'dotenv/config';
import { Octokit } from '@octokit/rest';
const github = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

await checkMilestoneForRelease({
  github,
  owner: 'metabase',
  repo: 'metabase',
  version: 'v0.50.7',
  commitHash: 'c3f115f00845e146acb4c26f5646fbe305aa735b',
});

// await addIssueToProject({
//   github,
//   owner: 'metabase',
//   repo: 'metabase',
//   issueNumber: 44453,
//   version: 'v0.50.7',
//   comment: 'Issue in milestone, cannot find commit'
// });
