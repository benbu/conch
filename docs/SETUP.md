# Conch Social - Setup Guide

## Prerequisites

- Node.js (LTS version)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android Emulator
- Firebase account

## 1. Install Dependencies

```bash
npm install firebase zustand @react-native-async-storage/async-storage expo-image-picker date-fns
```

## 2. Firebase Setup

### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Follow the wizard to create your project
4. Enable Google Analytics (optional)

### Enable Firebase Services

#### Authentication
1. Navigate to **Authentication** → **Sign-in method**
2. Enable the following providers:
   - Email/Password
   - Google (for web testing)
   - Apple (for production iOS)
   - Phone (optional)

#### Firestore Database
1. Navigate to **Firestore Database**
2. Click "Create database"
3. Start in **test mode** (for development)
4. Choose your region (recommended: us-central1)

#### Storage
1. Navigate to **Storage**
2. Click "Get started"
3. Start in **test mode** (for development)

#### Cloud Messaging (FCM)
1. Navigate to **Cloud Messaging**
2. Note your Server Key (for push notifications)

### Get Firebase Configuration

1. Go to **Project Settings** → **General**
2. Scroll to "Your apps"
3. Click **Web** icon (</>) to add a web app
4. Register app with nickname "Conch Web"
5. Copy the Firebase configuration object

### Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Copy from .env.example (if it exists) or create manually
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

**Important:** Add `.env` to your `.gitignore` to keep credentials secret!

### Update Firebase Configuration

Open `lib/firebase.ts` and verify your environment variables are being used correctly.

## 3. Firestore Security Rules

In Firebase Console → Firestore Database → Rules, update with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }
    
    // Conversations
    match /conversations/{conversationId} {
      allow read: if isAuthenticated() && 
        request.auth.uid in resource.data.participantIds;
      allow create: if isAuthenticated() && 
        request.auth.uid in request.resource.data.participantIds;
      allow update: if isAuthenticated() && 
        request.auth.uid in resource.data.participantIds;
        
      // Messages subcollection
      match /messages/{messageId} {
        allow read: if isAuthenticated() && 
          request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participantIds;
        allow create: if isAuthenticated() && 
          request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participantIds;
      }
    }
    
    // AI Artifacts (to be added in Phase 2)
    match /aiArtifacts/{artifactId} {
      allow read, write: if isAuthenticated();
    }
  }
}
```

## 4. Storage Security Rules

In Firebase Console → Storage → Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /conversations/{conversationId}/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 5. Run the App

### Start Development Server

```bash
npm start
# or
expo start
```

### Run on iOS Simulator

```bash
npm run ios
# or press 'i' in the Expo dev tools
```

### Run on Android Emulator

```bash
npm run android
# or press 'a' in the Expo dev tools
```

### Run on Web

```bash
npm run web
# or press 'w' in the Expo dev tools
```

## 6. Test the App

### Create Test Accounts

1. Run the app and tap "Sign Up"
2. Create at least 2 accounts with different emails
3. Sign in with each account on different devices/browsers

### Test Chat Flow

1. **Account 1**: Go to "Discover" tab
2. Search for Account 2's email
3. Tap to start a chat
4. Send a message
5. **Account 2**: Check "Chats" tab for the new conversation
6. Reply to the message
7. Verify real-time updates work

## 7. Troubleshooting

### Firebase Not Initialized

- Verify `.env` file exists and contains correct values
- Restart Metro bundler: `expo start -c`
- Check Firebase project status in console

### Authentication Errors

- Verify Email/Password is enabled in Firebase Console
- Check that email format is valid
- Password must be at least 6 characters

### Real-time Updates Not Working

- Check Firestore Security Rules are published
- Verify internet connection
- Check browser/device console for errors

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
expo start -c
```

## 8. Next Steps

Once basic chat is working:

- [ ] Set up Cloud Functions for AI features (Phase 2)
- [ ] Add offline message queue
- [ ] Implement push notifications
- [ ] Add image upload functionality
- [ ] Implement AI features (summaries, actions, decisions)
- [ ] Add calendar integration (Phase 3)

## Project Structure

```
conch/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication screens
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/            # Main app tabs
│   │   ├── index.tsx      # Chats list
│   │   ├── explore.tsx    # User discovery
│   │   └── profile.tsx    # User profile
│   └── chat/[id].tsx      # Individual chat screen
├── components/            # Reusable components
├── contexts/              # React contexts (Auth)
├── hooks/                 # Custom hooks
├── lib/                   # Utilities and config
├── services/              # Firebase services
├── stores/                # Zustand stores
├── types/                 # TypeScript types
├── memory-bank/           # Project documentation
└── docs/                  # PRD and specs
```

## Support

For issues or questions:
1. Check Firebase Console logs
2. Review Expo error messages
3. Check browser/device console
4. Verify all setup steps completed

## Security Notes

- Never commit `.env` file to version control
- Use Firebase Security Rules in production
- Implement rate limiting for production
- Enable App Check for additional security

