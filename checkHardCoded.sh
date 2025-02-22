#!/usr/bin/env bash
set -eu

env="./.envTest"
if [ ! -f "${env}" ]; then
  echo "You have to set env file (from ${env}-sample)"
fi

. "${env}"

files=$(git diff --name-only | xargs)
for word in ${HARCODEDGREP}; do
  for file in ${files}; do
    if grep "${word}" "${file}" >/dev/null; then
      echo "Word: ${word} found in file: ${file}"
    fi
  done
done
