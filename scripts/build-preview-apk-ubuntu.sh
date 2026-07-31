#!/usr/bin/env bash
# Run on the Ubuntu build machine after syncing this repo to:
#   /home/bhuguard/bhuguard-mobile
set -euo pipefail

cd /home/bhuguard/bhuguard-mobile
export EAS_LOCAL_BUILD_ARTIFACTS_DIR="$PWD/dist"
mkdir -p "$EAS_LOCAL_BUILD_ARTIFACTS_DIR"

npx eas-cli@latest build \
  --platform android \
  --profile preview \
  --local \
  --non-interactive

echo ""
echo "APK artifacts directory: $EAS_LOCAL_BUILD_ARTIFACTS_DIR"
ls -lah "$EAS_LOCAL_BUILD_ARTIFACTS_DIR" || true
find "$EAS_LOCAL_BUILD_ARTIFACTS_DIR" -name "*.apk" -print 2>/dev/null || true
