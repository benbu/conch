import { collection, doc, getDocs, query, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';

/**
 * Repository for read receipts. Uses serverTimestamp for consistency.
 */
export async function markMessageAsRead(
  conversationId: string,
  messageId: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
  await updateDoc(messageRef, {
    [`readBy.${user.uid}`]: serverTimestamp(),
  });
}

export async function markConversationAsRead(
  conversationId: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(
    messagesRef,
    where('senderId', '!=', user.uid),
    // Note: Equality on nested field to null may not be indexed; keep parity with existing service
    where(`readBy.${user.uid}`, '==', null as any)
  );
  const messagesSnapshot = await getDocs(q);

  if (messagesSnapshot.empty) return;

  const batch = writeBatch(db);
  messagesSnapshot.docs.forEach((docSnap) => {
    batch.update(docSnap.ref, {
      [`readBy.${user.uid}`]: serverTimestamp(),
    });
  });

  await batch.commit();
}

export async function getUnreadCount(
  conversationId: string
): Promise<number> {
  const user = auth.currentUser;
  if (!user) return 0;

  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(
    messagesRef,
    where('senderId', '!=', user.uid),
    where(`readBy.${user.uid}`, '==', null as any)
  );
  const messagesSnapshot = await getDocs(q);
  return messagesSnapshot.size;
}

export async function getTotalUnreadCount(): Promise<number> {
  const user = auth.currentUser;
  if (!user) return 0;

  const conversationsRef = collection(db, 'conversations');
  const q = query(conversationsRef, where('participantIds', 'array-contains', user.uid));
  const conversationsSnapshot = await getDocs(q);

  let totalUnread = 0;
  for (const conversationDoc of conversationsSnapshot.docs) {
    totalUnread += await getUnreadCount(conversationDoc.id);
  }
  return totalUnread;
}


