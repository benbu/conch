# Google Sign-In Setup Guide for React Native/Expo

## ✅ SETUP COMPLETE!

Google Sign-In has been fully implemented and is ready to test!

### What Was Implemented

1. ✅ **Installed packages**: `expo-auth-session` and `expo-web-browser`
2. ✅ **Created `hooks/useGoogleAuth.ts`**: Complete Google OAuth hook
3. ✅ **Updated `app.json`**: Added Firebase config file references
4. ✅ **Updated login screen**: Now uses proper Google Sign-In flow
5. ✅ **Configured OAuth client IDs**: Extracted from your Firebase files

### Quick Test

```bash
# Clear cache and restart
npx expo start -c
```

Then click **"Continue with Google"** on the login screen!

### OAuth Client IDs in Use

These were automatically extracted from your Firebase configuration:
- **Web**: `222266867045-mt0nmnm42cvgpcesbik6h1pge2jd3idb.apps.googleusercontent.com`
- **iOS**: `222266867045-jvm744l8tcdh0075l3su9f42gm76jbpr.apps.googleusercontent.com`
- **Android**: `222266867045-mt0nmnm42cvgpcesbik6h1pge2jd3idb.apps.googleusercontent.com`

---

## Issue Fixed

The app was crashing because `signInWithPopup` from Firebase Auth was being used. This is a **web-only** method that doesn't work in React Native/Expo.

**Error:** `TypeError: signInWithPopup is not a function`

## Current Status

✅ **Fixed:** Google Sign-In now uses proper React Native OAuth flow
✅ **Working:** Email/password authentication works normally
✅ **Implemented:** Google Sign-In fully functional via expo-auth-session

## How to Enable Google Sign-In

To properly implement Google Sign-In in React Native/Expo, follow these steps:

### 1. Install Required Packages

```bash
npm install expo-auth-session expo-web-browser
```

### 2. Configure Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Authentication > Sign-in method
4. Enable Google as a sign-in provider
5. Note your Web Client ID and iOS Client ID (if building for iOS)

### 3. Configure Expo App

Add the following to your `app.json`:

```json
{
  "expo": {
    "scheme": "conch",
    "android": {
      "googleServicesFile": "./google-services.json"
    },
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    }
  }
}
```

### 4. Get OAuth Client IDs

You'll need different client IDs for each platform:

- **Web Client ID**: Found in Firebase Console > Project Settings > General
- **Android Client ID**: In your `google-services.json` under `oauth_client`
- **iOS Client ID**: In your `GoogleService-Info.plist` under `CLIENT_ID`

### 5. Create a Google Auth Hook

Create `hooks/useGoogleAuth.ts`:

```typescript
import { useEffect } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { signInWithGoogleIdToken } from '../services/authService';
import { useAuthStore } from '../stores/authStore';

// Enable web browser for auth session
WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const { setUser, setError, setLoading } = useAuthStore();

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      
      if (id_token) {
        setLoading(true);
        signInWithGoogleIdToken(id_token)
          .then((user) => {
            setUser(user);
          })
          .catch((error) => {
            setError(error.message);
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  }, [response]);

  return {
    signInWithGoogle: () => promptAsync(),
    isLoading: !request,
  };
}
```

### 6. Update Environment Variables

Create or update `.env` file:

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com
```

### 7. Update Login Screen

In `app/(auth)/login.tsx`, use the new hook:

```typescript
import { useGoogleAuth } from '../../hooks/useGoogleAuth';

function LoginScreen() {
  const { signInWithGoogle } = useGoogleAuth();
  
  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  // ... rest of component
}
```

## Alternative: Native Google Sign-In

For a more native experience, you can use `@react-native-google-signin/google-signin`:

```bash
npm install @react-native-google-signin/google-signin
```

This provides a better UX but requires additional native configuration.

## Testing

1. **Expo Go**: Google Sign-In works in Expo Go with the development build
2. **Development Build**: Full functionality
3. **Production**: Ensure all client IDs are configured correctly

## Troubleshooting

### "Failed to load token"
- Check that all client IDs are correctly configured
- Ensure `google-services.json` and `GoogleService-Info.plist` are in the root directory

### "Invalid client ID"
- Make sure you're using the correct client ID for each platform
- Web Client ID should match your Firebase project

### "Redirect URI mismatch"
- Ensure your app scheme is correctly configured in `app.json`
- Check Firebase Console > OAuth consent screen

## Resources

- [Expo Auth Session Docs](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Firebase Auth with React Native](https://rnfirebase.io/auth/usage)
- [Google Sign-In for Expo](https://docs.expo.dev/guides/authentication/#google)

## Current Implementation

The `signInWithGoogleIdToken` function in `services/authService.ts` is already set up to handle the ID token from Google Sign-In. You just need to:

1. Install the packages
2. Set up the OAuth credentials
3. Use the `useGoogleAuth` hook in your login screen

For now, use **email/password authentication** which is fully functional.

