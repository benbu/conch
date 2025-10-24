import { PRESENCE_LOGGING } from '@/constants/featureFlags';
import { setUserAway, setUserOnline, updatePresence } from '@/services/presenceService';
import { selectUser, useAuthStore } from '@/stores/authStore';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Keyboard } from 'react-native';

// Activity-gated heartbeat configuration
const HEARTBEAT_INTERVAL_MS = 15 * 1000; // 15s
const SCHEDULER_TICK_MS = 5 * 1000; // 5s check cadence
const AWAY_AFTER_MS = 5 * 60 * 1000; // 5 minutes

// Simple global activity emitter so any component can signal interaction
type ActivitySubscriber = () => void;
const activitySubscribers = new Set<ActivitySubscriber>();

export function emitPresenceActivity(): void {
  activitySubscribers.forEach((fn) => {
    try {
      fn();
    } catch {}
  });
}

/**
 * Centralized presence heartbeat with activity gating.
 * - Sends at most one heartbeat per 15s
 * - Only sends if there has been activity within the last 15s
 * - Sets away after 5 minutes of inactivity
 * - Sets offline immediately on background
 */
export function usePresenceHeartbeat(
  providedUserId?: string,
  providedAppearOffline?: boolean
): void {
  const user = useAuthStore(selectUser);
  const userId = providedUserId ?? user?.id;
  const appearOffline = providedAppearOffline ?? user?.appearOffline ?? false;

  const appState = useRef<AppStateStatus>(AppState.currentState);
  const lastInteractionAtRef = useRef<number>(0);
  const lastHeartbeatAtRef = useRef<number>(0);
  const schedulerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const awayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle a user interaction signal
  const handleActivity = () => {
    if (!userId || appearOffline) return;
    const now = Date.now();
    lastInteractionAtRef.current = now;
    if (PRESENCE_LOGGING) {
      console.log('[presence] activity', { userId, now });
    }
    // Immediate heartbeat if window elapsed
    if (now - lastHeartbeatAtRef.current >= HEARTBEAT_INTERVAL_MS) {
      sendHeartbeat(userId);
    }
    resetAwayTimer(userId);
  };

  // Send a heartbeat if allowed
  const sendHeartbeat = async (uid: string) => {
    try {
      if (appearOffline) return;
      const now = Date.now();
      // Only if there was interaction within last 15s
      if (now - lastInteractionAtRef.current <= HEARTBEAT_INTERVAL_MS) {
        if (PRESENCE_LOGGING) {
          console.log('[presence] heartbeat → online', { uid, now });
        }
        await setUserOnline(uid);
        lastHeartbeatAtRef.current = now;
      }
    } catch (e) {
      if (PRESENCE_LOGGING) {
        console.warn('[presence] heartbeat error', e);
      }
    }
  };

  const resetAwayTimer = (uid: string) => {
    if (awayTimerRef.current) clearTimeout(awayTimerRef.current);
    if (!uid || appearOffline) return;
    awayTimerRef.current = setTimeout(() => {
      const now = Date.now();
      if (now - lastInteractionAtRef.current >= AWAY_AFTER_MS) {
        setUserAway(uid).catch(() => {});
      }
    }, AWAY_AFTER_MS);
  };

  const startScheduler = (uid: string) => {
    if (schedulerRef.current) return;
    if (PRESENCE_LOGGING) {
      console.log('[presence] scheduler:start', { uid });
    }
    schedulerRef.current = setInterval(() => {
      const now = Date.now();
      // Only send if there's newer interaction not yet heartbeated and 15s window elapsed
      if (
        lastInteractionAtRef.current > lastHeartbeatAtRef.current &&
        now - lastHeartbeatAtRef.current >= HEARTBEAT_INTERVAL_MS
      ) {
        sendHeartbeat(uid);
      }
    }, SCHEDULER_TICK_MS);
  };

  const stopScheduler = () => {
    if (schedulerRef.current) {
      clearInterval(schedulerRef.current);
      schedulerRef.current = null;
      if (PRESENCE_LOGGING) {
        console.log('[presence] scheduler:stop');
      }
    }
  };

  useEffect(() => {
    if (!userId) return;

    // Subscribe to global activity signals
    activitySubscribers.add(handleActivity);

    // Keyboard activity is a good proxy for interaction
    const showSub = Keyboard.addListener('keyboardDidShow', () => handleActivity());
    const hideSub = Keyboard.addListener('keyboardDidHide', () => handleActivity());

    // AppState to manage scheduler and offline transition
    const appStateSub = AppState.addEventListener('change', async (nextState) => {
      if (!userId) return;

      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        // Foreground: begin scheduler; do not auto-heartbeat unless recent activity
        if (PRESENCE_LOGGING) {
          console.log('[presence] appstate:active');
        }
        startScheduler(userId);
        resetAwayTimer(userId);
      }

      if (appState.current === 'active' && nextState.match(/inactive|background/)) {
        // Background: stop scheduler and set offline immediately
        if (PRESENCE_LOGGING) {
          console.log('[presence] appstate:background → offline');
        }
        stopScheduler();
        if (!appearOffline) {
          await updatePresence(userId, 'offline').catch(() => {});
        }
        if (awayTimerRef.current) {
          clearTimeout(awayTimerRef.current);
          awayTimerRef.current = null;
        }
      }

      appState.current = nextState;
    });

    // If currently active, start scheduler
    if (appState.current === 'active' && !appearOffline) {
      if (PRESENCE_LOGGING) {
        console.log('[presence] init:active');
      }
      startScheduler(userId);
    }

    return () => {
      activitySubscribers.delete(handleActivity);
      showSub.remove();
      hideSub.remove();
      appStateSub.remove();
      stopScheduler();
      if (awayTimerRef.current) clearTimeout(awayTimerRef.current);
      if (PRESENCE_LOGGING) {
        console.log('[presence] cleanup');
      }
    };
  }, [userId, appearOffline]);
}


