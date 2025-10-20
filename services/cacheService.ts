// Cache service for offline data storage
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Conversation, Message, User } from '../types';

const CACHE_PREFIX = '@conch_cache_';
const CONVERSATIONS_KEY = `${CACHE_PREFIX}conversations`;
const MESSAGES_PREFIX = `${CACHE_PREFIX}messages_`;
const USER_PREFIX = `${CACHE_PREFIX}user_`;
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CachedData<T> {
  data: T;
  timestamp: number;
}

/**
 * Generic cache set function
 */
async function setCacheItem<T>(key: string, data: T): Promise<void> {
  try {
    const cachedData: CachedData<T> = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(cachedData));
  } catch (error) {
    console.error(`Error caching ${key}:`, error);
  }
}

/**
 * Generic cache get function
 */
async function getCacheItem<T>(key: string): Promise<T | null> {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const cachedData: CachedData<T> = JSON.parse(cached);
    
    // Check if cache is expired
    if (Date.now() - cachedData.timestamp > CACHE_EXPIRY) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return cachedData.data;
  } catch (error) {
    console.error(`Error reading cache ${key}:`, error);
    return null;
  }
}

// ===== Conversations =====

export async function cacheConversations(conversations: Conversation[]): Promise<void> {
  await setCacheItem(CONVERSATIONS_KEY, conversations);
}

export async function getCachedConversations(): Promise<Conversation[] | null> {
  return getCacheItem<Conversation[]>(CONVERSATIONS_KEY);
}

// ===== Messages =====

export async function cacheMessages(conversationId: string, messages: Message[]): Promise<void> {
  await setCacheItem(`${MESSAGES_PREFIX}${conversationId}`, messages);
}

export async function getCachedMessages(conversationId: string): Promise<Message[] | null> {
  return getCacheItem<Message[]>(`${MESSAGES_PREFIX}${conversationId}`);
}

// ===== Users =====

export async function cacheUser(userId: string, user: User): Promise<void> {
  await setCacheItem(`${USER_PREFIX}${userId}`, user);
}

export async function getCachedUser(userId: string): Promise<User | null> {
  return getCacheItem<User>(`${USER_PREFIX}${userId}`);
}

// ===== Utilities =====

/**
 * Clear all cached data
 */
export async function clearAllCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Clear expired cache items
 */
export async function clearExpiredCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    
    for (const key of cacheKeys) {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const cachedData: CachedData<any> = JSON.parse(cached);
        if (Date.now() - cachedData.timestamp > CACHE_EXPIRY) {
          await AsyncStorage.removeItem(key);
        }
      }
    }
  } catch (error) {
    console.error('Error clearing expired cache:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalItems: number;
  totalSize: number;
}> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    
    let totalSize = 0;
    for (const key of cacheKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        totalSize += new Blob([value]).size;
      }
    }

    return {
      totalItems: cacheKeys.length,
      totalSize,
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { totalItems: 0, totalSize: 0 };
  }
}

