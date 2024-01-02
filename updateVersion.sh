#!/bin/bash
# Increment version
if [ "$1" != "major" ] && [ "$1" != "minor" ] && [ "$1" != "patch" ]; then
  echo "You have to provide, the kind of increment"
  echo "major|minor|patch"
  exit 1
fi

read -p "Do you confirm version update (y/N) ? " confirm

if [ "$confirm" == "y" ]; then
  # package.json server && UI
  npm version --no-git-tag-version "$1" && cd client && npm version --no-git-tag-version "$1" && cd ..
  newversion=$(jq '.version' package.json | sed -E 's/"//g')
  # constants file
  constFile="src/Constants.ts"
  sed -i "s/APPLICATION_VERSION.*$/APPLICATION_VERSION = \"$newversion\";/" "$constFile"
  grep APPLICATION_VERSION "$constFile"
fi
