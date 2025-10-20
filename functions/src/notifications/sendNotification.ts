/**
 * Send Push Notification Cloud Function
 * Sends notifications when new messages are received
 */

import * as admin from 'firebase-admin';

interface NotificationPayload {
  title: string;
  body: string;
  conversationId: string;
  senderId: string;
  messageId: string;
}

/**
 * Send push notification to a user
 */
export async function sendPushNotification(
  userId: string,
  payload: NotificationPayload
): Promise<boolean> {
  try {
    // Get user's FCM token
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.log(`User ${userId} not found`);
      return false;
    }

    const userData = userDoc.data();
    const fcmToken = userData?.fcmToken;

    if (!fcmToken) {
      console.log(`No FCM token for user ${userId}`);
      return false;
    }

    // Send notification
    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        conversationId: payload.conversationId,
        senderId: payload.senderId,
        messageId: payload.messageId,
      },
      token: fcmToken,
    };

    const response = await admin.messaging().send(message);
    console.log('Successfully sent notification:', response);
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    
    // If token is invalid, remove it from user document
    if ((error as any).code === 'messaging/invalid-registration-token' ||
        (error as any).code === 'messaging/registration-token-not-registered') {
      await admin.firestore().collection('users').doc(userId).update({
        fcmToken: null,
      });
    }
    
    return false;
  }
}

/**
 * Send notification to multiple users
 */
export async function sendPushNotificationToMultiple(
  userIds: string[],
  payload: NotificationPayload
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  await Promise.all(
    userIds.map(async (userId) => {
      const sent = await sendPushNotification(userId, payload);
      if (sent) {
        success++;
      } else {
        failed++;
      }
    })
  );

  return { success, failed };
}

