# Changelog

All notable changes to Conch Social will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2025-10-21

### Added
- **Unified Search**: Search both people and messages from a single interface
  - Real-time local filtering for instant results
  - Intelligent deeper search triggered when results ≤3 items
  - Grouped results display (People / Messages sections)
  - Message results show conversation name, preview, and timestamp
- **Scroll-to-Message Navigation**: Navigate directly to specific messages from search
  - URL parameter support (`/chat/[id]?messageId=[messageId]`)
  - Automatic scroll animation to target message
  - 2-second visual highlight (yellow background with gold border)
  - Graceful error handling for edge cases
- **AI Settings Navigation**: Quick access to AI Settings from Profile screen
  - New menu item: "✨ AI Settings"
  - Positioned after "Edit Profile" for easy discovery
- **Enhanced Search Service**: Updated with conversation context
  - Message results include conversation title
  - Results sorted by timestamp (most recent first)
  - Better data structure for navigation

### Changed
- Tab title changed from "Discover" to "Search" to better reflect functionality
- Search screen completely refactored for unified search experience
- Profile screen updated with AI Settings navigation option

### Technical Details
- Modified files:
  - `app/(tabs)/profile.tsx`
  - `app/(tabs)/_layout.tsx`
  - `app/(tabs)/explore.tsx`
  - `app/chat/[id].tsx`
  - `services/searchService.ts`
- New documentation:
  - `docs/UNIFIED_SEARCH.md`
  - `docs/NAVIGATION_IMPROVEMENTS.md`
- Updated documentation:
  - `memory-bank/activeContext.md`
  - `memory-bank/progress.md`

## [1.0.0] - 2025-10-20

### Added
- **MVP Core Features**
  - User authentication (Email/Password, Google Sign-In)
  - Real-time messaging with Firestore
  - Conversation management (1:1 and group chats)
  - User discovery and search
  - Profile management
  
- **Phase 2: Enhanced Features**
  - Offline message queue with retry logic
  - Message caching with AsyncStorage
  - Connection status monitoring
  - Image upload with compression
  - Message status indicators (sending, sent, failed)
  - Message pagination
  - Read receipts and typing indicators
  - Enhanced chat UI
  
- **Phase 3: AI Features**
  - Cloud Functions infrastructure
  - Vercel AI SDK integration
  - Thread summarization
  - Action item extraction
  - Decision tracking
  - Priority detection
  - AI hooks and services
  - AI UI components (sheets, lists, badges)
  - AI feature menu in chat screen
  - AI settings screen with privacy controls
  
- **Phase 4: Production Features**
  - Push notifications (FCM)
  - Profile editing
  - Global search
  - E2E testing suite
  - Detox configuration
  - Production deployment guides

### Technical Stack
- React Native with Expo SDK 52
- TypeScript for type safety
- Firebase (Auth, Firestore, Storage, Functions, FCM)
- Zustand for state management
- Vercel AI SDK for AI features
- AsyncStorage for local caching
- date-fns for date formatting

### Documentation
- Complete PRD (Product Requirements Document)
- Memory bank with 6 core files
- Setup guides (SETUP.md, QUICKSTART.md, QUICKDEPLOY.md)
- Implementation summaries (Phase 2, 3, 4)
- E2E testing documentation
- Deployment guides

---

## Version History

- **v1.1.0** (Oct 21, 2025) - Unified Search & Navigation Improvements
- **v1.0.0** (Oct 20, 2025) - Production-Ready Release (MVP + Phase 2-4)

---

## Upgrade Guide

### Upgrading from 1.0.0 to 1.1.0

No breaking changes. All updates are backwards compatible.

**What You Get:**
1. Improved search experience (no action required)
2. Easier AI Settings access (no action required)
3. Message navigation from search (no action required)

**Optional Steps:**
- Review new search documentation: `docs/UNIFIED_SEARCH.md`
- Update any custom search implementations to use new patterns
- Test scroll-to-message navigation in your workflow

**No Database Migrations Required** ✅

---

## Coming Soon

### v1.2.0 (Planned)
- Voice and video calling
- Advanced calendar integration (Option B)
- Proactive meeting suggestions
- Enhanced group chat features
- Message reactions and threading
- File attachment support beyond images

### v1.3.0 (Planned)
- Dark mode support
- Custom themes
- Message search within conversation
- Advanced notification controls
- Multi-device sync improvements

---

## Support

For questions or issues:
- Check documentation in `/docs`
- Review memory bank in `/memory-bank`
- See implementation summaries in project root

---

**Maintained By:** Development Team  
**License:** [Your License]  
**Repository:** [Your Repository URL]

