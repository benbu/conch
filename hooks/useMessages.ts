// Custom hook for messages
import { useCallback, useEffect, useState } from 'react';
import { cacheMessages, getCachedMessages } from '../services/cacheService';
import {
    sendMessage as sendMessageToFirestore,
    subscribeToMessages,
    updateMessageStatus,
} from '../services/firestoreService';
import { createOptimisticMessage } from '../services/messages/messageFactory';
import { selectUser, useAuthStore } from '../stores/authStore';
import {
    selectMessageLoading,
    selectMessages,
    useChatStore,
} from '../stores/chatStore';
import { Message } from '../types';
import { useOfflineQueue } from './useOfflineQueue';

// Stable references to avoid infinite loops when no conversationId is provided
const EMPTY_MESSAGES: Message[] = [];
const FALSE_CONST = false;
const selectEmptyMessages = () => EMPTY_MESSAGES;
const selectFalse = () => FALSE_CONST;

export function useMessages(conversationId: string | null) {
  const user = useAuthStore(selectUser);
  const messages = useChatStore(
    conversationId ? selectMessages(conversationId) : selectEmptyMessages
  );
  const loading = useChatStore(
    conversationId ? selectMessageLoading(conversationId) : selectFalse
  );
  const setMessages = useChatStore((s) => s.setMessages);
  const addMessage = useChatStore((s) => s.addMessage);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const setMessageLoading = useChatStore((s) => s.setMessageLoading);
  const { queueMessage, isConnected } = useOfflineQueue();
  // Placeholder for translations hook integration in a follow-up edit

  // Local pagination state (separate from initial loading)
  const PAGE_SIZE = 50;
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Load cached messages first, then subscribe to real-time updates
  useEffect(() => {
    if (!conversationId || !user) {
      return;
    }

    // Load from cache immediately
    getCachedMessages(conversationId).then(cachedMessages => {
      if (cachedMessages && cachedMessages.length > 0) {
        setMessages(conversationId, cachedMessages);
      }
    });

    setMessageLoading(conversationId, true);

    const unsubscribe = subscribeToMessages(conversationId, (messages) => {
      setMessages(conversationId, messages);
      setMessageLoading(conversationId, false);
      
      // Cache messages for offline access
      cacheMessages(conversationId, messages);
    });

    return () => unsubscribe();
  }, [conversationId, user, setMessages, setMessageLoading]);

  const sendMessage = useCallback(
    async (text: string, attachments?: any[]) => {
      if (!conversationId || !user) {
        throw new Error('Conversation ID and user required');
      }

      try {
        // If offline, queue the message
        if (!isConnected) {
          await queueMessage(conversationId, text, attachments);
          return 'queued';
        }

        // Create optimistic message
        const optimisticMessage = createOptimisticMessage(conversationId, user, text, attachments);

        // Add optimistic message to store
        addMessage(conversationId, optimisticMessage);

        // Send to Firestore
        const messageId = await sendMessageToFirestore(
          conversationId,
          user.id,
          text,
          attachments
        );

        // Update with real ID
        const sentMessage: Message = {
          ...optimisticMessage,
          id: messageId,
          deliveryStatus: 'sent',
          localId: undefined,
        };

        addMessage(conversationId, sentMessage);

        return messageId;
      } catch (error: any) {
        console.error('Error sending message:', error);
        
        // If failed while online, queue it for retry
        if (isConnected) {
          await queueMessage(conversationId, text, attachments);
        }
        
        throw error;
      }
    },
    [conversationId, user, addMessage, isConnected, queueMessage]
  );

  const markAsRead = useCallback(
    async (messageId: string) => {
      if (!conversationId) return;

      try {
        await updateMessageStatus(conversationId, messageId, 'read');
        updateMessage(conversationId, messageId, { deliveryStatus: 'read' });
      } catch (error: any) {
        console.error('Error marking message as read:', error);
      }
    },
    [conversationId, updateMessage]
  );

  const loadMoreMessages = useCallback(async () => {
    if (!conversationId) return 0;
    if (loadingMore) return 0;
    if (!hasMore) return 0;
    if (messages.length === 0) return 0;

    try {
      setLoadingMore(true);

      // Get oldest message date
      const oldestMessage = messages[0];
      const { getMessagesBefore } = await import('../services/firestoreService');
      const olderMessages = await getMessagesBefore(
        conversationId,
        oldestMessage.createdAt,
        PAGE_SIZE
      );

      if (olderMessages.length > 0) {
        const allMessages = [...olderMessages, ...messages];
        setMessages(conversationId, allMessages);
        await cacheMessages(conversationId, allMessages);
      }

      if (olderMessages.length < PAGE_SIZE) {
        setHasMore(false);
      }

      setLoadingMore(false);
      return olderMessages.length;
    } catch (error) {
      console.error('Error loading more messages:', error);
      setLoadingMore(false);
      return 0;
    }
  }, [conversationId, messages, hasMore, loadingMore, setMessages]);

  return {
    messages,
    loading,
    loadingMore,
    hasMore,
    sendMessage,
    markAsRead,
    loadMoreMessages,
  };
}

