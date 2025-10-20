# Technical Context

## Technology Stack

### Frontend
- **Framework:** React Native with Expo SDK
- **Language:** TypeScript (strict mode)
- **UI Library:** React Native core components
- **Navigation:** React Navigation
- **State Management:** Zustand or Recoil (to be decided)
- **Storage:** AsyncStorage for offline caching
- **Network:** Firebase JS SDK for real-time data

### Backend
- **Platform:** Firebase
  - **Authentication:** Firebase Auth (email, Google, Apple, phone)
  - **Database:** Cloud Firestore (real-time NoSQL)
  - **Storage:** Cloud Storage for files/images
  - **Functions:** Cloud Functions (Node.js runtime)
  - **Messaging:** Firebase Cloud Messaging (FCM) for push notifications
  - **Security:** Firebase Security Rules

### AI Layer
- **Runtime:** Vercel AI SDK integrated within Cloud Functions
- **Processing:** Server-side AI function calls
- **Storage:** Results cached in Firestore `aiArtifacts` collection
- **Calendar Integration:** Google/Microsoft Calendar APIs via OAuth

## Development Setup

### Prerequisites
- Node.js (LTS version)
- npm or yarn
- Expo CLI
- Firebase CLI
- iOS Simulator (macOS) or Android Emulator
- Git

### Environment Configuration
- Firebase project with all services enabled
- Environment variables for API keys
- OAuth credentials for calendar integration
- Development, staging, and production environments

### Project Structure
```
/app                  # Expo Router screens and layouts
/components           # Reusable UI components
  /ui                 # Base UI primitives
/constants            # Theme and configuration
/hooks                # Custom React hooks
/docs                 # Documentation (PRD, etc.)
/memory-bank          # Project memory and context
/scripts              # Utility scripts
/assets               # Images, fonts, static resources
```

## Technical Constraints

### Performance Requirements
- Message render time ≤ 50ms
- Chat screen load time ≤ 300ms
- Real-time updates with minimal latency
- Efficient memory usage for long conversations

### Offline Requirements
- AsyncStorage for message caching (lightweight, no Room DB)
- Background task queue for pending sends
- Graceful degradation when offline
- Clear UI indicators for connection status

### Security Requirements
- Firebase Auth for all authentication
- Firestore Security Rules for data access control
- HTTPS for all network communication
- Encrypted transport for messages
- Secure storage of sensitive data

### Platform Support
- iOS (latest 2 major versions)
- Android (latest 3 major versions)
- Web (modern browsers)
- Responsive design for tablets

## Key Dependencies

### Core
- `expo` - Development platform and tools
- `react-native` - Core mobile framework
- `typescript` - Type safety
- `react-navigation` - Screen routing

### Firebase
- `@react-native-firebase/app` (or Firebase JS SDK)
- `@react-native-firebase/auth`
- `@react-native-firebase/firestore`
- `@react-native-firebase/storage`
- `@react-native-firebase/messaging`

### State & Storage
- `zustand` or `recoil` - Global state
- `@react-native-async-storage/async-storage` - Local caching

### AI & Backend
- `ai` (Vercel AI SDK) - Server-side in Cloud Functions
- OAuth libraries for calendar integration

### Development
- `eslint` - Linting
- `prettier` - Code formatting
- `jest` - Testing
- `@testing-library/react-native` - Component testing

## Build & Deployment

### Development
- `expo start` - Start development server
- `expo start --ios` - Run on iOS simulator
- `expo start --android` - Run on Android emulator

### Testing
- Unit tests with Jest
- Component tests with React Native Testing Library
- Integration tests for Firebase interactions
- E2E tests for critical user flows

### Production
- Expo Application Services (EAS) for builds
- Over-the-air (OTA) updates for quick patches
- App Store (iOS) and Google Play (Android) distribution
- Web deployment via Expo web build

## Firebase Architecture

### Firestore Collections
```
/users/{userId}
  - displayName, photoURL, tz, workHours

/conversations/{conversationId}
  - title, createdBy, createdAt, lastMessageAt
  /messages/{messageId}
    - senderId, text, attachments[], createdAt, deliveryStatus

/aiArtifacts/{conversationId}
  /summaries/{summaryId}
    - text, createdAt, sourceMessageIds[]
  /actions/{actionId}
    - items[{title, ownerId, dueAt}]
  /decisions/{decisionId}
    - statement, createdAt, sourceMessageIds[]
  /suggestedMeetings/{meetingId}
    - participants[], timeOptions[], createdAt
```

### Cloud Functions
- `/ai/summarizeThread` - Generate conversation summaries
- `/ai/extractActions` - Extract action items
- `/ai/detectPriority` - Identify important messages
- `/ai/trackDecision` - Track key decisions
- `/ai/suggestMeetings` - Calendar-integrated meeting suggestions

### Security Rules
- Users can only read/write their own profile
- Conversation access controlled by participant list
- AI artifacts only accessible to conversation participants
- Write operations validate data structure and permissions

## Known Technical Challenges

### Network Variability
**Challenge:** Users on poor connections or switching networks
**Mitigation:** Expo offline APIs, AsyncStorage caching, retry logic

### AI Latency
**Challenge:** AI operations may take several seconds
**Mitigation:** Progress indicators, cached results, async processing

### Calendar Permissions
**Challenge:** Users may be hesitant about calendar access
**Mitigation:** Clear OAuth consent, explicit permission requests, transparent data usage

### Cross-Platform Consistency
**Challenge:** Platform-specific behaviors and limitations
**Mitigation:** Expo handles most abstraction, test on all platforms, use Platform-specific code when needed

