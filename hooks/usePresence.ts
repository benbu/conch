// Custom hook for user presence
import { useCallback, useEffect, useState } from 'react';
import {
    setAppearOffline as setAppearOfflineService,
    setUserAway,
    setUserOnline,
    subscribeToMultiplePresences,
    subscribeToUserPresence,
    updateCustomStatus as updateCustomStatusService,
    updatePresence
} from '../services/presenceService';
import { UserPresence } from '../types';

/**
 * Hook to get a single user's presence
 */
export function useUserPresence(userId: string | undefined) {
  const [presence, setPresence] = useState<UserPresence | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setPresence(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToUserPresence(userId, (newPresence) => {
      setPresence(newPresence);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  return { presence, loading };
}

/**
 * Hook to get multiple users' presence efficiently
 */
export function useMultiplePresences(userIds: string[]) {
  const [presences, setPresences] = useState<Record<string, UserPresence | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userIds.length === 0) {
      setPresences({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToMultiplePresences(userIds, (newPresences) => {
      setPresences(newPresences);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [JSON.stringify(userIds.sort())]); // Stable dependency on sorted user IDs

  return { presences, loading };
}

/**
 * Hook to update current user's presence and status
 */
export function useUpdatePresence() {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = useCallback(
    async (userId: string, status: UserPresence['status'], customStatus?: string) => {
      try {
        setUpdating(true);
        setError(null);
        await updatePresence(userId, status, customStatus);
      } catch (err: any) {
        setError(err.message || 'Failed to update presence');
        throw err;
      } finally {
        setUpdating(false);
      }
    },
    []
  );

  const setOnline = useCallback(async (userId: string) => {
    try {
      setUpdating(true);
      setError(null);
      await setUserOnline(userId);
    } catch (err: any) {
      setError(err.message || 'Failed to set online status');
      throw err;
    } finally {
      setUpdating(false);
    }
  }, []);

  const setAway = useCallback(async (userId: string) => {
    try {
      setUpdating(true);
      setError(null);
      await setUserAway(userId);
    } catch (err: any) {
      setError(err.message || 'Failed to set away status');
      throw err;
    } finally {
      setUpdating(false);
    }
  }, []);

  const updateCustomStatus = useCallback(async (userId: string, customStatus?: string) => {
    try {
      setUpdating(true);
      setError(null);
      await updateCustomStatusService(userId, customStatus);
    } catch (err: any) {
      setError(err.message || 'Failed to update custom status');
      throw err;
    } finally {
      setUpdating(false);
    }
  }, []);

  const setAppearOffline = useCallback(async (userId: string, appearOffline: boolean) => {
    try {
      setUpdating(true);
      setError(null);
      await setAppearOfflineService(userId, appearOffline);
    } catch (err: any) {
      setError(err.message || 'Failed to update appear offline setting');
      throw err;
    } finally {
      setUpdating(false);
    }
  }, []);

  return {
    updateStatus,
    setOnline,
    setAway,
    updateCustomStatus,
    setAppearOffline,
    updating,
    error,
  };
}

