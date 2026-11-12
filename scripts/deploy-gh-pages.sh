#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build
TMP=$(mktemp -d)
cp -r dist/. "$TMP/"
cd "$TMP"
git init -b gh-pages
git add -A
git commit -m "Deploy Cozy Diary $(date -u +%Y-%m-%dT%H:%MZ)"
git remote add origin https://github.com/Balanyukfed/english-cozy-diary.git
git push -f origin gh-pages
cd /
rm -rf "$TMP"
echo "Live: https://balanyukfed.github.io/english-cozy-diary/"
