// Chat and messaging store using Zustand
import { create } from 'zustand';
import { Conversation, Message, User } from '../types';

interface ChatStore {
  // State
  conversations: Conversation[];
  currentConversationId: string | null;
  messages: Record<string, Message[]>; // Keyed by conversationId
  messageLoading: Record<string, boolean>; // Per-conversation loading state
  conversationParticipants: Record<string, User[]>; // Cached participants per conversation
  
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
  
  // Utility actions
  clearChat: () => void;
  
  // Derived state helpers (call these from components)
  getConversationById: (id: string) => Conversation | undefined;
  getMessagesByConversationId: (id: string) => Message[];
  getUnreadCount: () => number;
  getCurrentConversation: () => Conversation | undefined;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  conversations: [],
  currentConversationId: null,
  messages: {},
  messageLoading: {},
  conversationParticipants: {},

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
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: messages,
      },
    })),
  
  addMessage: (conversationId, message) =>
    set((state) => {
      const existing = state.messages[conversationId] || [];
      
      // Check if message already exists (by id or localId)
      const exists = existing.some(
        (m) => m.id === message.id || (message.localId && m.localId === message.localId)
      );
      
      if (exists) {
        // Update existing message
        return {
          messages: {
            ...state.messages,
            [conversationId]: existing.map((m) =>
              m.id === message.id || (message.localId && m.localId === message.localId)
                ? message
                : m
            ),
          },
        };
      }
      
      // Add new message
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...existing, message].sort(
            (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
          ),
        },
      };
    }),
  
  updateMessage: (conversationId, messageId, updates) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).map((msg) =>
          msg.id === messageId ? { ...msg, ...updates } : msg
        ),
      },
    })),
  
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

  // Utility
  clearChat: () =>
    set({
      conversations: [],
      currentConversationId: null,
      messages: {},
      messageLoading: {},
      conversationParticipants: {},
    }),

  // Getters (these are functions, not reactive)
  getConversationById: (id) => {
    return get().conversations.find((conv) => conv.id === id);
  },
  
  getMessagesByConversationId: (id) => {
    return get().messages[id] || [];
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
}));

// Selectors for optimized subscriptions
export const selectConversations = (state: ChatStore) => state.conversations;
export const selectCurrentConversationId = (state: ChatStore) => state.currentConversationId;
export const selectCurrentConversation = (state: ChatStore) => state.getCurrentConversation();
export const selectMessages = (conversationId: string) => (state: ChatStore) =>
  state.messages[conversationId] || [];
export const selectMessageLoading = (conversationId: string) => (state: ChatStore) =>
  state.messageLoading[conversationId] || false;
export const selectUnreadCount = (state: ChatStore) => state.getUnreadCount();

