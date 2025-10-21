/**
 * Search Service
 * Global search functionality for messages and conversations
 */

import { collection, limit as firestoreLimit, getDocs, orderBy, query, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Conversation, Message, User } from '../types';

export interface SearchResult {
  type: 'message' | 'conversation' | 'user';
  id: string;
  data: Message | Conversation | User;
  conversationId?: string;
  conversationTitle?: string;
  highlights?: string[];
  timestamp?: Date;
}

/**
 * Search messages across all conversations
 */
export async function searchMessages(queryText: string): Promise<SearchResult[]> {
  try {
    const user = auth.currentUser;
    if (!user) return [];

    const normalizedQuery = queryText.toLowerCase().trim();
    if (!normalizedQuery) return [];

    // Get all conversations user is part of
    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', user.uid)
    );
    const conversationsSnapshot = await getDocs(conversationsQuery);

    const results: SearchResult[] = [];

    // Search in each conversation
    for (const conversationDoc of conversationsSnapshot.docs) {
      const conversation = conversationDoc.data() as Conversation;
      
      const messagesQuery = query(
        collection(db, 'conversations', conversationDoc.id, 'messages'),
        orderBy('createdAt', 'desc'),
        firestoreLimit(100) // Limit per conversation for performance
      );
      const messagesSnapshot = await getDocs(messagesQuery);

      for (const messageDoc of messagesSnapshot.docs) {
        const message = messageDoc.data() as Message;
        
        // Check if message text contains query
        if (message.text && message.text.toLowerCase().includes(normalizedQuery)) {
          results.push({
            type: 'message',
            id: messageDoc.id,
            conversationId: conversationDoc.id,
            conversationTitle: conversation.title || 'Chat',
            data: {
              ...message,
              id: messageDoc.id,
            } as Message,
            highlights: extractHighlights(message.text, normalizedQuery),
            timestamp: message.createdAt,
          });
        }
      }
    }

    // Sort by timestamp (most recent first)
    results.sort((a, b) => {
      const timeA = a.timestamp?.getTime() || 0;
      const timeB = b.timestamp?.getTime() || 0;
      return timeB - timeA;
    });

    return results;
  } catch (error) {
    console.error('Error searching messages:', error);
    return [];
  }
}

/**
 * Search conversations by title
 */
export async function searchConversations(queryText: string): Promise<SearchResult[]> {
  try {
    const user = auth.currentUser;
    if (!user) return [];

    const normalizedQuery = queryText.toLowerCase().trim();
    if (!normalizedQuery) return [];

    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', user.uid)
    );
    const conversationsSnapshot = await getDocs(conversationsQuery);

    const results: SearchResult[] = [];

    for (const docSnapshot of conversationsSnapshot.docs) {
      const conversation = docSnapshot.data() as Conversation;
      
      if (conversation.title?.toLowerCase().includes(normalizedQuery)) {
        results.push({
          type: 'conversation',
          id: docSnapshot.id,
          data: {
            ...conversation,
            id: docSnapshot.id,
          } as Conversation,
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error searching conversations:', error);
    return [];
  }
}

/**
 * Search users by name or email
 */
export async function searchUsers(queryText: string): Promise<SearchResult[]> {
  try {
    const normalizedQuery = queryText.toLowerCase().trim();
    if (!normalizedQuery) return [];

    // Note: This is a simplified search. In production, use a proper search service like Algolia
    const usersQuery = query(
      collection(db, 'users'),
      firestoreLimit(20)
    );
    const usersSnapshot = await getDocs(usersQuery);

    const results: SearchResult[] = [];

    for (const docSnapshot of usersSnapshot.docs) {
      const user = docSnapshot.data() as User;
      
      if (
        user.displayName?.toLowerCase().includes(normalizedQuery) ||
        user.email?.toLowerCase().includes(normalizedQuery)
      ) {
        results.push({
          type: 'user',
          id: docSnapshot.id,
          data: {
            ...user,
            id: docSnapshot.id,
          } as User,
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}

/**
 * Global search combining all types
 */
export async function globalSearch(queryText: string): Promise<SearchResult[]> {
  const [messages, conversations, users] = await Promise.all([
    searchMessages(queryText),
    searchConversations(queryText),
    searchUsers(queryText),
  ]);

  return [...conversations, ...messages, ...users];
}

/**
 * Extract text highlights around search query
 */
function extractHighlights(text: string, queryText: string, contextLength = 50): string[] {
  const highlights: string[] = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = queryText.toLowerCase();
  
  let index = lowerText.indexOf(lowerQuery);
  
  while (index !== -1) {
    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + queryText.length + contextLength);
    
    let highlight = text.substring(start, end);
    
    if (start > 0) highlight = '...' + highlight;
    if (end < text.length) highlight = highlight + '...';
    
    highlights.push(highlight);
    
    index = lowerText.indexOf(lowerQuery, index + 1);
    if (highlights.length >= 2) break; // Limit highlights
  }
  
  return highlights;
}

