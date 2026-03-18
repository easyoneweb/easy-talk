# Easy Talk - Nextcloud Talk Client

## Project Overview
Cross-platform iOS/Android messenger app built as a Nextcloud Talk client with React Native (Expo SDK 55).

## Tech Stack
- **Framework**: Expo SDK 55 with dev client (RN 0.83)
- **Language**: TypeScript (strict mode)
- **Navigation**: React Navigation (bottom tabs + native stack)
- **UI**: react-native-paper v5 (MD3), @callstack/liquid-glass (iOS 26+), @react-native-community/blur (iOS fallback)
- **State**: zustand (client state), @tanstack/react-query (server state)
- **HTTP**: axios with OCS header interceptors
- **Storage**: expo-secure-store (credentials), expo-sqlite (offline cache)

## Architecture
- `src/api/` - Nextcloud Talk API wrappers (auth, conversations, messages, participants, contacts)
- `src/hooks/` - React hooks wrapping API calls with TanStack Query
- `src/stores/` - Zustand stores (auth, settings)
- `src/navigation/` - React Navigation setup (RootNavigator, MainTabs, ChatStack)
- `src/screens/` - Screen components
- `src/components/` - Reusable UI components (platform/, chat/, conversations/, contacts/, common/)
- `src/theme/` - ThemeProvider with Material You dynamic colors + Liquid Glass
- `src/services/` - Long polling, secure storage, SQLite database, notifications
- `src/types/` - TypeScript type definitions
- `src/config/` - Constants and configuration

## Key Patterns
- Path alias: `@/` maps to `src/`
- API client singleton with OCS envelope unwrapping in response interceptor
- Platform branching in `src/components/platform/` (GlassCard, GlassHeader)
- Long polling via `LongPollingManager` class with AbortController

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
- `npm run clean` - Clean all native build artifacts

## Build & Deployment
- **All builds are local** — no EAS or cloud build services used
- `npm run prebuild` generates `android/` and `ios/` directories (gitignored)
- See `docs/DEPLOYMENT.md` for the full build guide, signing setup, and troubleshooting

## Important Notes
- App identifier: `ru.easyoneweb.easytalk` (both platforms)
- Native modules require dev client builds (not Expo Go)
- Nextcloud Talk API v4 for conversations, v1 for chat messages
- Authentication uses Login Flow v2 (browser-based)
