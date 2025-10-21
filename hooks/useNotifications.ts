/**
 * useNotifications Hook
 * Hook for managing push notifications
 */

import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  getBadgeCount,
  registerForPushNotifications,
  sendTestNotification,
  setBadgeCount,
  unregisterPushNotifications,
} from '../services/notificationService';

export function useNotifications() {
  const [token, setToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [badgeCount, setBadgeCountState] = useState(0);
  const router = useRouter();

  /**
   * Initialize notifications
   */
  useEffect(() => {
    // Register for push notifications
    registerForPushNotifications().then((token) => {
      if (token) {
        setToken(token);
      }
    });

    // Get initial badge count
    getBadgeCount().then(setBadgeCountState);

    // Listen for notifications received while app is foregrounded
    const receivedSubscription = addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      setNotification(notification);
      
      // Increment badge count
      getBadgeCount().then((count) => {
        const newCount = count + 1;
        setBadgeCount(newCount);
        setBadgeCountState(newCount);
      });
    });

    // Listen for notification taps
    const responseSubscription = addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      
      // Navigate based on notification data
      const data = response.notification.request.content.data;
      if (data?.conversationId) {
        router.push(`/chat/${data.conversationId}`);
      }
      
      // Clear notification
      Notifications.dismissNotificationAsync(response.notification.request.identifier);
    });

    // Cleanup
    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [router]);

  /**
   * Update badge count
   */
  const updateBadgeCount = useCallback(async (count: number) => {
    await setBadgeCount(count);
    setBadgeCountState(count);
  }, []);

  /**
   * Clear badge
   */
  const clearBadge = useCallback(async () => {
    await updateBadgeCount(0);
  }, [updateBadgeCount]);

  /**
   * Unregister notifications
   */
  const unregister = useCallback(async () => {
    await unregisterPushNotifications();
    setToken(null);
  }, []);

  /**
   * Send test notification (for development/testing)
   */
  const sendTest = useCallback(async (title?: string, message?: string, conversationId?: string) => {
    await sendTestNotification(title, message, conversationId);
  }, []);

  return {
    token,
    notification,
    badgeCount,
    updateBadgeCount,
    clearBadge,
    unregister,
    sendTest,
  };
}

