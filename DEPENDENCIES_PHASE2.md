# Phase 2 Dependencies

## New Dependencies to Install

Run the following command to install Phase 2 dependencies:

```bash
npm install @react-native-async-storage/async-storage @react-native-community/netinfo expo-image-manipulator
```

## Complete Dependency List

### Phase 1 + Phase 2 Combined

```bash
npm install firebase zustand @react-native-async-storage/async-storage expo-image-picker expo-image-manipulator @react-native-community/netinfo date-fns
```

## Package Details

### @react-native-async-storage/async-storage
- **Purpose:** Offline message queue and caching
- **Used in:**
  - `services/offlineQueueService.ts`
  - `services/cacheService.ts`
- **Size:** ~50KB
- **Documentation:** https://react-native-async-storage.github.io/async-storage/

### @react-native-community/netinfo
- **Purpose:** Network connection status monitoring
- **Used in:**
  - `hooks/useNetworkStatus.ts`
  - `hooks/useOfflineQueue.ts`
- **Size:** ~30KB
- **Documentation:** https://github.com/react-native-netinfo/react-native-netinfo

### expo-image-manipulator
- **Purpose:** Image compression and resizing
- **Used in:**
  - `services/imageService.ts`
- **Size:** ~20KB
- **Documentation:** https://docs.expo.dev/versions/latest/sdk/imagemanipulator/

### expo-image-picker (from Phase 1)
- **Purpose:** Pick images from gallery or camera
- **Used in:**
  - `services/imageService.ts`
  - `app/chat/[id].tsx`
- **Documentation:** https://docs.expo.dev/versions/latest/sdk/imagepicker/

## Configuration Notes

### AsyncStorage

No additional configuration needed for Expo. Works out of the box.

**Storage Limits:**
- iOS: 10MB default (can be increased)
- Android: 6MB default (can be increased)
- Web: 5MB-10MB (browser dependent)

### NetInfo

No additional configuration needed for Expo.

**Permissions:**
- iOS: No special permissions needed
- Android: Automatically handled by Expo
- Web: Uses `navigator.onLine`

### Image Manipulator & Picker

**Permissions needed (configured in app.json):**

```json
{
  "expo": {
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow Conch to access your photos to share images",
          "cameraPermission": "Allow Conch to access your camera to take photos"
        }
      ]
    ]
  }
}
```

## Troubleshooting

### AsyncStorage Errors

If you get "Cannot read property 'getItem' of undefined":
```bash
# Clear cache and reinstall
npm install
expo start -c
```

### NetInfo Not Detecting Connection

Check that you're testing on a real device or that simulator has network access.

### Image Upload Failing

1. Check Firebase Storage rules are configured
2. Verify permissions are granted
3. Check file size isn't too large
4. Ensure Firebase Storage is initialized

## Bundle Size Impact

| Package | Size (gzipped) | Purpose |
|---------|----------------|---------|
| @react-native-async-storage/async-storage | ~15KB | Caching |
| @react-native-community/netinfo | ~10KB | Network status |
| expo-image-manipulator | ~8KB | Image processing |
| **Total Phase 2** | **~33KB** | - |

Combined with Phase 1:
- **Firebase:** ~180KB
- **Zustand:** ~1.2KB
- **date-fns:** ~70KB (tree-shakeable)
- **Phase 2:** ~33KB
- **Total:** ~285KB

## Expo Compatibility

All packages are Expo-compatible and work with:
- ✅ Expo SDK 54+
- ✅ iOS 13+
- ✅ Android 6+
- ✅ Web (with limitations)

## Alternative Packages (Not Used)

### Why not react-native-fs?
- AsyncStorage is simpler and sufficient for our needs
- Better Expo integration
- Smaller bundle size

### Why not @react-native-firebase/storage?
- Firebase JS SDK works well with Expo
- No need for native modules
- Simpler setup

### Why not react-native-image-crop-picker?
- expo-image-picker + expo-image-manipulator covers our needs
- Better Expo integration
- No native linking required

## Development vs Production

### Development
All packages work in development mode without additional setup.

### Production (EAS Build)
No special configuration needed. All packages work with EAS Build.

### Web
Most packages work on web with graceful degradation:
- ✅ AsyncStorage → localStorage
- ✅ NetInfo → navigator.onLine
- ⚠️ Image upload → works but may need CORS config

## Updates

Keep dependencies up to date:
```bash
# Check for updates
npm outdated

# Update all
npm update

# Or update specific package
npm install @react-native-async-storage/async-storage@latest
```

## Security Considerations

- **AsyncStorage:** Not encrypted by default. Don't store sensitive data.
- **NetInfo:** No security concerns
- **Images:** Compressed before upload, no EXIF data removed (feature for later)

For sensitive data, consider:
- expo-secure-store (encrypted storage)
- Encrypt before storing in AsyncStorage

