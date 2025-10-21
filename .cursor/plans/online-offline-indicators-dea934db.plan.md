<!-- dea934db-f547-4049-a229-8dbabf9e172b 16e0f6ff-7fd5-402a-9dfa-9e1317bf4998 -->
# Online/Offline Presence System

## Overview

Implement a robust presence system with automatic status tracking, manual overrides, away detection, custom status messages, and visual indicators throughout the app.

## Implementation Steps

### 1. Update Type Definitions

**File:** `types/index.ts`

Add presence fields to the `User` interface:

```typescript
export interface User {
  // ... existing fields
  presence?: {
    status: 'online' | 'offline' | 'away';
    lastSeen: Date;
    customStatus?: string;
    appearOffline?: boolean; // Manual override
  };
}
```

### 2. Add Firebase Realtime Database Configuration

**File:** `lib/firebase.ts`

Add Firebase Realtime Database initialization:

```typescript
import { getDatabase } from 'firebase/database';

export function getFirebaseRealtimeDB() {
  return getDatabase(app);
}
```

This will be used exclusively for presence tracking, leveraging its built-in `onDisconnect()` API.

### 3. Create Presence Service

**File:** `services/presenceService.ts` (new)

Implement using **Firebase Realtime Database** (not Firestore):

- `updatePresence(userId, status, customStatus?)` - Update user's presence in Realtime DB
- `setAppearOffline(userId, appearOffline)` - Toggle manual offline mode (stored in Firestore user doc)
- `subscribeToUserPresence(userId, callback)` - Listen to a user's presence changes
- `subscribeToMultiplePresences(userIds, callback)` - Listen to multiple users (batch)
- `startPresenceTracking(userId)` - Begin automatic tracking with `onDisconnect()` handler
- `stopPresenceTracking(userId)` - Clean up on logout

Structure in Realtime Database:

```
/presence/{userId}
  - status: 'online' | 'offline' | 'away'
  - lastSeen: timestamp
  - customStatus: string (optional)
```

Use `onDisconnect().set()` to automatically mark user offline when connection drops.

### 3. Create Presence Hook

**File:** `hooks/usePresence.ts` (new)

Export:

- `useUserPresence(userId)` - Get a single user's presence
- `useMultiplePresences(userIds)` - Get multiple users' presence efficiently
- `useUpdatePresence()` - Update current user's status/custom message

### 4. Update Auth Store

**File:** `stores/authStore.ts`

Add presence state management:

- Track current user's presence settings
- Store `appearOffline` preference
- Store custom status message

### 5. Create Presence Indicator Component

**File:** `components/PresenceIndicator.tsx` (new)

Visual indicator showing:

- Green dot for online
- Gray dot for offline
- Yellow/orange dot for away
- Size variants (small, medium, large)
- Optional custom status text display

### 6. App Lifecycle Integration

**File:** `app/_layout.tsx`

Add presence tracking:

- Start tracking when user logs in
- Update to "online" when app becomes active
- Update to "away" after 5 minutes of inactivity
- Update to "offline" when app closes/backgrounds
- Respect "appearOffline" setting throughout

Use React Native's `AppState` API for lifecycle detection.

### 7. Update Profile Settings Screen

**File:** `app/(tabs)/profile.tsx`

Add new menu item for "Presence Settings" that navigates to new screen.

### 8. Create Presence Settings Screen

**File:** `app/(tabs)/presence-settings.tsx` (new)

UI for:

- Toggle "Appear Offline" switch
- Custom status message input (with character limit)
- Status presets (e.g., "In a meeting", "On vacation", "Busy")
- Clear status button
- Away timeout settings (future enhancement)

### 9. Update Auth Service

**File:** `services/authService.ts`

- Call presence tracking on successful login
- Clean up presence on logout
- Set offline status on sign out

### 10. Integrate Presence Indicators

Update components to show presence:

**`app/(tabs)/index.tsx`** - Conversation list avatars

**`app/chat/[id].tsx`** - Chat header for other user(s)

**`app/(tabs)/explore.tsx`** - Search results user items

**`components/MessageBubble.tsx`** - Sender avatars in messages (optional)

Replace avatar circles with new `PresenceIndicator` wrapper component.

### 11. Update Firestore Service

**File:** `services/firestoreService.ts`

- Update `getUsersByIds()` to include presence data
- Update `searchUsers()` to include presence data

### 12. Firestore Security Rules

Update Firebase rules to:

- Allow users to read all presence data
- Allow users to only write their own presence
- Validate presence data structure

Example rule:

```javascript
match /users/{userId} {
  allow read: if request.auth != null;
  allow update: if request.auth.uid == userId 
    && request.resource.data.diff(resource.data).affectedKeys()
      .hasOnly(['presence', 'updatedAt']);
}
```

## Technical Considerations

### Performance

- Use batch subscriptions for multiple users to reduce reads
- Cache presence data with short TTL (30 seconds)
- Debounce presence updates to avoid excessive writes

### Edge Cases

- Handle rapid app switching (don't flicker between states)
- Respect appearOffline across all presence updates
- Clear custom status on logout (optional preference)

### Future Enhancements

- "Do Not Disturb" mode
- Scheduled status messages
- Activity-based status ("Typing in chat X")

### To-dos

- [ ] Update User type with presence fields in types/index.ts
- [ ] Create presenceService.ts with Firestore presence tracking
- [ ] Create usePresence hook for consuming presence data
- [ ] Create PresenceIndicator component with visual status dots
- [ ] Add presence state management to authStore
- [ ] Add app lifecycle presence tracking to _layout.tsx
- [ ] Create presence-settings.tsx screen with appear offline toggle and custom status
- [ ] Add Presence Settings menu item to profile screen
- [ ] Update authService to handle presence on login/logout
- [ ] Add presence indicators to all user avatars (conversation list, chat, search)
- [ ] Update firestoreService to include presence in user queries