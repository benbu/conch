// Hook for managing offline message queue
import { useCallback, useEffect } from 'react';
import { sendMessage as sendMessageToFirestore } from '../services/firestoreService';
import { createOptimisticMessage } from '../services/messages/messageFactory';
import {
  addToQueue,
  getQueueStats,
  getRetryableMessages,
  removeFromQueue,
  updateRetryCount,
} from '../services/offlineQueueService';
import { selectUser, useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { useNetworkStatus } from './useNetworkStatus';

export function useOfflineQueue() {
  const { isConnected } = useNetworkStatus();
  const user = useAuthStore(selectUser);
  const { addMessage, updateMessage } = useChatStore();

  /**
   * Process the offline queue
   */
  const processQueue = useCallback(async () => {
    if (!isConnected || !user) return;

    try {
      const retryableMessages = await getRetryableMessages();
      
      for (const queuedMessage of retryableMessages) {
        try {
          // Attempt to send the message
          const messageId = await sendMessageToFirestore(
            queuedMessage.message.conversationId,
            queuedMessage.message.senderId,
            queuedMessage.message.text,
            queuedMessage.message.attachments
          );

          // Success - remove from queue and update UI
          await removeFromQueue(queuedMessage.localId);
          
          updateMessage(
            queuedMessage.message.conversationId,
            queuedMessage.localId,
            {
              id: messageId,
              deliveryStatus: 'sent',
            }
          );

          console.log(`✅ Successfully sent queued message: ${queuedMessage.localId}`);
        } catch (error) {
          // Failed - update retry count
          console.error(`❌ Failed to send queued message: ${queuedMessage.localId}`, error);
          await updateRetryCount(queuedMessage.localId);
          
          // Update UI to show failed status
          updateMessage(
            queuedMessage.message.conversationId,
            queuedMessage.localId,
            {
              deliveryStatus: 'failed',
            }
          );
        }
      }
    } catch (error) {
      console.error('Error processing queue:', error);
    }
  }, [isConnected, user, updateMessage]);

  /**
   * Queue a message for later sending
   */
  const queueMessage = useCallback(
    async (
      conversationId: string,
      text: string,
      attachments?: any[]
    ): Promise<string> => {
      if (!user) {
        throw new Error('User must be logged in');
      }

      const localId = `local-${Date.now()}-${Math.random()}`;
      
      await addToQueue({
        localId,
        message: {
          conversationId,
          senderId: user.id,
          text,
          attachments: attachments || [],
          deliveryStatus: 'sending',
          createdAt: new Date(),
        },
      });

      // Add optimistic message to UI using factory
      const optimistic = createOptimisticMessage(conversationId, user, text, attachments);
      addMessage(conversationId, { ...optimistic, id: localId, localId });

      return localId;
    },
    [user, addMessage]
  );

  /**
   * Get queue statistics
   */
  const getStats = useCallback(async () => {
    return await getQueueStats();
  }, []);

  // Process queue when connection is restored
  useEffect(() => {
    if (isConnected) {
      processQueue();
    }
  }, [isConnected, processQueue]);

  // Set up periodic queue processing (every 30 seconds when online)
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      processQueue();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isConnected, processQueue]);

  return {
    queueMessage,
    processQueue,
    getStats,
    isConnected,
  };
}

