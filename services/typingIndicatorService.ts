/**
 * Typing Indicator Service
 * Handles real-time typing indicators
 */

import { auth, db } from '../lib/firebase';

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

    const typingRef = db
      .collection('conversations')
      .doc(conversationId)
      .collection('typing')
      .doc(user.uid);

    if (isTyping) {
      await typingRef.set({
        userId: user.uid,
        displayName: user.displayName || 'Someone',
        timestamp: new Date(),
      });
    } else {
      await typingRef.delete();
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

  const unsubscribe = db
    .collection('conversations')
    .doc(conversationId)
    .collection('typing')
    .onSnapshot((snapshot) => {
      const typingUsers = snapshot.docs
        .map((doc) => doc.data() as { userId: string; displayName: string; timestamp: Date })
        .filter((data) => data.userId !== user.uid) // Exclude current user
        .filter((data) => {
          // Filter out stale typing indicators (older than 5 seconds)
          const age = Date.now() - new Date(data.timestamp).getTime();
          return age < 5000;
        })
        .map((data) => ({
          userId: data.userId,
          displayName: data.displayName,
        }));

      callback(typingUsers);
    });

  return unsubscribe;
}

