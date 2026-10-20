#!/usr/bin/env bash
# Run this YOURSELF, once, on your own computer. Never commit the output.
# Creates android/release.keystore + android/keystore.properties (both gitignored).
# BACK UP the keystore and passwords: if lost, you can never update the app on Google Play
# (unless you enrolled in Play App Signing with an upload key, which is the default and recommended).
set -euo pipefail
cd "$(dirname "$0")/../android"
[ -f release.keystore ] && { echo "android/release.keystore already exists - refusing to overwrite."; exit 1; }
read -rp "Key alias [noorquran]: " ALIAS; ALIAS=${ALIAS:-noorquran}
read -rsp "Keystore password (min 6 chars): " PW; echo
read -rp "Your name / organisation (for certificate): " CN
keytool -genkeypair -v -keystore release.keystore -alias "$ALIAS" -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass "$PW" -keypass "$PW" -dname "CN=${CN}, O=${CN}, C=PK"
cat > keystore.properties <<P
ANDROID_KEYSTORE_FILE=../release.keystore
ANDROID_KEYSTORE_PASSWORD=$PW
ANDROID_KEY_ALIAS=$ALIAS
ANDROID_KEY_PASSWORD=$PW
P
chmod 600 keystore.properties release.keystore
echo "Done. For GitHub Actions add secrets: ANDROID_KEYSTORE_BASE64 (base64 -w0 android/release.keystore), ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS, ANDROID_KEY_PASSWORD"
