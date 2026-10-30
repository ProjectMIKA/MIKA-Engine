#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

VERSION="$(node -p "require('./package.json').version")"
SDK_ROOT="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-/usr/local/lib/android/sdk}}"

if [ ! -d "$SDK_ROOT" ]; then
    echo "Error: Android SDK not found at $SDK_ROOT" >&2
    exit 1
fi

BUILD_TOOLS="$(ls -d "$SDK_ROOT/build-tools/"* | sort -V | tail -n 1)"
PLATFORM_DIR="$(ls -d "$SDK_ROOT/platforms/android-"* | sort -V | tail -n 1)"
PLATFORM_JAR="$PLATFORM_DIR/android.jar"

echo "[MIKA_APK] Using build-tools: $BUILD_TOOLS"
echo "[MIKA_APK] Using platform:    $PLATFORM_JAR"

if [ ! -f "dist/index.html" ]; then
    echo "[MIKA_APK] Building dist/index.html first..."
    npx vite build
fi

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

mkdir -p "$WORK_DIR/gen" "$WORK_DIR/classes" "$WORK_DIR/dex" "$WORK_DIR/pkg/assets" "builds"

echo "[MIKA_APK] 1/6 Compiling Android resources via aapt2..."
"$BUILD_TOOLS/aapt2" compile --dir android/res -o "$WORK_DIR/res.zip"
"$BUILD_TOOLS/aapt2" link \
    -o "$WORK_DIR/unaligned.apk" \
    -I "$PLATFORM_JAR" \
    --manifest android/AndroidManifest.xml \
    --java "$WORK_DIR/gen" \
    --version-code 1 \
    --version-name "$VERSION" \
    "$WORK_DIR/res.zip"

echo "[MIKA_APK] 2/6 Compiling MainActivity.java..."
find "$WORK_DIR/gen" android/src -name "*.java" > "$WORK_DIR/sources.txt"
javac --release 11 \
    -cp "$PLATFORM_JAR" \
    -d "$WORK_DIR/classes" \
    @"$WORK_DIR/sources.txt"

echo "[MIKA_APK] 3/6 Converting JVM bytecode to Dalvik classes.dex via d8..."
find "$WORK_DIR/classes" -name "*.class" > "$WORK_DIR/classes.txt"
"$BUILD_TOOLS/d8" \
    --lib "$PLATFORM_JAR" \
    --min-api 24 \
    --output "$WORK_DIR/dex" \
    $(cat "$WORK_DIR/classes.txt")

echo "[MIKA_APK] 4/6 Packaging classes.dex & single-file web bundle into APK..."
cp "dist/index.html" "$WORK_DIR/pkg/assets/index.html"
cp "$WORK_DIR/dex/classes.dex" "$WORK_DIR/pkg/classes.dex"
(
    cd "$WORK_DIR/pkg"
    zip -q -r "$WORK_DIR/unaligned.apk" classes.dex
    zip -q -0 -r "$WORK_DIR/unaligned.apk" assets/index.html
)

echo "[MIKA_APK] 5/6 Aligning APK on 4-byte boundaries via zipalign..."
"$BUILD_TOOLS/zipalign" -f -p 4 "$WORK_DIR/unaligned.apk" "$WORK_DIR/aligned.apk"

echo "[MIKA_APK] 6/6 Signing APK (v1 + v2 + v3) via apksigner..."
keytool -genkeypair -v \
    -keystore "$WORK_DIR/release.keystore" \
    -alias mikaengine \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass mikaengine -keypass mikaengine \
    -dname "CN=Project MIKA, OU=MIKA Engine, O=ProjectMIKA, L=Cyber, S=Matrix, C=US" >/dev/null 2>&1

OUT_APK="builds/MIKA-Engine_V${VERSION}_Android.apk"
"$BUILD_TOOLS/apksigner" sign \
    --ks "$WORK_DIR/release.keystore" \
    --ks-key-alias mikaengine \
    --ks-pass pass:mikaengine \
    --key-pass pass:mikaengine \
    --out "$OUT_APK" \
    "$WORK_DIR/aligned.apk"

"$BUILD_TOOLS/apksigner" verify --verbose "$OUT_APK"
ls -lh "$OUT_APK"
echo "[MIKA_APK] Successfully built standalone Android APK: $OUT_APK"
