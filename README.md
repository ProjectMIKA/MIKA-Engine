# 🐾 MIKA Engine // Standalone Cyber-Familiar Companion

**MIKA Engine** (`v1.0.0`) is a standalone, cross-platform desktop and mobile cyber-familiar powered by local or cloud Large Language Models. Designed with the **MIKA Visual Language** (Obsidian Terminal + High-Voltage Neon Holography), MIKA roams your screen, pilots her retro RGB starfighter, opens holographic hacker terminals, reacts to head-pats, pokes, and gravity throws, and links directly to your choice of local or cloud LLM.

---

## ✨ Key Capabilities

- **Orbital Radial HUD Menu (`ASK`, `POKE`, `PET`, `MSGS`, `DOSSIER`, `SETTINGS`)**:
  - **⚡ ASK**: Relay one-shot messages or switch to **Continuous Terminal Chat (`MODE: CHAT`)**.
  - **👉 POKE**: Provoke an immediate dry, deadpan terminal quip.
  - **💗 PET**: Give MIKA head-pats (watch out for the 3-pat bite threshold and 60s lockout!).
  - **📜 MSGS**: Inspect or clear the persistent TTY message & neural transmission archive.
  - **🔮 DOSSIER**: Live familiar telemetry + one-click overrides (`LAUNCH_STARFIGHTER`, `HOLO_HACKER_TTY`, `CEILING_DROP`, `NEURAL_SETTINGS`).
  - **⚙ SETTINGS**: Full 3-tab configuration deck (`> NEURAL_UPLINK`, `> CHASSIS_&_STAGE`, `> AUTONOMY_&_VOICE`).
- **Universal Multi-LLM Uplink**:
  - **🏠 Local Inference (Zero API Keys Required)**: Ollama (`localhost:11434`), LM Studio (`localhost:1234`), `llama.cpp` Server (`localhost:8080`), KoboldCPP (`localhost:5001`), and vLLM (`localhost:8000`).
  - **☁️ Popular Cloud Providers**: NanoGPT, OpenRouter, OpenAI, Anthropic Claude, Google Gemini, Groq, DeepSeek, Mistral AI, Together AI, Fireworks AI, and Chutes AI.
  - **🔧 Custom OpenAI-Compatible Endpoint**: Connect any self-hosted proxy, LiteLLM, TabbyAPI, Text-Generation-WebUI, or custom URL with custom JSON headers, live `/v1/models` fetching, and one-click `TEST_UPLINK` verification.
- **Dual Stage Topology (`◈ OVERLAY` & `▣ STAGE`)**:
  - **Transparent Desktop Overlay Mode (Windows & Linux via Electron)**: MIKA roams directly over your OS desktop with automatic click-through on empty space.
  - **Cyber-Stage Sanctuary Mode (Desktop, Web & Android)**: Full obsidian cyber-grid deck with CRT scanlines and ambient telemetry.
- **Dual Chassis Renderers**:
  - **Vector RGB Neon (`vector_rgb`)**: Crisp vector line-art with mood-reactive RGB rim lighting.
  - **24×24 Retro Pixel (`retro_pixel`)**: Classic 24×24 terminal pixel sprite with scanline shading.

---

## 📦 Platform Downloads & Installation

Download the pre-packaged archive for your platform from the [**GitHub Releases**](https://github.com/ProjectMIKA/MIKA-Engine/releases) page:

| Platform | Release Asset | How to Run |
| :--- | :--- | :--- |
| **Windows** | `MIKA-Engine_V1.0.0_Windows.zip` | Extract and double-click `Launch-MIKA-Engine.bat` (run `Install-Overlay-Runtime.bat` once for transparent desktop overlay mode). |
| **Linux** | `MIKA-Engine_V1.0.0_Linux.zip` | Extract and run `./mika-engine.sh` (install `electron` for transparent desktop overlay mode). |
| **Android (APK)** | `MIKA-Engine_V1.0.0_Android.apk` | Download and install the standalone signed `.apk` directly on any Android 7.0+ device. |
| **Android (Source/PWA)** | `MIKA-Engine_V1.0.0_Android.zip` | Standalone Android WebView/Capacitor source package & PWA bundle. |
| **Standalone / Web** | `MIKA-Engine_V1.0.0_Standalone.zip` | Universal zero-dependency single-file `index.html` bundle. |

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

# Build single-file bundle + all 4 platform release archives in builds/
npm run build
```

---

## 📜 Release Changelog

### v1.0.0 — Initial Standalone Multi-Platform Release
- **Standalone MIKA Chibi Proxy Engine**: Extracted MIKA's autonomous state machine, physics/throw engine, retro RGB starfighter, holographic hacker terminal, and procedural WebAudio SFX into a clean, self-contained cross-platform engine.
- **Orbital Radial `SETTINGS` Node & 3-Tab Configuration Deck**: Added the cyan gear `SETTINGS` node to MIKA's radial menu (`> NEURAL_UPLINK`, `> CHASSIS_&_STAGE`, `> AUTONOMY_&_VOICE`) built strictly to the MIKA Visual Language specification.
- **Multi-Provider LLM Client (`17 Presets + Custom OpenAI`)**: Built-in presets for Ollama, LM Studio, llama.cpp, KoboldCPP, vLLM, NanoGPT, OpenRouter, OpenAI, Anthropic Claude, Google Gemini, Groq, DeepSeek, Mistral, Together AI, Fireworks AI, Chutes AI, and Custom OpenAI-Compatible Endpoints with live `/models` discovery and connection testing.
- **Cross-Platform Packaging (`Windows`, `Linux`, `Android`, `Standalone`)**: Added Electron transparent desktop overlay wrapper (`electron/main.cjs`), Capacitor Android manifest (`capacitor.config.json`), and `package-app.cjs` multi-archive builder.
