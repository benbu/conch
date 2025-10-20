/**
 * useTypingIndicator Hook
 * Hook for managing typing indicators in a conversation
 */

import { useCallback, useEffect, useState } from 'react';
import {
    startTyping,
    stopTyping,
    subscribeToTypingIndicators,
} from '../services/typingIndicatorService';

interface TypingUser {
  userId: string;
  displayName: string;
}

export function useTypingIndicator(conversationId: string | null) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  /**
   * Start typing
   */
  const handleTypingStart = useCallback(() => {
    if (conversationId) {
      startTyping(conversationId);
    }
  }, [conversationId]);

  /**
   * Stop typing
   */
  const handleTypingStop = useCallback(() => {
    if (conversationId) {
      stopTyping(conversationId);
    }
  }, [conversationId]);

  /**
   * Subscribe to typing indicators
   */
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = subscribeToTypingIndicators(conversationId, setTypingUsers);

    return () => {
      unsubscribe();
      handleTypingStop(); // Clean up typing indicator on unmount
    };
  }, [conversationId, handleTypingStop]);

  /**
   * Get typing indicator text
   */
  const getTypingText = useCallback((): string | null => {
    if (typingUsers.length === 0) return null;

    if (typingUsers.length === 1) {
      return `${typingUsers[0].displayName} is typing...`;
    }

    if (typingUsers.length === 2) {
      return `${typingUsers[0].displayName} and ${typingUsers[1].displayName} are typing...`;
    }

    return `${typingUsers[0].displayName} and ${typingUsers.length - 1} others are typing...`;
  }, [typingUsers]);

  return {
    typingUsers,
    typingText: getTypingText(),
    startTyping: handleTypingStart,
    stopTyping: handleTypingStop,
  };
}

