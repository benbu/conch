/**
 * Read Receipt Service
 * Handles read receipts and message status tracking
 */

import { collection, doc, getDocs, query, updateDoc, where, writeBatch } from 'firebase/firestore';
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

    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);

    await updateDoc(messageRef, {
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

    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(
      messagesRef,
      where('senderId', '!=', user.uid),
      where(`readBy.${user.uid}`, '==', null)
    );
    const messagesSnapshot = await getDocs(q);

    const batch = writeBatch(db);
    const now = new Date();

    messagesSnapshot.docs.forEach((docSnap) => {
      batch.update(docSnap.ref, {
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

    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(
      messagesRef,
      where('senderId', '!=', user.uid),
      where(`readBy.${user.uid}`, '==', null)
    );
    const messagesSnapshot = await getDocs(q);

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
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participantIds', 'array-contains', user.uid)
    );
    const conversationsSnapshot = await getDocs(q);

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

