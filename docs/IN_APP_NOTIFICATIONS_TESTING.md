# In-App Notifications Testing Guide

## ✅ Implementation Complete

The complete in-app and background notification system has been successfully implemented and is ready for testing!

## 🔔 How It Works

### Two-Tier Notification System:

1. **Foreground (In-App) Notifications:**
   - When app is open and you receive a message from a different conversation
   - Beautiful banner slides down from the top
   - Tap to navigate, swipe up to dismiss, or auto-dismiss after 4 seconds

2. **Background Notifications:**
   - When app is in background/closed
   - System notification appears in notification tray
   - Tap to open app directly to the conversation

## 🚨 Expo Go Limitation

**Important:** Starting with Expo SDK 53, push notifications no longer work in Expo Go. However, the in-app notification system is **fully functional** for testing!

### What Works in Expo Go:
- ✅ In-app notification banner UI
- ✅ Real-time notifications when messages arrive
- ✅ Notification animations (slide down/up)
- ✅ Swipe up to dismiss gesture
- ✅ Tap to navigate to conversations
- ✅ Auto-dismiss after 4 seconds
- ✅ Smart filtering (no notification if already in that chat)
- ✅ Local test notifications

### What Requires Development Build:
- ❌ Background push notifications via FCM
- ❌ System notification tray notifications
- ❌ Notification badge count

## 🧪 Testing the In-App Notifications

### Method 1: With Real Messages (Best)

1. **Run your app:**
   ```bash
   npm start
   ```

2. **Create two test accounts** (or use existing ones)

3. **Log in with User A on one device/emulator**

4. **Log in with User B on another device/emulator (or web)**

5. **Send a message from User B to User A**

6. **Watch User A's screen:**
   - If User A is NOT in that chat: Notification banner appears!
   - If User A IS in that chat: No notification (smart filtering)

7. **Test interactions:**
   - **Tap notification:** Navigates to the conversation
   - **Swipe up:** Dismisses the notification
   - **Wait 4 seconds:** Auto-dismisses

### Method 2: Test Button (Quick Test)

1. **Run your app:**
   ```bash
   npm start
   ```

2. **Navigate to Profile screen** (bottom tab bar)

3. **Scroll down to the "Development" section**

4. **Tap "🔔 Test In-App Notification"**

5. **Observe:** A blue notification banner should slide down from the top with:
   - Sender name: "John Doe"
   - Message: "Hey! Check out this amazing new feature 🚀"
   - Auto-dismisses after 4 seconds

6. **Test gestures:**
   - **Tap:** Navigation test (won't actually navigate - test conversation ID)
   - **Swipe up:** Dismisses the notification
   - **Close button:** Also dismisses

### Method 3: Programmatic Testing

You can also trigger test notifications from any component:

```typescript
import { useNotifications } from '@/hooks/useNotifications';

function MyComponent() {
  const { sendTest } = useNotifications();
  
  const triggerTestNotification = () => {
    sendTest(
      'Alice', // title
      'Let\'s meet at 3pm!', // message
      'conversation-123' // conversationId
    );
  };
  
  return <Button onPress={triggerTestNotification} title="Test" />;
}
```

## 🎨 Features to Verify

### In-App Notifications (Foreground):
- [ ] Notification appears when message is received in different conversation
- [ ] Doesn't appear if already viewing that conversation
- [ ] Notification slides down smoothly from top
- [ ] Shows blue banner with swipe indicator, icon, title, and message
- [ ] Auto-dismisses after 4 seconds
- [ ] Can swipe up to dismiss
- [ ] Can manually close with X button
- [ ] Tapping navigates to conversation and clears notification
- [ ] Safe area padding works on iOS notch devices
- [ ] Works in both light and dark mode

### Background Notifications (Requires Development Build):
- [ ] System notification appears when app is in background
- [ ] Notification appears in system notification tray
- [ ] Tapping system notification opens app to conversation
- [ ] Badge count updates correctly
- [ ] Sound plays on notification arrival

## 🚀 Production Setup (Development Build)

To test real push notifications (not just the in-app UI), you'll need to create a development build:

### Option 1: EAS Build (Recommended)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure project
eas build:configure

# Create development build for Android
eas build --profile development --platform android

# Create development build for iOS
eas build --profile development --platform ios
```

### Option 2: Local Development Build
```bash
# For Android
npx expo run:android

# For iOS
npx expo run:ios
```

## 📱 Testing Real Notifications (Development Build)

Once you have a development build:

1. **Deploy Firebase Cloud Functions:**
   ```bash
   cd functions
   npm run deploy
   ```

2. **Send a message from another user**

3. **Notification should appear:**
   - When app is in foreground: In-app banner
   - When app is in background: System notification
   - When app is closed: System notification

## 🔧 Troubleshooting

### "Expo Go limitation" warning
- **Expected:** This is normal in Expo Go. Use the test button instead.
- **Solution:** For real notifications, create a development build.

### Notification doesn't appear
- **Check:** Did you grant notification permissions?
- **Check:** Is the test button actually being tapped?
- **Check:** Look for console logs: "✅ Test notification sent"

### Navigation doesn't work
- **Check:** The conversationId must exist in your database
- **Note:** Test notifications use a fake ID, so they won't navigate to a real chat

## 📝 Code Overview

### Components Created/Modified:

1. **`components/InAppNotification.tsx`**
   - Reusable notification banner component
   - Swipe-to-dismiss gesture with PanResponder
   - Slide down/up animations with spring physics
   - Tap to navigate, visual swipe indicator

2. **`services/messageNotificationService.ts`** ⭐ NEW
   - Listens to new messages in real-time via Firestore
   - Triggers local notifications for testing in Expo Go
   - Smart filtering to avoid notifying for own messages
   - Provides fallback for FCM in production builds

3. **`app/_layout.tsx`**
   - Integrated notification display logic
   - Prevents showing notifications when already viewing conversation
   - Starts/stops message notification listener with user session
   - Handles notification navigation and dismissal

4. **`services/notificationService.ts`**
   - Added `sendTestNotification()` function
   - Graceful handling of Expo Go limitations
   - Device push token registration for FCM

5. **`hooks/useNotifications.ts`**
   - Exposed `sendTest()` function for easy testing
   - Listens for notification events
   - Manages badge count

6. **`app/(tabs)/profile.tsx`**
   - Added test button in Development section

7. **`functions/src/triggers/onMessageCreated.ts`**
   - Firebase Cloud Function that triggers on new messages
   - Sends push notifications via FCM (for production builds)

## 🎯 Next Steps

1. ✅ Test the in-app notification UI (current)
2. ⏳ Create development build for real push notifications
3. ⏳ Deploy Firebase Cloud Functions
4. ⏳ Test end-to-end notification flow
5. ⏳ Submit to App Store/Play Store

## 📚 Resources

- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Development Builds Guide](https://docs.expo.dev/develop/development-builds/introduction/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [EAS Build](https://docs.expo.dev/build/introduction/)

---

**Status:** ✅ In-app notification UI fully functional and testable in Expo Go!

