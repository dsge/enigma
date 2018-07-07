#!/bin/sh
git init ~/deploy

cd ~/deploy

git remote add pages "https://$GITHUB_TOKEN@github.com/$TRAVIS_REPO_SLUG.git"
git fetch pages
git checkout gh-pages

cp -r $TRAVIS_BUILD_DIR/dist/enigma/ ~/deploy

#remove all gitignore files to make sure we can commit all files from the public folder to github pages
find . -name ".gitignore" -type f -delete

git config user.email 'deploy@travis-ci.org'
git config user.name 'Deployment Bot (from Travis CI)'

git add . --all && git commit -m "Travis auto deploy"

git push -f pages gh-pages > /dev/null 2>&1
