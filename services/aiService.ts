/**
 * AI Service
 * Client-side service for calling AI Cloud Functions
 */

import { auth } from '../lib/firebase';
import {
  AISummary,
  AIActions,
  AIDecision,
  AIPriority,
} from '../types';

const FUNCTIONS_BASE_URL = process.env.EXPO_PUBLIC_FUNCTIONS_URL || 'https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net';

interface AIRequestOptions {
  messageLimit?: number;
  dateRange?: {
    start: Date;
    end: Date;
  };
  minScore?: number;
}

/**
 * Get auth token for authenticated requests
 */
async function getAuthToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return await user.getIdToken();
}

/**
 * Make authenticated request to Cloud Function
 */
async function callFunction<T>(
  endpoint: string,
  data: any
): Promise<T> {
  const token = await getAuthToken();

  const response = await fetch(`${FUNCTIONS_BASE_URL}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Generate thread summary
 */
export async function generateSummary(
  conversationId: string,
  options?: AIRequestOptions
): Promise<AISummary> {
  return await callFunction<AISummary>('aiSummarizeThread', {
    conversationId,
    options,
  });
}

/**
 * Extract action items from conversation
 */
export async function extractActions(
  conversationId: string,
  options?: AIRequestOptions
): Promise<AIActions> {
  return await callFunction<AIActions>('aiExtractActions', {
    conversationId,
    options,
  });
}

/**
 * Track decisions in conversation
 */
export async function trackDecisions(
  conversationId: string,
  options?: AIRequestOptions
): Promise<AIDecision[]> {
  return await callFunction<AIDecision[]>('aiTrackDecision', {
    conversationId,
    options,
  });
}

/**
 * Detect priority messages
 */
export async function detectPriority(
  conversationId: string,
  options?: AIRequestOptions
): Promise<AIPriority> {
  return await callFunction<AIPriority>('aiDetectPriority', {
    conversationId,
    options,
  });
}

/**
 * Cache AI results in AsyncStorage
 */
export const aiCacheService = {
  /**
   * Cache key generators
   */
  summaryKey: (conversationId: string) => `ai_summary_${conversationId}`,
  actionsKey: (conversationId: string) => `ai_actions_${conversationId}`,
  decisionsKey: (conversationId: string) => `ai_decisions_${conversationId}`,
  priorityKey: (conversationId: string) => `ai_priority_${conversationId}`,

  /**
   * Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const parsed = JSON.parse(cached);
      // Check if cache is less than 1 hour old
      const age = Date.now() - parsed.timestamp;
      if (age > 60 * 60 * 1000) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.error('Error getting cached AI data:', error);
      return null;
    }
  },

  /**
   * Set cached data
   */
  async set<T>(key: string, data: T): Promise<void> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching AI data:', error);
    }
  },

  /**
   * Clear cached data
   */
  async clear(key: string): Promise<void> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing cached AI data:', error);
    }
  },
};

