/**
 * AI Service
 * Client-side service for calling AI Cloud Functions
 */

import { auth } from '../lib/firebase';
import {
    AIActions,
    AIDecision,
    AIPriority,
    AISummary,
} from '../types';

const FUNCTIONS_REGION = process.env.EXPO_PUBLIC_FUNCTIONS_REGION || 'us-central1';
const FIREBASE_PROJECT_ID = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
const DEFAULT_FUNCTIONS_BASE_URL = FIREBASE_PROJECT_ID
  ? `https://${FUNCTIONS_REGION}-${FIREBASE_PROJECT_ID}.cloudfunctions.net`
  : undefined;
const FUNCTIONS_BASE_URL = process.env.EXPO_PUBLIC_FUNCTIONS_URL || DEFAULT_FUNCTIONS_BASE_URL;

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
  if (!FUNCTIONS_BASE_URL) {
    throw new Error(
      'Cloud Functions base URL is not configured. Set EXPO_PUBLIC_FUNCTIONS_URL or EXPO_PUBLIC_FIREBASE_PROJECT_ID.'
    );
  }
  const token = await getAuthToken();

  const url = `${FUNCTIONS_BASE_URL}/${endpoint}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    // Prefer JSON error; otherwise include status/text snippet for easier debugging
    const errorJson = await response
      .json()
      .catch(async () => {
        const text = await response.text().catch(() => '');
        return { message: text?.slice(0, 200) || null };
      });
    const message =
      errorJson?.message || `HTTP ${response.status} ${response.statusText} at ${url}`;
    throw new Error(message);
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
 * Get AI response suggestions for the conversation
 */
export async function getResponseSuggestions(
  conversationId: string,
  options?: { lastMessagesN?: number }
): Promise<string[]> {
  return await callFunction<string[]>('aiSuggestResponses', {
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

