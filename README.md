# 🐾 MIKA Engine // Standalone Always-On-Top Cyber-Familiar Overlay

**MIKA Engine** (`v1.1.0`) is a standalone, cross-platform **always-on-top avatar overlay** for **Windows**, **Linux**, and **Android** powered by local or cloud Large Language Models. Built with the **Project M.I.K.A. Terminal & Holographic Design Language** (`#050308` obsidian terminal panels, `#00E5FF` / `#FF107A` / `#39FF14` neon holography, and CRT scanlines), MIKA floats directly on top of your screen, roams in 8 directions, can be dragged and thrown anywhere, pilots her retro RGB starfighter, opens holographic hacker terminals, and links to any Local, Cloud, or Custom OpenAI-compatible LLM.

---

## ✨ Key Capabilities

- **True Always-On-Top Avatar Overlay (Windows, Linux & Android)**:
  - **100% Transparent Click-Through Desktop Overlay (Windows & Linux)**: Pre-packaged native Electron executables (`MIKA-Engine.exe` on Windows, `MIKA-Engine` on Linux) render MIKA directly over your desktop and applications with 30fps OS cursor hit-testing so clicks on empty space pass straight through to underlying windows.
  - **System-Wide Floating Overlay on Android (`MIKA-Engine_V1.1.0_Android.apk`)**: Uses Android's `Display over other apps` (`SYSTEM_ALERT_WINDOW`) foreground overlay service so MIKA floats over all your Android apps and can be dragged anywhere on your phone screen.
- **7-Node Orbital Radial HUD Menu (`ASK`, `POKE`, `PET`, `LOGS`, `MSGS`, `DOSSIER`, `SETTINGS`)**:
  - **⚡ ASK**: Relay one-shot messages or switch to **Continuous Terminal Chat (`MODE: CHAT`)**.
  - **👉 POKE**: Provoke an immediate dry, deadpan terminal quip.
  - **💗 PET**: Give MIKA head-pats (or hold & rub directly on her sprite — watch out for her 5-pat bite reflex and 60s cooldown!).
  - **🖥 LOGS / 📜 MSGS / 🔮 DOSSIER**: Inspect live system telemetry, TTY message history, and familiar specs via `> NEURAL_DATA_EXTRACTED` holographic popups.
  - **⚙ SETTINGS**: Opens the `> DIRECTOR_SETTINGS` terminal deck (`CORE MATRIX`, `NEURAL UPLINK`, `P.U.R.R. & VOICE`).
- **Universal Multi-LLM Uplink (`17 Presets + Custom OpenAI Endpoint`)**:
  - **🏠 Local Inference (Zero API Keys Required)**: Ollama (`localhost:11434`), LM Studio (`localhost:1234`), `llama.cpp` Server (`localhost:8080`), KoboldCPP (`localhost:5001`), and vLLM (`localhost:8000`).
  - **☁️ Popular Cloud Providers**: NanoGPT, OpenRouter, OpenAI, Anthropic Claude, Google Gemini, Groq, DeepSeek, Mistral AI, Together AI, Fireworks AI, and Chutes AI.
  - **🔧 Custom OpenAI-Compatible Endpoint**: Connect any self-hosted proxy, LiteLLM, TabbyAPI, Text-Generation-WebUI, or custom URL with custom JSON headers, live `↻ FETCH_MODELS` discovery, and one-click `⚡ VERIFY_NEURAL_UPLINK` testing.

---

## 📦 Platform Downloads & Installation

Download the ready-to-run package for your platform from the [**GitHub Releases**](https://github.com/ProjectMIKA/MIKA-Engine/releases) page:

| Platform | Release Asset | How to Run |
| :--- | :--- | :--- |
| **Windows (x64)** | `MIKA-Engine_V1.1.0_Windows.zip` | Extract and double-click `MIKA-Engine.exe` — MIKA immediately spawns as a transparent always-on-top desktop overlay. |
| **Linux (x64)** | `MIKA-Engine_V1.1.0_Linux.zip` | Extract and run `./MIKA-Engine` — MIKA spawns as a transparent always-on-top desktop overlay. |
| **Android (APK)** | `MIKA-Engine_V1.1.0_Android.apk` | Install the signed `.apk` on Android 7.0+, grant **"Display over other apps"**, and MIKA will float over your phone screen. |
| **Android (Source/PWA)** | `MIKA-Engine_V1.1.0_Android.zip` | Standalone Android WebView/Capacitor source package & PWA bundle. |
| **Standalone / Web** | `MIKA-Engine_V1.1.0_Standalone.zip` | Universal zero-dependency single-file `index.html` bundle. |

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

### v1.1.0 — Always-On-Top Avatar Overlay & Canonical Terminal UI Overhaul
- **Always-On-Top Transparent Avatar Overlay Across All Platforms**: Removed opaque stage backgrounds and the top floating status bar so MIKA always operates as a pure, draggable on-screen avatar overlay on Windows (`MIKA-Engine.exe`), Linux (`MIKA-Engine`), and Android (`OverlayService` with `SYSTEM_ALERT_WINDOW`).
- **Pre-Built Native Windows & Linux Electron Binaries**: GitHub Releases now ship ready-to-run native Electron overlay executables for Windows and Linux with main-process 30fps OS cursor click-through hit-testing (`screen.getCursorScreenPoint()`).
- **Canonical `> DIRECTOR_SETTINGS` & `> NEURAL_DATA_EXTRACTED` UI**: Rebuilt `MikaSettingsModal` (`CORE MATRIX`, `NEURAL UPLINK`, `P.U.R.R. & VOICE`) and the `LOGS`/`MSGS`/`DOSSIER` modals to match the exact Project M.I.K.A. terminal design language (`.list-item`, `.settings-tab-nav`, `.toggle-switch`, `CyberDropdown`, `> SYSTEM PRESETS`, and `> M.I.K.A_RECOMMENDATION`).

### v1.0.0 — Initial Standalone Multi-Platform Release
- **Standalone MIKA Chibi Proxy Engine**: Extracted MIKA's autonomous state machine, physics/throw engine, retro RGB starfighter, holographic hacker terminal, and procedural WebAudio SFX into a clean, self-contained cross-platform engine.
- **Multi-Provider LLM Client (`17 Presets + Custom OpenAI`)**: Built-in presets for Ollama, LM Studio, llama.cpp, KoboldCPP, vLLM, NanoGPT, OpenRouter, OpenAI, Anthropic Claude, Google Gemini, Groq, DeepSeek, Mistral, Together AI, Fireworks AI, Chutes AI, and Custom OpenAI-Compatible Endpoints.
