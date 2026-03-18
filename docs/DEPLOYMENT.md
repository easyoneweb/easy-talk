# Easy Talk — Local Build & Deployment Guide

All builds are done locally on your machine. No Expo EAS or cloud build services are used.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Generate Native Projects](#generate-native-projects)
4. [Android — Debug Build](#android--debug-build)
5. [Android — Release APK](#android--release-apk)
6. [Android — Release AAB (Google Play)](#android--release-aab-google-play)
7. [Android — App Signing](#android--app-signing)
8. [iOS — Debug Build](#ios--debug-build)
9. [iOS — Release Archive (App Store / TestFlight)](#ios--release-archive-app-store--testflight)
10. [iOS — Code Signing](#ios--code-signing)
11. [Desktop — Web Dev Server](#desktop--web-dev-server)
12. [Desktop — Electron Dev Mode](#desktop--electron-dev-mode)
13. [Desktop — Building Installers](#desktop--building-installers)
14. [Desktop — Platform-Specific Notes](#desktop--platform-specific-notes)
15. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Common (macOS / Linux / Windows)

| Software | Minimum Version | How to Install |
|----------|----------------|----------------|
| **Node.js** | 18.x (LTS recommended: 20.x or 22.x) | https://nodejs.org or `brew install node` |
| **npm** | 9.x+ (comes with Node) | `npm install -g npm@latest` |
| **Git** | 2.x+ | `brew install git` or https://git-scm.com |
| **Watchman** (macOS, recommended) | latest | `brew install watchman` |

### Android-specific

| Software | Details |
|----------|---------|
| **Java Development Kit (JDK)** | JDK 17 (required by Gradle for RN 0.83). Install: `brew install --cask zulu@17` (macOS) or download from https://www.azul.com/downloads/ |
| **Android Studio** | Latest stable. Download: https://developer.android.com/studio |
| **Android SDK** | Installed via Android Studio → SDK Manager |
| **Android SDK Platform** | API 35 (Android 15) — required by Expo SDK 55 |
| **Android SDK Build-Tools** | 35.0.0 |
| **Android NDK** | 27.1.12297006 (side by side) |
| **CMake** | 3.22.1 (via SDK Manager → SDK Tools tab) |
| **Android Emulator** (optional) | For testing without a physical device |

#### Android environment variables

Add these to your shell profile (`~/.zshrc`, `~/.bashrc`, or `~/.bash_profile`):

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

After editing, reload: `source ~/.zshrc`

Verify:
```bash
java -version          # Should show "17.x.x"
echo $ANDROID_HOME     # Should print the SDK path
adb --version          # Should print adb version
```

#### Android SDK setup via Android Studio

1. Open Android Studio → **Settings** → **Languages & Frameworks** → **Android SDK**
2. **SDK Platforms** tab: check **Android 15 (API 35)**
3. **SDK Tools** tab: check:
   - Android SDK Build-Tools 35.0.0
   - NDK (Side by side) 27.1.12297006
   - CMake 3.22.1
   - Android Emulator
   - Android SDK Platform-Tools
4. Click **Apply** / **OK**

### iOS-specific (macOS only)

| Software | Details |
|----------|---------|
| **macOS** | Sequoia 15.x or later recommended |
| **Xcode** | 16.x+ (for RN 0.83). Xcode 26 beta required for Liquid Glass. Download from Mac App Store or https://developer.apple.com/xcode/ |
| **Xcode Command Line Tools** | `xcode-select --install` |
| **CocoaPods** | `sudo gem install cocoapods` or `brew install cocoapods` |
| **Apple Developer Account** | Free for simulator builds. Paid ($99/year) for device builds and App Store distribution |

Verify:
```bash
xcodebuild -version    # Should print Xcode version
pod --version           # Should print CocoaPods version (1.15+)
```

---

## Project Setup

```bash
# Clone the repository (if not done yet)
git clone <repo-url>
cd easy-talk

# Install JavaScript dependencies
npm install

# Verify TypeScript compiles cleanly
npm run typecheck
```

---

## Generate Native Projects

Expo uses **prebuild** to generate the native `android/` and `ios/` directories from `app.json` config and Expo plugins. You must run this before any native build.

```bash
# Generate native projects (first time or after changing app.json / plugins)
npm run prebuild

# Force regenerate (nukes existing android/ and ios/ and recreates)
npm run prebuild:clean
```

This creates:
- `android/` — Gradle-based Android project
- `ios/` — Xcode workspace with CocoaPods

**Important:** These generated directories are gitignored. Always regenerate from `app.json` via prebuild. Do not manually edit files in `android/` or `ios/` unless you know the changes will be overwritten.

---

## Android — Debug Build

### On emulator
```bash
# Start Metro bundler + build + install on running emulator
npm run android
```

### On physical device
1. Enable **Developer Options** and **USB Debugging** on the device
2. Connect via USB
3. Verify device is visible: `adb devices`
4. Run:
```bash
npm run android
```

---

## Android — Release APK

A release APK is a standalone installable file. Use this for direct distribution (not Google Play).

### Step 1: Set up signing (first time only)

See [Android — App Signing](#android--app-signing) below.

### Step 2: Prebuild if not done

```bash
npm run prebuild
```

### Step 3: Build the APK

```bash
npm run build:apk
```

This runs `./gradlew assembleRelease` inside `android/`.

### Step 4: Find the APK

The output APK is at:
```
android/app/build/outputs/apk/release/app-release.apk
```

### Step 5: Install on a device (optional)

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

---

## Android — Release AAB (Google Play)

Google Play requires an Android App Bundle (AAB) instead of APK.

```bash
npm run build:aab
```

This runs `./gradlew bundleRelease` inside `android/`.

Output:
```
android/app/build/outputs/bundle/release/app-release.aab
```

Upload this `.aab` file to Google Play Console → Production / Internal testing.

---

## Android — App Signing

Release builds must be signed. There are two approaches:

### Option A: Debug signing (quick testing)

By default, Expo prebuild configures release builds to use the debug keystore. This works for local APK installs but **not** for Google Play.

### Option B: Production keystore (Google Play)

#### 1. Generate a keystore

```bash
keytool -genkeypair \
  -v \
  -storetype PKCS12 \
  -keystore android/app/easytalk-release.keystore \
  -alias easytalk-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

You will be prompted for:
- Keystore password
- Key password
- Your name, organization, etc.

**Keep this keystore file and passwords safe. If you lose them, you cannot update your app on Google Play.**

#### 2. Configure Gradle to use the keystore

Create the file `android/gradle.properties` (or append to it) — **do not commit passwords**:

```properties
EASYTALK_RELEASE_STORE_FILE=easytalk-release.keystore
EASYTALK_RELEASE_KEY_ALIAS=easytalk-key
EASYTALK_RELEASE_STORE_PASSWORD=your_store_password
EASYTALK_RELEASE_KEY_PASSWORD=your_key_password
```

#### 3. Edit `android/app/build.gradle`

Find the `android { }` block and add/modify the `signingConfigs` and `buildTypes`:

```groovy
android {
    // ...existing config...

    signingConfigs {
        release {
            if (project.hasProperty('EASYTALK_RELEASE_STORE_FILE')) {
                storeFile file(EASYTALK_RELEASE_STORE_FILE)
                storePassword EASYTALK_RELEASE_STORE_PASSWORD
                keyAlias EASYTALK_RELEASE_KEY_ALIAS
                keyPassword EASYTALK_RELEASE_KEY_PASSWORD
            }
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true     // enable ProGuard/R8
            shrinkResources true   // remove unused resources
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### 4. Rebuild

```bash
npm run build:apk
# or
npm run build:aab
```

#### Security note

- Add `*.keystore` to `.gitignore` (already covered by `*.jks` pattern, but add explicitly if using `.keystore` extension)
- Never commit keystore passwords to version control
- Consider using environment variables or a `local.properties` approach

---

## iOS — Debug Build

### On simulator
```bash
npm run ios
```

This will:
1. Run `pod install` in `ios/` (automatically via expo)
2. Build the app with Xcode
3. Install and launch on the iOS Simulator

### On physical device

1. Open `ios/EasyTalk.xcworkspace` in Xcode
2. Select your Apple Developer team in **Signing & Capabilities**
3. Select your connected device as the build target
4. Press **Cmd + R** to build and run

Or from CLI:
```bash
npx expo run:ios --device
```

---

## iOS — Release Archive (App Store / TestFlight)

### Step 1: Prebuild

```bash
npm run prebuild
```

### Step 2: Open in Xcode

```bash
open ios/EasyTalk.xcworkspace
```

### Step 3: Configure signing

1. Select the **EasyTalk** target
2. Go to **Signing & Capabilities** tab
3. Check **Automatically manage signing**
4. Select your **Team** (requires paid Apple Developer account)
5. Verify the **Bundle Identifier** is `ru.easyoneweb.easytalk`

### Step 4: Set the build scheme to Release

1. In the menu bar: **Product** → **Scheme** → **Edit Scheme...**
2. Select **Run** on the left
3. Set **Build Configuration** to **Release**
4. Close

### Step 5: Archive

1. Select **Any iOS Device (arm64)** as the destination (not a simulator)
2. **Product** → **Archive**
3. Wait for the build to complete
4. The **Organizer** window opens automatically

### Step 5 (alternative): Archive from CLI

```bash
npm run build:ios
```

Or more explicitly:
```bash
cd ios

xcodebuild -workspace EasyTalk.xcworkspace \
  -scheme EasyTalk \
  -configuration Release \
  -sdk iphoneos \
  -destination 'generic/platform=iOS' \
  archive \
  -archivePath build/EasyTalk.xcarchive
```

### Step 6: Export / Upload

**From Xcode Organizer:**
1. Select the archive
2. Click **Distribute App**
3. Choose **App Store Connect** (for TestFlight / App Store) or **Ad Hoc** (for direct install)
4. Follow the prompts

**From CLI (using xcodebuild):**

Create an `ExportOptions.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
</dict>
</plist>
```

Then export:
```bash
xcodebuild -exportArchive \
  -archivePath build/EasyTalk.xcarchive \
  -exportPath build/export \
  -exportOptionsPlist ExportOptions.plist
```

Upload to App Store Connect:
```bash
xcrun altool --upload-app \
  -f build/export/EasyTalk.ipa \
  -t ios \
  -u "your@apple.id" \
  -p "app-specific-password"
```

Or use **Transporter** app from Mac App Store for a GUI-based upload.

---

## iOS — Code Signing

### Automatic (recommended for solo devs)

1. In Xcode, enable **Automatically manage signing**
2. Select your team
3. Xcode handles provisioning profiles and certificates

### Manual

1. Create certificates at https://developer.apple.com/account/resources/certificates
   - **Apple Development** — for debug builds
   - **Apple Distribution** — for App Store / TestFlight
2. Create an **App ID** with bundle identifier `ru.easyoneweb.easytalk`
3. Create **Provisioning Profiles**:
   - Development (for device testing)
   - Distribution (for App Store)
4. Download and install in Xcode (double-click `.mobileprovision` files)
5. In Xcode → target → Signing & Capabilities: uncheck auto-signing, select profiles manually

---

## Desktop — Web Dev Server

The app can run in a browser using Expo's web platform (react-native-web). This is useful for quick testing without Electron.

```bash
npm run web
```

This starts Metro bundler serving the web version at `http://localhost:8081`. The app renders using react-native-web with a desktop-optimized layout (sidebar navigation, split-view chat).

---

## Desktop — Electron Dev Mode

For a full desktop experience with native window chrome, system tray, and encrypted credential storage:

```bash
npm run electron:dev
```

This runs two processes concurrently:
1. Expo web dev server on port 8081
2. Electron loading from `http://localhost:8081` (waits for Metro to be ready)

Hot reload works — changes to React components update live in the Electron window.

### First-time setup

No additional setup is needed beyond `npm install`. Electron and all Forge makers are included as devDependencies.

---

## Desktop — Building Installers

### Package without installers (for testing)

```bash
npm run electron:package
```

This creates a packaged app in `out/` without creating platform-specific installers. Useful for quick local testing.

### Build distributable installers

```bash
npm run electron:build
```

This:
1. Exports the Expo web bundle to `dist/`
2. Compiles Electron TypeScript to `dist-electron/`
3. Runs Electron Forge to package and create platform-specific installers

The Forge config is at `electron/forge.config.ts` (compiled to `dist-electron/forge.config.js`), referenced via `config.forge` in `package.json`. The packager bundles only `dist-electron/`, `dist/`, `assets/`, and `package.json` into the ASAR archive (all other files are excluded to keep the bundle small).

### What each platform produces

| Platform | Maker | Output |
|----------|-------|--------|
| **Windows** | Squirrel.Windows | `.exe` installer with auto-update support |
| **macOS** | DMG | `.dmg` disk image |
| **Linux** | DEB + RPM | `.deb` (Debian/Ubuntu) and `.rpm` (Fedora/RHEL) packages |

Output location: `out/make/`

### Cross-platform builds

Electron Forge builds for the **current platform only**. To build for all platforms:
- Build Windows installers on a Windows machine (or Windows CI runner)
- Build macOS DMG on macOS
- Build Linux packages on Linux (or Linux CI runner)

For CI, use a GitHub Actions matrix:
```yaml
strategy:
  matrix:
    os: [windows-latest, macos-latest, ubuntu-latest]
```

---

## Desktop — Platform-Specific Notes

### Architecture

Desktop support uses **Expo Web + Electron**:
- React components render via `react-native-web` in Electron's Chromium renderer
- Electron main process handles: window management, system tray, native menus, encrypted credential storage (via `safeStorage`), and OS notifications
- Communication between renderer and main process uses IPC via a preload script (`electron/preload.ts`)
- Production builds use a custom `app://` protocol to serve the web bundle from the `dist/` directory inside the ASAR archive, ensuring absolute asset paths resolve correctly

### Service abstractions

Native mobile APIs are replaced with web equivalents via Metro's `.web.ts` file extension resolution:

| Service | Mobile | Desktop (web) |
|---------|--------|---------------|
| **Secure storage** | `expo-secure-store` | `localStorage` (browser) / Electron `safeStorage` (desktop app) |
| **Database** | `expo-sqlite` | `sql.js` (SQLite compiled to WASM) with IndexedDB persistence |
| **Notifications** | `expo-notifications` | Web Notifications API / Electron native notifications |
| **Long polling** | `AppState` | `document.visibilityState` (handled by react-native-web) |
| **OAuth browser** | `expo-web-browser` | `window.open()` |

### Desktop UI differences

- **Navigation**: Permanent sidebar (drawer) instead of bottom tabs; no hamburger toggle (hidden via `headerLeft: () => null`)
- **Chat**: Split-view with conversation list on the left and chat on the right (empty state when no conversation selected)
- **Visual effects**: No Liquid Glass or blur — uses Material Design 3 Surface cards
- **Icons**: MaterialCommunityIcons font loaded via CSS `@font-face` injection (`src/utils/loadWebIcons.ts`)
- **Platform components**: `.web.tsx` variants in `src/components/platform/` avoid bundling iOS-only native modules
- **Contacts**: Load immediately on mount (empty-query returns known users), same as mobile

### Electron project structure

```
electron/
  main.ts          — Main process (window, IPC handlers, tray, menus, app:// protocol)
  preload.ts       — contextBridge exposing electronAPI to renderer
  forge.config.ts  — Electron Forge packaging configuration (ignore patterns, hooks, makers)
  tsconfig.json    — TypeScript config for Electron code (compiles to dist-electron/)
```

### App category

The macOS app is categorized as **Social Networking** (`public.app-category.social-networking`) via `appCategoryType` in `forge.config.ts`. The same category is set for iOS via `infoPlist` in `app.json`. For Android, the Play Store category is configured in Google Play Console (not in the app manifest).

### CORS handling

The Electron main process sets `webSecurity: false` on the `BrowserWindow`. This disables CORS enforcement, allowing the renderer to make direct API requests to any Nextcloud server. This is necessary because Nextcloud does not send `Access-Control-Allow-Origin` headers, and is safe because this is a trusted desktop app (not a public website). The `npm run web` browser mode will also hit CORS issues unless you configure a proxy or browser extension.

### Dark mode

Electron is configured with `nativeTheme.themeSource = 'system'`, so `prefers-color-scheme` CSS media queries (used by react-native-web's `useColorScheme`) correctly reflect the OS dark mode setting.

### Security

The Electron setup follows security best practices:
- `contextIsolation: true` — renderer cannot access Node.js APIs directly
- `nodeIntegration: false` — no `require()` in renderer
- All main process communication via `contextBridge` and `ipcRenderer.invoke()`
- Credentials encrypted with Electron's `safeStorage` (OS-level encryption)
- `webSecurity: false` is required for CORS bypass (see above) — this is acceptable for a desktop app but means the renderer can load cross-origin resources

---

## Troubleshooting

### General

**"Metro bundler not found" or blank screen**
```bash
# Start Metro manually in a separate terminal
npx expo start --dev-client
```

**TypeScript errors after prebuild**
```bash
npm run typecheck
```

**Stale native code after changing plugins or app.json**
```bash
npm run prebuild:clean
```

### Android

**"SDK location not found"**
Create `android/local.properties`:
```properties
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
```

**"Could not determine the dependencies of task ':app:compileDebugJavaWithJavac'"**
```bash
cd android && ./gradlew clean && cd ..
npm run prebuild:clean
npm run android
```

**"JAVA_HOME is not set"**
```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```
Add to `~/.zshrc` permanently.

**Gradle daemon issues**
```bash
cd android && ./gradlew --stop && cd ..
```

**"Installed Build Tools revision X is corrupted"**
Open Android Studio → SDK Manager → uninstall and reinstall the affected Build-Tools version.

### iOS

**"No signing certificate / provisioning profile"**
- Ensure you have a paid Apple Developer account
- In Xcode: Preferences → Accounts → add your Apple ID
- In target Signing & Capabilities: select your team

**Pod install fails**
```bash
cd ios
pod deintegrate
pod install --repo-update
cd ..
```

**"The sandbox is not in sync with the Podfile.lock"**
```bash
cd ios && pod install && cd ..
```

**Xcode build fails with module not found**
```bash
npm run prebuild:clean
cd ios && pod install && cd ..
```

**M1/M2/M3 Mac CocoaPods issues**
```bash
# If pod install fails with architecture errors
cd ios
arch -x86_64 pod install
cd ..
```

### Desktop / Electron

**`npm run web` shows blank page or errors**
```bash
# Ensure web dependencies and babel preset are installed
npx expo install react-dom react-native-web @expo/metro-runtime
npm install babel-preset-expo

# Clear Metro cache and restart
npx expo start --web --clear
```

**CORS errors in browser (not Electron)**
- Running via `npm run web` in a regular browser will hit CORS errors when connecting to Nextcloud
- This is expected — use `npm run electron:dev` for full desktop testing (Electron bypasses CORS)
- For browser-only testing, configure a CORS proxy or use a browser extension

**`npm run electron:dev` — Electron window is blank**
- Metro may not be ready yet. The `wait-on` utility should handle this, but if it times out, start Metro separately:
```bash
# Terminal 1
npm run web

# Terminal 2 (after Metro is ready)
tsc -p electron/tsconfig.json && electron dist-electron/main.js --dev
```

**macOS Dock shows default Electron icon instead of Easy Talk icon**
macOS aggressively caches app icons. After installing a new build, reset the icon cache:
```bash
/System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/LaunchServices.framework/Versions/A/Support/lsregister -kill -r -domain local -domain system -domain user
killall Dock
```

**`npm run electron:build` fails with "cannot find module"**
```bash
# Ensure Electron TypeScript is compiled
npx tsc -p electron/tsconfig.json

# Verify dist-electron/ contains main.js and preload.js
ls dist-electron/
```

**Native module errors on web (e.g., `@callstack/liquid-glass`)**
- Platform components should have `.web.tsx` variants that avoid importing native modules
- If a new native module is added, create a `.web.tsx` variant in `src/components/platform/`

**sql.js WASM file not found**
- `sql.js` needs its WASM binary. By default it fetches from CDN. If offline, copy `node_modules/sql.js/dist/sql-wasm.wasm` to your `public/` or `dist/` directory

**Electron `safeStorage` not available**
- `safeStorage` requires a running desktop environment with a keychain/keyring
- On headless Linux, install `gnome-keyring` or `kwallet`
- Falls back to `localStorage` when `electronAPI` is not present (browser-only mode)

---

## Quick Reference — All Commands

| Task | Command |
|------|---------|
| Install dependencies | `npm install` |
| Type-check | `npm run typecheck` |
| Generate native projects | `npm run prebuild` |
| Regenerate from scratch | `npm run prebuild:clean` |
| Run on Android (debug) | `npm run android` |
| Run on iOS (debug) | `npm run ios` |
| Build release APK | `npm run prebuild && npm run build:apk` |
| Build release AAB | `npm run prebuild && npm run build:aab` |
| Build iOS archive | `npm run prebuild && npm run build:ios` |
| Run web in browser | `npm run web` |
| Build web bundle | `npm run build:web` |
| Run Electron (dev) | `npm run electron:dev` |
| Build desktop installers | `npm run electron:build` |
| Package desktop app | `npm run electron:package` |
| Start dev server manually | `npm start` |
| Clean all build artifacts | `npm run clean` |

---

## Build Output Locations

| Artifact | Path |
|----------|------|
| Android debug APK | `android/app/build/outputs/apk/debug/app-debug.apk` |
| Android release APK | `android/app/build/outputs/apk/release/app-release.apk` |
| Android release AAB | `android/app/build/outputs/bundle/release/app-release.aab` |
| iOS archive | `ios/build/EasyTalk.xcarchive` |
| iOS exported IPA | `ios/build/export/EasyTalk.ipa` |
| Web bundle | `dist/` |
| Electron compiled TS | `dist-electron/` |
| Desktop packaged app | `out/` |
| Desktop installers | `out/make/` |
