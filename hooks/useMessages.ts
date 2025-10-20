// Custom hook for messages
import { useCallback, useEffect } from 'react';
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

export function useMessages(conversationId: string | null) {
  const user = useAuthStore(selectUser);
  const messages = useChatStore(
    conversationId ? selectMessages(conversationId) : () => []
  );
  const loading = useChatStore(
    conversationId ? selectMessageLoading(conversationId) : () => false
  );
  const { setMessages, addMessage, updateMessage, setMessageLoading } = useChatStore();

  // Subscribe to messages when conversation is selected
  useEffect(() => {
    if (!conversationId || !user) {
      return;
    }

    setMessageLoading(conversationId, true);

    const unsubscribe = subscribeToMessages(conversationId, (messages) => {
      setMessages(conversationId, messages);
      setMessageLoading(conversationId, false);
    });

    return () => unsubscribe();
  }, [conversationId, user, setMessages, setMessageLoading]);

  const sendMessage = useCallback(
    async (text: string, attachments?: any[]) => {
      if (!conversationId || !user) {
        throw new Error('Conversation ID and user required');
      }

      try {
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
        
        // Update message status to failed
        // We'll keep the local message so user can retry
        throw error;
      }
    },
    [conversationId, user, addMessage]
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

  return {
    messages,
    loading,
    sendMessage,
    markAsRead,
  };
}

