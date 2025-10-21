# Notification Flow Diagram

## Complete User Interaction Flow

### Scenario: Receiving a Message While in a Different Chat

```
┌─────────────────────────────────────────────────────────┐
│  User A is viewing Chat with User C                     │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  User B sends message to User A                         │
│  Firestore: New message created in A-B conversation     │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  messageNotificationService detects new message         │
│  ├─ Check: Is sender === currentUser? → NO ✓            │
│  ├─ Check: Already processed? → NO ✓                    │
│  └─ Check: conversationId === currentConversation? → NO ✓│
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  scheduleLocalNotification() triggered                   │
│  Notification data: { conversationId, title, message }  │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  useNotifications hook receives notification            │
│  Sets notification state in app/_layout.tsx             │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  📱 InAppNotification banner slides down                │
│  Shows: "User B: Hello there!"                          │
│  ├─ Auto-dismiss timer: 4 seconds                       │
│  ├─ Swipe up: Dismisses immediately                     │
│  └─ Tap: Navigate + Dismiss                             │
└─────────────────┬───────────────────────────────────────┘
                  │
         USER TAPS NOTIFICATION
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  handlePress() in InAppNotification component           │
│  1. handleDismiss() → setShowNotification(false)        │
│  2. onPress() → router.push('/chat/[id]')               │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ├──────────────────────────┐
                  ▼                          ▼
┌──────────────────────────┐   ┌────────────────────────┐
│  Notification slides up  │   │  Navigation to User B  │
│  (dismiss animation)     │   │  chat begins           │
└──────────────┬───────────┘   └───────────┬────────────┘
               │                           │
               │                           ▼
               │              ┌────────────────────────┐
               │              │  Chat screen mounts    │
               │              │  useEffect runs:       │
               │              │  setCurrentConversation│
               │              │  (User B chat ID)      │
               │              └────────┬───────────────┘
               │                       │
               └───────────┬───────────┘
                           ▼
           ┌───────────────────────────────┐
           │  After 500ms:                 │
           │  - notificationData = null    │
           │  - Notification fully cleared │
           └───────────────┬───────────────┘
                           │
                           ▼
           ┌───────────────────────────────┐
           │  User A now viewing User B    │
           │  Any new messages from B:     │
           │  ❌ NO notification (in chat) │
           └───────────────────────────────┘
```

## Key State Changes

### 1. When Notification Appears
```javascript
showNotification = true
notificationData = {
  title: "User B",
  message: "Hello there!",
  conversationId: "user-b-chat-id"
}
```

### 2. When User Taps Notification
```javascript
// Immediately
showNotification = false  // Triggers dismiss animation

// Navigation occurs
router.push('/chat/user-b-chat-id')

// Chat screen updates
currentConversationId = "user-b-chat-id"

// After 500ms
notificationData = null  // Full cleanup
```

### 3. New Message in Same Chat
```javascript
// messageNotificationService checks:
if (conversationId === currentConversationId) {
  return; // Don't notify - already in this chat!
}
```

## Timing Breakdown

```
T+0ms:    User taps notification
T+0ms:    handleDismiss() called
T+0ms:    setShowNotification(false)
T+0ms:    Dismiss animation begins (slides up)
T+0ms:    router.push() called
T+50ms:   Navigation transition starts
T+300ms:  Chat screen renders
T+300ms:  setCurrentConversation(newId) called
T+500ms:  setNotificationData(null) called
T+500ms:  Notification fully cleared
```

## Edge Cases Handled

### Multiple Rapid Notifications
```
Message 1 arrives → Notification shows
Message 2 arrives → Queued (first must dismiss)
User taps → Navigates, notification clears
Message 2 → Can now show (if not in that chat)
```

### Navigation Race Condition
```
User taps notification
  └─ Dismisses immediately
  └─ Navigates to chat
       └─ setCurrentConversation() blocks future notifications
```

### User Already in Chat
```
Message arrives
  └─ messageNotificationService checks
       └─ conversationId === currentConversationId?
            └─ YES → ❌ Don't notify
            └─ NO → ✅ Show notification
```

## Code Flow

```typescript
// 1. Detection (messageNotificationService.ts)
if (conversationId === currentConversationId) return;
await scheduleLocalNotification(title, message, data);

// 2. Display (app/_layout.tsx)
useEffect(() => {
  if (notification) {
    setNotificationData({ title, message, conversationId });
    setShowNotification(true);
  }
}, [notification]);

// 3. Interaction (InAppNotification.tsx)
const handlePress = () => {
  handleDismiss(); // setShowNotification(false)
  onPress();       // navigate
};

// 4. Navigation (app/_layout.tsx)
const handleNotificationPress = () => {
  router.push(`/chat/${conversationId}`);
  setTimeout(() => setNotificationData(null), 500);
};

// 5. Cleanup (chat/[id].tsx)
useEffect(() => {
  setCurrentConversation(conversationId);
  return () => setCurrentConversation(null);
}, [conversationId]);
```

---

**Result:** Smooth, intelligent notification system that knows exactly when to show, dismiss, and stay silent! 🎯

