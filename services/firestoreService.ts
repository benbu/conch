// Firestore service for conversations and messages
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { getFirebaseDB } from '../lib/firebase';
import { Conversation, Message, User } from '../types';

const db = getFirebaseDB();

// ===== Conversations =====

/**
 * Create a new conversation
 */
export async function createConversation(
  participantIds: string[],
  createdBy: string,
  title?: string,
  type: 'direct' | 'group' = 'direct'
): Promise<string> {
  try {
    const conversationData = {
      title: title || null,
      type,
      participantIds,
      createdBy,
      createdAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'conversations'), conversationData);
    return docRef.id;
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    throw new Error(error.message || 'Failed to create conversation');
  }
}

/**
 * Get conversations for a user
 */
export async function getUserConversations(userId: string): Promise<Conversation[]> {
  try {
    const q = query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', userId),
      orderBy('lastMessageAt', 'desc')
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        type: data.type,
        participantIds: data.participantIds,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastMessageAt: data.lastMessageAt?.toDate() || new Date(),
        lastMessage: data.lastMessage ? {
          ...data.lastMessage,
          createdAt: data.lastMessage.createdAt?.toDate() || new Date(),
        } : undefined,
      };
    });
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    throw new Error(error.message || 'Failed to fetch conversations');
  }
}

/**
 * Listen to conversations in real-time
 */
export function subscribeToConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void
) {
  const q = query(
    collection(db, 'conversations'),
    where('participantIds', 'array-contains', userId),
    orderBy('lastMessageAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const conversations = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        type: data.type,
        participantIds: data.participantIds,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastMessageAt: data.lastMessageAt?.toDate() || new Date(),
        lastMessage: data.lastMessage ? {
          ...data.lastMessage,
          createdAt: data.lastMessage.createdAt?.toDate() || new Date(),
        } : undefined,
      };
    });
    
    callback(conversations);
  });
}

// ===== Messages =====

/**
 * Send a message
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string,
  attachments?: any[]
): Promise<string> {
  try {
    const messageData = {
      conversationId,
      senderId,
      text,
      attachments: attachments || [],
      deliveryStatus: 'sent',
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(
      collection(db, 'conversations', conversationId, 'messages'),
      messageData
    );

    // Update conversation's lastMessageAt and lastMessage
    await updateDoc(doc(db, 'conversations', conversationId), {
      lastMessageAt: serverTimestamp(),
      lastMessage: {
        text,
        senderId,
        createdAt: serverTimestamp(),
      },
    });

    return docRef.id;
  } catch (error: any) {
    console.error('Error sending message:', error);
    throw new Error(error.message || 'Failed to send message');
  }
}

/**
 * Get messages for a conversation
 */
export async function getMessages(
  conversationId: string,
  limitCount: number = 50
): Promise<Message[]> {
  try {
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          conversationId,
          senderId: data.senderId,
          text: data.text,
          attachments: data.attachments,
          deliveryStatus: data.deliveryStatus,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate(),
        };
      })
      .reverse(); // Reverse to show oldest first
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    throw new Error(error.message || 'Failed to fetch messages');
  }
}

/**
 * Get messages with pagination (before a specific message)
 */
export async function getMessagesBefore(
  conversationId: string,
  beforeDate: Date,
  limitCount: number = 50
): Promise<Message[]> {
  try {
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      where('createdAt', '<', beforeDate),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          conversationId,
          senderId: data.senderId,
          text: data.text,
          attachments: data.attachments,
          deliveryStatus: data.deliveryStatus,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate(),
        };
      })
      .reverse(); // Reverse to show oldest first
  } catch (error: any) {
    console.error('Error fetching messages before date:', error);
    throw new Error(error.message || 'Failed to fetch messages');
  }
}

/**
 * Listen to messages in real-time
 */
export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void
) {
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        conversationId,
        senderId: data.senderId,
        text: data.text,
        attachments: data.attachments,
        deliveryStatus: data.deliveryStatus,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate(),
      };
    });
    
    callback(messages);
  });
}

/**
 * Update message delivery status
 */
export async function updateMessageStatus(
  conversationId: string,
  messageId: string,
  status: Message['deliveryStatus']
): Promise<void> {
  try {
    await updateDoc(
      doc(db, 'conversations', conversationId, 'messages', messageId),
      {
        deliveryStatus: status,
        updatedAt: serverTimestamp(),
      }
    );
  } catch (error: any) {
    console.error('Error updating message status:', error);
    throw new Error(error.message || 'Failed to update message status');
  }
}

// ===== User Search =====

/**
 * Search users by email or display name
 */
export async function searchUsers(searchTerm: string): Promise<User[]> {
  try {
    // Note: Firestore doesn't support full-text search natively
    // For production, consider using Algolia or similar service
    // This is a simple prefix match on email
    const q = query(
      collection(db, 'users'),
      where('email', '>=', searchTerm),
      where('email', '<=', searchTerm + '\uf8ff'),
      limit(10)
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL,
        timeZone: data.timeZone,
        workHours: data.workHours,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });
  } catch (error: any) {
    console.error('Error searching users:', error);
    throw new Error(error.message || 'Failed to search users');
  }
}

/**
 * Get multiple users by IDs
 */
export async function getUsersByIds(userIds: string[]): Promise<User[]> {
  try {
    const users: User[] = [];
    
    // Fetch users in parallel
    const promises = userIds.map(async (id) => {
      const userDoc = await getDoc(doc(db, 'users', id));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          id: userDoc.id,
          email: data.email,
          displayName: data.displayName,
          photoURL: data.photoURL,
          timeZone: data.timeZone,
          workHours: data.workHours,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      }
      return null;
    });

    const results = await Promise.all(promises);
    return results.filter((user): user is User => user !== null);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    throw new Error(error.message || 'Failed to fetch users');
  }
}

