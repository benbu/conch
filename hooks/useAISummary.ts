/**
 * useAISummary Hook
 * Hook for generating and managing conversation summaries
 */

import { useCallback, useEffect, useState } from 'react';
import { aiCacheService, generateSummary } from '../services/aiService';
import { AISummary } from '../types';

interface UseAISummaryOptions {
  messageLimit?: number;
  dateRange?: {
    start: Date;
    end: Date;
  };
  autoLoad?: boolean;
}

export function useAISummary(
  conversationId: string | null,
  options?: UseAISummaryOptions
) {
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load cached summary
   */
  const loadCached = useCallback(async () => {
    if (!conversationId) return;

    const cacheKey = aiCacheService.summaryKey(conversationId);
    const cached = await aiCacheService.get<AISummary>(cacheKey);
    
    if (cached) {
      setSummary(cached);
    }
  }, [conversationId]);

  /**
   * Generate new summary
   */
  const refresh = useCallback(async () => {
    if (!conversationId) return;

    setLoading(true);
    setError(null);

    try {
      const newSummary = await generateSummary(conversationId, {
        messageLimit: options?.messageLimit,
        dateRange: options?.dateRange,
      });

      setSummary(newSummary);

      // Cache the result
      const cacheKey = aiCacheService.summaryKey(conversationId);
      await aiCacheService.set(cacheKey, newSummary);
    } catch (err: any) {
      console.error('Error generating summary:', err);
      setError(err.message || 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  }, [conversationId, options?.messageLimit, options?.dateRange]);

  /**
   * Clear summary
   */
  const clear = useCallback(async () => {
    setSummary(null);
    if (conversationId) {
      const cacheKey = aiCacheService.summaryKey(conversationId);
      await aiCacheService.clear(cacheKey);
    }
  }, [conversationId]);

  /**
   * Load cached summary on mount if autoLoad is enabled
   */
  useEffect(() => {
    if (options?.autoLoad) {
      loadCached();
    }
  }, [loadCached, options?.autoLoad]);

  return {
    summary,
    loading,
    error,
    refresh,
    clear,
    loadCached,
  };
}

