# MIKA Engine v1.1.1 — Full-Screen Settings Deck & Android Overlay Warp Fix

**MIKA Engine v1.1.1** makes the **`> DIRECTOR_SETTINGS`** menu a true full-screen terminal view (with explicit `[X] EXIT` and `> BACK_TO_OVERLAY` controls so it never vanishes on mobile touches) and eliminates the Android overlay coordinate warp when tapping or speaking with MIKA.

---

### 🌟 What's Fixed & Improved in v1.1.1

* **Full-Screen `> DIRECTOR_SETTINGS` Terminal Deck**:
  * Converted `MikaSettingsModal` into a full-screen `#050308` terminal view (`100vw × 100vh`) with native touch scrolling and explicit **`[X] EXIT`** / **`> BACK_TO_OVERLAY`** buttons.
  * Removed the backdrop `onPointerDown` auto-dismiss on `DIRECTOR_SETTINGS`, `ASK`, and `> NEURAL_DATA_EXTRACTED` modals so tapping inputs, dropdowns, or scrolling on Android never accidentally closes the menu.
* **Android Overlay Pass-Through & Zero-Warp Fix (`MikaProxy`, `OverlayService`, `MainActivity`)**:
  * **100% Background Click Pass-Through**:
    * Fixed `menuOpen` backdrop (`pointerEvents: 'auto'`) so tapping anywhere outside MIKA's radial menu closes the ring and immediately shrinks the Android `TYPE_APPLICATION_OVERLAY` window back down to a tight **`92dp × 98dp`** avatar hit-box around MIKA, leaving 98%+ of your phone screen 100% clickable in underlying apps.
    * Updated `MainActivity` to call `finishAndRemoveTask()` + `overridePendingTransition(0, 0)` after starting `OverlayService` so the translucent launcher activity never lingers over the Android home screen.
  * **Eliminated Coordinate Warping**: Added a 3-tier overlay sizing bridge (`syncOverlayMode`: `92×98dp` compact avatar, `250×220dp` speech bubble box, `MATCH_PARENT` radial/modal) and increased mobile touch-slop thresholds (`dragThreshold: 12px`, `tapThreshold: 14px`) so tapping MIKA never jumps or warps her across the screen.

---

### 📦 Platform Installation Packages (Attached Below)

1. **`MIKA-Engine_V1.1.1_Android.apk`** — Standalone signed Android `.apk` with system-wide floating overlay (`Display over other apps`), zero-warp tap handling, and full-screen `> DIRECTOR_SETTINGS`.
2. **`MIKA-Engine_V1.1.1_Windows.zip`** — Pre-built Windows x64 Always-On-Top Avatar Overlay executable (`MIKA-Engine.exe`).
3. **`MIKA-Engine_V1.1.1_Linux.zip`** — Pre-built Linux x64 Always-On-Top Avatar Overlay executable (`MIKA-Engine`).
4. **`MIKA-Engine_V1.1.1_Android.zip`** — Android WebView / Capacitor source & PWA package.
5. **`MIKA-Engine_V1.1.1_Standalone.zip`** — Universal single-file HTML5 bundle (`index.html` + `app.json` + `manifest.json`).
