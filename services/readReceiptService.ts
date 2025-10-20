/**
 * Read Receipt Service
 * Handles read receipts and message status tracking
 */

import { auth, db } from '../lib/firebase';

/**
 * Mark message as read
 */
export async function markMessageAsRead(
  conversationId: string,
  messageId: string
): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const messageRef = db
      .collection('conversations')
      .doc(conversationId)
      .collection('messages')
      .doc(messageId);

    await messageRef.update({
      [`readBy.${user.uid}`]: new Date(),
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
  }
}

/**
 * Mark all messages in conversation as read
 */
export async function markConversationAsRead(
  conversationId: string
): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const messagesSnapshot = await db
      .collection('conversations')
      .doc(conversationId)
      .collection('messages')
      .where('senderId', '!=', user.uid)
      .where(`readBy.${user.uid}`, '==', null)
      .get();

    const batch = db.batch();
    const now = new Date();

    messagesSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        [`readBy.${user.uid}`]: now,
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('Error marking conversation as read:', error);
  }
}

/**
 * Get unread message count for a conversation
 */
export async function getUnreadCount(
  conversationId: string
): Promise<number> {
  try {
    const user = auth.currentUser;
    if (!user) return 0;

    const messagesSnapshot = await db
      .collection('conversations')
      .doc(conversationId)
      .collection('messages')
      .where('senderId', '!=', user.uid)
      .where(`readBy.${user.uid}`, '==', null)
      .get();

    return messagesSnapshot.size;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

/**
 * Get total unread count across all conversations
 */
export async function getTotalUnreadCount(): Promise<number> {
  try {
    const user = auth.currentUser;
    if (!user) return 0;

    // Get all conversations user is part of
    const conversationsSnapshot = await db
      .collection('conversations')
      .where('participantIds', 'array-contains', user.uid)
      .get();

    let totalUnread = 0;

    for (const conversationDoc of conversationsSnapshot.docs) {
      const unread = await getUnreadCount(conversationDoc.id);
      totalUnread += unread;
    }

    return totalUnread;
  } catch (error) {
    console.error('Error getting total unread count:', error);
    return 0;
  }
}

