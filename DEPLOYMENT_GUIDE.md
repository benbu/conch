# Conch Social - Complete Deployment Guide

## Pre-Deployment Checklist

### Firebase Configuration
- [ ] Firebase project created
- [ ] Authentication enabled (Email, Google)
- [ ] Firestore database created
- [ ] Cloud Storage enabled
- [ ] Cloud Functions enabled
- [ ] Security rules deployed

### API Keys
- [ ] OpenAI API key obtained
- [ ] Firebase config added to `.env`
- [ ] Functions URL configured

### Code Status
- [ ] All dependencies installed
- [ ] TypeScript compilation successful
- [ ] No linter errors
- [ ] All tests passing (if applicable)

## Step-by-Step Deployment

### 1. Client App Deployment

#### Install Dependencies
```bash
npm install
```

#### Configure Environment
Create `.env` file:
```bash
# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=your-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id

# Cloud Functions
EXPO_PUBLIC_FUNCTIONS_URL=https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net
```

#### Build for Development
```bash
# Start development server
npm start

# Test on platforms
npm run ios
npm run android
npm run web
```

#### Build for Production (EAS)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure

# Build iOS
eas build --platform ios

# Build Android
eas build --platform android
```

### 2. Cloud Functions Deployment

#### Install Function Dependencies
```bash
cd functions
npm install
```

#### Configure OpenAI API Key
Create `functions/.env`:
```bash
OPENAI_API_KEY=sk-your-openai-api-key
```

#### Build Functions
```bash
npm run build
```

#### Deploy Functions
```bash
# Deploy all functions
npm run deploy

# Or deploy individually
firebase deploy --only functions:aiSummarizeThread
firebase deploy --only functions:aiExtractActions
firebase deploy --only functions:aiTrackDecision
firebase deploy --only functions:aiDetectPriority
```

#### Verify Deployment
```bash
# Check function status
firebase functions:list

# View logs
firebase functions:log
```

### 3. Firestore Security Rules

Deploy security rules from Firebase Console or using CLI:

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
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }
    
    // Conversations collection
    match /conversations/{conversationId} {
      allow read: if hasConversationAccess(conversationId);
      allow create: if isAuthenticated() && 
        request.auth.uid in request.resource.data.participantIds;
      allow update, delete: if hasConversationAccess(conversationId);
      
      // Messages subcollection
      match /messages/{messageId} {
        allow read, write: if hasConversationAccess(conversationId);
      }
    }
    
    // AI Artifacts collection
    match /aiArtifacts/{conversationId} {
      match /{collection}/{documentId} {
        allow read: if hasConversationAccess(conversationId);
        allow write: if false; // Only Cloud Functions can write
      }
    }
  }
}
```

### 4. Firebase Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isAuthenticated() {
      return request.auth != null;
    }
    
    match /conversations/{conversationId}/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && 
        request.resource.size < 10 * 1024 * 1024 && // 10MB limit
        request.resource.contentType.matches('image/.*');
    }
  }
}
```

## Testing Deployment

### 1. Client App Testing

#### Create Test Accounts
```bash
# Account 1
Email: test1@example.com
Password: Test123456!

# Account 2
Email: test2@example.com
Password: Test123456!
```

#### Test Core Features
- [ ] User registration
- [ ] User login
- [ ] User discovery
- [ ] Conversation creation
- [ ] Message sending
- [ ] Message receiving
- [ ] Image upload
- [ ] Offline message queue
- [ ] Message status indicators

#### Test AI Features
- [ ] Generate thread summary
- [ ] Extract action items
- [ ] Track decisions
- [ ] Detect priority messages
- [ ] AI caching works
- [ ] AI settings save correctly

### 2. Function Testing

Test each function with curl:

```bash
# Get auth token
TOKEN=$(firebase auth:print-identity-token)

# Test summary
curl -X POST https://us-central1-YOUR-PROJECT.cloudfunctions.net/aiSummarizeThread \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"conversationId": "test-conv-id"}'

# Test actions
curl -X POST https://us-central1-YOUR-PROJECT.cloudfunctions.net/aiExtractActions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"conversationId": "test-conv-id"}'
```

### 3. Performance Testing

Monitor in Firebase Console:
- Function execution time (should be < 10s)
- Function error rate (should be < 1%)
- Firestore read/write operations
- Storage usage
- OpenAI API usage

## Production Checklist

### Security
- [ ] API keys in environment variables (not in code)
- [ ] Security rules deployed and tested
- [ ] CORS properly configured
- [ ] Rate limiting implemented (if needed)
- [ ] Input validation on all functions

### Performance
- [ ] Images compressed before upload
- [ ] Message pagination working
- [ ] AI results cached
- [ ] Firestore indexes created
- [ ] Function cold start optimized

### Monitoring
- [ ] Firebase Analytics enabled
- [ ] Crashlytics configured
- [ ] Function logs reviewed
- [ ] Error tracking set up
- [ ] Usage alerts configured

### User Experience
- [ ] Loading states for all async operations
- [ ] Error messages user-friendly
- [ ] Offline mode graceful
- [ ] Push notifications working
- [ ] UI responsive on all devices

## Rollback Plan

If issues arise after deployment:

### Rollback Cloud Functions
```bash
# List function versions
firebase functions:list

# Rollback to previous version
firebase functions:delete functionName
firebase deploy --only functions:functionName@previous-version
```

### Rollback App
```bash
# Use EAS rollback
eas update --branch production --message "Rollback to previous version"
```

## Monitoring & Maintenance

### Daily Checks
- Review Firebase Console for errors
- Check OpenAI API usage
- Monitor user feedback

### Weekly Tasks
- Review Cloud Functions logs
- Check storage usage
- Analyze user engagement metrics
- Review AI feature usage

### Monthly Tasks
- Update dependencies
- Review security rules
- Optimize costs
- Plan feature updates

## Cost Management

### Expected Monthly Costs (1000 active users)

**Firebase:**
- Authentication: Free
- Firestore: ~$25/month
- Storage: ~$10/month
- Functions: ~$20/month
- **Total**: ~$55/month

**OpenAI:**
- API usage: ~$100/month
- **Total**: ~$100/month

**Grand Total**: ~$155/month for 1000 users

### Cost Optimization
1. Enable AI result caching (reduces API calls by 80%)
2. Set message limits for AI processing
3. Monitor and optimize Firestore queries
4. Compress images before upload
5. Use Firebase free tier where possible

## Support & Troubleshooting

### Common Issues

**Functions not deploying:**
- Check Firebase billing enabled
- Verify Node.js version (18)
- Check function size < 100MB

**AI features failing:**
- Verify OpenAI API key valid
- Check function logs for errors
- Ensure user has conversation access

**App crashes:**
- Check Crashlytics reports
- Review recent code changes
- Test on multiple devices

### Getting Help
- Firebase Support: https://firebase.google.com/support
- OpenAI Support: https://help.openai.com
- Expo Forums: https://forums.expo.dev

## Success Criteria

Deployment is successful when:
- [ ] App installs and runs on iOS/Android/Web
- [ ] Users can sign up and log in
- [ ] Messages send and receive in real-time
- [ ] Images upload successfully
- [ ] Offline mode works correctly
- [ ] All AI features respond within 10 seconds
- [ ] Error rate < 1%
- [ ] No critical bugs reported

## Next Steps After Deployment

1. **Beta Testing**: Invite small group of users
2. **Gather Feedback**: Collect user experiences
3. **Monitor Metrics**: Track usage and errors
4. **Iterate**: Fix issues and add improvements
5. **Scale**: Gradually increase user base

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Version**: 1.0.0 (MVP + Phase 2 + Phase 3)

