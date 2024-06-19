git reset HEAD~1
rm ./backport.sh
git cherry-pick 3f788bbaf2dac001ffa601bff36c2e0f5a1c997d
echo 'Resolve conflicts and force push this branch'
