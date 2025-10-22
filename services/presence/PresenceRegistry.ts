import { onValue, ref } from 'firebase/database';
import { getFirebaseRealtimeDB } from '../../lib/firebase';
import { UserPresence } from '../../types';

type Unsubscribe = () => void;

interface PresenceEntry {
  subscribers: Set<(presence: UserPresence | null) => void>;
  unsubscribe?: Unsubscribe;
  lastValue?: UserPresence | null;
}

const realtimeDb = getFirebaseRealtimeDB();
const registry = new Map<string, PresenceEntry>();

export function subscribeToPresence(userId: string, cb: (presence: UserPresence | null) => void): Unsubscribe {
  let entry = registry.get(userId);
  if (!entry) {
    entry = { subscribers: new Set() };
    registry.set(userId, entry);
    const r = ref(realtimeDb, `presence/${userId}`);
    entry.unsubscribe = onValue(
      r,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          entry!.lastValue = {
            status: data.status || 'offline',
            lastSeen: data.lastSeen || Date.now(),
            customStatus: data.customStatus,
          };
        } else {
          entry!.lastValue = null;
        }
        entry!.subscribers.forEach((fn) => fn(entry!.lastValue!));
      },
      () => {
        entry!.lastValue = null;
        entry!.subscribers.forEach((fn) => fn(null));
      }
    );
  }

  // Immediately deliver last known value if present
  if (entry.lastValue !== undefined) {
    cb(entry.lastValue);
  }

  entry.subscribers.add(cb);

  return () => {
    const e = registry.get(userId);
    if (!e) return;
    e.subscribers.delete(cb);
    if (e.subscribers.size === 0) {
      if (e.unsubscribe) e.unsubscribe();
      registry.delete(userId);
    }
  };
}

export function subscribeToPresences(
  userIds: string[],
  callback: (presences: Record<string, UserPresence | null>) => void
): Unsubscribe {
  const presences: Record<string, UserPresence | null> = {};
  const unsubs = userIds.map((id) =>
    subscribeToPresence(id, (p) => {
      presences[id] = p;
      callback({ ...presences });
    })
  );
  return () => unsubs.forEach((u) => u());
}

export function cleanupPresenceRegistry(): void {
  registry.forEach((e) => e.unsubscribe && e.unsubscribe());
  registry.clear();
}


