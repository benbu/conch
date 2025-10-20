# System Patterns

## Architecture Overview

Conch Social follows a **client-server architecture** with Firebase as the backend-as-a-service (BaaS) provider and React Native as the cross-platform frontend.

```
┌─────────────────────────────────────┐
│     React Native Client App         │
│  (iOS / Android / Web via Expo)     │
│                                      │
│  ┌─────────────────────────────┐   │
│  │   Presentation Layer         │   │
│  │   - Screens (Expo Router)    │   │
│  │   - Components               │   │
│  │   - Navigation               │   │
│  └─────────────────────────────┘   │
│              ↕                       │
│  ┌─────────────────────────────┐   │
│  │   Business Logic Layer       │   │
│  │   - State Management         │   │
│  │   - Custom Hooks             │   │
│  │   - Data Synchronization     │   │
│  └─────────────────────────────┘   │
│              ↕                       │
│  ┌─────────────────────────────┐   │
│  │   Data Layer                 │   │
│  │   - Firebase SDK             │   │
│  │   - AsyncStorage Cache       │   │
│  │   - Offline Queue            │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
                 ↕
         ┌──────────────┐
         │   Firebase    │
         └──────────────┘
                 ↕
    ┌─────────────────────────┐
    │   Cloud Functions        │
    │  (AI Processing Layer)   │
    │                          │
    │  - Vercel AI SDK         │
    │  - Calendar Integration  │
    │  - Business Logic        │
    └─────────────────────────┘
```

## Key Architectural Patterns

### 1. Real-Time Data Synchronization

**Pattern:** Observer pattern via Firestore listeners

**Implementation:**
- Subscribe to Firestore collections/documents on mount
- Automatic UI updates when data changes
- Unsubscribe on unmount to prevent memory leaks

**Example Flow:**
```
User opens chat → Subscribe to messages collection → 
Real-time listener → State updates → UI re-renders
```

### 2. Offline-First Design

**Pattern:** Cache-first with background sync

**Implementation:**
- Read from AsyncStorage cache immediately
- Display cached data while fetching fresh data
- Queue write operations when offline
- Process queue when connection restored

**Message Send Flow:**
```
User sends message → 
Add to local state immediately →
Add to offline queue →
Display as "sending" →
When online: Upload to Firestore →
Update status to "sent" →
Remove from queue
```

### 3. AI Request Pattern

**Pattern:** Command pattern with async execution

**Implementation:**
- User triggers AI action (button press)
- Show loading indicator
- Call Cloud Function via HTTP
- Function processes with Vercel AI SDK
- Store result in Firestore `aiArtifacts`
- Cache result locally for instant future access
- Display result in UI

**AI Summary Flow:**
```
User taps "Summarize" →
Show loading →
Client calls /ai/summarizeThread function →
Function fetches messages from Firestore →
Vercel AI SDK generates summary →
Store in /aiArtifacts/{convId}/summaries →
Return to client →
Cache locally →
Display summary
```

### 4. State Management Strategy

**Pattern:** Global state with local component state

**Options (to be decided):**
- **Zustand:** Lightweight, simple API, good for moderate complexity
- **Recoil:** Atom-based, excellent for derived state, better for complex scenarios

**State Organization:**
```
Global State:
- Current user profile
- Active conversation list
- Authentication status
- Connection status

Local State:
- Form inputs
- UI interactions (modals, sheets)
- Temporary selections
```

### 5. Component Architecture

**Pattern:** Atomic Design with container/presentation split

**Structure:**
```
/components
  /ui              # Atoms & molecules (buttons, inputs, icons)
  /features        # Organisms (message bubbles, chat lists)
  /layouts         # Templates (screen layouts)
```

**Guidelines:**
- **UI components:** Pure, reusable, no business logic
- **Feature components:** Connect to state, handle logic
- **Screens:** Compose feature components, manage navigation

### 6. Navigation Structure

**Pattern:** Stack + Tab Navigation

**Implementation via Expo Router:**
```
/app
  /_layout.tsx          # Root layout with auth check
  /(tabs)
    /_layout.tsx        # Tab navigator
    /index.tsx          # Chats list (home)
    /explore.tsx        # Discover/search
  /chat/[id].tsx        # Chat screen (stack)
  /profile/[id].tsx     # User profile (stack)
  /modal.tsx            # Modal screens
```

### 7. Data Access Pattern

**Pattern:** Repository pattern with hooks

**Implementation:**
```typescript
// Custom hooks encapsulate data access
useConversations() → Returns conversation list + loading state
useMessages(conversationId) → Returns messages + real-time updates
useSendMessage() → Returns send function
useAISummary(conversationId) → Returns cached summary + refresh function
```

**Benefits:**
- Centralized data logic
- Easy to mock for testing
- Consistent error handling
- Automatic loading states

### 8. Authentication Flow

**Pattern:** Protected routes with auth context

**Flow:**
```
App starts →
Check auth state (Firebase) →
If authenticated: Navigate to main app →
If not: Navigate to login screen →
After login: Refresh auth state → Navigate to main app
```

**Implementation:**
- Auth context provider wraps entire app
- Protected routes check auth state
- Automatic redirect to login when needed

### 9. Error Handling Strategy

**Pattern:** Layered error handling

**Layers:**
1. **Network Layer:** Retry logic, offline detection
2. **Business Logic:** Validation, error transformation
3. **Presentation:** User-friendly error messages, fallback UI

**Example:**
```
Firestore error →
Catch in hook →
Transform to user message →
Display toast/banner →
Log for debugging
```

### 10. Security Pattern

**Pattern:** Zero-trust with server-side validation

**Implementation:**
- All data access controlled by Firestore Security Rules
- Client-side validation for UX only
- Server-side validation in Cloud Functions for critical operations
- Never trust client data

**Rules Example:**
```javascript
// Users can only read/write their own data
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
}

// Conversation access by participant list
match /conversations/{convId} {
  allow read: if request.auth.uid in resource.data.participantIds;
  allow write: if request.auth.uid in resource.data.participantIds;
}
```

## Design Decisions

### Why Firebase?
- Real-time listeners eliminate polling
- Built-in authentication with social providers
- Generous free tier for development
- Scales automatically with user growth
- Cloud Functions for serverless backend logic

### Why Expo over React Native CLI?
- Faster development with managed workflow
- Over-the-air updates without app store approval
- Simplified build and deployment process
- Good web support out of the box
- Active development and strong community

### Why AsyncStorage over Room/SQLite?
- Cross-platform consistency (iOS, Android, Web)
- Simpler API for key-value caching
- No need for complex schema migrations
- Adequate for message caching needs
- Lighter weight for mobile app

### Why User-Initiated AI Only?
- Respects user privacy and control
- Reduces AI processing costs
- Prevents unexpected behavior
- Transparent about AI usage
- Users opt-in per feature

## Component Relationships

### Core Data Flow
```
Firestore ↔ Firebase SDK ↔ Data Hooks ↔ State Management ↔ Components ↔ UI
                              ↕
                        AsyncStorage Cache
```

### AI Feature Flow
```
User Action → UI Component → AI Hook → Cloud Function →
Vercel AI SDK → Process → Store in Firestore →
Cache Locally → Update UI
```

### Offline Queue Flow
```
User Action (offline) → Add to Queue → Store in AsyncStorage →
Connection Restored → Process Queue → Sync to Firestore →
Update UI → Clear Queue
```

## Testing Strategy

### Unit Tests
- Pure functions and utilities
- Data transformation logic
- Validation functions

### Component Tests
- UI components render correctly
- User interactions work as expected
- Props are handled properly

### Integration Tests
- Firebase interactions
- State management flows
- Navigation between screens

### E2E Tests
- Critical user journeys (login → send message → logout)
- AI feature workflows
- Offline functionality

## Performance Optimizations

### Rendering
- `React.memo` for expensive components
- `useMemo` and `useCallback` for derived values
- Virtualized lists for long conversations
- Lazy loading for images and attachments

### Data Fetching
- Pagination for message history (load more)
- Firestore query limits
- Debounce search inputs
- Cache AI results aggressively

### Network
- Compress images before upload
- Batch read operations when possible
- Use Firestore offline persistence
- Preload critical data on app start

