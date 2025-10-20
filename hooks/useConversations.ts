// Custom hook for conversations
import { useCallback, useEffect } from 'react';
import {
    createConversation,
    getUsersByIds,
    subscribeToConversations,
} from '../services/firestoreService';
import { selectUser, useAuthStore } from '../stores/authStore';
import { selectConversations, useChatStore } from '../stores/chatStore';

export function useConversations() {
  const conversations = useChatStore(selectConversations);
  const user = useAuthStore(selectUser);
  const { setConversations, addConversation, setConversationParticipants } = useChatStore();

  // Subscribe to conversations when user is logged in
  useEffect(() => {
    if (!user) {
      setConversations([]);
      return;
    }

    const unsubscribe = subscribeToConversations(user.id, async (conversations) => {
      setConversations(conversations);

      // Fetch participants for each conversation
      for (const conv of conversations) {
        const participants = await getUsersByIds(conv.participantIds);
        setConversationParticipants(conv.id, participants);
      }
    });

    return () => unsubscribe();
  }, [user, setConversations, setConversationParticipants]);

  const createNewConversation = useCallback(
    async (
      participantIds: string[],
      title?: string,
      type: 'direct' | 'group' = 'direct'
    ) => {
      if (!user) {
        throw new Error('User must be logged in');
      }

      try {
        const conversationId = await createConversation(
          [...participantIds, user.id], // Include current user
          user.id,
          title,
          type
        );

        return conversationId;
      } catch (error: any) {
        console.error('Error creating conversation:', error);
        throw error;
      }
    },
    [user]
  );

  return {
    conversations,
    createConversation: createNewConversation,
  };
}

