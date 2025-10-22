# Phase 3 Dependencies - AI Features

## Cloud Functions Dependencies

These dependencies need to be installed in the `functions/` directory:

```bash
cd functions
npm install
```

### Production Dependencies

```json
{
  "firebase-admin": "^12.0.0",
  "firebase-functions": "^4.5.0",
  "ai": "^3.0.0",
  "@ai-sdk/openai": "^0.0.24",
  "openai": "^4.28.0",
  "zod": "^3.22.4"
}
```

- **firebase-admin**: Firebase Admin SDK for Firestore access
- **firebase-functions**: Firebase Cloud Functions runtime
- **ai**: Vercel AI SDK core
- **@ai-sdk/openai**: OpenAI provider for Vercel AI SDK
- **openai**: OpenAI official SDK
- **zod**: Schema validation for structured AI outputs

### Development Dependencies

```json
{
  "@types/node": "^20.11.0",
  "typescript": "^5.3.3"
}
```

## Client Dependencies

No new client dependencies needed! Phase 3 uses existing dependencies:

- ✅ `@react-native-async-storage/async-storage` (already installed in Phase 2)
- ✅ `date-fns` (already installed)
- ✅ Firebase SDK (already installed)

## Environment Variables

### Cloud Functions (.env in functions/)

```bash
# Required
OPENAI_API_KEY=sk-your-openai-api-key

# Optional (if using other AI providers)
# ANTHROPIC_API_KEY=your-anthropic-key
# GOOGLE_AI_API_KEY=your-google-ai-key
```

### Client (.env in root)

```bash
# Add to existing .env file
EXPO_PUBLIC_FUNCTIONS_URL=https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net
```

## Setup Commands

### 1. Install Function Dependencies

```bash
cd functions
npm install
```

### 2. Build Functions

```bash
npm run build
```

### 3. Deploy Functions

```bash
# Deploy all functions
npm run deploy

# Or deploy individually
firebase deploy --only functions:aiSummarizeThread
firebase deploy --only functions:aiExtractActions
firebase deploy --only functions:aiTrackDecision
firebase deploy --only functions:aiDetectPriority
```

### 4. Test Functions Locally

```bash
# Start emulator
npm run serve

# Test endpoint
curl -X POST http://localhost:5001/YOUR-PROJECT/us-central1/aiSummarizeThread \
  -H "Authorization: Bearer YOUR-TEST-TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"conversationId": "test123"}'
```

## Firebase Configuration

### 1. Enable Required Services

- ✅ Cloud Functions (already enabled)
- ✅ Cloud Firestore (already enabled)
- ✅ Firebase Authentication (already enabled)

### 2. Set Function Environment Variables

```bash
firebase functions:config:set openai.key="sk-your-key"
```

### 3. Update Security Rules

Add to Firestore rules:

```javascript
// AI Artifacts collection
match /aiArtifacts/{conversationId} {
  match /{collection}/{documentId} {
    allow read: if isAuthenticated() && 
      hasConversationAccess(conversationId);
    allow write: if false; // Only Cloud Functions can write
  }
}

function hasConversationAccess(convId) {
  return exists(/databases/$(database)/documents/conversations/$(convId)) &&
    request.auth.uid in get(/databases/$(database)/documents/conversations/$(convId)).data.participantIds;
}
```

## Deployment Checklist

- [ ] Install functions dependencies
- [ ] Add OpenAI API key to `.env`
- [ ] Build functions (`npm run build`)
- [ ] Test functions locally with emulator
- [ ] Deploy functions to Firebase
- [ ] Update client `.env` with functions URL
- [ ] Update Firestore security rules
- [ ] Test AI features in the app
- [ ] Monitor function logs for errors
- [ ] Check OpenAI usage dashboard

## Cost Estimation

### OpenAI API Costs

**GPT-4 Turbo Pricing:**
- Input: $0.01 per 1K tokens
- Output: $0.03 per 1K tokens

**Typical Usage:**
- Summary (100 messages): ~500 input + ~150 output = $0.01
- Actions (100 messages): ~400 input + ~100 output = $0.01
- Decisions (50 messages): ~300 input + ~80 output = $0.007
- Priority (50 messages): ~250 input + ~60 output = $0.005

**Monthly Estimate (1000 users, 10 uses/month):**
- 10,000 AI requests × $0.01 average = **$100/month**

### Firebase Costs

**Cloud Functions:**
- Free tier: 2M invocations/month
- After: $0.40 per million invocations

**Firestore:**
- Reads/writes for AI artifacts minimal (~$5/month for 1000 users)

**Total Estimated Monthly Cost**: ~$110/month for 1000 active users

## Troubleshooting

### Function Deployment Fails

```bash
# Check logs
firebase functions:log

# Redeploy specific function
firebase deploy --only functions:aiSummarizeThread

# Check function status
firebase functions:list
```

### OpenAI API Errors

```bash
# Verify API key
echo $OPENAI_API_KEY

# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Client Can't Call Functions

- Check CORS configuration in function
- Verify Firebase Auth token is valid
- Check functions URL in `.env`
- Ensure user is participant in conversation

## Monitoring

### Cloud Functions Logs

```bash
# View logs
firebase functions:log

# Follow logs
firebase functions:log --only aiSummarizeThread
```

### OpenAI Usage Dashboard

Visit: https://platform.openai.com/usage

### Firebase Console

Monitor:
- Function invocations
- Function execution time
- Error rates
- Billing

## Security Best Practices

1. **API Keys**: Never commit OpenAI API key to git
2. **Rate Limiting**: Implement rate limiting in production
3. **Input Validation**: Validate all function inputs
4. **Error Handling**: Don't expose internal errors to clients
5. **Monitoring**: Set up alerts for unusual usage patterns

## Support

For issues or questions:
- [Vercel AI SDK Docs](https://sdk.vercel.ai)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Firebase Functions Docs](https://firebase.google.com/docs/functions)

