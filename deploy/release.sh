#!/usr/bin/env bash
#
# Deploys what is on origin/main to the server set up by setup-server.sh.
# Run from your machine (npm run deploy), with the server's SSH address:
#
#   DEPLOY_HOST=<user>@<server> npm run deploy
#
# Sends `git archive origin/main` over SSH, so the server needs no GitHub access
# and local uncommitted changes are never deployed. The server builds, swaps the
# release in and checks it (see server-release.sh).

set -euo pipefail

if [[ -z ${DEPLOY_HOST:-} ]]; then
  echo "Set DEPLOY_HOST to the server's SSH address, e.g. DEPLOY_HOST=me@tools.example.com" >&2
  exit 1
fi

cd "$(git rev-parse --show-toplevel)"
git fetch --quiet origin main
echo "==> Deploying $(git log -1 --format='%h %s' origin/main) to $DEPLOY_HOST"
git archive --format=tar origin/main | ssh "$DEPLOY_HOST" cctv-tools-release
