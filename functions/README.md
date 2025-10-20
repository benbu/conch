# Conch Social Cloud Functions

AI-powered backend functions for Conch Social messaging app.

## Features

- **Thread Summaries**: Generate concise summaries of conversations
- **Action Extraction**: Identify tasks and action items from discussions
- **Decision Tracking**: Record key decisions made in conversations
- **Priority Detection**: Highlight urgent or important messages

## Setup

### 1. Install Dependencies

```bash
cd functions
npm install
```

### 2. Configure Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Add your OpenAI API key:

```
OPENAI_API_KEY=sk-...
```

### 3. Build TypeScript

```bash
npm run build
```

### 4. Deploy Functions

```bash
npm run deploy
```

Or deploy a specific function:

```bash
firebase deploy --only functions:aiSummarizeThread
```

## Local Development

### Run Functions Emulator

```bash
npm run serve
```

This starts the Firebase emulators for local testing.

### Watch Mode

For automatic recompilation on changes:

```bash
npm run build:watch
```

## API Endpoints

All endpoints require Firebase Authentication token in the `Authorization` header:

```
Authorization: Bearer <firebase-id-token>
```

### POST /ai/summarizeThread

Generate a conversation summary.

**Request:**
```json
{
  "conversationId": "conv_123",
  "options": {
    "messageLimit": 100,
    "dateRange": {
      "start": "2025-01-01T00:00:00Z",
      "end": "2025-01-31T23:59:59Z"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "summary_abc",
    "conversationId": "conv_123",
    "text": "The team discussed...",
    "createdAt": "2025-01-20T10:30:00Z",
    "sourceMessageIds": ["msg_1", "msg_2"]
  }
}
```

### POST /ai/extractActions

Extract action items from conversation.

**Request:**
```json
{
  "conversationId": "conv_123",
  "options": {
    "messageLimit": 100
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "actions_xyz",
    "conversationId": "conv_123",
    "items": [
      {
        "title": "Review the PR",
        "ownerId": "user_123",
        "dueAt": "2025-01-25T00:00:00Z",
        "completed": false
      }
    ],
    "createdAt": "2025-01-20T10:30:00Z",
    "sourceMessageIds": ["msg_3", "msg_4"]
  }
}
```

### POST /ai/trackDecision

Track decisions made in conversation.

**Request:**
```json
{
  "conversationId": "conv_123",
  "options": {
    "messageLimit": 50
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "decision_def",
      "conversationId": "conv_123",
      "statement": "We will use PostgreSQL for the database",
      "createdAt": "2025-01-20T10:30:00Z",
      "sourceMessageIds": ["msg_5", "msg_6"]
    }
  ]
}
```

### POST /ai/detectPriority

Identify high-priority messages.

**Request:**
```json
{
  "conversationId": "conv_123",
  "options": {
    "messageLimit": 50,
    "minScore": 6
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "priority_ghi",
    "conversationId": "conv_123",
    "priorityMessages": [
      {
        "messageId": "msg_7",
        "score": 8,
        "reason": "Production deployment blocker"
      }
    ],
    "createdAt": "2025-01-20T10:30:00Z"
  }
}
```

## Error Handling

All functions return errors in the following format:

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

Common status codes:
- `400`: Bad request (missing parameters)
- `401`: Unauthorized (invalid or missing token)
- `403`: Forbidden (no access to conversation)
- `500`: Internal server error

## Security

- All functions verify Firebase ID tokens
- Users must be participants in a conversation to access its AI features
- API keys are stored securely in Firebase Functions config

## Cost Considerations

AI functions use OpenAI's GPT-4 Turbo model. Monitor usage:

```bash
firebase functions:log
```

Consider implementing rate limiting for production use.

## Testing

Run TypeScript compiler in check mode:

```bash
npx tsc --noEmit
```

## Deployment Checklist

- [ ] Set OpenAI API key in Firebase Functions config
- [ ] Test all functions with Firebase emulator
- [ ] Verify Firestore security rules allow AI artifact writes
- [ ] Monitor function execution costs
- [ ] Set up error alerting

## Support

For issues or questions, refer to:
- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Vercel AI SDK Documentation](https://sdk.vercel.ai)
- [OpenAI API Documentation](https://platform.openai.com/docs)

