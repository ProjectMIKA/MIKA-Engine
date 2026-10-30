# MIKA Engine v1.0.0 — Initial Multi-Platform Release (Windows, Linux, Android & Standalone)

**MIKA Engine v1.0.0** brings the **MIKA Chibi Proxy** out into her own standalone cross-platform cyber-familiar application for **Windows**, **Linux**, **Android**, and **Standalone Web**.

---

### 🌟 Highlights

* **New `SETTINGS` Radial Node & Cyber-Deck UI**:
  * Tap MIKA to open her orbital radial HUD (`ASK`, `POKE`, `PET`, `MSGS`, `DOSSIER`, `SETTINGS`) featuring the new cyan gear **`SETTINGS`** button.
  * Styled strictly with the **MIKA Visual Language** (`#050308` obsidian terminal surfaces, `#00E5FF` / `#FF107A` / `#B533FF` / `#39FF14` neon holography, custom `CyberDropdown` selectors, and CRT scanline overlays).
* **Universal Multi-Provider LLM Uplink (`17 Presets + Custom OpenAI Endpoint`)**:
  * **🏠 Local Inference**: First-class presets for **Ollama** (`localhost:11434`), **LM Studio** (`localhost:1234`), **llama.cpp** (`localhost:8080`), **KoboldCPP** (`localhost:5001`), and **vLLM** (`localhost:8000`).
  * **☁️ Popular Cloud Providers**: Pre-wired endpoints and curated model lists for **NanoGPT**, **OpenRouter**, **OpenAI**, **Anthropic Claude**, **Google Gemini**, **Groq**, **DeepSeek**, **Mistral AI**, **Together AI**, **Fireworks AI**, and **Chutes AI**.
  * **🔧 Custom OpenAI-Compatible Endpoint**: Configure any custom Base URL, API key, custom JSON request headers, live `↻ FETCH_MODELS` discovery, and `⚡ TEST_UPLINK` latency/response verification.
* **Relay & Continuous Terminal Chat (`MODE: RELAY` / `MODE: CHAT`)**:
  * Use `ASK` as a fast one-shot terminal relay or toggle `MODE: CHAT` for an ongoing multi-turn conversation window while MIKA simultaneously speaks in her glassmorphic TTY bubble.
* **Transparent Desktop Overlay & Cyber-Stage Modes**:
  * Run MIKA in **Transparent Desktop Overlay Mode (`◈ OVERLAY`)** on Windows and Linux via Electron (with automatic mouse click-through on empty desktop space) or switch to **Cyber-Stage Sanctuary Mode (`▣ STAGE`)** on any desktop or mobile screen.

---

### 📦 Platform Installation Packages (Attached Below)

1. **`MIKA-Engine_V1.0.0_Android.apk`** — Standalone signed Android `.apk` installer (Android 7.0+ / API 24+, hardware-accelerated WebView with full local LAN & cloud LLM support).
2. **`MIKA-Engine_V1.0.0_Windows.zip`** — Windows Desktop Overlay & Cyber-Stage package (`Launch-MIKA-Engine.bat` + `Install-Overlay-Runtime.bat` + Electron main/preload + standalone bundle).
3. **`MIKA-Engine_V1.0.0_Linux.zip`** — Linux Desktop Overlay & Cyber-Stage package (`mika-engine.sh` + `mika-engine.desktop` + Electron main/preload + standalone bundle).
4. **`MIKA-Engine_V1.0.0_Android.zip`** — Android Mobile PWA & Capacitor APK project package (`index.html` + `capacitor.config.json` + `manifest.json` + `INSTALL_ANDROID.txt`).
5. **`MIKA-Engine_V1.0.0_Standalone.zip`** — Universal single-file HTML5 bundle (`index.html` + `app.json` + `manifest.json`).
