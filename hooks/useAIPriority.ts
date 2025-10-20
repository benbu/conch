/**
 * useAIPriority Hook
 * Hook for detecting priority messages
 */

import { useState, useEffect, useCallback } from 'react';
import { detectPriority, aiCacheService } from '../services/aiService';
import { AIPriority } from '../types';

interface UseAIPriorityOptions {
  messageLimit?: number;
  dateRange?: {
    start: Date;
    end: Date;
  };
  minScore?: number;
  autoLoad?: boolean;
}

export function useAIPriority(
  conversationId: string | null,
  options?: UseAIPriorityOptions
) {
  const [priority, setPriority] = useState<AIPriority | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load cached priority data
   */
  const loadCached = useCallback(async () => {
    if (!conversationId) return;

    const cacheKey = aiCacheService.priorityKey(conversationId);
    const cached = await aiCacheService.get<AIPriority>(cacheKey);
    
    if (cached) {
      setPriority(cached);
    }
  }, [conversationId]);

  /**
   * Detect priority messages
   */
  const refresh = useCallback(async () => {
    if (!conversationId) return;

    setLoading(true);
    setError(null);

    try {
      const newPriority = await detectPriority(conversationId, {
        messageLimit: options?.messageLimit,
        dateRange: options?.dateRange,
        minScore: options?.minScore,
      });

      setPriority(newPriority);

      // Cache the result
      const cacheKey = aiCacheService.priorityKey(conversationId);
      await aiCacheService.set(cacheKey, newPriority);
    } catch (err: any) {
      console.error('Error detecting priority:', err);
      setError(err.message || 'Failed to detect priority');
    } finally {
      setLoading(false);
    }
  }, [conversationId, options?.messageLimit, options?.dateRange, options?.minScore]);

  /**
   * Clear priority data
   */
  const clear = useCallback(async () => {
    setPriority(null);
    if (conversationId) {
      const cacheKey = aiCacheService.priorityKey(conversationId);
      await aiCacheService.clear(cacheKey);
    }
  }, [conversationId]);

  /**
   * Check if a message is priority
   */
  const isPriorityMessage = useCallback((messageId: string): boolean => {
    if (!priority) return false;
    return priority.priorityMessages.some(pm => pm.messageId === messageId);
  }, [priority]);

  /**
   * Get priority score for a message
   */
  const getPriorityScore = useCallback((messageId: string): number | null => {
    if (!priority) return null;
    const priorityMsg = priority.priorityMessages.find(pm => pm.messageId === messageId);
    return priorityMsg?.score ?? null;
  }, [priority]);

  /**
   * Load cached priority on mount if autoLoad is enabled
   */
  useEffect(() => {
    if (options?.autoLoad) {
      loadCached();
    }
  }, [loadCached, options?.autoLoad]);

  return {
    priority,
    loading,
    error,
    refresh,
    clear,
    loadCached,
    isPriorityMessage,
    getPriorityScore,
  };
}

