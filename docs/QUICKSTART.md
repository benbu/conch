# Conch Social - Quick Start Guide

Get up and running in under 30 minutes!

## Prerequisites

- Node.js 18+ installed
- Firebase account
- OpenAI API key (for AI features)

## 1. Clone & Install (5 min)

```bash
# Install dependencies
npm install

# Install function dependencies
cd functions
npm install
cd ..
```

## 2. Firebase Setup (10 min)

### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Name it "Conch Social" → Continue
4. Disable Google Analytics (optional) → Create

### Enable Services

**Authentication:**
- Go to Authentication → Sign-in method
- Enable "Email/Password"
- Enable "Google" (for testing)

**Firestore:**
- Go to Firestore Database
- Click "Create database"
- Start in "Test mode"
- Choose region (us-central1 recommended)

**Storage:**
- Go to Storage
- Click "Get started"
- Start in "Test mode"

### Get Firebase Config

1. Go to Project Settings (gear icon) → General
2. Scroll to "Your apps"
3. Click Web icon (</>)
4. Register app: "Conch Web"
5. Copy the config object

## 3. Configure Environment (5 min)

### Client Config

Create `.env` in root:

```bash
# Copy from Firebase config
EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123:web:abc

# Functions URL (update after deploying functions)
EXPO_PUBLIC_FUNCTIONS_URL=https://us-central1-YOUR-PROJECT.cloudfunctions.net
```

### Functions Config

Create `functions/.env`:

```bash
# Get from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-...
```

## 4. Deploy Security Rules (3 min)

### Firestore Rules

Go to Firestore → Rules, paste this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function hasConversationAccess(convId) {
      return isAuthenticated() &&
        exists(/databases/$(database)/documents/conversations/$(convId)) &&
        request.auth.uid in get(/databases/$(database)/documents/conversations/$(convId)).data.participantIds;
    }
    
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && request.auth.uid == userId;
    }
    
    match /conversations/{conversationId} {
      allow read, write: if hasConversationAccess(conversationId);
      
      match /messages/{messageId} {
        allow read, write: if hasConversationAccess(conversationId);
      }
    }
    
    match /aiArtifacts/{conversationId}/{collection}/{documentId} {
      allow read: if hasConversationAccess(conversationId);
      allow write: if false;
    }
  }
}
```

Click **Publish**.

### Storage Rules

Go to Storage → Rules, paste this:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /conversations/{conversationId}/{file} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        request.resource.size < 10 * 1024 * 1024 &&
        request.resource.contentType.matches('image/.*');
    }
  }
}
```

Click **Publish**.

## 5. Deploy Cloud Functions (5 min)

```bash
# Login to Firebase
firebase login

# Initialize (if needed)
firebase init functions
# Select: Use existing project
# Choose: Your Firebase project
# Language: TypeScript (already set up)
# Dependencies: No (already installed)

# Build and deploy
cd functions
npm run build
npm run deploy
```

Wait for deployment to complete (~2-3 minutes).

Copy the function URLs from output and update `EXPO_PUBLIC_FUNCTIONS_URL` in root `.env`.

## 6. Run the App (2 min)

```bash
# Start development server
npm start

# Then press:
# w - for web
# i - for iOS simulator
# a - for Android emulator
```

## 7. Test It! (5 min)

### Create First Account

1. App opens → Tap "Sign Up"
2. Email: `test1@example.com`
3. Password: `Test123456!`
4. Tap "Sign Up"

### Create Second Account

1. Open in another browser/device
2. Email: `test2@example.com`
3. Password: `Test123456!`
4. Tap "Sign Up"

### Start Chatting

**On Device 1:**
1. Go to "Discover" tab
2. Search for `test2@example.com`
3. Tap user → Start chat

**Send Messages:**
1. Type "Hello!" → Send
2. Try uploading an image 📷
3. Send a few more messages

**Try AI Features:**
1. Tap "✨ AI" button in header
2. Select "Thread Summary"
3. Wait 3-5 seconds
4. Read the AI-generated summary!
5. Try other features (Actions, Decisions, Priority)

## Features Checklist

Test these features:

- [ ] ✅ User signup/login
- [ ] 💬 Send/receive messages
- [ ] 📷 Upload images
- [ ] 📴 Offline mode (turn off wifi, send message, turn on)
- [ ] ✨ AI summary generation
- [ ] ✅ AI action extraction
- [ ] 💡 AI decision tracking
- [ ] ⚡ AI priority detection
- [ ] ⚙️ AI settings screen

## Troubleshooting

### Can't connect to Firebase

**Check:**
- `.env` file exists with correct values
- Firebase services are enabled
- Security rules are published

**Fix:**
```bash
# Restart Metro bundler
npm start -c
```

### Cloud Functions failing

**Check:**
- Functions deployed successfully
- OpenAI API key is valid
- Function URL in `.env` is correct

**Debug:**
```bash
# View function logs
firebase functions:log
```

### AI features not working

**Check:**
- OpenAI API key in `functions/.env`
- Functions deployed
- User is authenticated
- User has access to conversation

**Test function directly:**
```bash
# Get auth token
TOKEN=$(firebase auth:print-identity-token)

# Test summary function
curl -X POST YOUR_FUNCTION_URL/aiSummarizeThread \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"conversationId": "test-conv-id"}'
```

## What's Next?

Now that you're up and running:

1. **Explore the code** - Check out the file structure
2. **Read documentation** - See PHASE3_SUMMARY.md
3. **Customize** - Add your own features
4. **Deploy** - Follow DEPLOYMENT_GUIDE.md
5. **Ship it!** - Submit to App Store/Play Store

## File Structure

```
Conch/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Login, signup
│   ├── (tabs)/            # Main app tabs
│   └── chat/              # Chat screens
├── components/             # React components
│   ├── AI*.tsx            # AI feature components
│   └── *.tsx              # Other components
├── functions/              # Cloud Functions
│   └── src/
│       ├── ai/            # AI functions
│       └── middleware/    # Auth middleware
├── hooks/                  # Custom React hooks
├── services/               # Business logic
└── stores/                 # Zustand stores
```

## Resources

- 📖 [Full Documentation](./README.md)
- 🚀 [Phase 3 Summary](./PHASE3_SUMMARY.md)
- 📦 [Dependencies](./DEPENDENCIES_PHASE3.md)
- 🔧 [Deployment Guide](./DEPLOYMENT_GUIDE.md)

## Need Help?

- **Firebase**: https://firebase.google.com/support
- **Expo**: https://docs.expo.dev
- **OpenAI**: https://help.openai.com

---

**Congratulations!** 🎉 You now have a fully functional AI-powered messenger running locally!

Time to build something awesome! 🚀

