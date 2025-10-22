// Firestore service for conversations and messages
import {
  addDoc,
  arrayRemove,
  arrayUnion,
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
  type: 'direct' | 'group' = 'direct',
  name?: string
): Promise<string> {
  try {
    // Create members array with roles
    // Note: Using new Date() instead of serverTimestamp() because Firestore doesn't support serverTimestamp() in arrays
    const now = new Date();
    const members = participantIds.map((userId) => ({
      userId,
      role: userId === createdBy ? 'admin' : 'user',
      joinedAt: now,
    }));

    const conversationData: any = {
      title: title || null,
      name: name || null,
      type,
      participantIds,
      members,
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
        name: data.name,
        type: data.type,
        participantIds: data.participantIds,
        members: data.members?.map((m: any) => ({
          userId: m.userId,
          role: m.role,
          joinedAt: m.joinedAt?.toDate?.() || new Date(),
        })),
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
        name: data.name,
        type: data.type,
        participantIds: data.participantIds,
        members: data.members?.map((m: any) => ({
          userId: m.userId,
          role: m.role,
          joinedAt: m.joinedAt?.toDate?.() || new Date(),
        })),
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
          readBy: data.readBy
            ? Object.fromEntries(
                Object.entries(data.readBy).map(([k, v]: any) => [k, v?.toDate ? v.toDate() : v])
              )
            : undefined,
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
          readBy: data.readBy
            ? Object.fromEntries(
                Object.entries(data.readBy).map(([k, v]: any) => [k, v?.toDate ? v.toDate() : v])
              )
            : undefined,
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
        readBy: data.readBy
          ? Object.fromEntries(
              Object.entries(data.readBy).map(([k, v]: any) => [k, v?.toDate ? v.toDate() : v])
            )
          : undefined,
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
    return results.filter((user) => user !== null) as User[];
  } catch (error: any) {
    console.error('Error fetching users:', error);
    throw new Error(error.message || 'Failed to fetch users');
  }
}

// ===== Group Member Management =====

/**
 * Update conversation name (group chats only)
 */
export async function updateConversationName(
  conversationId: string,
  name: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'conversations', conversationId), {
      name,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error updating conversation name:', error);
    throw new Error(error.message || 'Failed to update conversation name');
  }
}

/**
 * Add a member to a conversation
 */
export async function addMemberToConversation(
  conversationId: string,
  userId: string,
  role: 'admin' | 'team' | 'user' = 'user'
): Promise<void> {
  try {
    // Note: Using new Date() instead of serverTimestamp() because Firestore doesn't support serverTimestamp() in arrays
    const newMember = {
      userId,
      role,
      joinedAt: new Date(),
    };

    await updateDoc(doc(db, 'conversations', conversationId), {
      participantIds: arrayUnion(userId),
      members: arrayUnion(newMember),
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error adding member:', error);
    throw new Error(error.message || 'Failed to add member');
  }
}

/**
 * Update a member's role in a conversation
 */
export async function updateMemberRole(
  conversationId: string,
  userId: string,
  newRole: 'admin' | 'team' | 'user'
): Promise<void> {
  try {
    // Get current conversation
    const convDoc = await getDoc(doc(db, 'conversations', conversationId));
    if (!convDoc.exists()) {
      throw new Error('Conversation not found');
    }

    const data = convDoc.data();
    const members = data.members || [];
    
    // Update the specific member's role
    const updatedMembers = members.map((m: any) =>
      m.userId === userId ? { ...m, role: newRole } : m
    );

    await updateDoc(doc(db, 'conversations', conversationId), {
      members: updatedMembers,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error updating member role:', error);
    throw new Error(error.message || 'Failed to update member role');
  }
}

/**
 * Remove a member from a conversation
 */
export async function removeMemberFromConversation(
  conversationId: string,
  userId: string
): Promise<void> {
  try {
    // Get current conversation
    const convDoc = await getDoc(doc(db, 'conversations', conversationId));
    if (!convDoc.exists()) {
      throw new Error('Conversation not found');
    }

    const data = convDoc.data();
    const members = data.members || [];
    
    // Remove the member
    const updatedMembers = members.filter((m: any) => m.userId !== userId);

    await updateDoc(doc(db, 'conversations', conversationId), {
      participantIds: arrayRemove(userId),
      members: updatedMembers,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error removing member:', error);
    throw new Error(error.message || 'Failed to remove member');
  }
}

/**
 * Get a user's role in a conversation
 */
export async function getUserRole(
  conversationId: string,
  userId: string
): Promise<'admin' | 'team' | 'user' | null> {
  try {
    const convDoc = await getDoc(doc(db, 'conversations', conversationId));
    if (!convDoc.exists()) {
      return null;
    }

    const data = convDoc.data();
    const members = data.members || [];
    const member = members.find((m: any) => m.userId === userId);
    
    return member?.role || null;
  } catch (error: any) {
    console.error('Error getting user role:', error);
    return null;
  }
}

