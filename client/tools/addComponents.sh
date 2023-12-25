#!/bin/bash

# @author DHENRY for mytinydc.com
# @license AGPL3

# ask
# - Composant Name

pathComponent="src/components"
pathTemplate="tools/tplComponents"

echo "****************************************"
echo "* Tool : Create New Component"
echo "****************************************"
echo ""
read -p "  [INFO] Provide the name of new component: " component
echo ""

if [ "$component" == "" ]; then
    echo "[ERROR] You have to provide new component name"
    exit 1
fi

files="TPL.scss TPL.stories.tsx TPL.tsx"

for file in $files; do
    finalFileName=$(echo $file | sed -E "s/TPL/$component/")
    if [ -f "$pathComponent/$finalFileName" ]; then
        echo "[WARN] $pathComponent/$finalFileName already exists"
        continue
    fi
    echo Copying "$pathTemplate/$file to $pathComponent/$finalFileName"
    cp "$pathTemplate/$file" "$pathComponent/$finalFileName"
    if [ -f "$pathComponent/$finalFileName" ]; then
        sed -E -i "s/TPL/$component/g" "$pathComponent/$finalFileName"
    else
        echo "[ERROR] File $pathComponent/$finalFileName doesn't exist, impossible to continue"
        exit 1
    fi
done
