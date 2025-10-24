// Feature flags for toggling optional functionality

// Set to true to enable in-app notification banners while app is foregrounded
export const IN_APP_NOTIFICATIONS_ENABLED = false;

// Set to true to enable local notifications in Expo Go (useful for development)
// This will schedule local OS notifications without showing the custom in-app banner
export const LOCAL_NOTIFICATIONS_IN_EXPO_GO = true;

// V2 rollout flags for aggressive refactor areas
export const NOTIFICATIONS_V2 = true; // Use NotificationGateway + deduper path
export const READ_RECEIPTS_V2 = false; // Use repository + batching when enabled
export const PRESENCE_V2 = false; // Use multiplexed presence subscriptions when enabled

// Enable verbose client-side logging for presence lifecycle (development only)
export const PRESENCE_LOGGING = true;

