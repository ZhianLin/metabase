git reset HEAD~1
rm ./backport.sh
git cherry-pick 9b305a03e68cb0bdbd9af5b79753d06b4ff514f0
echo 'Resolve conflicts and force push this branch'
