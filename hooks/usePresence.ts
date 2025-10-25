// Custom hook for user presence (RTDB-backed reader)
import { subscribePresence } from '@/services/presenceSubscribeRegistry';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { UserPresence } from '../types';

/**
 * Hook to get a single user's presence
 */
export function useUserPresence(userId: string | undefined) {
  const [presence, setPresence] = useState<UserPresence | null>(null);
  const [loading, setLoading] = useState<boolean>(!!userId);

  useEffect(() => {
    if (!userId) {
      setPresence(null);
      setLoading(false);
      return;
    }
    const off = subscribePresence(userId, (val) => {
      if (val && typeof val === 'object') {
        setPresence({ status: val.online ? 'online' : 'offline', lastSeen: typeof val.lastSeen === 'number' ? val.lastSeen : 0 });
      } else {
        setPresence({ status: 'offline', lastSeen: 0 });
      }
      setLoading(false);
    });
    return () => off();
  }, [userId]);

  return { presence, loading };
}

/**
 * Hook to get multiple users' presence efficiently
 */
export function useMultiplePresences(userIds: string[]) {
  const stableIds = useMemo(() => Array.from(new Set(userIds)).filter(Boolean), [userIds.join('|')]);
  const [presences, setPresences] = useState<Record<string, UserPresence | null>>({});
  const [loading, setLoading] = useState<boolean>(stableIds.length > 0);

  useEffect(() => {
    if (stableIds.length === 0) {
      setPresences({});
      setLoading(false);
      return;
    }
    const unsubs: Array<() => void> = stableIds.map((id) =>
      subscribePresence(id, (val) => {
        setPresences((prev) => ({
          ...prev,
          [id]: val && typeof val === 'object'
            ? { status: val.online ? 'online' : 'offline', lastSeen: typeof val.lastSeen === 'number' ? val.lastSeen : 0 }
            : { status: 'offline', lastSeen: 0 },
        }));
      })
    );
    setLoading(false);
    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [stableIds]);

  return { presences, loading };
}

/**
 * Hook to update current user's presence and status
 */
export function useUpdatePresence() {
  const noopAsync = useCallback(async (..._args: any[]) => {}, []);
  return {
    updateStatus: noopAsync as (
      userId: string,
      status: UserPresence['status'],
      customStatus?: string
    ) => Promise<void>,
    setOnline: noopAsync as (userId: string) => Promise<void>,
    setAway: noopAsync as (userId: string) => Promise<void>,
    updateCustomStatus: noopAsync as (userId: string, customStatus?: string) => Promise<void>,
    setAppearOffline: noopAsync as (userId: string, appearOffline: boolean) => Promise<void>,
    updating: false,
    error: null as string | null,
  };
}

