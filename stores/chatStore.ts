// Chat and messaging store using Zustand
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Conversation, ConversationMember, Message, User } from '../types';

// Stable fallbacks to avoid returning new references on every selector read
const EMPTY_MESSAGES: Message[] = [];
const FALSE = false;

interface ChatStore {
  // State
  conversations: Conversation[];
  currentConversationId: string | null;
  messages: Record<string, Message[]>; // Keyed by conversationId
  messageLoading: Record<string, boolean>; // Per-conversation loading state
  conversationParticipants: Record<string, User[]>; // Cached participants per conversation
  computedConversationNames: Record<string, string>; // Derived display names per conversation
  
  // Actions - Conversations
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  setCurrentConversation: (id: string | null) => void;
  
  // Actions - Messages
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  removeMessage: (conversationId: string, messageId: string) => void;
  setMessageLoading: (conversationId: string, loading: boolean) => void;
  
  // Actions - Participants
  setConversationParticipants: (conversationId: string, participants: User[]) => void;
  setComputedConversationName: (conversationId: string, name: string) => void;
  
  // Actions - Group Member Management
  updateConversationName: (conversationId: string, name: string) => void;
  addConversationMember: (conversationId: string, member: ConversationMember) => void;
  updateConversationMemberRole: (conversationId: string, userId: string, role: 'admin' | 'team' | 'user') => void;
  removeConversationMember: (conversationId: string, userId: string) => void;
  
  // Utility actions
  clearChat: () => void;
  
  // Derived state helpers (call these from components)
  getConversationById: (id: string) => Conversation | undefined;
  getMessagesByConversationId: (id: string) => Message[];
  getUnreadCount: () => number;
  getCurrentConversation: () => Conversation | undefined;
}

const MAX_STORED_PER_CONV = 100;

function toDateSafe(value: any): Date {
  if (value instanceof Date) return value;
  if (!value) return new Date(0);
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date(0) : d;
  }
  if (value && typeof (value as any).toDate === 'function') {
    const d = (value as any).toDate();
    return d instanceof Date ? d : new Date(0);
  }
  return new Date(0);
}

function normalizeMessage<T extends Message>(message: T): T {
  return {
    ...message,
    createdAt: toDateSafe((message as any).createdAt),
  } as T;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
  // Initial state
  conversations: [],
  currentConversationId: null,
  messages: {},
  messageLoading: {},
  conversationParticipants: {},
  computedConversationNames: {},

  // Conversation actions
  setConversations: (conversations) => set({ conversations }),
  
  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),
  
  updateConversation: (id, updates) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === id ? { ...conv, ...updates } : conv
      ),
    })),
  
  setCurrentConversation: (id) => set({ currentConversationId: id }),

  // Message actions
  setMessages: (conversationId, messages) =>
    set((state) => {
      const normalized = messages.map(normalizeMessage);
      const sorted = normalized.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );
      const pruned = sorted.slice(-MAX_STORED_PER_CONV);
      return {
        messages: {
          ...state.messages,
          [conversationId]: pruned,
        },
      };
    }),
  
  addMessage: (conversationId, message) =>
    set((state) => {
      const existing = (state.messages[conversationId] || []).map(normalizeMessage);
      const normalizedMsg = normalizeMessage(message as any);
      
      // Check if message already exists (by id or localId)
      const exists = existing.some(
        (m) => m.id === normalizedMsg.id || (normalizedMsg.localId && m.localId === normalizedMsg.localId)
      );
      
      if (exists) {
        // Update existing message
        const updated = existing.map((m) =>
          m.id === normalizedMsg.id || (normalizedMsg.localId && m.localId === normalizedMsg.localId)
            ? normalizedMsg
            : m
        );
        const sortedUpdated = updated.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        );
        const prunedUpdated = sortedUpdated.slice(-MAX_STORED_PER_CONV);
        return {
          messages: {
            ...state.messages,
            [conversationId]: prunedUpdated,
          },
        };
      }
      
      // Add new message
      const sorted = [...existing, normalizedMsg].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );
      const pruned = sorted.slice(-MAX_STORED_PER_CONV);
      return {
        messages: {
          ...state.messages,
          [conversationId]: pruned,
        },
      };
    }),
  
  updateMessage: (conversationId, messageId, updates) =>
    set((state) => {
      const updated = (state.messages[conversationId] || [])
        .map((msg) => (msg.id === messageId ? normalizeMessage({ ...msg, ...updates } as any) : normalizeMessage(msg as any)))
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      const pruned = updated.slice(-MAX_STORED_PER_CONV);
      return {
        messages: {
          ...state.messages,
          [conversationId]: pruned,
        },
      };
    }),
  
  removeMessage: (conversationId, messageId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).filter(
          (msg) => msg.id !== messageId
        ),
      },
    })),
  
  setMessageLoading: (conversationId, loading) =>
    set((state) => ({
      messageLoading: {
        ...state.messageLoading,
        [conversationId]: loading,
      },
    })),

  // Participants
  setConversationParticipants: (conversationId, participants) =>
    set((state) => ({
      conversationParticipants: {
        ...state.conversationParticipants,
        [conversationId]: participants,
      },
    })),

  setComputedConversationName: (conversationId, name) =>
    set((state) => ({
      computedConversationNames: {
        ...state.computedConversationNames,
        [conversationId]: name,
      },
    })),

  // Group Member Management
  updateConversationName: (conversationId, name) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, name } : conv
      ),
    })),

  addConversationMember: (conversationId, member) =>
    set((state) => ({
      conversations: state.conversations.map((conv) => {
        if (conv.id !== conversationId) return conv;
        
        const members = conv.members || [];
        const participantIds = conv.participantIds || [];
        
        return {
          ...conv,
          members: [...members, member],
          participantIds: [...participantIds, member.userId],
        };
      }),
    })),

  updateConversationMemberRole: (conversationId, userId, role) =>
    set((state) => ({
      conversations: state.conversations.map((conv) => {
        if (conv.id !== conversationId) return conv;
        
        const members = (conv.members || []).map((m) =>
          m.userId === userId ? { ...m, role } : m
        );
        
        return { ...conv, members };
      }),
    })),

  removeConversationMember: (conversationId, userId) =>
    set((state) => ({
      conversations: state.conversations.map((conv) => {
        if (conv.id !== conversationId) return conv;
        
        const members = (conv.members || []).filter((m) => m.userId !== userId);
        const participantIds = (conv.participantIds || []).filter((id) => id !== userId);
        
        return { ...conv, members, participantIds };
      }),
    })),

  // Utility
  clearChat: () =>
    set({
      conversations: [],
      currentConversationId: null,
      messages: {},
      messageLoading: {},
      conversationParticipants: {},
      computedConversationNames: {},
    }),

  // Getters (these are functions, not reactive)
  getConversationById: (id) => {
    return get().conversations.find((conv) => conv.id === id);
  },
  
  getMessagesByConversationId: (id) => {
    return get().messages[id] ?? EMPTY_MESSAGES;
  },
  
  getUnreadCount: () => {
    return get().conversations.reduce(
      (sum, conv) => sum + (conv.unreadCount || 0),
      0
    );
  },
  
  getCurrentConversation: () => {
    const { currentConversationId, conversations } = get();
    if (!currentConversationId) return undefined;
    return conversations.find((conv) => conv.id === currentConversationId);
  },
    }),
    {
      name: 'chat-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        conversations: state.conversations,
        messages: state.messages,
        conversationParticipants: state.conversationParticipants,
        computedConversationNames: state.computedConversationNames,
      }),
      version: 1,
      migrate: async (persistedState, version) => {
        // Basic date revival for older states if needed
        const state = persistedState as any;
        if (state?.messages) {
          for (const key of Object.keys(state.messages)) {
            state.messages[key] = (state.messages[key] || []).map((m: any) => ({
              ...m,
              createdAt: toDateSafe(m?.createdAt),
            }));
          }
        }
        if (Array.isArray(state?.conversations)) {
          state.conversations = state.conversations.map((c: any) => ({
            ...c,
            createdAt: toDateSafe(c?.createdAt),
            lastMessageAt: toDateSafe(c?.lastMessageAt),
          }));
        }
        return state;
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Ensure dates are revived after hydration as well
        const s = useChatStore.getState();
        const revivedMessages: Record<string, any[]> = {};
        for (const key of Object.keys(s.messages)) {
          revivedMessages[key] = (s.messages[key] || []).map((m: any) => ({
            ...m,
            createdAt: toDateSafe(m?.createdAt),
          }));
        }
        const revivedConversations = s.conversations.map((c: any) => ({
          ...c,
          createdAt: toDateSafe(c?.createdAt),
          lastMessageAt: toDateSafe(c?.lastMessageAt),
        }));
        useChatStore.setState({
          messages: revivedMessages,
          conversations: revivedConversations,
        });
      },
    }
  )
);

// Selectors for optimized subscriptions
export const selectConversations = (state: ChatStore) => state.conversations;
export const selectCurrentConversationId = (state: ChatStore) => state.currentConversationId;
export const selectCurrentConversation = (state: ChatStore) => state.getCurrentConversation();
export const selectMessages = (conversationId: string) => (state: ChatStore) =>
  state.messages[conversationId] ?? EMPTY_MESSAGES;
export const selectMessageLoading = (conversationId: string) => (state: ChatStore) =>
  state.messageLoading[conversationId] ?? FALSE;
export const selectUnreadCount = (state: ChatStore) => state.getUnreadCount();

