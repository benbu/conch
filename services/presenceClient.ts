import { getFirebaseRealtimeDB } from '@/lib/firebase';
import { networkLog, withNetworkLog } from '@/lib/networkLogger';
import { onDisconnect, onValue, ref, serverTimestamp, update } from 'firebase/database';

type Unsub = () => void;

const rtdb = getFirebaseRealtimeDB();

const THROTTLE_MS = 15_000;

let initialized = false;
let currentUserId: string | null = null;
let presencePathRef: ReturnType<typeof ref> | null = null;
let connectedUnsub: Unsub | null = null;

let lastSentAt = 0;
let pendingTimer: ReturnType<typeof setTimeout> | null = null;
let pendingActivityAt: number | null = null;
let isOnlineLocal = false;

async function sendOnlineUpdate(now = Date.now()): Promise<void> {
  if (!presencePathRef) return;
  lastSentAt = now;
  pendingActivityAt = null;
  const path = presencePathRef.toString();
  const payload = { online: true, lastSeen: serverTimestamp() as unknown as number } as any;
  await withNetworkLog('rtdb', 'update', path, async () => update(presencePathRef!, payload), { payload });
}

export function init(userId: string): void {
  if (initialized && currentUserId === userId) return;

  dispose();

  initialized = true;
  currentUserId = userId;
  presencePathRef = ref(rtdb, `presence/${userId}`);
  lastSentAt = 0;
  pendingTimer = null;
  pendingActivityAt = null;
  isOnlineLocal = false;

  // Re-register onDisconnect each time we connect
  const connectedRef = ref(rtdb, '.info/connected');
  connectedUnsub = onValue(connectedRef, async (snap) => {
    try {
      if (snap.val() === true && presencePathRef) {
        const path = presencePathRef.toString();
        const payload = { online: false, lastSeen: serverTimestamp() as unknown as number } as any;
        networkLog('rtdb', 'onDisconnect.update', path, 'start', { payload });
        await onDisconnect(presencePathRef).update(payload);
        networkLog('rtdb', 'onDisconnect.update', path, 'success', { payload });
      }
    } catch {
      // swallow
    }
  });
}

export function enqueueActivity(): void {
  if (!initialized || !presencePathRef) return;
  if (!isOnlineLocal) isOnlineLocal = true;
  const now = Date.now();
  if (now - lastSentAt >= THROTTLE_MS) {
    void sendOnlineUpdate(now);
    return;
  }
  // Coalesce to a single flush at the end of the window
  pendingActivityAt = now; // overwrite older
  const ms = Math.max(0, lastSentAt + THROTTLE_MS - now);
  if (!pendingTimer) {
    pendingTimer = setTimeout(() => {
      pendingTimer = null;
      if (pendingActivityAt) void sendOnlineUpdate();
    }, ms);
  }
}

export async function goOfflineNow(): Promise<void> {
  if (!initialized || !presencePathRef) return;
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
  }
  pendingActivityAt = null;
  isOnlineLocal = false;
  try {
    const path = presencePathRef.toString();
    const payload = { online: false, lastSeen: serverTimestamp() as unknown as number } as any;
    await withNetworkLog('rtdb', 'update', path, async () => update(presencePathRef!, payload), { payload });
  } catch {
    // swallow
  }
}

export function dispose(): void {
  if (connectedUnsub) {
    connectedUnsub();
    connectedUnsub = null;
  }
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
  }
  initialized = false;
  currentUserId = null;
  presencePathRef = null;
  lastSentAt = 0;
  pendingActivityAt = null;
  isOnlineLocal = false;
}

export const presenceClient = {
  init,
  enqueueActivity,
  goOfflineNow,
  dispose,
};


