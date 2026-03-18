# Easy Talk - Nextcloud Talk Client

## Project Overview
Cross-platform iOS/Android/Windows/Linux/macOS messenger app built as a Nextcloud Talk client with React Native (Expo SDK 55). Desktop support via Expo Web (react-native-web) + Electron.

## Tech Stack
- **Framework**: Expo SDK 55 with dev client (RN 0.83)
- **Language**: TypeScript (strict mode)
- **Navigation**: React Navigation (bottom tabs on mobile, drawer sidebar on desktop, native stack)
- **Desktop**: Electron + react-native-web (Expo web platform)
- **UI**: react-native-paper v5 (MD3), @callstack/liquid-glass (iOS 26+), @react-native-community/blur (iOS fallback)
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
- Desktop uses Material Design 3 (react-native-paper); iOS Liquid Glass/blur effects are mobile-only
