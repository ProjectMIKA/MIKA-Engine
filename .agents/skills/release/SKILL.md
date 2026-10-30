---
name: release
description: Build, version-tag, and publish MIKA Engine releases to GitHub Releases — END-TO-END BY DEFAULT (bump -> notes -> build -> commit -> tag -> publish all 4 platform zips -> archive).
---

# MIKA Engine Release Skill (`release`)

When shipping a release for **MIKA Engine**, execute the entire pipeline end-to-end so the GitHub Release page carries all four platform installation packages:

1. **Bump Version**: Update `"version"` in `package.json` and `app.json`.
2. **Release Notes**: Update `RELEASE_NOTES.md` and prepend the changelog section in `README.md`.
3. **Verify & Build**:
   ```bash
   npm test
   npm run lint
   npm run build
   ```
   This compiles the single-file bundle into `dist/index.html` and runs `package-app.cjs` to produce:
   - `builds/MIKA-Engine_V<VERSION>_Windows.zip`
   - `builds/MIKA-Engine_V<VERSION>_Linux.zip`
   - `builds/MIKA-Engine_V<VERSION>_Android.zip`
   - `builds/MIKA-Engine_V<VERSION>_Standalone.zip`
4. **Commit, Tag & Push**:
   ```bash
   git add -A
   git commit -m "chore(release): v<VERSION>"
   git tag -a "v<VERSION>" -m "MIKA Engine v<VERSION>"
   git push origin main --tags
   ```
5. **Publish GitHub Release (`gh`)**:
   ```bash
   gh release create "v<VERSION>" \
     "builds/MIKA-Engine_V<VERSION>_Windows.zip#MIKA-Engine_V<VERSION>_Windows.zip (Windows Desktop Overlay & Stage)" \
     "builds/MIKA-Engine_V<VERSION>_Linux.zip#MIKA-Engine_V<VERSION>_Linux.zip (Linux Desktop Overlay & Stage)" \
     "builds/MIKA-Engine_V<VERSION>_Android.zip#MIKA-Engine_V<VERSION>_Android.zip (Android PWA & Capacitor Package)" \
     "builds/MIKA-Engine_V<VERSION>_Standalone.zip#MIKA-Engine_V<VERSION>_Standalone.zip (Universal Single-File Web Bundle)" \
     --title "v<VERSION> — <Headline>" \
     --notes-file RELEASE_NOTES.md
   ```
