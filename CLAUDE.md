# Easy Talk - Nextcloud Talk Client

## Project Overview
Cross-platform iOS/Android/Windows/Linux/macOS messenger app built as a Nextcloud Talk client with React Native (Expo SDK 55). Desktop support via Expo Web (react-native-web) + Electron.

## Tech Stack
- **Framework**: Expo SDK 55 with dev client (RN 0.83)
- **Language**: TypeScript (strict mode)
- **Navigation**: React Navigation (bottom tabs on mobile, drawer sidebar on desktop, native stack)
- **Desktop**: Electron + react-native-web (Expo web platform)
- **UI**: react-native-paper v5 (MD3), @callstack/liquid-glass (iOS 26+), @react-native-community/blur (iOS fallback), expo-image (media rendering with animated GIF support)
- **State**: zustand (client state), @tanstack/react-query (server state)
- **HTTP**: axios with OCS header interceptors
- **Storage**: expo-secure-store (credentials, mobile), expo-sqlite (offline cache, mobile), localStorage/Electron safeStorage (desktop), sql.js (offline cache, desktop)

## Architecture
- `src/api/` - Nextcloud Talk API wrappers (auth, conversations, messages, participants, contacts)
- `src/hooks/` - React hooks wrapping API calls with TanStack Query
- `src/stores/` - Zustand stores (auth, settings)
- `src/navigation/` - React Navigation setup (RootNavigator, MainLayout, MainTabs, DesktopSidebar, ChatStack)
- `src/screens/` - Screen components (includes DesktopChatSplitView for desktop split-pane chat)
- `src/components/` - Reusable UI components (platform/, chat/, conversations/, contacts/, common/)
- `src/theme/` - ThemeProvider with Material You dynamic colors + Liquid Glass
- `src/services/` - Long polling, secure storage, SQLite database, notifications
- `src/types/` - TypeScript type definitions (includes electron.d.ts, sql.js.d.ts)
- `src/utils/` - Utility functions (loadWebIcons)
- `src/config/` - Constants and configuration
- `electron/` - Electron main process, preload script, Forge config, tsconfig

## Key Patterns
- Path alias: `@/` maps to `src/`
- API client singleton with OCS envelope unwrapping in response interceptor
- Platform branching in `src/components/platform/` (GlassCard, GlassHeader, AdaptiveBackground) with `.web.tsx` variants
- Service abstractions via Metro `.web.ts` file extensions (secureStorage, database, notifications)
- Desktop layout: permanent sidebar + split-view chat (DesktopChatSplitView)
- Platform detection via `src/hooks/usePlatform.ts` (isWeb, isElectron, isMobile)
- Web icon fonts loaded via `src/utils/loadWebIcons.ts` (MaterialCommunityIcons @font-face injection)
- Long polling via `LongPollingManager` class with AbortController; returns `X-Chat-Last-Common-Read` header for read receipts
- Message read status: single checkmark (sent), double checkmark (read by all) — driven by `lastCommonRead` from API headers
- Contacts load immediately on mount (empty-query autocomplete), with server-side search for 2+ character queries
- iOS 26 styling: transparent glass headers (`headerTransparent` + `headerBlurEffect`) on list screens with `useHeaderHeight()` padding; opaque header on ChatWindow to avoid full-screen blur leak
- iOS floating tab bar: pill-shaped with LiquidGlassView, `marginHorizontal: 60`, `borderRadius: 28`, `overflow: 'hidden'`
- iOS floating message input: LiquidGlassView glass pill (`borderRadius: 28`) absolutely positioned above the tab bar; `bottom` dynamically adjusts when keyboard opens (from `tabBarHeight + 16` to `keyboardHeight`); MessageList gets extra `contentPaddingBottom` that reduces when keyboard is open
- iOS message text uses RN native `Text` (not react-native-paper) for proper emoji rendering
- Android message input uses RN native `TextInput` (not react-native-paper) for proper vertical text centering
- Media attachments in messages: images rendered via Nextcloud preview API (`/index.php/core/preview?fileId=`), GIFs loaded via WebDAV raw file URL (`/remote.php/dav/files/{userId}/{path}`) for animation support; videos show preview thumbnail with play overlay. Media max width capped at 300px on web/desktop, 65% of screen width on mobile
- Metro config (`metro.config.js`): resolves `@react-native-community/blur` and `@callstack/liquid-glass` to empty modules on web platform (these native-only modules have no web entry points)
- Icon fonts: iOS gets MaterialCommunityIcons from `react-native-vector-icons` autolinking (podspec `s.resources`); Android gets it from `expo-font` plugin (`android.fonts` in app.json). Both platforms use `useFonts` in App.tsx for runtime loading
- Keyboard handling: `Keyboard` event listeners in ChatWindowScreen track keyboard height on both platforms (`keyboardWillShow`/`Hide` on iOS, `keyboardDidShow`/`Hide` on Android). iOS adjusts absolute input position and content padding; Android applies `paddingBottom` to push input above keyboard

## Commands
- `npm start` - Start Metro dev server (dev client mode)
- `npm run typecheck` - TypeScript type check
- `npm run lint` - Run ESLint (includes Prettier checks)
- `npm run lint:fix` - Auto-fix ESLint + Prettier issues
- `npm run format` - Format all source files with Prettier
- `npm run format:check` - Check formatting without writing
- `npm run prebuild` - Generate native android/ and ios/ projects
- `npm run prebuild:clean` - Regenerate native projects from scratch
- `npm run android` - Build and run on Android (debug)
- `npm run ios` - Build and run on iOS (debug)
- `npm run android:release` - Build and run release variant on Android
- `npm run ios:release` - Build and run release config on iOS
- `npm run build:apk` - Build release APK (standalone)
- `npm run build:aab` - Build release AAB (Google Play)
- `npm run build:ios` - Build iOS archive
- `npm run web` - Start Expo web dev server
- `npm run build:web` - Export production web bundle
- `npm run electron:dev` - Start Electron desktop app (dev mode)
- `npm run electron:build` - Build desktop installers via Electron Forge
- `npm run electron:package` - Package desktop app without creating installers
- `npm run clean` - Clean all native build artifacts

## Build & Deployment
- **All builds are local** — no EAS or cloud build services used
- `npm run prebuild` generates `android/` and `ios/` directories (gitignored)
- Desktop: `npm run electron:build` creates platform-specific installers (Squirrel for Windows, DMG for macOS, DEB/RPM for Linux)
- Electron config in `electron/` directory (main.ts, preload.ts, forge.config.ts)
- See `docs/DEPLOYMENT.md` for the full build guide, signing setup, and troubleshooting

## Important Notes
- App identifier: `ru.easyoneweb.easytalk` (all platforms)
- Native modules require dev client builds (not Expo Go) on mobile
- Nextcloud Talk API v4 for conversations, v1 for chat messages
- Authentication uses Login Flow v2 (browser-based; `window.open()` on web, `expo-web-browser` on mobile)
- Electron uses `webSecurity: false` to bypass CORS (desktop app talks directly to Nextcloud servers)
- Electron uses `nativeTheme.themeSource = 'system'` to respect OS dark mode
- Electron production build uses custom `app://` protocol (registered via `protocol.handle`) to serve the `dist/` web bundle, so absolute asset paths (`/_expo/static/...`) resolve correctly inside the ASAR archive
- Electron Forge config is loaded via `config.forge` in `package.json` pointing to `./dist-electron/forge.config.js` (compiled from `electron/forge.config.ts`)
- Electron packaging uses an `ignore` regex to only bundle `dist-electron/`, `dist/`, `assets/`, and `package.json` into the ASAR (excludes `node_modules`, `src/`, native dirs) and a `packageAfterCopy` hook to rewrite `package.json` `main` from `index.ts` to `dist-electron/main.js`
- Electron tray: closing the window hides to tray; Cmd+Q / menu Quit actually quits (controlled by `isQuitting` flag set on `before-quit` event)
- macOS icon: `assets/icon.icns` generated from `icon.png`; Electron packager copies it as `electron.icns` into the app bundle. After installing a new build, run `lsregister -kill` + `killall Dock` if the Dock shows a stale cached icon
- App category: `public.app-category.social-networking` — set via `appCategoryType` in Forge packagerConfig (macOS) and `infoPlist.LSApplicationCategoryType` in app.json (iOS). Android Play Store category is set in Play Console, not in app config
- React Navigation theme is bridged from the Paper/Material theme in `App.tsx` (`ThemedNavigation` component) — maps Paper colors to navigation `background`, `card`, `text`, etc. so native stack transitions use correct dark/light backgrounds
- Desktop uses Material Design 3 (react-native-paper); iOS Liquid Glass/blur effects are mobile-only
