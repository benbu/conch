// Custom hook for user presence (networking removed; always offline)
import { useCallback } from 'react';
import { UserPresence } from '../types';

/**
 * Hook to get a single user's presence
 */
export function useUserPresence(userId: string | undefined) {
  const presence: UserPresence | null = userId
    ? { status: 'offline', lastSeen: 0 }
    : null;
  return { presence, loading: false };
}

/**
 * Hook to get multiple users' presence efficiently
 */
export function useMultiplePresences(userIds: string[]) {
  const presences: Record<string, UserPresence | null> = Object.fromEntries(
    (userIds || []).map((id) => [id, { status: 'offline', lastSeen: 0 }])
  );
  return { presences, loading: false };
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

