# Active Context

## Current Focus

**Project Initialization Phase**

The project is in its **initial setup stage**. Memory bank has just been created based on the PRD. The next major step is to begin implementing the foundation of the application.

## Recent Changes

- ✅ Memory bank initialized with complete project documentation
- ✅ PRD reviewed and analyzed
- ✅ Core documentation files created

## Next Immediate Steps

### 1. Development Environment Setup
- [ ] Initialize Firebase project
- [ ] Configure Firebase services (Auth, Firestore, Storage, Functions, FCM)
- [ ] Set up environment variables and configuration
- [ ] Configure Firebase Security Rules (basic)

### 2. Project Structure & Dependencies
- [ ] Review and update `package.json` with required dependencies
- [ ] Set up proper TypeScript configuration
- [ ] Establish folder structure for features
- [ ] Configure Expo for iOS/Android builds

### 3. Core Infrastructure
- [ ] Set up authentication flow and context
- [ ] Implement basic navigation structure (Expo Router)
- [ ] Create Firebase service layer/hooks
- [ ] Set up state management (decide between Zustand/Recoil)
- [ ] Implement AsyncStorage caching utility

### 4. MVP Features - Phase 1
- [ ] Authentication screens (login, signup, profile setup)
- [ ] User profile management
- [ ] Chat list screen (conversations)
- [ ] Basic chat screen with message rendering

### 5. MVP Features - Phase 2
- [ ] Real-time message sending and receiving
- [ ] Image/file attachment support
- [ ] Message delivery status indicators
- [ ] Offline message queue
- [ ] Push notifications setup

## Active Decisions & Considerations

### State Management: Zustand vs Recoil

**Decision needed:** Choose between Zustand and Recoil for global state management.

**Considerations:**
- **Zustand:** Simpler API, smaller bundle size, easier learning curve
- **Recoil:** Better for derived state, atom-based architecture, more React-like

**Recommendation:** Start with **Zustand** for its simplicity. Can migrate to Recoil later if complexity demands it.

### AI Implementation Approach

**Current plan:** Server-side AI processing via Cloud Functions with Vercel AI SDK.

**Key decisions:**
- All AI features will be implemented after MVP messaging core is stable
- AI permissions will be opt-in per conversation
- Results will be cached in Firestore for instant access
- No automatic AI processing - all user-initiated

### Calendar Integration Strategy

**Advanced Option B (Proactive Assistant):** Will be implemented in the final milestone after core AI features are working.

**Approach:**
- OAuth integration with Google Calendar and Microsoft Calendar
- Server-side processing to protect API keys
- Explicit user approval before posting meeting suggestions
- Fallback to manual scheduling if calendar access denied

### Offline Strategy Details

**Caching approach:**
- Recent messages cached in AsyncStorage (last 100-200 per conversation)
- Conversation list cached with last message preview
- User profile cached
- AI artifacts cached when generated

**Queue strategy:**
- Outgoing messages queued in AsyncStorage when offline
- Background task processes queue when connection restored
- Retry logic with exponential backoff
- User can manually retry failed messages

## Current Constraints & Blockers

### No Blockers Yet
Project is just starting, no technical blockers identified.

### Potential Future Considerations
- **Calendar API quotas:** May need to implement rate limiting for scheduling feature
- **AI processing costs:** Will need to monitor Cloud Function execution costs as user base grows
- **Firestore read/write limits:** May need to optimize queries as conversations grow
- **Image storage costs:** Implement compression and size limits

## Questions to Resolve

1. **State Management:** Finalize choice between Zustand and Recoil
2. **Firebase Region:** Choose optimal Cloud Functions region for target users
3. **AI Model Selection:** Which model to use in Vercel AI SDK (GPT-4, Claude, etc.)
4. **Image Compression:** Client-side or server-side image optimization?
5. **Push Notification Strategy:** When to send notifications (all messages vs mentions only)?

## Context for Next Session

When starting the next work session, the immediate priorities are:

1. **Set up Firebase project** - This is the foundation for all backend services
2. **Configure Expo project** - Ensure proper iOS/Android/Web support
3. **Implement authentication** - Users need to log in before anything else works
4. **Create basic navigation** - Get the app structure in place

The MVP goal is to have working chat functionality with offline support before tackling AI features. Focus should be on reliability and user experience fundamentals first.

## Memory Bank Status

All core memory bank files are complete:
- ✅ `projectbrief.md` - Foundation document
- ✅ `productContext.md` - Why and how the product works
- ✅ `techContext.md` - Technologies and setup
- ✅ `systemPatterns.md` - Architecture and design patterns
- ✅ `activeContext.md` - Current work state (this file)
- ✅ `progress.md` - Status tracking

Next update should occur after:
- Firebase setup is complete
- Authentication is implemented
- First screen is functional

