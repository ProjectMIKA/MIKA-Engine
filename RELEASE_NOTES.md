# MIKA Engine v1.1.2 — Interactive Director Settings Fix, Streamlined MIKA Engine Tabs & Smooth 1:1 Android Dragging

**MIKA Engine v1.1.2** fixes touch/click interaction inside **`> DIRECTOR_SETTINGS`**, streamlines the settings deck so every control strictly applies to the standalone **MIKA Engine** (`MIKA ENGINE` + `NEURAL UPLINK`, removing unimplemented `P.U.R.R.` references), and overhauls Android overlay touch tracking so dragging MIKA around the screen is 100% smooth with zero teleporting.

---

### 🌟 What's Fixed & Improved in v1.1.2

* **Fixed Unclickable `> DIRECTOR_SETTINGS` Panel (`MikaSettingsModal.jsx`, `index.css`, `OverlayService.java`)**:
  * Fixed a CSS bug where `.swipe-scanlines` (`pointer-events: none`) was applied directly onto `.mika-director-panel`, which blocked clicks and taps on all buttons, tabs, toggles, dropdowns, and inputs inside `DIRECTOR_SETTINGS`.
  * `.swipe-scanlines` is now rendered as a separate non-interactive overlay child, and `OverlayService.java` explicitly requests focus (`webView.requestFocus()`) when `DIRECTOR_SETTINGS` or `ASK` opens.
* **Streamlined MIKA Engine Settings (`MIKA ENGINE` & `NEURAL UPLINK`)**:
  * Removed the `P.U.R.R. & VOICE` tab and consolidated all settings into two dedicated MIKA Engine tabs:
    * **`MIKA ENGINE`**: Configuration presets, autonomous roaming toggle, `PROXY_AVATAR_CHASSIS` (`VECTOR_PIXEL` / `RETRO_PIXEL`), `CHASSIS_SCALE_MATRIX`, `UNPROMPTED_ROAM_CADENCE`, `CHIBI_SYNTH_SFX` (wired directly to `matrixAudio.setMuted`), and `DIRECT_CHASSIS_OVERRIDES` (`🚀 STARFIGHTER`, `💻 HOLO_TTY`, `☄ CEILING_DROP`, `⚡ ASK_MIKA`).
    * **`NEURAL UPLINK`**: Category filters (`ALL`, `LOCAL`, `CLOUD`, `CUSTOM`), 17 LLM provider presets + Custom OpenAI endpoint, model fetching, uplink verification, `USER_HONORIFIC_TITLE`, `PROACTIVE_LLM_THOUGHTS`, `SAMPLING_PARAMETERS` (`TEMP` / `MAX_TOKENS`), and `CUSTOM_PERSONA_DIRECTIVE`.
* **Butter-Smooth 1:1 Android Overlay Dragging (`OverlayService.java` & `MikaProxy.jsx`)**:
  * **Hardware-Locked Raw Touch Tracking**: Added a native `View.OnTouchListener` on the Android `WebView` that tracks physical display finger deltas via `MotionEvent.getRawX()` and `MotionEvent.getRawY()` (`window.mikaAndroid.getRawTouchX/Y`), eliminating the coordinate feedback loop caused by WebView-relative `e.screenX/clientX` shifting when the floating overlay window moves.
  * **Zero Mid-Drag Window Resizing & Edge Clamping**: Kept MIKA in her compact `88×92dp` floating window throughout drag gestures (instead of switching to `MATCH_PARENT` mid-drag), enabled `FLAG_LAYOUT_IN_SCREEN | FLAG_LAYOUT_NO_LIMITS` (plus `LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES` and `getRealMetrics`), and synchronized `renderCenterX/Y` with the live WebView viewport width so MIKA never teleports or jumps when tapped or dragged.

---

### 📦 Platform Installation Packages (Attached Below)

1. **`MIKA-Engine_V1.1.2_Android.apk`** — Standalone signed Android `.apk` with system-wide floating overlay (`Display over other apps`), hardware-locked 1:1 drag tracking, and interactive `> DIRECTOR_SETTINGS`.
2. **`MIKA-Engine_V1.1.2_Windows.zip`** — Pre-built Windows x64 Always-On-Top Avatar Overlay executable (`MIKA-Engine.exe`).
3. **`MIKA-Engine_V1.1.2_Linux.zip`** — Pre-built Linux x64 Always-On-Top Avatar Overlay executable (`MIKA-Engine`).
4. **`MIKA-Engine_V1.1.2_Android.zip`** — Android WebView / Capacitor source & PWA package.
5. **`MIKA-Engine_V1.1.2_Standalone.zip`** — Universal single-file HTML5 bundle (`index.html` + `app.json` + `manifest.json`).
