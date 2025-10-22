# Phase 4 Dependencies

## Client Dependencies

Install these packages in the root project:

```bash
npm install expo-notifications expo-device expo-image-picker
```

### Package Details

```json
{
  "expo-notifications": "~0.27.0",
  "expo-device": "~6.0.0",
  "expo-image-picker": "~15.0.0"
}
```

- **expo-notifications**: Push notifications, FCM token management, badge counts
- **expo-device**: Device detection (required for notifications)
- **expo-image-picker**: Profile photo upload

## Cloud Functions Dependencies

No new dependencies needed! Phase 4 uses existing Firebase Admin SDK.

## Configuration Files

### app.json (Expo Config)

Add notification permissions:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#007AFF",
          "sounds": ["./assets/sounds/notification.wav"]
        }
      ]
    ],
    "notification": {
      "icon": "./assets/images/notification-icon.png",
      "color": "#007AFF",
      "androidMode": "default",
      "androidCollapsedTitle": "{{unread_count}} new messages"
    }
  }
}
```

### Firebase Console Setup

1. **Enable Cloud Messaging**
   - Go to Project Settings → Cloud Messaging
   - Note the Server Key (for backend notifications)

2. **iOS Configuration**
   - Upload APNs key or certificate
   - Enable Push Notifications capability in Xcode

3. **Android Configuration**
   - Add `google-services.json` (already done in Phase 1)
   - FCM automatically configured

## Firestore Rules Updates

Add these rules to support new features:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function hasConversationAccess(convId) {
      return isAuthenticated() &&
        exists(/databases/$(database)/documents/conversations/$(convId)) &&
        request.auth.uid in get(/databases/$(database)/documents/conversations/$(convId)).data.participantIds;
    }
    
    // Users collection (updated for FCM tokens)
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
      
      // Allow updating FCM token
      allow update: if isOwner(userId) && 
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['fcmToken', 'fcmTokenUpdatedAt', 'platform']);
    }
    
    // Conversations
    match /conversations/{conversationId} {
      allow read: if hasConversationAccess(conversationId);
      allow create: if isAuthenticated() && 
        request.auth.uid in request.resource.data.participantIds;
      allow update, delete: if hasConversationAccess(conversationId);
      
      // Messages (updated for read receipts)
      match /messages/{messageId} {
        allow read, write: if hasConversationAccess(conversationId);
        
        // Allow updating readBy field
        allow update: if hasConversationAccess(conversationId) &&
          request.resource.data.diff(resource.data).affectedKeys().hasOnly(['readBy']);
      }
      
      // Typing indicators
      match /typing/{userId} {
        allow read: if hasConversationAccess(conversationId);
        allow write: if isAuthenticated() && 
          isOwner(userId) && 
          hasConversationAccess(conversationId);
      }
    }
    
    // AI Artifacts (existing)
    match /aiArtifacts/{conversationId} {
      match /{collection}/{documentId} {
        allow read: if hasConversationAccess(conversationId);
        allow write: if false; // Only Cloud Functions can write
      }
    }
  }
}
```

## Platform-Specific Setup

### iOS (Xcode Configuration)

1. **Enable Push Notifications Capability**
   - Open project in Xcode
   - Select target → Signing & Capabilities
   - Click + → Add "Push Notifications"

2. **Background Modes**
   - Add "Background fetch"
   - Add "Remote notifications"

3. **APNs Setup**
   - Create APNs key in Apple Developer Portal
   - Upload to Firebase Console → Cloud Messaging

### Android (AndroidManifest.xml)

No additional configuration needed! Expo handles it automatically.

For custom sounds/icons:
```xml
<manifest>
  <application>
    <meta-data
      android:name="com.google.firebase.messaging.default_notification_icon"
      android:resource="@drawable/notification_icon" />
    <meta-data
      android:name="com.google.firebase.messaging.default_notification_color"
      android:resource="@color/notification_color" />
  </application>
</manifest>
```

## Environment Variables

No new environment variables needed for Phase 4.

Existing `.env` is sufficient:
```bash
# Firebase (from Phase 1)
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...

# Cloud Functions (from Phase 3)
EXPO_PUBLIC_FUNCTIONS_URL=https://us-central1-YOUR-PROJECT.cloudfunctions.net
```

## Cloud Function Deployment

Deploy the new trigger:

```bash
cd functions
npm run build
firebase deploy --only functions:onMessageCreated
```

Verify deployment:
```bash
firebase functions:list
```

Should show:
- ✅ aiSummarizeThread
- ✅ aiExtractActions
- ✅ aiTrackDecision
- ✅ aiDetectPriority
- ✅ onMessageCreated (NEW)

## Testing Push Notifications

### Using Expo Push Notification Tool

1. Get your Expo push token from the app
2. Visit: https://expo.dev/notifications
3. Send test notification:
   ```json
   {
     "to": "ExponentPushToken[...]",
     "sound": "default",
     "title": "Test Message",
     "body": "This is a test notification",
     "data": {
       "conversationId": "test123"
     }
   }
   ```

### Using Firebase Console

1. Go to Firebase Console → Cloud Messaging
2. Click "Send your first message"
3. Enter title and text
4. Select app
5. Send test notification

## Troubleshooting

### Notifications Not Appearing

**iOS:**
- Check APNs certificate is valid
- Verify Push Notifications capability enabled
- Check device notification settings
- Ensure app has notification permission

**Android:**
- Verify `google-services.json` is present
- Check FCM is enabled in Firebase Console
- Verify token registration succeeded

**Both:**
- Check device is not in Do Not Disturb mode
- Verify user granted notification permissions
- Check FCM token is saved to Firestore
- View Cloud Function logs for errors

### TypeScript Errors

If you get type errors, run:
```bash
npx expo install --check
```

Then restart TypeScript server in your IDE.

### Build Errors

If EAS build fails:
```bash
# Clear cache
eas build:clear-cache

# Rebuild
eas build --platform ios --clear-cache
```

## Cost Estimate

### Firebase Cloud Messaging
- **Free tier**: Unlimited messages
- **Cost**: $0/month (free forever)

### Cloud Functions
- New trigger adds minimal cost
- Estimated: +$5-10/month for 10,000 messages

### Firestore
- Typing indicators add ~100 reads/writes per message
- Estimated: +$10-20/month for 1000 active users

**Total Phase 4 Added Cost**: ~$15-30/month for 1000 users

## Summary

Phase 4 dependencies are minimal:
- ✅ 3 new NPM packages
- ✅ No new environment variables
- ✅ Firestore rules updated
- ✅ 1 new Cloud Function trigger
- ✅ Platform-specific notification setup

**Installation Time**: ~30 minutes
**Configuration Time**: ~1 hour
**Total Setup Time**: ~1.5 hours

---

Ready to deploy! 🚀

