# Easy Talk

A cross-platform messenger for [Nextcloud Talk](https://nextcloud.com/talk/) — built with React Native for iOS, Android, and desktop (Windows, Linux, macOS via Electron).

Easy Talk connects to your Nextcloud server and gives you a native chat experience: **Liquid Glass** on iOS 26+, **Material Design 3** with dynamic colors on Android, and a desktop app with sidebar navigation and split-view chat.

## Features

- **Login** — Secure browser-based authentication via Nextcloud Login Flow v2
- **Conversations** — View all your chats with unread counts, avatars, and search
- **Messaging** — Send and receive messages in real time with long polling
- **Replies** — Reply to specific messages with quoted previews
- **Media** — Inline images, animated GIFs, and video previews in chat
- **Contacts** — Search Nextcloud users and start new conversations
- **Offline support** — Cached conversations and messages available without network
- **Theming** — System, light, and dark themes; Android picks up your device's Material You colors
- **Notifications** — Push notification scaffolding for incoming messages

## Screenshots

*Coming soon*

## Requirements

- Node.js 18+
- For iOS builds: macOS with Xcode 16+, CocoaPods
- For Android builds: JDK 17, Android Studio, Android SDK (API 35)

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full setup guide.

## Getting Started

```bash
# Install dependencies
npm install

# Generate native projects
npm run prebuild

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

The app will open a dev client. Enter your Nextcloud server URL, authenticate in the browser, and start chatting.

## Building for Release

```bash
# Android APK (direct install)
npm run build:apk

# Android AAB (Google Play)
npm run build:aab

# iOS archive (App Store / TestFlight)
npm run build:ios

# Desktop installers (Windows/macOS/Linux)
npm run electron:build
```

All builds run locally — no cloud build services required. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for signing setup and detailed instructions.

## Project Structure

```
src/
├── api/            Nextcloud Talk API client modules
├── components/     Reusable UI components
│   ├── chat/       Message bubbles, list, input
│   ├── common/     Avatar, badge, empty state
│   ├── contacts/   Contact search and list items
│   ├── conversations/  Conversation list items
│   └── platform/   iOS Liquid Glass / Android MD3 wrappers
├── config/         Constants and configuration
├── hooks/          React hooks (TanStack Query wrappers)
├── navigation/     React Navigation setup
├── screens/        App screens
├── services/       Long polling, storage, database, notifications
├── stores/         Zustand state stores
├── theme/          Theming (Material You + Liquid Glass)
└── types/          TypeScript type definitions
```

## Tech Stack

| | |
|---|---|
| Framework | Expo SDK 55 (React Native 0.83) |
| Language | TypeScript |
| Navigation | React Navigation |
| UI (Android) | React Native Paper (Material Design 3) |
| UI (iOS) | Liquid Glass / BlurView |
| Media | expo-image (animated GIF support) |
| State | Zustand + TanStack Query |
| Storage | Expo Secure Store + SQLite |
| Desktop | Electron + react-native-web |
| Linting | ESLint (eslint-config-expo) + Prettier |

## Development

```bash
npm start           # Start dev server
npm run typecheck   # TypeScript check
npm run lint        # ESLint + Prettier
npm run lint:fix    # Auto-fix issues
npm run format      # Format with Prettier
```

## License

*TBD*
