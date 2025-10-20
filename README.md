# # Conch Social 🐚

A production-grade **cross-platform mobile messenger** built with **React Native + Expo**, designed for **Remote Team Professionals** who collaborate asynchronously across time zones.

## Features

### MVP (Current)
- ✅ Email/password authentication
- ✅ Real-time messaging with Firestore
- ✅ 1:1 and group conversations
- ✅ User discovery and search
- ✅ Cross-platform (iOS, Android, Web)
- ✅ Modern UI with tab navigation

### Coming Soon
- 🔄 Offline message queue and caching
- 🔄 Image and file attachments
- 🔄 Push notifications
- 🔄 Message delivery and read receipts
- 🔄 AI-powered features:
  - Thread summaries
  - Action item extraction
  - Decision tracking
  - Priority detection
- 🔄 Proactive scheduling assistant with calendar integration

## Tech Stack

- **Frontend:** React Native (Expo SDK 54), TypeScript
- **Backend:** Firebase (Auth, Firestore, Storage, Functions)
- **State Management:** Zustand
- **Navigation:** Expo Router
- **UI:** React Native core components with custom styling

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Required Packages

```bash
npm install firebase zustand @react-native-async-storage/async-storage expo-image-picker date-fns
```

### 3. Firebase Setup

See **[SETUP.md](./SETUP.md)** for detailed Firebase configuration instructions.

Quick steps:
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password, Google)
3. Create Firestore Database
4. Enable Cloud Storage
5. Copy your Firebase config to `.env` file

### 4. Run the App

```bash
npm start
```

Then press:
- `i` for iOS Simulator
- `a` for Android Emulator
- `w` for Web browser

## Project Structure

```
conch/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication (login, signup)
│   ├── (tabs)/            # Main tabs (chats, discover, profile)
│   └── chat/[id].tsx      # Chat screen
├── components/            # Reusable UI components
├── contexts/              # React contexts (AuthContext)
├── hooks/                 # Custom hooks (useAuth, useMessages)
├── lib/                   # Firebase configuration
├── services/              # Firebase services (auth, firestore)
├── stores/                # Zustand stores (auth, chat, UI)
├── types/                 # TypeScript type definitions
└── memory-bank/           # Project documentation
```

## Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Type Checking
```bash
npx tsc --noEmit
```

## Documentation

- **[SETUP.md](./SETUP.md)** - Complete setup guide
- **[docs/PRD.md](./docs/PRD.md)** - Product Requirements Document
- **[memory-bank/](./memory-bank/)** - Project memory and context

## Architecture

### State Management (Zustand)
- `authStore` - User authentication state
- `chatStore` - Conversations and messages
- `uiStore` - UI state (modals, loading, toasts)

### Data Flow
```
User Action → Hook → Service → Firebase → Real-time Listener → Store → UI Update
```

### Key Patterns
- Real-time sync with Firestore listeners
- Optimistic UI updates for messages
- Protected routes with auth guards
- Offline-first design (coming soon)

## Contributing

1. Check the memory bank for project context
2. Follow the established patterns
3. Update documentation when making changes
4. Test on iOS, Android, and Web

## Roadmap

### Phase 1: MVP ✅ (Current)
- Basic authentication
- Real-time messaging
- User discovery

### Phase 2: Core Features (Next)
- Offline support
- Push notifications
- AI summaries and actions

### Phase 3: Advanced (Future)
- Calendar integration
- Meeting scheduling assistant
- Advanced AI features

## License

MIT

## Support

For setup help, see [SETUP.md](./SETUP.md) or check the Firebase Console for errors.

---

Built with ❤️ using React Native, Expo, and Firebase
