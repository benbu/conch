# 🚀 Quick Deploy Guide

Get Conch Social running in production in under 2 hours!

## Prerequisites

- Node.js 18+ installed
- Firebase project created
- Firebase CLI installed: `npm install -g firebase-tools`
- EAS CLI installed: `npm install -g eas-cli`
- Apple Developer account (for iOS)
- Google Play Console account (for Android)

## Step 1: Clone & Install (10 minutes)

```bash
# Clone repository
cd Conch

# Install dependencies
npm install

# Install Cloud Functions dependencies
cd functions
npm install
cd ..
```

## Step 2: Firebase Setup (15 minutes)

### 2.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add Project"
3. Name it "Conch Social" (or your choice)
4. Enable Google Analytics (optional)

### 2.2 Enable Services
1. **Authentication**: Enable Email/Password and Google
2. **Firestore**: Create database in production mode
3. **Storage**: Create default bucket
4. **Cloud Messaging**: Enable FCM

### 2.3 Get Configuration
1. Project Settings → General → Your apps
2. Add iOS app (get `GoogleService-Info.plist`)
3. Add Android app (get `google-services.json`)
4. Add Web app (get Firebase config object)

### 2.4 Create `.env` File

```bash
# Copy template
cp .env.example .env

# Edit with your Firebase config
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FUNCTIONS_URL=https://us-central1-your-project.cloudfunctions.net
```

### 2.5 Deploy Firestore Rules & Indexes

```bash
firebase login
firebase use --add  # Select your project
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

## Step 3: OpenAI Setup (5 minutes)

1. Get API key from [OpenAI Platform](https://platform.openai.com)
2. Add to `functions/.env`:
   ```bash
   OPENAI_API_KEY=sk-...
   ```

## Step 4: Deploy Cloud Functions (10 minutes)

```bash
cd functions

# Build functions
npm run build

# Deploy all functions
firebase deploy --only functions

# Verify deployment
firebase functions:list
```

Expected functions:
- ✅ aiSummarizeThread
- ✅ aiExtractActions
- ✅ aiTrackDecision
- ✅ aiDetectPriority
- ✅ onMessageCreated

## Step 5: Test Locally (15 minutes)

```bash
# Start Expo dev server
npx expo start

# Test on physical device (recommended) or simulator
# Press 'i' for iOS simulator
# Press 'a' for Android emulator
# Scan QR code with Expo Go app
```

### Test Checklist
- [ ] Sign up with email
- [ ] Create a conversation
- [ ] Send a message
- [ ] Upload an image
- [ ] Go offline and send message (should queue)
- [ ] Go online (message should sync)
- [ ] Test AI summary
- [ ] Test AI action extraction

## Step 6: Build for Production (30 minutes)

### 6.1 Configure EAS

```bash
# Login to Expo
eas login

# Configure project
eas build:configure
```

### 6.2 Update `app.json`

```json
{
  "expo": {
    "name": "Conch Social",
    "slug": "conch-social",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourcompany.conchsocial",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.yourcompany.conchsocial",
      "versionCode": 1
    }
  }
}
```

### 6.3 Build iOS

```bash
# Production build
eas build --platform ios --profile production

# Wait for build to complete (~20 minutes)
# Download IPA when ready
```

### 6.4 Build Android

```bash
# Production build
eas build --platform android --profile production

# Wait for build to complete (~15 minutes)
# Download AAB when ready
```

## Step 7: Submit to App Stores (45 minutes)

### iOS - Apple App Store

1. **Prepare Assets**
   - App icon (1024x1024)
   - Screenshots (all device sizes)
   - App description
   - Keywords
   - Privacy policy URL
   - Support URL

2. **Submit via EAS**
   ```bash
   eas submit --platform ios
   ```

3. **Or Manual Upload**
   - Open Transporter app
   - Drag and drop IPA file
   - Wait for upload
   - Go to App Store Connect
   - Submit for review

**Review Time**: 1-3 days

### Android - Google Play Store

1. **Prepare Assets**
   - App icon (512x512)
   - Feature graphic (1024x500)
   - Screenshots (at least 2)
   - App description
   - Privacy policy URL

2. **Submit via EAS**
   ```bash
   eas submit --platform android
   ```

3. **Or Manual Upload**
   - Go to Google Play Console
   - Create app
   - Upload AAB
   - Fill out store listing
   - Submit for review

**Review Time**: Hours to 1 day

## Step 8: Monitor & Iterate

### Set Up Monitoring

1. **Firebase Console**
   - Watch Firestore usage
   - Monitor function executions
   - Check error logs

2. **OpenAI Dashboard**
   - Monitor API usage
   - Watch costs
   - Track token usage

3. **Expo Dashboard**
   - Monitor builds
   - Check updates
   - View analytics

### Post-Launch Checklist
- [ ] Monitor crash reports
- [ ] Watch Firebase costs
- [ ] Check OpenAI costs
- [ ] Read user reviews
- [ ] Respond to feedback
- [ ] Plan updates

## Cost Summary

### Development (One-Time)
- Apple Developer: $99/year
- Google Play: $25 one-time
- **Total**: $124

### Monthly Operations (1000 users)
- Firebase: ~$55/month
- OpenAI API: ~$100/month
- **Total**: ~$155/month

### Scaling (10,000 users)
- Firebase: ~$300/month
- OpenAI API: ~$1000/month
- **Total**: ~$1300/month

## Troubleshooting

### Build Fails
```bash
# Clear cache and retry
eas build:clear-cache
eas build --platform ios --clear-cache
```

### Functions Not Working
```bash
# Check logs
firebase functions:log

# Redeploy specific function
firebase deploy --only functions:aiSummarizeThread
```

### Push Notifications Not Working
- iOS: Check APNs certificate in Firebase
- Android: Verify `google-services.json` is present
- Both: Test with Expo push notification tool

### App Crashes
- Check Expo logs
- Review Firebase errors
- Test on multiple devices
- Check for TypeScript errors

## Quick Links

- **Firebase Console**: https://console.firebase.google.com
- **OpenAI Platform**: https://platform.openai.com
- **Expo Dashboard**: https://expo.dev
- **App Store Connect**: https://appstoreconnect.apple.com
- **Google Play Console**: https://play.google.com/console

## Support

Need help? Check:
1. `SETUP.md` - Detailed setup guide
2. `FINAL_STATUS.md` - Complete feature list
3. `PHASE4_SUMMARY.md` - Latest features
4. Firebase documentation
5. Expo documentation

---

**"Deploy you must. Production awaits!"** 🚀✨

Good luck with your launch! 🎉

