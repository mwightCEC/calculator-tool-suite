#!/usr/bin/env bash
#
# Server half of a release; installed as /usr/local/bin/cctv-tools-release by
# setup-server.sh. Reads a tar of the repository on stdin (deploy/release.sh
# sends `git archive origin/main`), builds the Next.js standalone server, swaps
# it in, restarts the service and checks /api/health. If the check fails, the
# previous release is put back.
#
# Builds on the server, not on your machine: the standalone output includes
# platform-specific binaries (sharp), so a macOS build would not run on Linux.

set -euo pipefail

SERVICE=cctv-tools
BASE_DIR=${CCTV_TOOLS_DIR:-/opt/cctv-tools}
HEALTH_URL=http://127.0.0.1:3000/api/health

# Built next to the live release so the final swap is a rename on one filesystem.
WORK=$(mktemp -d "$BASE_DIR/release.XXXXXX")
trap 'rm -rf "$WORK"' EXIT

echo "==> Unpacking source"
mkdir "$WORK/src"
tar -x -C "$WORK/src"

echo "==> Installing dependencies and building"
cd "$WORK/src"
npm ci --no-audit --no-fund
NEXT_TELEMETRY_DISABLED=1 npm run build -w @cctv/web

echo "==> Assembling the release"
# Same layout as the Dockerfile's runner stage.
WEB=apps/web
mkdir "$WORK/app"
cp -a "$WEB/.next/standalone/." "$WORK/app/"
cp -a "$WEB/.next/static" "$WORK/app/$WEB/.next/static"
cp -a "$WEB/public" "$WORK/app/$WEB/public"
cd "$BASE_DIR"

restart() {
  sudo -n /usr/bin/systemctl restart "$SERVICE"
}

healthy() {
  for _ in $(seq 1 15); do
    if curl -fsS "$HEALTH_URL" > /dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

echo "==> Switching to the new release"
rm -rf "$BASE_DIR/app.previous"
if [[ -d $BASE_DIR/app ]]; then
  mv "$BASE_DIR/app" "$BASE_DIR/app.previous"
fi
mv "$WORK/app" "$BASE_DIR/app"
restart

if healthy; then
  echo "==> Release is live"
  exit 0
fi

echo "!! Health check failed: $HEALTH_URL" >&2
if [[ -d $BASE_DIR/app.previous ]]; then
  echo "!! Restoring the previous release" >&2
  rm -rf "$BASE_DIR/app"
  mv "$BASE_DIR/app.previous" "$BASE_DIR/app"
  restart
fi
echo "!! See the logs with: journalctl -u $SERVICE -n 50" >&2
exit 1
