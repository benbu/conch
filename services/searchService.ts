/**
 * Search Service
 * Global search functionality for messages and conversations
 */

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
export async function searchMessages(query: string): Promise<SearchResult[]> {
  try {
    const user = auth.currentUser;
    if (!user) return [];

    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];

    // Get all conversations user is part of
    const conversationsSnapshot = await db
      .collection('conversations')
      .where('participantIds', 'array-contains', user.uid)
      .get();

    const results: SearchResult[] = [];

    // Search in each conversation
    for (const conversationDoc of conversationsSnapshot.docs) {
      const conversation = conversationDoc.data() as Conversation;
      
      const messagesSnapshot = await db
        .collection('conversations')
        .doc(conversationDoc.id)
        .collection('messages')
        .orderBy('createdAt', 'desc')
        .limit(100) // Limit per conversation for performance
        .get();

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
export async function searchConversations(query: string): Promise<SearchResult[]> {
  try {
    const user = auth.currentUser;
    if (!user) return [];

    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];

    const conversationsSnapshot = await db
      .collection('conversations')
      .where('participantIds', 'array-contains', user.uid)
      .get();

    const results: SearchResult[] = [];

    for (const doc of conversationsSnapshot.docs) {
      const conversation = doc.data() as Conversation;
      
      if (conversation.title?.toLowerCase().includes(normalizedQuery)) {
        results.push({
          type: 'conversation',
          id: doc.id,
          data: {
            ...conversation,
            id: doc.id,
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
export async function searchUsers(query: string): Promise<SearchResult[]> {
  try {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];

    // Note: This is a simplified search. In production, use a proper search service like Algolia
    const usersSnapshot = await db
      .collection('users')
      .limit(20)
      .get();

    const results: SearchResult[] = [];

    for (const doc of usersSnapshot.docs) {
      const user = doc.data() as User;
      
      if (
        user.displayName?.toLowerCase().includes(normalizedQuery) ||
        user.email?.toLowerCase().includes(normalizedQuery)
      ) {
        results.push({
          type: 'user',
          id: doc.id,
          data: {
            ...user,
            id: doc.id,
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
export async function globalSearch(query: string): Promise<SearchResult[]> {
  const [messages, conversations, users] = await Promise.all([
    searchMessages(query),
    searchConversations(query),
    searchUsers(query),
  ]);

  return [...conversations, ...messages, ...users];
}

/**
 * Extract text highlights around search query
 */
function extractHighlights(text: string, query: string, contextLength = 50): string[] {
  const highlights: string[] = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  let index = lowerText.indexOf(lowerQuery);
  
  while (index !== -1) {
    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + query.length + contextLength);
    
    let highlight = text.substring(start, end);
    
    if (start > 0) highlight = '...' + highlight;
    if (end < text.length) highlight = highlight + '...';
    
    highlights.push(highlight);
    
    index = lowerText.indexOf(lowerQuery, index + 1);
    if (highlights.length >= 2) break; // Limit highlights
  }
  
  return highlights;
}

