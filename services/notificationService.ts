/**
 * Notification Service
 * Handles Firebase Cloud Messaging (FCM) push notifications
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { doc, updateDoc } from 'firebase/firestore';
import { Platform } from 'react-native';
import { auth, db } from '../lib/firebase';

const FCM_TOKEN_KEY = 'fcm_token';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('Must use physical device for push notifications');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return false;
  }

  return true;
}

/**
 * Get FCM token and register with backend
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    // Get device push token (FCM token for Android, APNs token for iOS)
    // Note: This will not work in Expo Go (SDK 53+), but works in development/production builds
    const pushTokenData = await Notifications.getDevicePushTokenAsync();
    const token = pushTokenData.data;
    
    // Save token locally
    await AsyncStorage.setItem(FCM_TOKEN_KEY, token);

    // Register token with Firestore
    const user = auth.currentUser;
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), {
        fcmToken: token,
        fcmTokenUpdatedAt: new Date(),
        platform: Platform.OS,
      });
    }

    console.log('Push notification token registered:', token);
    return token;
  } catch (error) {
    // Gracefully handle Expo Go limitation or other errors
    const errorMessage = (error as Error).message || '';
    if (errorMessage.includes('Expo Go') || errorMessage.includes('development build')) {
      console.warn('⚠️ Push notifications require a development build. In-app notifications will still work for testing.');
    } else {
      console.error('Error registering for push notifications:', error);
    }
    return null;
  }
}

/**
 * Unregister FCM token
 */
export async function unregisterPushNotifications(): Promise<void> {
  try {
    const user = auth.currentUser;
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), {
        fcmToken: null,
        fcmTokenUpdatedAt: new Date(),
      });
    }

    await AsyncStorage.removeItem(FCM_TOKEN_KEY);
    console.log('Push notification token unregistered');
  } catch (error) {
    console.error('Error unregistering push notifications:', error);
  }
}

/**
 * Handle notification received while app is foregrounded
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Handle notification response (user tapped notification)
 */
export function addNotificationResponseReceivedListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Get badge count
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
  await setBadgeCount(0);
}

/**
 * Schedule local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: any
): Promise<string> {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // Show immediately
  });
}

/**
 * Cancel scheduled notification
 */
export async function cancelNotification(
  notificationId: string
): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Send test notification (for development/testing in Expo Go)
 * This triggers a local notification to test the in-app notification UI
 */
export async function sendTestNotification(
  title: string = 'Test Message',
  body: string = 'This is a test notification to verify in-app notifications work!',
  conversationId: string = 'test-conversation-id'
): Promise<void> {
  try {
    await scheduleLocalNotification(title, body, {
      conversationId,
      senderId: 'test-sender',
      messageId: 'test-message',
    });
    console.log('✅ Test notification sent');
  } catch (error) {
    console.error('Error sending test notification:', error);
  }
}

