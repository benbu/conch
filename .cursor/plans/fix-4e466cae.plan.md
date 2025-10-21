<!-- 4e466cae-f74a-40b3-b9a1-686d2013b1ca 375b8756-3c91-48d9-ad44-9de5375e09bf -->
# Fix iOS Network Detection - Move Config to Initialization

## Root Cause
NetInfo configuration in `_layout.tsx` useEffect runs after `ConnectionBanner` component mounts, causing a race condition where the initial network check uses unconfigured NetInfo settings.

## Solution
Move NetInfo configuration to `lib/firebase.ts` so it runs synchronously during app initialization, before any components mount.

## Changes

### 1. Update `lib/firebase.ts`
- Import NetInfo and Platform at top
- Add `configureNetInfo()` function that sets iOS/Android reachability URLs
- Call `configureNetInfo()` at the start of `initializeFirebase()` before Firebase services init
- Export the function for testing purposes

```typescript
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

function configureNetInfo() {
  NetInfo.configure({
    reachabilityUrl: Platform.OS === 'ios'
      ? 'https://www.apple.com/library/test/success.html'
      : 'https://clients3.google.com/generate_204',
    reachabilityTest: async (response) => Platform.OS === 'ios' ? response.status === 200 : response.status === 204,
    reachabilityShortTimeout: 5000,
    reachabilityLongTimeout: 60000,
  });
}

export function initializeFirebase() {
  try {
    // Configure NetInfo first, before any network checks
    configureNetInfo();
    
    // ... rest of Firebase initialization
  }
}
```

### 2. Remove NetInfo config from `app/_layout.tsx`
- Remove the NetInfo import
- Remove the useEffect that calls NetInfo.configure
- Keep Platform import if still needed elsewhere

### 3. Verify `hooks/useNetworkStatus.ts`
- Ensure the transport-based logic is in place (already done)
- Ensure debounce is working (already done)

## Testing
- Open chat in airplane mode with Wi-Fi: banner should NOT appear
- Turn Wi-Fi off: banner appears within ~1s
- Turn Wi-Fi back on: banner disappears


### To-dos

- [ ] Move NetInfo.configure to lib/firebase.ts initializeFirebase function
- [ ] Remove NetInfo configuration useEffect from app/_layout.tsx
- [ ] Test iOS airplane mode with Wi-Fi on real device