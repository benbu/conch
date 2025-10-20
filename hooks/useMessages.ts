// Custom hook for messages
import { useCallback, useEffect } from 'react';
import { cacheMessages, getCachedMessages } from '../services/cacheService';
import {
    sendMessage as sendMessageToFirestore,
    subscribeToMessages,
    updateMessageStatus,
} from '../services/firestoreService';
import { selectUser, useAuthStore } from '../stores/authStore';
import {
    selectMessageLoading,
    selectMessages,
    useChatStore,
} from '../stores/chatStore';
import { Message } from '../types';
import { useOfflineQueue } from './useOfflineQueue';

export function useMessages(conversationId: string | null) {
  const user = useAuthStore(selectUser);
  const messages = useChatStore(
    conversationId ? selectMessages(conversationId) : () => []
  );
  const loading = useChatStore(
    conversationId ? selectMessageLoading(conversationId) : () => false
  );
  const { setMessages, addMessage, updateMessage, setMessageLoading } = useChatStore();
  const { queueMessage, isConnected } = useOfflineQueue();

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
        const localId = `local-${Date.now()}`;
        const optimisticMessage: Message = {
          id: localId,
          conversationId,
          senderId: user.id,
          sender: user,
          text,
          attachments: attachments || [],
          deliveryStatus: 'sending',
          createdAt: new Date(),
          localId,
        };

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
    if (!conversationId || loading || messages.length === 0) return;

    try {
      setMessageLoading(conversationId, true);
      
      // Get oldest message date
      const oldestMessage = messages[0];
      const { getMessagesBefore } = await import('../services/firestoreService');
      const olderMessages = await getMessagesBefore(conversationId, oldestMessage.createdAt);
      
      if (olderMessages.length > 0) {
        const allMessages = [...olderMessages, ...messages];
        setMessages(conversationId, allMessages);
        await cacheMessages(conversationId, allMessages);
      }
      
      setMessageLoading(conversationId, false);
      return olderMessages.length;
    } catch (error) {
      console.error('Error loading more messages:', error);
      setMessageLoading(conversationId, false);
      return 0;
    }
  }, [conversationId, messages, loading, setMessages, setMessageLoading]);

  return {
    messages,
    loading,
    sendMessage,
    markAsRead,
    loadMoreMessages,
  };
}

