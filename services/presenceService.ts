// Presence tracking service using Firebase Realtime Database
import {
    get,
    onDisconnect,
    onValue,
    ref,
    set,
    update
} from 'firebase/database';
import { doc, updateDoc } from 'firebase/firestore';
import { PRESENCE_V2 } from '../constants/featureFlags';
import { getFirebaseDB, getFirebaseRealtimeDB } from '../lib/firebase';
import { UserPresence } from '../types';
import { cleanupPresenceRegistry, subscribeToPresence, subscribeToPresences } from './presence/PresenceRegistry';

const realtimeDb = getFirebaseRealtimeDB();
const firestoreDb = getFirebaseDB();

// Track active listeners for cleanup
const activeListeners = new Map<string, () => void>();

/**
 * Update user's presence status in Realtime Database
 */
export async function updatePresence(
  userId: string,
  status: UserPresence['status'],
  customStatus?: string
): Promise<void> {
  try {
    const presenceRef = ref(realtimeDb, `presence/${userId}`);
    const presenceData: Partial<UserPresence> = {
      status,
      lastSeen: Date.now(),
    };

    if (customStatus !== undefined) {
      presenceData.customStatus = customStatus || undefined;
    }

    await set(presenceRef, presenceData);
  } catch (error: any) {
    console.error('Error updating presence:', error);
    throw new Error(error.message || 'Failed to update presence');
  }
}

/**
 * Set "Appear Offline" preference in Firestore user document
 */
export async function setAppearOffline(
  userId: string,
  appearOffline: boolean
): Promise<void> {
  try {
    const userRef = doc(firestoreDb, 'users', userId);
    await updateDoc(userRef, {
      appearOffline,
      updatedAt: new Date(),
    });
  } catch (error: any) {
    console.error('Error setting appear offline:', error);
    throw new Error(error.message || 'Failed to update appear offline setting');
  }
}

/**
 * Subscribe to a single user's presence
 */
export function subscribeToUserPresence(
  userId: string,
  callback: (presence: UserPresence | null) => void
): () => void {
  if (PRESENCE_V2) {
    const unsub = subscribeToPresence(userId, callback);
    const listenerId = `single-${userId}`;
    activeListeners.set(listenerId, unsub);
    return () => {
      const u = activeListeners.get(listenerId);
      if (u) u();
      activeListeners.delete(listenerId);
    };
  }

  const presenceRef = ref(realtimeDb, `presence/${userId}`);
  const unsubscribe = onValue(
    presenceRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        callback({
          status: data.status || 'offline',
          lastSeen: data.lastSeen || Date.now(),
          customStatus: data.customStatus,
        });
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error subscribing to presence:', error);
      callback(null);
    }
  );
  const listenerId = `single-${userId}`;
  activeListeners.set(listenerId, unsubscribe);
  return () => {
    unsubscribe();
    activeListeners.delete(listenerId);
  };
}

/**
 * Subscribe to multiple users' presence efficiently
 */
export function subscribeToMultiplePresences(
  userIds: string[],
  callback: (presences: Record<string, UserPresence | null>) => void
): () => void {
  if (PRESENCE_V2) {
    const unsub = subscribeToPresences(userIds, callback);
    const listenerId = `multi-${userIds.join('-')}`;
    activeListeners.set(listenerId, unsub);
    return () => {
      const u = activeListeners.get(listenerId);
      if (u) u();
      activeListeners.delete(listenerId);
    };
  }

  const presences: Record<string, UserPresence | null> = {};
  const unsubscribers: (() => void)[] = [];
  userIds.forEach((userId) => {
    const unsubscribe = subscribeToUserPresence(userId, (presence) => {
      presences[userId] = presence;
      callback({ ...presences });
    });
    unsubscribers.push(unsubscribe);
  });
  const listenerId = `multi-${userIds.join('-')}`;
  activeListeners.set(listenerId, () => {
    unsubscribers.forEach((unsub) => unsub());
  });
  return () => {
    unsubscribers.forEach((unsub) => unsub());
    activeListeners.delete(listenerId);
  };
}

/**
 * Get user's current presence without subscribing
 */
export async function getUserPresence(userId: string): Promise<UserPresence | null> {
  try {
    const presenceRef = ref(realtimeDb, `presence/${userId}`);
    const snapshot = await get(presenceRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      return {
        status: data.status || 'offline',
        lastSeen: data.lastSeen || Date.now(),
        customStatus: data.customStatus,
      };
    }
    
    return null;
  } catch (error: any) {
    console.error('Error getting presence:', error);
    return null;
  }
}

/**
 * Start presence tracking for a user with automatic offline detection
 */
export async function startPresenceTracking(
  userId: string,
  appearOffline: boolean = false
): Promise<void> {
  try {
    const presenceRef = ref(realtimeDb, `presence/${userId}`);
    
    // Set user as online (unless appearOffline is true)
    const initialStatus: UserPresence = {
      status: appearOffline ? 'offline' : 'online',
      lastSeen: Date.now(),
    };

    await set(presenceRef, initialStatus);

    // Only set up onDisconnect if not appearing offline
    if (!appearOffline) {
      // Set up automatic offline status on disconnect
      await onDisconnect(presenceRef).set({
        status: 'offline',
        lastSeen: Date.now(),
      } as UserPresence);
    }

    console.log('✅ Presence tracking started for user:', userId);
  } catch (error: any) {
    console.error('Error starting presence tracking:', error);
    throw new Error(error.message || 'Failed to start presence tracking');
  }
}

/**
 * Stop presence tracking and set user offline
 */
export async function stopPresenceTracking(userId: string): Promise<void> {
  try {
    const presenceRef = ref(realtimeDb, `presence/${userId}`);
    
    // Cancel any pending onDisconnect operations
    await onDisconnect(presenceRef).cancel();
    
    // Set user as offline
    await set(presenceRef, {
      status: 'offline',
      lastSeen: Date.now(),
    } as UserPresence);

    // Clean up all active listeners for this user
    const listenersToRemove: string[] = [];
    activeListeners.forEach((_, key) => {
      if (key.includes(userId)) {
        listenersToRemove.push(key);
      }
    });

    listenersToRemove.forEach((key) => {
      const unsubscribe = activeListeners.get(key);
      if (unsubscribe) {
        unsubscribe();
        activeListeners.delete(key);
      }
    });

    console.log('✅ Presence tracking stopped for user:', userId);
  } catch (error: any) {
    console.error('Error stopping presence tracking:', error);
    throw new Error(error.message || 'Failed to stop presence tracking');
  }
}

/**
 * Update user to "away" status
 */
export async function setUserAway(userId: string): Promise<void> {
  try {
    const presenceRef = ref(realtimeDb, `presence/${userId}`);
    await update(presenceRef, {
      status: 'away',
      lastSeen: Date.now(),
    });
  } catch (error: any) {
    console.error('Error setting user away:', error);
  }
}

/**
 * Update user to "online" status
 */
export async function setUserOnline(userId: string): Promise<void> {
  try {
    const presenceRef = ref(realtimeDb, `presence/${userId}`);
    await update(presenceRef, {
      status: 'online',
      lastSeen: Date.now(),
    });
  } catch (error: any) {
    console.error('Error setting user online:', error);
  }
}

/**
 * Update custom status message
 */
export async function updateCustomStatus(
  userId: string,
  customStatus?: string
): Promise<void> {
  try {
    const presenceRef = ref(realtimeDb, `presence/${userId}`);
    await update(presenceRef, {
      customStatus: customStatus || null,
      lastSeen: Date.now(),
    });
  } catch (error: any) {
    console.error('Error updating custom status:', error);
    throw new Error(error.message || 'Failed to update custom status');
  }
}

/**
 * Clean up all active presence listeners
 */
export function cleanupAllPresenceListeners(): void {
  activeListeners.forEach((unsubscribe) => {
    unsubscribe();
  });
  activeListeners.clear();
  if (PRESENCE_V2) {
    cleanupPresenceRegistry();
  }
  console.log('✅ All presence listeners cleaned up');
}

