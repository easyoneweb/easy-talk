# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] - 2026-03-19

### Added

#### Core App
- Project scaffold with Expo SDK 55, React Native 0.83, React 19.2, and TypeScript strict mode
- App identifier `ru.easyoneweb.easytalk` across all platforms
- ESLint (eslint-config-expo) and Prettier integration
- Local build configuration — no EAS or cloud build dependency
- Deployment guide (`docs/DEPLOYMENT.md`) covering all platforms, signing, and troubleshooting

#### Authentication
- Nextcloud Login Flow v2 (browser-based OAuth): `expo-web-browser` on mobile, `window.open()` on web/Electron
- App-specific password stored securely after login flow completes
- Basic auth with `userId:appPassword` for all subsequent API calls
- Secure credential storage: `expo-secure-store` on mobile, `localStorage`/Electron `safeStorage` on desktop

#### Conversations
- Conversations list screen with search, pull-to-refresh, and unread badge counts
- Real-time conversation updates via long polling (`LongPollingManager` with `AbortController`)
- Offline conversation caching with SQLite (`expo-sqlite` on mobile, `sql.js` on desktop)

#### Chat
- Chat window with full message history, send, and reply support
- Real-time message updates via Nextcloud Talk long polling
- `X-Chat-Last-Common-Read` header tracking for message read receipts
- Single checkmark (sent) and double checkmark (read by all) read status indicators
- Date separators in message list with correct deduplication and `Invalid Date`-safe formatting
- Long polling callbacks update `lastCommonRead` state to trigger re-renders for double checkmarks

#### Media
- Inline image rendering via Nextcloud preview API (`/index.php/core/preview?fileId=`)
- Animated GIF rendering via WebDAV raw file URL using `expo-image`
- Video message thumbnails with play overlay
- Media width capped at 300px on web/desktop, 65% of screen width on mobile
- Media sending: 2-step Nextcloud flow — WebDAV PUT upload to `/Talk/` directory, then OCS file sharing API (`shareType: 10`)
- `expo-image-picker` for gallery and camera on mobile; hidden `<input type="file">` on web/desktop
- iOS ActionSheet for gallery/camera choice; Android/desktop opens gallery directly
- HEIC image normalization to JPEG (mime type + extension + re-encoding) for Nextcloud preview compatibility
- `useMediaUpload` hook managing pick → preview → upload → share lifecycle
- Message input media preview strip with thumbnail, filename, progress bar, and cancel button
- Send button enabled with media-only messages (no text required)
- Android keyboard GIF picker via `react-native-image-keyboard` plugin with custom Expo config plugin (`plugins/withGifKeyboard.js`)

#### Contacts
- Contacts search screen with Nextcloud user autocomplete
- Contacts load immediately on mount (empty-query), server-side search triggered at 2+ characters

#### Settings
- Theme switching (light / dark / system)
- Notifications toggle
- Logout

#### Platform UI — iOS
- iOS 26+ Liquid Glass styling: `@callstack/liquid-glass` (`LiquidGlassView`) for tab bar and message input
- `@react-native-community/blur` `BlurView` fallback for older iOS versions
- Transparent glass headers with `headerTransparent` + `headerBlurEffect` and `useHeaderHeight()` padding on list screens
- Opaque header on Chat Window to prevent full-screen blur leak
- Floating pill-shaped tab bar: `LiquidGlassView`, `marginHorizontal: 60`, `borderRadius: 28`
- Floating message input: glass pill absolutely positioned above the tab bar; `bottom` adjusts dynamically when keyboard opens
- Keyboard handling via `keyboardWillShow`/`Hide` listeners; input position and content padding adjust accordingly
- iOS message text uses native `Text` with `fontFamily: 'System'` to preserve emoji fallback when `MaterialCommunityIcons` is registered via podspec
- `react-native-vector-icons` provides `MaterialCommunityIcons` on iOS via podspec auto-linking
- App category set to `public.app-category.social-networking` via `infoPlist.LSApplicationCategoryType`

#### Platform UI — Android
- Material Design 3 (react-native-paper v5) with dynamic color theming
- Message input uses native `TextInput` (not react-native-paper) for correct vertical text centering
- Keyboard handling via `keyboardDidShow`/`Hide` listeners; `paddingBottom` pushes input above keyboard
- `MaterialCommunityIcons` font loaded via `expo-font` plugin (`android.fonts` in app.json)
- App category set in Play Console (not app config)

#### Platform UI — Desktop (Windows / Linux / macOS)
- Desktop support via Expo Web (react-native-web) + Electron
- Permanent sidebar navigation (`DesktopSidebar`) + split-view chat (`DesktopChatSplitView`)
- Electron main process with system tray: window close hides to tray, Cmd+Q / menu Quit actually quits
- Custom `app://` protocol registered in production builds to serve `dist/` bundle and resolve absolute asset paths inside ASAR
- ASAR packaging optimized: ignore regex reduces bundle from ~5.7 GB to ~5 MB (excludes `node_modules`, `src/`, native dirs)
- `packageAfterCopy` hook rewrites `package.json` `main` field to `dist-electron/main.js` at package time
- `webSecurity: false` in Electron BrowserWindow to bypass CORS when talking to Nextcloud servers
- `nativeTheme.themeSource = 'system'` to respect OS dark/light mode
- macOS icon: `assets/icon.icns` generated from `icon.png`; copied as `electron.icns` into app bundle
- macOS app category `public.app-category.social-networking` via Forge `appCategoryType`
- Metro config stubs `@react-native-community/blur` and `@callstack/liquid-glass` on web platform (native-only, no web entry points)
- Web icon fonts loaded via `@font-face` injection (`src/utils/loadWebIcons.ts`)
- Desktop SQLite via `sql.js`; secure storage via `localStorage`/Electron `safeStorage`; notifications via Web Notifications API
- Platform detection hook `usePlatform` (`isWeb`, `isElectron`, `isMobile`) for runtime branching

#### Theme & Navigation
- `ThemeProvider` with Material You dynamic colors and Liquid Glass integration
- React Navigation theme bridged from react-native-paper theme in `App.tsx` (`ThemedNavigation`) — maps Paper colors to navigation `background`, `card`, `text` for correct dark/light native stack transitions
- Dark mode transition flash eliminated by bridging themes before navigation renders

#### State & Data
- Zustand stores for auth and settings
- TanStack Query for server state (conversations, messages, contacts)
- Axios HTTP client with OCS header interceptors and envelope unwrapping in response interceptor
- Nextcloud Talk API v4 for conversations, v1 for chat messages
