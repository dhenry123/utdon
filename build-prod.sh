#!/bin/bash
# @author DHENRY for mytinydc.com
# @license AGPL3

# Prepare buildx multiarch
# sudo docker buildx create --name multiarch --use

# jq is needed
which jq >/dev/null 2>&1
if [ "$?" == "1" ]; then
    echo "You have to install jq package"
    exit 1
fi
NOCACHE="--no-cache"
PLATFORM="--platform=linux/arm64,linux/amd64"
TAG=$(jq '.version' package.json | sed -E 's/^"|"$//g')
#PROGRESS="--progress plain"
sudo docker buildx build --push $PROGRESS $NOCACHE $PLATFORM -t ghcr.io/dhenry123/utdon:$TAG -f Dockerfile .
