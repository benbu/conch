import { getFirebaseRealtimeDB } from '@/lib/firebase';
import { networkLog } from '@/lib/networkLogger';
import { onValue, ref } from 'firebase/database';

type Unsub = () => void;
type Callback = (presence: { online?: boolean; lastSeen?: number } | null) => void;

type Entry = {
  subs: Set<Callback>;
  last?: { online?: boolean; lastSeen?: number } | null;
  unsub?: Unsub;
};

const registry = new Map<string, Entry>();

export function subscribePresence(userId: string, cb: Callback): Unsub {
  let entry = registry.get(userId);
  if (!entry) {
    entry = { subs: new Set<Callback>() };
    registry.set(userId, entry);

    const rtdb = getFirebaseRealtimeDB();
    const pRef = ref(rtdb, `presence/${userId}`);
    networkLog('rtdb', 'onValue', pRef.toString(), 'subscribe');
    const off = onValue(pRef, (snap) => {
      entry!.last = (snap.val() ?? null) as any;
      entry!.subs.forEach((fn) => fn(entry!.last!));
    });
    entry.unsub = () => {
      networkLog('rtdb', 'onValue', pRef.toString(), 'unsubscribe');
      off();
    };
  }

  if (entry.last !== undefined) cb(entry.last);
  entry.subs.add(cb);

  return () => {
    const e = registry.get(userId);
    if (!e) return;
    e.subs.delete(cb);
    if (e.subs.size === 0) {
      e.unsub?.();
      registry.delete(userId);
    }
  };
}


