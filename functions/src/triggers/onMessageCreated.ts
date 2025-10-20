/**
 * Firestore Trigger: On Message Created
 * Sends push notifications when new messages are created
 */

import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { sendPushNotificationToMultiple } from '../notifications/sendNotification';

export const onMessageCreated = onDocumentCreated(
  'conversations/{conversationId}/messages/{messageId}',
  async (event) => {
    const message = event.data?.data();
    const conversationId = event.params.conversationId;
    const messageId = event.params.messageId;

    if (!message) {
      console.log('No message data');
      return;
    }

    try {
      // Get conversation to find participants
      const conversationDoc = await admin
        .firestore()
        .collection('conversations')
        .doc(conversationId)
        .get();

      if (!conversationDoc.exists) {
        console.log('Conversation not found');
        return;
      }

      const conversation = conversationDoc.data();
      if (!conversation) {
        return;
      }

      // Get sender info
      const senderDoc = await admin
        .firestore()
        .collection('users')
        .doc(message.senderId)
        .get();

      const senderName = senderDoc.data()?.displayName || 'Someone';

      // Find recipients (all participants except sender)
      const recipients = conversation.participantIds.filter(
        (id: string) => id !== message.senderId
      );

      if (recipients.length === 0) {
        console.log('No recipients to notify');
        return;
      }

      // Prepare notification payload
      const title = conversation.title || senderName;
      const body = message.text || '📷 Image';

      // Send notifications
      const result = await sendPushNotificationToMultiple(recipients, {
        title,
        body,
        conversationId,
        senderId: message.senderId,
        messageId,
      });

      console.log(
        `Sent ${result.success} notifications, ${result.failed} failed`
      );
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
);

