// Offline message queue service
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueuedMessage } from '../types';

const QUEUE_KEY = '@conch_message_queue';
const MAX_RETRY_COUNT = 5;

/**
 * Get all queued messages
 */
export async function getQueuedMessages(): Promise<QueuedMessage[]> {
  try {
    const queueJson = await AsyncStorage.getItem(QUEUE_KEY);
    if (!queueJson) return [];
    return JSON.parse(queueJson);
  } catch (error) {
    console.error('Error reading message queue:', error);
    return [];
  }
}

/**
 * Add message to queue
 */
export async function addToQueue(message: Omit<QueuedMessage, 'retryCount' | 'lastAttempt'>): Promise<void> {
  try {
    const queue = await getQueuedMessages();
    const queuedMessage: QueuedMessage = {
      ...message,
      retryCount: 0,
      lastAttempt: new Date(),
    };
    queue.push(queuedMessage);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error adding to queue:', error);
    throw error;
  }
}

/**
 * Remove message from queue
 */
export async function removeFromQueue(localId: string): Promise<void> {
  try {
    const queue = await getQueuedMessages();
    const updatedQueue = queue.filter(msg => msg.localId !== localId);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updatedQueue));
  } catch (error) {
    console.error('Error removing from queue:', error);
    throw error;
  }
}

/**
 * Update message retry count
 */
export async function updateRetryCount(localId: string): Promise<void> {
  try {
    const queue = await getQueuedMessages();
    const updatedQueue = queue.map(msg => {
      if (msg.localId === localId) {
        return {
          ...msg,
          retryCount: msg.retryCount + 1,
          lastAttempt: new Date(),
        };
      }
      return msg;
    });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updatedQueue));
  } catch (error) {
    console.error('Error updating retry count:', error);
    throw error;
  }
}

/**
 * Get messages that should be retried
 */
export async function getRetryableMessages(): Promise<QueuedMessage[]> {
  try {
    const queue = await getQueuedMessages();
    const now = new Date().getTime();
    
    return queue.filter(msg => {
      // Don't retry if max attempts reached
      if (msg.retryCount >= MAX_RETRY_COUNT) {
        return false;
      }
      
      // Calculate backoff delay: 2^retryCount seconds
      const backoffDelay = Math.pow(2, msg.retryCount) * 1000;
      const lastAttemptTime = new Date(msg.lastAttempt).getTime();
      
      // Retry if enough time has passed
      return now - lastAttemptTime >= backoffDelay;
    });
  } catch (error) {
    console.error('Error getting retryable messages:', error);
    return [];
  }
}

/**
 * Clear failed messages that exceeded max retries
 */
export async function clearFailedMessages(): Promise<number> {
  try {
    const queue = await getQueuedMessages();
    const failedCount = queue.filter(msg => msg.retryCount >= MAX_RETRY_COUNT).length;
    const updatedQueue = queue.filter(msg => msg.retryCount < MAX_RETRY_COUNT);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updatedQueue));
    return failedCount;
  } catch (error) {
    console.error('Error clearing failed messages:', error);
    return 0;
  }
}

/**
 * Clear entire queue
 */
export async function clearQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(QUEUE_KEY);
  } catch (error) {
    console.error('Error clearing queue:', error);
    throw error;
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  total: number;
  pending: number;
  failed: number;
}> {
  try {
    const queue = await getQueuedMessages();
    return {
      total: queue.length,
      pending: queue.filter(msg => msg.retryCount < MAX_RETRY_COUNT).length,
      failed: queue.filter(msg => msg.retryCount >= MAX_RETRY_COUNT).length,
    };
  } catch (error) {
    console.error('Error getting queue stats:', error);
    return { total: 0, pending: 0, failed: 0 };
  }
}

