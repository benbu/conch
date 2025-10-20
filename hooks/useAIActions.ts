/**
 * useAIActions Hook
 * Hook for extracting and managing action items
 */

import { useState, useEffect, useCallback } from 'react';
import { extractActions, aiCacheService } from '../services/aiService';
import { AIActions } from '../types';

interface UseAIActionsOptions {
  messageLimit?: number;
  dateRange?: {
    start: Date;
    end: Date;
  };
  autoLoad?: boolean;
}

export function useAIActions(
  conversationId: string | null,
  options?: UseAIActionsOptions
) {
  const [actions, setActions] = useState<AIActions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load cached actions
   */
  const loadCached = useCallback(async () => {
    if (!conversationId) return;

    const cacheKey = aiCacheService.actionsKey(conversationId);
    const cached = await aiCacheService.get<AIActions>(cacheKey);
    
    if (cached) {
      setActions(cached);
    }
  }, [conversationId]);

  /**
   * Extract new actions
   */
  const refresh = useCallback(async () => {
    if (!conversationId) return;

    setLoading(true);
    setError(null);

    try {
      const newActions = await extractActions(conversationId, {
        messageLimit: options?.messageLimit,
        dateRange: options?.dateRange,
      });

      setActions(newActions);

      // Cache the result
      const cacheKey = aiCacheService.actionsKey(conversationId);
      await aiCacheService.set(cacheKey, newActions);
    } catch (err: any) {
      console.error('Error extracting actions:', err);
      setError(err.message || 'Failed to extract actions');
    } finally {
      setLoading(false);
    }
  }, [conversationId, options?.messageLimit, options?.dateRange]);

  /**
   * Clear actions
   */
  const clear = useCallback(async () => {
    setActions(null);
    if (conversationId) {
      const cacheKey = aiCacheService.actionsKey(conversationId);
      await aiCacheService.clear(cacheKey);
    }
  }, [conversationId]);

  /**
   * Load cached actions on mount if autoLoad is enabled
   */
  useEffect(() => {
    if (options?.autoLoad) {
      loadCached();
    }
  }, [loadCached, options?.autoLoad]);

  return {
    actions,
    loading,
    error,
    refresh,
    clear,
    loadCached,
  };
}

