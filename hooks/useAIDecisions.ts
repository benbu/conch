/**
 * useAIDecisions Hook
 * Hook for tracking and managing decisions
 */

import { useCallback, useEffect, useState } from 'react';
import { aiCacheService, trackDecisions } from '../services/aiService';
import { AIDecision } from '../types';

interface UseAIDecisionsOptions {
  messageLimit?: number;
  dateRange?: {
    start: Date;
    end: Date;
  };
  autoLoad?: boolean;
}

export function useAIDecisions(
  conversationId: string | null,
  options?: UseAIDecisionsOptions
) {
  const [decisions, setDecisions] = useState<AIDecision[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load cached decisions
   */
  const loadCached = useCallback(async () => {
    if (!conversationId) return;

    const cacheKey = aiCacheService.decisionsKey(conversationId);
    const cached = await aiCacheService.get<AIDecision[]>(cacheKey);
    
    if (cached) {
      setDecisions(cached);
    }
  }, [conversationId]);

  /**
   * Track new decisions
   */
  const refresh = useCallback(async () => {
    if (!conversationId) return;

    setLoading(true);
    setError(null);

    try {
      const newDecisions = await trackDecisions(conversationId, {
        messageLimit: options?.messageLimit,
        dateRange: options?.dateRange,
      });

      setDecisions(newDecisions);

      // Cache the result
      const cacheKey = aiCacheService.decisionsKey(conversationId);
      await aiCacheService.set(cacheKey, newDecisions);
    } catch (err: any) {
      console.error('Error tracking decisions:', err);
      setError(err.message || 'Failed to track decisions');
    } finally {
      setLoading(false);
    }
  }, [conversationId, options?.messageLimit, options?.dateRange]);

  /**
   * Clear decisions
   */
  const clear = useCallback(async () => {
    setDecisions([]);
    if (conversationId) {
      const cacheKey = aiCacheService.decisionsKey(conversationId);
      await aiCacheService.clear(cacheKey);
    }
  }, [conversationId]);

  /**
   * Load cached decisions on mount if autoLoad is enabled
   */
  useEffect(() => {
    if (options?.autoLoad) {
      loadCached();
    }
  }, [loadCached, options?.autoLoad]);

  return {
    decisions,
    loading,
    error,
    refresh,
    clear,
    loadCached,
  };
}

