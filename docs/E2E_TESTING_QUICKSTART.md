# E2E Testing Quick Start Guide

This guide will help you quickly set up and run end-to-end tests for the Conch messaging app.

## Quick Setup (5 minutes)

### 1. Prerequisites Check

Ensure you have:
- ✅ Node.js and npm installed
- ✅ iOS Simulator (Mac) or Android Emulator installed
- ✅ Expo CLI (`npm install -g expo-cli`)
- ✅ All dependencies installed (`npm install` - already done)

### 2. Start Firebase Emulator

Open a terminal and run:

```bash
npm run emulator:start
```

**Important**: Keep this terminal open. You should see:
```
✔  All emulators ready! View status and logs at http://127.0.0.1:4000
```

### 3. Build the App (First Time Only)

In a **new terminal**, build the app for testing:

**For iOS (Mac only):**
```bash
npm run test:e2e:build:ios
```

**For Android:**
```bash
npm run test:e2e:build:android
```

This will take 5-10 minutes the first time.

### 4. Run Tests

Once the build completes, run tests:

**iOS:**
```bash
npm run test:e2e:ios
```

**Android:**
```bash
npm run test:e2e:android
```

## Test Suites Available

- **`auth.test.ts`**: Signup, login, logout (5 tests)
- **`chat.test.ts`**: Creating conversations and sending messages (5 tests)
- **`screens.test.ts`**: Navigation across all screens (8 tests)
- **`ai-features.test.ts`**: AI summaries, actions, decisions (5 tests)
- **`main-flow.test.ts`**: Complete user journey (1 comprehensive test)

## Running Specific Tests

```bash
# Run only auth tests
detox test --configuration ios.sim.debug e2e/auth.test.ts

# Run only the main flow test
detox test --configuration ios.sim.debug e2e/main-flow.test.ts
```

## What the Tests Do

The tests simulate real user interactions:

1. **Sign up two mock users** (testuser1@example.com and testuser2@example.com)
2. **Create a conversation** between them
3. **Send and receive messages**
4. **Navigate through all screens**:
   - Home/Chats
   - Explore
   - Profile
   - Edit Profile
   - AI Settings
5. **Test AI features** (if Cloud Functions are deployed)
6. **Verify all UI elements** are working correctly

## Viewing Test Results

Tests run in the simulator/emulator - you can watch the automated interactions happen!

Results are printed in the terminal:
```
PASS  e2e/auth.test.ts (45.2s)
  Authentication Flow
    Signup
      ✓ should successfully sign up a new user (8234ms)
      ✓ should show error for mismatched passwords (2145ms)
    Login
      ✓ should successfully log in an existing user (3421ms)
```

## Troubleshooting

### "Emulator not found"

**iOS**: Make sure Xcode is installed and an iOS simulator is available:
```bash
xcrun simctl list devices
```

**Android**: Ensure an Android emulator is created:
```bash
emulator -list-avds
```

### "Firebase Emulator not responding"

1. Check that emulator is running: http://127.0.0.1:4000
2. Restart the emulator:
   ```bash
   # Press Ctrl+C to stop, then:
   npm run emulator:start
   ```

### "App crashed during test"

1. Clear emulator data:
   ```bash
   npm run emulator:clear
   ```
2. Rebuild the app:
   ```bash
   npm run test:e2e:build:ios  # or android
   ```

### Tests are flaky

Some tests may fail due to timing issues. Try:
1. Running tests individually
2. Increasing timeouts in test files
3. Ensuring your machine isn't overloaded

## Continuous Testing Workflow

For active development:

### Terminal 1: Emulator
```bash
npm run emulator:start
```
Leave running.

### Terminal 2: Development
```bash
npm start
```
For normal app development.

### Terminal 3: Tests
```bash
npm run test:e2e:ios
```
Run tests as needed.

## Test Configuration Files

- **`firebase.json`**: Emulator ports configuration
- **`.detoxrc.js`**: Detox test runner configuration
- **`e2e/jest.config.js`**: Jest configuration for E2E tests
- **`e2e/environment.js`**: Custom Detox test environment

## Next Steps

1. **Read detailed docs**: See `e2e/README.md` for comprehensive guide
2. **Write custom tests**: Add new test files in `e2e/` directory
3. **Add testIDs**: Add `testID` props to components for easier testing
4. **Integrate with CI/CD**: Automate tests in your CI pipeline

## Need Help?

- Check `e2e/README.md` for detailed documentation
- Review test files in `e2e/` for examples
- Look at helper functions in `e2e/helpers/`
- Detox docs: https://wix.github.io/Detox/

## Common Commands Cheat Sheet

```bash
# Start emulator
npm run emulator:start

# Build for testing (first time)
npm run test:e2e:build:ios
npm run test:e2e:build:android

# Run all tests
npm run test:e2e:ios
npm run test:e2e:android

# Run specific test
detox test --configuration ios.sim.debug e2e/auth.test.ts

# Clear emulator data
npm run emulator:clear

# View emulator UI
open http://127.0.0.1:4000
```

Happy Testing! 🧪🚀


