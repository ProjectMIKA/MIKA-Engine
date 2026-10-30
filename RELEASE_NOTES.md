# MIKA Engine v1.1.0 — Always-On-Top Avatar Overlay & Canonical Terminal UI Overhaul

**MIKA Engine v1.1.0** upgrades every platform (**Windows**, **Linux**, and **Android**) into a **100% transparent, always-on-top avatar overlay** and overhauls the `> DIRECTOR_SETTINGS` and `> NEURAL_DATA_EXTRACTED` menus to match the exact **Project M.I.K.A. Terminal & Holographic Design Language**.

---

### 🌟 What's New in v1.1.0

* **True Always-On-Top Transparent Avatar Overlay (Windows, Linux & Android)**:
  * **100% Transparent Canvas**: Removed the opaque background and floating top status bar — only MIKA herself, her glassmorphic TTY speech bubble, her 7-node radial menu (`ASK`, `POKE`, `PET`, `LOGS`, `MSGS`, `DOSSIER`, `SETTINGS`), and active modals render on screen.
  * **Pre-Built Native Windows & Linux Executables**: `MIKA-Engine_V1.1.0_Windows.zip` (`MIKA-Engine.exe`) and `MIKA-Engine_V1.1.0_Linux.zip` (`MIKA-Engine` binary) now ship with the full native Electron overlay runtime pre-bundled, plus a 30fps OS cursor hit-test loop (`screen.getCursorScreenPoint()`) so mouse clicks pass seamlessly through empty desktop space while MIKA remains draggable anywhere on screen.
  * **Android System-Wide Floating Overlay (`OverlayService`)**: `MIKA-Engine_V1.1.0_Android.apk` now uses `SYSTEM_ALERT_WINDOW` ("Display over other apps") and a foreground `TYPE_APPLICATION_OVERLAY` service so MIKA floats directly over all other Android apps, can be dragged around your phone screen, and expands seamlessly when you open her radial menu or `ASK` / `SETTINGS` terminals.
* **Canonical `> DIRECTOR_SETTINGS` Terminal UI (`MikaSettingsModal`)**:
  * Rebuilt the `SETTINGS` modal (`400px` single-column `#050308` terminal panel with `1px solid #00E5FF` border, `.swipe-scanlines`, and dismissible dashed `> M.I.K.A_RECOMMENDATION` banner).
  * **Sticky 3-Tab Navigation (`.settings-tab-nav`)**:
    * **`CORE MATRIX`** (DNA Helix SVG): Hot-swappable `> SYSTEM PRESETS` (`★ M.I.K.A.`, `LOCAL_ECO`, `CLOUD_MAX`, `SILENT_GUARD` + `save_current_as...`), `> MIKA_ENGINE` (`OVERLAY` badge), `> PROXY_AVATAR_CHASSIS` (`vector_pixel` / `retro_pixel`), `> CHASSIS_SCALE_MATRIX`, `> ALWAYS_ON_TOP_OVERLAY`, and `> DIRECT_CHASSIS_OVERRIDES` (`🚀 STARFIGHTER`, `💻 HOLO_TTY`, `☄ CEILING_DROP`, `⚡ ASK_MIKA`).
    * **`NEURAL UPLINK`** (Chat Bubble SVG): Category filter pills (`⚡ ALL`, `🏠 LOCAL`, `☁️ CLOUD`, `🔧 CUSTOM`), `CyberDropdown` for all 17 built-in Local & Cloud LLM providers (`Ollama`, `LM Studio`, `llama.cpp`, `KoboldCPP`, `vLLM`, `OpenRouter`, `NanoGPT`, `OpenAI`, `Anthropic`, `Gemini`, `Groq`, `DeepSeek`, `Mistral`, `Together`, `Fireworks`, `Chutes`, `Custom Endpoint`), dashed cyan sub-panel for `> ENDPOINT_BASE_URL`, `> API_BEARER_KEY`, `> TARGET_MODEL_ID` (`↻ FETCH_MODELS`), custom JSON headers, and `⚡ VERIFY_NEURAL_UPLINK`.
    * **`P.U.R.R. & VOICE`** (Waveform SVG): `> USER_HONORIFIC_TITLE`, `> UNPROMPTED_ROAM_CADENCE`, `> PROACTIVE_LLM_THOUGHTS`, `> WEBAUDIO_SYNTH_SFX`, `> SAMPLING_PARAMETERS`, and `> CUSTOM_PERSONA_DIRECTIVE`.
  * **`> NEURAL_DATA_EXTRACTED` Glass Popups**: `LOGS`, `MSGS`, and `DOSSIER` radial nodes now open the canonical holographic glass extraction modal (`[MEM_OK]` / `[ACKNOWLEDGE]`).

---

### 📦 Platform Installation Packages (Attached Below)

1. **`MIKA-Engine_V1.1.0_Android.apk`** — Standalone signed Android `.apk` with system-wide floating overlay (`Display over other apps`).
2. **`MIKA-Engine_V1.1.0_Windows.zip`** — Pre-built Windows x64 Always-On-Top Avatar Overlay executable (`MIKA-Engine.exe`).
3. **`MIKA-Engine_V1.1.0_Linux.zip`** — Pre-built Linux x64 Always-On-Top Avatar Overlay executable (`MIKA-Engine`).
4. **`MIKA-Engine_V1.1.0_Android.zip`** — Android WebView / Capacitor source & PWA package.
5. **`MIKA-Engine_V1.1.0_Standalone.zip`** — Universal single-file HTML5 bundle (`index.html` + `app.json` + `manifest.json`).
