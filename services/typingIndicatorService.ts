/**
 * Typing Indicator Service
 * Handles real-time typing indicators (RTDB-backed)
 */

import { onDisconnect, onValue, ref, remove, serverTimestamp, set } from 'firebase/database';
import { auth, getFirebaseRealtimeDB } from '../lib/firebase';

const TYPING_TIMEOUT = 3000; // 3 seconds
let typingTimer: NodeJS.Timeout | null = null;

/**
 * Set user as typing in a conversation
 */
export async function setTyping(
  conversationId: string,
  isTyping: boolean
): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const rtdb = getFirebaseRealtimeDB();
    const typingRef = ref(rtdb, `typing/${conversationId}/${user.uid}`);

    if (isTyping) {
      await set(typingRef, {
        userId: user.uid,
        displayName: user.displayName || 'Someone',
        timestamp: serverTimestamp(),
      });
      try {
        onDisconnect(typingRef).remove();
      } catch {
        // ignore
      }
    } else {
      await remove(typingRef);
    }
  } catch (error) {
    console.error('Error setting typing indicator:', error);
  }
}

/**
 * Start typing indicator (with auto-stop after timeout)
 */
export function startTyping(conversationId: string): void {
  // Clear existing timer
  if (typingTimer) {
    clearTimeout(typingTimer);
  }

  // Set typing
  setTyping(conversationId, true);

  // Auto-stop after timeout
  typingTimer = setTimeout(() => {
    setTyping(conversationId, false);
    typingTimer = null;
  }, TYPING_TIMEOUT);
}

/**
 * Stop typing indicator
 */
export function stopTyping(conversationId: string): void {
  if (typingTimer) {
    clearTimeout(typingTimer);
    typingTimer = null;
  }
  setTyping(conversationId, false);
}

/**
 * Subscribe to typing indicators in a conversation
 */
export function subscribeToTypingIndicators(
  conversationId: string,
  callback: (typingUsers: Array<{ userId: string; displayName: string }>) => void
): () => void {
  const user = auth.currentUser;
  if (!user) {
    return () => {};
  }

  const rtdb = getFirebaseRealtimeDB();
  const convRef = ref(rtdb, `typing/${conversationId}`);

  const off = onValue(convRef, (snapshot) => {
    const value = snapshot.val() || {} as Record<string, { userId: string; displayName: string; timestamp?: number }>;
    const now = Date.now();
    const typingUsers = Object.entries(value)
      .filter(([uid]) => uid !== user.uid)
      .filter(([, data]) => {
        const ts = typeof data.timestamp === 'number' ? data.timestamp : 0;
        return !ts || now - ts < 5000;
      })
      .map(([uid, data]) => ({ userId: uid, displayName: data.displayName }));

    callback(typingUsers);
  });

  return () => off();
}

