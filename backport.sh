git reset HEAD~1
rm ./backport.sh
git cherry-pick 172c7cc3afae69dad0a47a85227467cc63b995b5
echo 'Resolve conflicts and force push this branch'
