#!/usr/bin/env bash
# Change the store app id everywhere it is hardcoded.
# Usage: scripts/set-app-id.sh com.aamir.quransafar
# Does not build, sign, or publish. Run it only after the final id is confirmed.
set -euo pipefail
NEW="${1:-}"
if ! [[ "$NEW" =~ ^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$ ]]; then
  echo "Usage: scripts/set-app-id.sh com.example.app" >&2
  echo "The id must be a reverse-domain name (letters, digits, underscore)." >&2
  exit 1
fi
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OLD="$(node -p "require('$ROOT/capacitor.config.json').appId")"
if [[ "$OLD" == "$NEW" ]]; then
  echo "App id is already $NEW"
  exit 0
fi
echo "Changing app id: $OLD -> $NEW"

python3 - "$ROOT" "$OLD" "$NEW" << 'PY'
import pathlib, sys
root, old, new = sys.argv[1:]
files = [
    "capacitor.config.json",
    "android/app/build.gradle",
    "android/app/src/main/res/values/strings.xml",
    "ios/App/App.xcodeproj/project.pbxproj",
    "README.md",
    "docs/APP_DETAILS.md",
]
java = pathlib.Path(root, "android/app/src/main/java", *old.split("."), "MainActivity.java")
files.append(str(java.relative_to(root)))
for rel in files:
    p = pathlib.Path(root, rel)
    if not p.is_file():
        raise SystemExit(f"missing {rel}")
    text = p.read_text()
    if old not in text:
        raise SystemExit(f"{rel} does not contain {old}")
    p.write_text(text.replace(old, new))
    print(f"  updated {rel}")
PY

OLD_DIR="$ROOT/android/app/src/main/java/$(echo "$OLD" | tr . /)"
NEW_DIR="$ROOT/android/app/src/main/java/$(echo "$NEW" | tr . /)"
if [[ -d "$OLD_DIR" ]]; then
  mkdir -p "$(dirname "$NEW_DIR")"
  mv "$OLD_DIR" "$NEW_DIR"
  # remove empty parents left behind (com/aamir/oldname)
  d="$(dirname "$OLD_DIR")"
  while [[ "$d" == "$ROOT/android/app/src/main/java/"* ]]; do
    rmdir "$d" 2>/dev/null || break
    d="$(dirname "$d")"
  done
  echo "  moved Java package directory"
fi

echo "Done. iOS CI reads the id from capacitor.config.json."
echo "Next, on a machine with the SDK: npx cap sync"
echo "The id cannot be changed after the first store upload."
