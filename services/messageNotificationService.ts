/**
 * Message Notification Service
 * Listens for new messages and triggers in-app notifications
 * This is primarily for testing in Expo Go. In production builds,
 * Firebase Cloud Messaging will handle push notifications.
 */

import { collection, onSnapshot, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { IN_APP_NOTIFICATIONS_ENABLED, LOCAL_NOTIFICATIONS_IN_EXPO_GO } from '../constants/featureFlags';
import { auth, db } from '../lib/firebase';
import { scheduleLocalNotification } from './notificationService';

let unsubscribeList: Array<() => void> = [];
let startTime: Timestamp | null = null;
let processedMessageIds = new Set<string>();
let currentConversationId: string | null = null;
const lastNotifiedMessageIdByConversation: Record<string, string> = {};

/**
 * Start listening for new messages across all conversations
 * Triggers local notifications for testing in Expo Go
 */
export function startMessageNotificationListener() {
  if (!IN_APP_NOTIFICATIONS_ENABLED && !LOCAL_NOTIFICATIONS_IN_EXPO_GO) {
    return;
  }
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
        where('createdAt', '>', startTime!),
        orderBy('createdAt', 'asc')
      );

      const messageUnsub = onSnapshot(messagesQuery, async (messagesSnapshot) => {
        // Consider only newly added docs in this snapshot
        const added = messagesSnapshot.docChanges().filter((c) => c.type === 'added');
        if (added.length === 0) return;

        // Pick the newest by createdAt
        let newest = added[0];
        let newestCreatedAt: Timestamp | null = (added[0].doc.data()?.createdAt as Timestamp) || null;
        for (let i = 1; i < added.length; i++) {
          const ct = (added[i].doc.data()?.createdAt as Timestamp) || null;
          if (!newestCreatedAt || (ct && ct.toMillis() > newestCreatedAt.toMillis())) {
            newest = added[i];
            newestCreatedAt = ct;
          }
        }

        const message = newest.doc.data();
        const messageId = newest.doc.id;

        // Guard: If we've already notified for a newer/equal message in this conversation, skip
        if (lastNotifiedMessageIdByConversation[conversationId]) {
          const lastId = lastNotifiedMessageIdByConversation[conversationId];
          if (processedMessageIds.has(lastId)) {
            // We already fired a notification for a message in this conversation; allow only strictly newer by createdAt
            const lastDoc = messagesSnapshot.docs.find((d) => d.id === lastId);
            const lastCt = (lastDoc?.data()?.createdAt as Timestamp) || null;
            if (lastCt && newestCreatedAt && newestCreatedAt.toMillis() <= lastCt.toMillis()) {
              return;
            }
          }
        }

        // Don't notify for own messages, already processed, or active conversation
        if (
          message.senderId === user.uid ||
          processedMessageIds.has(messageId) ||
          conversationId === currentConversationId
        ) {
          return;
        }

        processedMessageIds.add(messageId);

        try {
          const senderName = message.senderName || conversation.participants?.find(
            (p: any) => p.id === message.senderId
          )?.displayName || 'Someone';

          const messageText = message.text || '📷 Image';
          const title = conversation.isGroup ? conversation.name || 'Group Chat' : senderName;

          await scheduleLocalNotification(title, messageText, {
            conversationId,
            senderId: message.senderId,
            messageId,
          });

          lastNotifiedMessageIdByConversation[conversationId] = messageId;
          console.log(`📬 Local notification triggered: ${title} - ${messageText.substring(0, 30)}...`);
        } catch (error) {
          console.error('Error triggering notification:', error);
        }
      });

      unsubscribeList.push(messageUnsub);
    });
  });

  unsubscribeList.push(conversationsUnsub);
}

/**
 * Set the currently active conversation
 * Call this when user navigates to/from a conversation
 */
export function setCurrentConversation(conversationId: string | null) {
  currentConversationId = conversationId;
  console.log(`📍 Current conversation set to: ${conversationId || 'none'}`);
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
    currentConversationId = null;
    console.log('🔕 Stopped message notification listener');
  }
}

