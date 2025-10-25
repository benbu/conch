// Custom hook for conversations
import { useCallback, useEffect } from 'react';
import { Image } from 'react-native';
import {
  addMemberToConversation,
  createConversation,
  getUsersByIds,
  removeMemberFromConversation,
  subscribeToConversations,
  updateConversationName,
  updateMemberRole,
} from '../services/firestoreService';
import { selectUser, useAuthStore } from '../stores/authStore';
import { selectConversations, useChatStore } from '../stores/chatStore';
import { User } from '../types';

export function useConversations() {
  const conversations = useChatStore(selectConversations);
  const user = useAuthStore(selectUser);

  // Subscribe to conversations when user is logged in
  useEffect(() => {
    if (!user) {
      useChatStore.getState().setConversations([]);
      return;
    }

    const unsubscribe = subscribeToConversations(user.id, async (conversations) => {
      useChatStore.getState().setConversations(conversations);

      // Fetch participants for each conversation
      for (const conv of conversations) {
        const participants = await getUsersByIds(conv.participantIds);
        useChatStore.getState().setConversationParticipants(conv.id, participants);

        // Prefetch avatar images to warm the cache for instant display
        for (const u of participants) {
          if (u.photoURL) {
            Image.prefetch(u.photoURL).catch(() => {});
          }
        }

        // Compute display names from participants only (no message reads)
        const existing = useChatStore.getState().computedConversationNames[conv.id];
        const otherUsers: User[] = participants.filter((p) => p.id !== user.id).slice(0, 5);
        if (otherUsers.length > 0) {
          const full = otherUsers.map((u) => u.displayName).join(',');
          const formatted = full.length <= 30
            ? full
            : otherUsers.map((u) => u.displayName.slice(0, 5)).join(',');
          if (!existing || existing !== formatted) {
            useChatStore.getState().setComputedConversationName(conv.id, formatted);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [user]);

  const createNewConversation = useCallback(
    async (
      participantIds: string[],
      title?: string,
      type: 'direct' | 'group' = 'direct',
      name?: string
    ) => {
      if (!user) {
        throw new Error('User must be logged in');
      }

      try {
        const conversationId = await createConversation(
          [...participantIds, user.id], // Include current user
          user.id,
          title,
          type,
          name
        );

        return conversationId;
      } catch (error: any) {
        console.error('Error creating conversation:', error);
        throw error;
      }
    },
    [user]
  );

  const updateGroupName = useCallback(
    async (conversationId: string, name: string) => {
      try {
        await updateConversationName(conversationId, name);
        useChatStore.getState().updateConversationName(conversationId, name);
      } catch (error: any) {
        console.error('Error updating group name:', error);
        throw error;
      }
    },
    []
  );

  const addGroupMember = useCallback(
    async (conversationId: string, userId: string, role: 'admin' | 'team' | 'user' = 'user') => {
      try {
        await addMemberToConversation(conversationId, userId, role);
        useChatStore.getState().addConversationMember(conversationId, {
          userId,
          role,
          joinedAt: new Date(),
        });
      } catch (error: any) {
        console.error('Error adding member:', error);
        throw error;
      }
    },
    []
  );

  const updateMemberRoleInGroup = useCallback(
    async (conversationId: string, userId: string, newRole: 'admin' | 'team' | 'user') => {
      try {
        await updateMemberRole(conversationId, userId, newRole);
        useChatStore.getState().updateConversationMemberRole(conversationId, userId, newRole);
      } catch (error: any) {
        console.error('Error updating member role:', error);
        throw error;
      }
    },
    []
  );

  const leaveGroup = useCallback(
    async (conversationId: string) => {
      if (!user) {
        throw new Error('User must be logged in');
      }

      try {
        await removeMemberFromConversation(conversationId, user.id);
        useChatStore.getState().removeConversationMember(conversationId, user.id);
      } catch (error: any) {
        console.error('Error leaving group:', error);
        throw error;
      }
    },
    [user]
  );

  const removeMember = useCallback(
    async (conversationId: string, userId: string) => {
      try {
        await removeMemberFromConversation(conversationId, userId);
        useChatStore.getState().removeConversationMember(conversationId, userId);
      } catch (error: any) {
        console.error('Error removing member:', error);
        throw error;
      }
    },
    []
  );

  return {
    conversations,
    createConversation: createNewConversation,
    updateGroupName,
    addGroupMember,
    updateMemberRole: updateMemberRoleInGroup,
    leaveGroup,
    removeMember,
  };
}

