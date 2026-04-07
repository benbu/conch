## Auth persistence in Expo Go vs Dev Client

Firebase Auth persistence uses React Native `AsyncStorage` when available. In Expo Go, native persistence may not be initialized, causing sessions to be lost after force close. This app includes a fallback that securely stores email/password using `expo-secure-store` and attempts a silent sign-in on launch if Firebase does not restore a session. For best reliability, use a Dev Client or production build.

# # Conch Social 🐚

A production-grade **cross-platform mobile messenger** built with **React Native + Expo**, designed for **Remote Team Professionals** who collaborate asynchronously across time zones.

## Tech Stack

- **Frontend:** React Native (Expo SDK 54), TypeScript
- **Backend:** Firebase (Auth, Firestore, Storage, Functions, FCM)
- **AI Layer:** Vercel AI SDK with OpenAI GPT-4 Turbo
- **State Management:** Zustand
- **Navigation:** Expo Router
- **Caching:** AsyncStorage for offline support
- **UI:** React Native core components with custom styling

## Quick Start

See **[QUICKSTART.md](./QUICKSTART.md)** for a complete 30-minute setup guide!

### TL;DR

```bash
# 1. Install dependencies
npm install
cd functions && npm install && cd ..

# 2. Configure Firebase (see QUICKSTART.md for details)
cp .env.example .env  # Add your Firebase config

# 3. Deploy Cloud Functions
cd functions
npm run build
npm run deploy

# 4. Run the app
cd ..
npm start
```

Then press:
- `w` for Web (fastest for testing)
- `i` for iOS Simulator
- `a` for Android Emulator

## Project Structure

```
conch/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication (login, signup)
│   ├── (tabs)/            # Main tabs (chats, discover, profile, ai-settings)
│   └── chat/[id].tsx      # Chat screen with AI features
├── components/            # Reusable UI components
│   ├── AI*.tsx            # AI feature components
│   └── *.tsx              # Other components
├── functions/             # Firebase Cloud Functions (AI backend)
│   └── src/
│       ├── ai/            # AI feature implementations
│       └── middleware/    # Authentication & security
├── hooks/                 # Custom React hooks (including AI hooks)
├── services/              # Business logic services (auth, firestore, AI, image, cache)
├── stores/                # Zustand stores (auth, chat, UI)
├── types/                 # TypeScript type definitions
└── memory-bank/           # Project documentation & context
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

### Getting Started
- **[QUICKSTART.md](./QUICKSTART.md)** - 30-minute setup guide
- **[SETUP.md](./SETUP.md)** - Detailed Firebase setup
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Production deployment

### Implementation Details
- **[PHASE3_SUMMARY.md](./PHASE3_SUMMARY.md)** - Complete AI features documentation
- **[DEPENDENCIES_PHASE3.md](./DEPENDENCIES_PHASE3.md)** - Cloud Functions setup
- **[NEXT_STEPS_PHASE4.md](./NEXT_STEPS_PHASE4.md)** - Roadmap for next features

### Project Context
- **[docs/PRD.md](./docs/PRD.md)** - Product Requirements Document
- **[memory-bank/](./memory-bank/)** - Project memory and architecture

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

## License

MIT

## Support

- **Quick Start**: See [QUICKSTART.md](./QUICKSTART.md)
- **Setup Help**: See [SETUP.md](./SETUP.md)
- **Deployment**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **AI Features**: See [PHASE3_SUMMARY.md](./PHASE3_SUMMARY.md)

## What's Next?

1. **Deploy**: Follow the deployment guide to go live
2. **Test**: Run end-to-end tests with real users
3. **Monitor**: Set up analytics and error tracking
4. **Iterate**: Add Phase 4 features based on feedback

---

Built with ❤️ using React Native, Expo, Firebase, and AI

**Stack**: React Native · Expo · TypeScript · Firebase · OpenAI · Zustand
