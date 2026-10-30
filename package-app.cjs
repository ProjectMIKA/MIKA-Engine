const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const pkg = require('./package.json');

const version = pkg.version;
const buildsDir = path.join(__dirname, 'builds');
const distHtmlPath = path.join(__dirname, 'dist', 'index.html');

if (!fs.existsSync(distHtmlPath)) {
    console.error('Error: dist/index.html not found. Run "vite build" first.');
    process.exit(1);
}

if (!fs.existsSync(buildsDir)) {
    fs.mkdirSync(buildsDir, { recursive: true });
}

function createZipArchive(zipName, populateFn) {
    return new Promise((resolve, reject) => {
        const outPath = path.join(buildsDir, zipName);
        const output = fs.createWriteStream(outPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            console.log(`Successfully created ${outPath} (${archive.pointer()} total bytes)`);
            resolve(outPath);
        });
        archive.on('error', (err) => reject(err));
        archive.pipe(output);
        populateFn(archive);
        archive.finalize();
    });
}

const WIN_BAT = `@echo off
title MIKA Engine v${version}
cd /d "%~dp0"

REM If Node/Electron is installed in node_modules, launch transparent desktop overlay mode
if exist "node_modules\\.bin\\electron.cmd" (
    start "" "node_modules\\.bin\\electron.cmd" .
    exit /b 0
)

REM Otherwise check if global electron is available
where electron >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    start "" electron .
    exit /b 0
)

REM Fallback: Launch chromeless desktop app window via Microsoft Edge or Chrome
where msedge >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    start "" msedge --app="file:///%~dp0dist/index.html" --window-size=1100,760
    exit /b 0
)

start "" "%~dp0dist\\index.html"
`;

const WIN_INSTALL_OVERLAY_BAT = `@echo off
title MIKA Engine v${version} - Install Transparent Desktop Overlay Runtime
cd /d "%~dp0"
echo [MIKA_ENGINE] Installing Electron desktop overlay runtime...
call npm install --omit=dev electron
echo.
echo [MIKA_ENGINE] Complete! Run Launch-MIKA-Engine.bat to start MIKA in Transparent Desktop Overlay Mode.
pause
`;

const WIN_README = `====================================================================
  MIKA ENGINE v${version} // WINDOWS INSTALLATION & QUICKSTART
====================================================================

1. INSTANT LAUNCH (ZERO DEPENDENCIES):
   Double-click "Launch-MIKA-Engine.bat" (or open "dist\\index.html").
   MIKA will launch immediately in Cyber-Stage App Mode.

2. TRANSPARENT DESKTOP OVERLAY MODE (ELECTRON):
   If you have Node.js installed and want MIKA to roam transparently
   on top of your Windows desktop with click-through background:
   - Double-click "Install-Overlay-Runtime.bat" once (or run "npm i electron")
   - Double-click "Launch-MIKA-Engine.bat"
   - Toggle between [ ◈ OVERLAY ] and [ ▣ STAGE ] anytime from the top pill
     or the SETTINGS radial menu button!

3. CONFIGURING LLMs (LOCAL & CLOUD):
   Click MIKA to open her radial menu -> Click "SETTINGS" (Cyan Gear).
   - LOCAL: Ollama, LM Studio, llama.cpp, KoboldCPP, vLLM
   - CLOUD: NanoGPT, OpenRouter, OpenAI, Anthropic, Gemini, Groq, DeepSeek,
            Mistral, Together AI, Fireworks AI, Chutes AI
   - CUSTOM: Custom OpenAI-Compatible Endpoint (any Base URL + API Key)
`;

const LINUX_SH = `#!/usr/bin/env bash
set -e
DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

if [ -x "$DIR/node_modules/.bin/electron" ]; then
    exec "$DIR/node_modules/.bin/electron" "$DIR" "$@"
elif command -v electron >/dev/null 2>&1; then
    exec electron "$DIR" "$@"
elif command -v google-chrome >/dev/null 2>&1; then
    exec google-chrome --app="file://$DIR/dist/index.html" --window-size=1100,760
elif command -v chromium >/dev/null 2>&1; then
    exec chromium --app="file://$DIR/dist/index.html" --window-size=1100,760
elif command -v chromium-browser >/dev/null 2>&1; then
    exec chromium-browser --app="file://$DIR/dist/index.html" --window-size=1100,760
else
    exec xdg-open "$DIR/dist/index.html"
fi
`;

const LINUX_DESKTOP = `[Desktop Entry]
Type=Application
Name=MIKA Engine
Comment=Autonomous Cyber-Familiar Desktop Companion with Multi-LLM Uplink
Exec=./mika-engine.sh
Icon=utilities-terminal
Terminal=false
Categories=Utility;ArtificialIntelligence;Game;
`;

const LINUX_README = `====================================================================
  MIKA ENGINE v${version} // LINUX INSTALLATION & QUICKSTART
====================================================================

1. INSTANT LAUNCH:
   chmod +x mika-engine.sh
   ./mika-engine.sh

2. TRANSPARENT DESKTOP OVERLAY MODE (ELECTRON):
   To run MIKA as a transparent always-on-top desktop overlay with
   automatic background click-through:
   npm install --omit=dev electron
   ./mika-engine.sh

3. CONFIGURING LLMs (LOCAL & CLOUD):
   Tap MIKA -> Click "SETTINGS" in the radial menu (or top HUD bar).
   Configure Ollama, LM Studio, llama.cpp, KoboldCPP, vLLM, NanoGPT,
   OpenRouter, OpenAI, Anthropic, Gemini, Groq, DeepSeek, or any Custom
   OpenAI-compatible endpoint.
`;

const ANDROID_README = `====================================================================
  MIKA ENGINE v${version} // ANDROID INSTALLATION & APK BUILD GUIDE
====================================================================

OPTION A — INSTANT MOBILE INSTALL (STANDALONE HTML / PWA):
1. Copy "index.html" to your Android device (or host the folder on LAN).
2. Open in Chrome / Brave / Firefox on Android and tap "Add to Home Screen",
   or open "index.html" directly in any Android WebView wrapper.

OPTION B — BUILD NATIVE ANDROID APK (CAPACITOR):
This archive includes the pre-configured Capacitor Android manifest
("capacitor.config.json" + compiled "dist/index.html"). To compile a native
Android ".apk" with Android Studio / Gradle:
1. npm install @capacitor/core @capacitor/cli @capacitor/android
2. npx cap add android
3. npx cap sync android
4. npx cap open android  (or cd android && ./gradlew assembleDebug)
`;

async function run() {
    const appJsonContent = JSON.stringify(
        {
            name: 'MIKA Engine',
            version,
            description: pkg.description,
            author: pkg.author,
            main: 'index.html',
            icon: 'icon.svg',
        },
        null,
        2
    );

    const runtimePkgJson = JSON.stringify(
        {
            name: pkg.name,
            productName: pkg.productName,
            version: pkg.version,
            description: pkg.description,
            main: 'electron/main.cjs',
            author: pkg.author,
            license: pkg.license,
            scripts: {
                start: 'electron .',
            },
        },
        null,
        2
    );

    // 1. Windows Release Package
    await createZipArchive(`MIKA-Engine_V${version}_Windows.zip`, (archive) => {
        archive.file(distHtmlPath, { name: 'dist/index.html' });
        archive.file(path.join(__dirname, 'electron', 'main.cjs'), { name: 'electron/main.cjs' });
        archive.file(path.join(__dirname, 'electron', 'preload.cjs'), { name: 'electron/preload.cjs' });
        archive.file(path.join(__dirname, 'public', 'icon.svg'), { name: 'dist/icon.svg' });
        archive.append(runtimePkgJson, { name: 'package.json' });
        archive.append(WIN_BAT, { name: 'Launch-MIKA-Engine.bat' });
        archive.append(WIN_INSTALL_OVERLAY_BAT, { name: 'Install-Overlay-Runtime.bat' });
        archive.append(WIN_README, { name: 'INSTALL_WINDOWS.txt' });
    });

    // 2. Linux Release Package
    await createZipArchive(`MIKA-Engine_V${version}_Linux.zip`, (archive) => {
        archive.file(distHtmlPath, { name: 'dist/index.html' });
        archive.file(path.join(__dirname, 'electron', 'main.cjs'), { name: 'electron/main.cjs' });
        archive.file(path.join(__dirname, 'electron', 'preload.cjs'), { name: 'electron/preload.cjs' });
        archive.file(path.join(__dirname, 'public', 'icon.svg'), { name: 'dist/icon.svg' });
        archive.append(runtimePkgJson, { name: 'package.json' });
        archive.append(LINUX_SH, { name: 'mika-engine.sh', mode: 0o755 });
        archive.append(LINUX_DESKTOP, { name: 'mika-engine.desktop' });
        archive.append(LINUX_README, { name: 'INSTALL_LINUX.txt' });
    });

    // 3. Android Release Package (Capacitor + PWA + Standalone WebView)
    await createZipArchive(`MIKA-Engine_V${version}_Android.zip`, (archive) => {
        archive.file(distHtmlPath, { name: 'index.html' });
        archive.file(distHtmlPath, { name: 'dist/index.html' });
        archive.file(path.join(__dirname, 'capacitor.config.json'), { name: 'capacitor.config.json' });
        archive.file(path.join(__dirname, 'public', 'manifest.json'), { name: 'manifest.json' });
        archive.file(path.join(__dirname, 'public', 'icon.svg'), { name: 'icon.svg' });
        archive.append(runtimePkgJson, { name: 'package.json' });
        archive.append(ANDROID_README, { name: 'INSTALL_ANDROID.txt' });
    });

    // 4. Universal Standalone Web / Host Bundle (Single-File Architecture)
    await createZipArchive(`MIKA-Engine_V${version}_Standalone.zip`, (archive) => {
        archive.file(distHtmlPath, { name: 'index.html' });
        archive.file(path.join(__dirname, 'public', 'manifest.json'), { name: 'manifest.json' });
        archive.file(path.join(__dirname, 'public', 'icon.svg'), { name: 'icon.svg' });
        archive.append(appJsonContent, { name: 'app.json' });
    });
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
