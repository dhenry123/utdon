#!/bin/bash
# @author DHENRY for mytinydc.com
# @license AGPL3

set -e

# create this file and set env LOCALREGISTRY=[Your local container registry]
source .envlocaldev

# jq is needed
which jq >/dev/null 2>&1
if [ "$?" == "1" ]; then
    echo "You have to install jq package"
    exit 1
fi
TAG=$(jq '.version' package.json | sed -E 's/^"|"$//g')
#PROGRESS="--progress plain"
#NOCACHE="--no-cache"
PLATFORM="--platform=linux/arm64"
echo "Building image $LOCALREGISTRY:$TAG"
sudo docker buildx build --load $PROGRESS $NOCACHE $PLATFORM -t $LOCALREGISTRY:$TAG -f Dockerfile-dev .
echo "Pushing image $LOCALREGISTRY:$TAG"
sudo docker push "$LOCALREGISTRY":"$TAG"
