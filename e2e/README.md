# E2E Testing with Detox

This directory contains end-to-end tests for the Conch messaging app using Detox and Firebase Emulator.

## Prerequisites

1. **Firebase Emulator**: Installed via `firebase-tools` (already in devDependencies)
2. **iOS Simulator** (macOS only) or **Android Emulator**
3. **Expo CLI**: For building the app
4. **Detox CLI** (optional): `npm install -g detox-cli`

## Setup

### 1. Install Dependencies

Dependencies are already installed via the main `package.json`. If you need to reinstall:

```bash
npm install
```

### 2. Configure Firebase Emulator

The Firebase emulator configuration is in `firebase.json` at the project root:

- **Auth Emulator**: http://127.0.0.1:9099
- **Firestore Emulator**: http://127.0.0.1:8080
- **Storage Emulator**: http://127.0.0.1:9199
- **Emulator UI**: http://127.0.0.1:4000

### 3. Build the App for Testing

**iOS:**
```bash
npm run test:e2e:build:ios
```

**Android:**
```bash
npm run test:e2e:build:android
```

## Running Tests

### Start Firebase Emulator

In a separate terminal, start the Firebase emulator:

```bash
npm run emulator:start
```

Or directly:

```bash
firebase emulators:start
```

Leave this running while you execute tests.

### Run Tests

**iOS:**
```bash
npm run test:e2e:ios
```

**Android:**
```bash
npm run test:e2e:android
```

Or use Detox CLI directly:

```bash
detox test --configuration ios.sim.debug
detox test --configuration android.emu.debug
```

### Run Specific Test Files

```bash
detox test --configuration ios.sim.debug e2e/auth.test.ts
detox test --configuration ios.sim.debug e2e/chat.test.ts
detox test --configuration ios.sim.debug e2e/main-flow.test.ts
```

## Test Structure

### Test Files

- **`auth.test.ts`**: Authentication flows (signup, login, logout)
- **`chat.test.ts`**: Chat functionality (create conversation, send messages)
- **`screens.test.ts`**: Screen navigation across all tabs
- **`ai-features.test.ts`**: AI feature testing (summaries, actions, decisions)
- **`main-flow.test.ts`**: Complete user journey from signup to messaging

### Helper Files

- **`helpers/testUsers.ts`**: Mock user credentials
- **`helpers/setup.ts`**: Test setup utilities (emulator control, waits)
- **`helpers/actions.ts`**: Common test actions (signup, login, send message)
- **`helpers/firebaseEmulator.ts`**: Firebase emulator connection helpers

## Test Data

Tests use predefined test users:

- **User 1**: testuser1@example.com / password123
- **User 2**: testuser2@example.com / password123

The emulator is cleared before each test to ensure clean state.

## Debugging

### Enable Verbose Logging

Set `verbose: true` in `e2e/jest.config.js` (already enabled).

### View Emulator Data

Access the Firebase Emulator UI at http://127.0.0.1:4000 to inspect:
- Authentication users
- Firestore documents
- Storage files

### Common Issues

1. **Emulator not running**: Make sure `firebase emulators:start` is running
2. **App not found**: Run the build command first (`npm run test:e2e:build:ios`)
3. **Simulator/Emulator not found**: Check device configuration in `.detoxrc.js`
4. **Tests timing out**: Increase timeout in test files or `e2e/jest.config.js`

### Clear Emulator Data

```bash
npm run emulator:clear
```

Or manually:
```bash
firebase emulators:exec --only firestore,auth "echo cleared"
```

## Environment Variables

Set `USE_FIREBASE_EMULATOR=true` to force Firebase to connect to emulator:

```bash
USE_FIREBASE_EMULATOR=true npm run test:e2e:ios
```

The `lib/firebase.ts` file automatically connects to the emulator when this variable is set.

## CI/CD Integration

For continuous integration, you can run tests in headless mode:

```bash
# Start emulator in background
firebase emulators:start &
EMULATOR_PID=$!

# Wait for emulator to be ready
sleep 10

# Run tests
npm run test:e2e:ios

# Kill emulator
kill $EMULATOR_PID
```

## Writing New Tests

1. Create a new test file in `e2e/` directory
2. Import helpers from `e2e/helpers/`
3. Use the standard Detox API:
   - `element(by.id('testID'))` - Find element by testID
   - `waitFor(element).toBeVisible()` - Wait for element
   - `element.tap()` - Tap element
   - `element.typeText()` - Type text
   - `expect(element).toBeVisible()` - Assert visibility

4. Add testIDs to components:
   ```tsx
   <TextInput testID="my-input" ... />
   <TouchableOpacity testID="my-button" ... />
   ```

## Tips

- Always use `waitFor()` for async operations
- Clear emulator data between tests for isolation
- Use descriptive testIDs (e.g., `chat-message-input` not just `input`)
- Add sleep() when Detox actions are too fast for the app
- Test on both iOS and Android as behaviors can differ

## Resources

- [Detox Documentation](https://wix.github.io/Detox/)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Expo + Detox Guide](https://docs.expo.dev/build-reference/e2e-tests/)


