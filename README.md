# 🐾 MIKA Engine // Standalone Always-On-Top Cyber-Familiar Overlay

**MIKA Engine** (`v1.1.2`) is a standalone, cross-platform **always-on-top avatar overlay** for **Windows**, **Linux**, and **Android** powered by local or cloud Large Language Models. Built with the **Project M.I.K.A. Terminal & Holographic Design Language** (`#050308` obsidian terminal panels, `#00E5FF` / `#FF107A` / `#39FF14` neon holography, and CRT scanlines), MIKA floats directly on top of your screen, roams in 8 directions, can be dragged and thrown anywhere, pilots her retro RGB starfighter, opens holographic hacker terminals, and links to any Local, Cloud, or Custom OpenAI-compatible LLM.

---

## ✨ Key Capabilities

- **True Always-On-Top Avatar Overlay (Windows, Linux & Android)**:
  - **100% Transparent Click-Through Desktop Overlay (Windows & Linux)**: Pre-packaged native Electron executables (`MIKA-Engine.exe` on Windows, `MIKA-Engine` on Linux) render MIKA directly over your desktop and applications with 30fps OS cursor hit-testing so clicks on empty space pass straight through to underlying windows.
  - **System-Wide Floating Overlay on Android (`MIKA-Engine_V1.1.2_Android.apk`)**: Uses Android's `Display over other apps` (`SYSTEM_ALERT_WINDOW`) foreground overlay service with hardware-locked raw touch tracking (`MotionEvent.getRawX() / getRawY()`) so MIKA floats over all your Android apps and drags smoothly across your phone screen with zero coordinate jitter.
- **7-Node Orbital Radial HUD Menu (`ASK`, `POKE`, `PET`, `LOGS`, `MSGS`, `DOSSIER`, `SETTINGS`)**:
  - **⚡ ASK**: Relay one-shot messages or switch to **Continuous Terminal Chat (`MODE: CHAT`)**.
  - **👉 POKE**: Provoke an immediate dry, deadpan terminal quip.
  - **💗 PET**: Give MIKA head-pats (or hold & rub directly on her sprite — watch out for her 5-pat bite reflex and 60s cooldown!).
  - **🖥 LOGS / 📜 MSGS / 🔮 DOSSIER**: Inspect live system telemetry, TTY message history, and familiar specs via `> NEURAL_DATA_EXTRACTED` holographic popups.
  - **⚙ SETTINGS**: Opens the full-screen `> DIRECTOR_SETTINGS` terminal deck (`MIKA ENGINE` & `NEURAL UPLINK`).
- **Universal Multi-LLM Uplink (`17 Presets + Custom OpenAI Endpoint`)**:
  - **🏠 Local Inference (Zero API Keys Required)**: Ollama (`localhost:11434`), LM Studio (`localhost:1234`), `llama.cpp` Server (`localhost:8080`), KoboldCPP (`localhost:5001`), and vLLM (`localhost:8000`).
  - **☁️ Popular Cloud Providers**: NanoGPT, OpenRouter, OpenAI, Anthropic Claude, Google Gemini, Groq, DeepSeek, Mistral AI, Together AI, Fireworks AI, and Chutes AI.
  - **🔧 Custom OpenAI-Compatible Endpoint**: Connect any self-hosted proxy, LiteLLM, TabbyAPI, Text-Generation-WebUI, or custom URL with custom JSON headers, live `↻ FETCH_MODELS` discovery, and one-click `⚡ VERIFY_NEURAL_UPLINK` testing.

---

## 📦 Platform Downloads & Installation

Download the ready-to-run package for your platform from the [**GitHub Releases**](https://github.com/ProjectMIKA/MIKA-Engine/releases) page:

| Platform | Release Asset | How to Run |
| :--- | :--- | :--- |
| **Windows (x64)** | `MIKA-Engine_V1.1.2_Windows.zip` | Extract and double-click `MIKA-Engine.exe` — MIKA immediately spawns as a transparent always-on-top desktop overlay. |
| **Linux (x64)** | `MIKA-Engine_V1.1.2_Linux.zip` | Extract and run `./MIKA-Engine` — MIKA spawns as a transparent always-on-top desktop overlay. |
| **Android (APK)** | `MIKA-Engine_V1.1.2_Android.apk` | Install the signed `.apk` on Android 7.0+, grant **"Display over other apps"**, and MIKA will float over your phone screen. |
| **Android (Source/PWA)** | `MIKA-Engine_V1.1.2_Android.zip` | Standalone Android WebView/Capacitor source package & PWA bundle. |
| **Standalone / Web** | `MIKA-Engine_V1.1.2_Standalone.zip` | Universal zero-dependency single-file `index.html` bundle. |

---

## 🛠️ Development & Building from Source

```bash
# Install dependencies
npm install

# Run unit tests & linter
npm test
npm run lint

# Start Vite development server
npm run dev

# Launch in Electron Transparent Desktop Overlay mode
npm run electron:start

# Build single-file bundle + platform release archives in builds/
npm run build
```

---

## 📜 Release Changelog

### v1.1.2 — Interactive Director Settings Fix, Streamlined MIKA Engine Tabs & Smooth 1:1 Android Dragging
- **Fixed Unclickable `> DIRECTOR_SETTINGS` Menu**: Separated the `.swipe-scanlines` decorative CRT overlay (`pointer-events: none`) into its own child element instead of applying it directly to `.mika-director-panel`, restoring 100% touch/click interactivity across all tabs, buttons, toggles, dropdowns, and text inputs.
- **Streamlined MIKA Engine Settings (`MIKA ENGINE` & `NEURAL UPLINK`)**: Removed unimplemented external engine references (`P.U.R.R. & VOICE`) and consolidated `> DIRECTOR_SETTINGS` into two focused tabs (`MIKA ENGINE` for presets, chassis style/scale, roaming cadence, synth SFX, and animations; `NEURAL UPLINK` for local/cloud/custom LLM endpoints, persona honorifics, and sampling parameters).
- **Butter-Smooth 1:1 Android Overlay Dragging (Zero Teleporting)**:
  - Added hardware-locked raw touch delta tracking (`MotionEvent.getRawX()` / `getRawY()`) in `OverlayService.java` (`window.mikaAndroid.getRawTouchX/Y`) so moving the floating `WindowManager` window never shifts WebView touch coordinates under your finger.
  - Enabled `FLAG_LAYOUT_IN_SCREEN | FLAG_LAYOUT_NO_LIMITS` (with `LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES` and `getRealMetrics`) and kept MIKA in her compact `88×92dp` floating window throughout drag gestures so Android `WindowManager` never clamps edge positions or resizes the surface mid-drag.

### v1.1.1 — Full-Screen Settings Deck & Android Overlay Pass-Through
- **Full-Screen `> DIRECTOR_SETTINGS` Terminal Deck**: Made `MikaSettingsModal` a dedicated full-screen terminal view with explicit `[X] EXIT` and `> BACK_TO_OVERLAY` buttons.
- **Android Overlay Pass-Through**: Shrunk the idle Android overlay window to a tight avatar hit-box around MIKA so 98%+ of the phone screen passes touches straight through to underlying apps.

### v1.1.0 — Always-On-Top Avatar Overlay & Canonical Terminal UI Overhaul
- **Always-On-Top Transparent Avatar Overlay Across All Platforms**: Removed opaque stage backgrounds and the top floating status bar so MIKA always operates as a pure, draggable on-screen avatar overlay on Windows (`MIKA-Engine.exe`), Linux (`MIKA-Engine`), and Android (`OverlayService` with `SYSTEM_ALERT_WINDOW`).
- **Pre-Built Native Windows & Linux Electron Binaries**: GitHub Releases ship ready-to-run native Electron overlay executables for Windows and Linux with main-process 30fps OS cursor click-through hit-testing (`screen.getCursorScreenPoint()`).

### v1.0.0 — Initial Standalone Multi-Platform Release
- **Standalone MIKA Chibi Proxy Engine**: Extracted MIKA's autonomous state machine, physics/throw engine, retro RGB starfighter, holographic hacker terminal, and procedural WebAudio SFX into a clean, self-contained cross-platform engine.
