#!/bin/bash
# @author DHENRY for mytinydc.com
# @license AGPL3

set -e

source .envlocaldev
# login to github
echo "${CR_PAT}" | docker login ghcr.io --username "${USERNAME}" --password-stdin

# jq is needed
which jq >/dev/null 2>&1
if [ "$?" == "1" ]; then
    echo "You have to install jq package"
    exit 1
fi
IMAGE="ghcr.io/${USERNAME}/utdon"
PLATFORMS="amd64 arm64"
TAG=$(jq '.version' package.json | sed -E 's/^"|"$//g')
PROGRESS="--progress plain"
#NOCACHE="--no-cache"

# Build images
for platform in ${PLATFORMS}
do
    # Build
    podman build ${PROGRESS} ${NOCACHE} \
        --platform="linux/${platform}" \
        -t "${IMAGE}":"${platform}-${TAG}" \
        -f Dockerfile \
        .
done
images=$(for platform in ${PLATFORMS}; do echo "${IMAGE}:${platform}-${TAG}"; done | xargs)

# Reset manifests
echo "[*] Deleting existing manifest ${IMAGE}:${TAG}"
podman manifest rm "${IMAGE}":"${TAG}" 2>/dev/null || true

echo "[*] Deleting existing manifest ${IMAGE}:latest"
podman manifest rm "${IMAGE}":"lastest" 2>/dev/null || true

# Reset images
echo "[*] Deleting existing image ${IMAGE}:${TAG}"
podman image rm "${IMAGE}":"${TAG}" 2>/dev/null || true

echo "[*] Deleting existing image ${IMAGE}:latest"
podman image rm "${IMAGE}":"lastest" 2>/dev/null || true

echo "[*] Creating manifest ${IMAGE}:${TAG} from ${images}"
# shellcheck disable=SC2086
podman manifest create "${IMAGE}":"${TAG}" ${images}

echo "[*] Pushing manifest ${IMAGE}:${TAG} to the registry"
podman manifest push --all "${IMAGE}":"${TAG}" "${IMAGE}":latest
