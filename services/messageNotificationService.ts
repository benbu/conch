/**
 * Message Notification Service
 * Listens for new messages and triggers in-app notifications
 * This is primarily for testing in Expo Go. In production builds,
 * Firebase Cloud Messaging will handle push notifications.
 */

import { collection, onSnapshot, query, Timestamp, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { scheduleLocalNotification } from './notificationService';

let unsubscribeList: Array<() => void> = [];
let startTime: Timestamp | null = null;
let processedMessageIds = new Set<string>();

/**
 * Start listening for new messages across all conversations
 * Triggers local notifications for testing in Expo Go
 */
export function startMessageNotificationListener() {
  const user = auth.currentUser;
  if (!user) {
    console.log('No user logged in, cannot start message notification listener');
    return;
  }

  // Mark the start time - only notify for messages after this point
  startTime = Timestamp.now();
  processedMessageIds.clear();

  console.log('🔔 Starting message notification listener for new messages...');

  // Get all conversations where user is a participant
  const conversationsRef = collection(db, 'conversations');
  const conversationsQuery = query(
    conversationsRef,
    where('participantIds', 'array-contains', user.uid)
  );

  // Listen to conversations to get list of conversation IDs
  const conversationsUnsub = onSnapshot(conversationsQuery, async (snapshot) => {
    // For each conversation, listen to new messages
    snapshot.docs.forEach((doc) => {
      const conversationId = doc.id;
      const conversation = doc.data();
      
      // Listen to messages in this conversation
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const messagesQuery = query(
        messagesRef,
        where('createdAt', '>', startTime!)
      );

      const messageUnsub = onSnapshot(messagesQuery, async (messagesSnapshot) => {
        messagesSnapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const message = change.doc.data();
            const messageId = change.doc.id;

            // Don't notify for own messages or already processed messages
            if (message.senderId === user.uid || processedMessageIds.has(messageId)) {
              return;
            }

            processedMessageIds.add(messageId);

            // Trigger local notification
            try {
              // Get sender name from conversation participants
              const senderName = message.senderName || conversation.participants?.find(
                (p: any) => p.id === message.senderId
              )?.displayName || 'Someone';
              
              const messageText = message.text || '📷 Image';
              const title = conversation.isGroup 
                ? conversation.name || 'Group Chat'
                : senderName;

              await scheduleLocalNotification(title, messageText, {
                conversationId,
                senderId: message.senderId,
                messageId,
              });

              console.log(`📬 Local notification triggered: ${title} - ${messageText.substring(0, 30)}...`);
            } catch (error) {
              console.error('Error triggering notification:', error);
            }
          }
        });
      });

      unsubscribeList.push(messageUnsub);
    });
  });

  unsubscribeList.push(conversationsUnsub);
}

/**
 * Stop listening for new messages
 */
export function stopMessageNotificationListener() {
  if (unsubscribeList.length > 0) {
    unsubscribeList.forEach(unsub => unsub());
    unsubscribeList = [];
    startTime = null;
    processedMessageIds.clear();
    console.log('🔕 Stopped message notification listener');
  }
}

