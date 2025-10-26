// Core data types for Conch Social

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  timeZone: string;
  defaultLanguage?: string; // ISO 639-1 like 'en', 'es'
  autoTranslate?: boolean;
  preferredAIModel?: string; // OpenAI model identifier
  workHours?: {
    start: string; // HH:mm format
    end: string;   // HH:mm format
  };
  createdAt: Date;
  updatedAt: Date;
  appearOffline?: boolean; // Manual offline mode preference
}

export interface UserPresence {
  status: 'online' | 'offline' | 'away';
  lastSeen: number; // Timestamp
  customStatus?: string;
}

export interface ConversationMember {
  userId: string;
  role: 'admin' | 'team' | 'user';
  joinedAt: Date;
}

export interface Conversation {
  id: string;
  title?: string;
  name?: string; // Custom editable name for groups
  type: 'direct' | 'group';
  participantIds: string[];
  participants?: User[]; // Populated on client
  members?: ConversationMember[]; // Role-based member tracking for groups
  createdBy: string;
  createdAt: Date;
  lastMessageAt: Date;
  lastMessage?: {
    text: string;
    senderId: string;
    createdAt: Date;
  };
  unreadCount?: number; // Client-side computed
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: User; // Populated on client
  text: string;
  attachments?: Attachment[];
  deliveryStatus: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  createdAt: Date;
  updatedAt?: Date;
  localId?: string; // For optimistic updates
}

export interface Attachment {
  id: string;
  type: 'image' | 'file';
  url: string;
  name: string;
  size: number;
  mimeType: string;
  thumbnailUrl?: string;
}

// AI Artifacts
export interface Summary {
  id: string;
  conversationId: string;
  text: string;
  sourceMessageIds: string[];
  createdAt: Date;
}

export interface ActionItem {
  id: string;
  title: string;
  ownerId?: string;
  owner?: User;
  dueAt?: Date;
  completed: boolean;
  completedAt?: Date;
}

export interface ActionArtifact {
  id: string;
  conversationId: string;
  items: ActionItem[];
  createdAt: Date;
}

export interface Decision {
  id: string;
  conversationId: string;
  statement: string;
  sourceMessageIds: string[];
  createdBy: string;
  createdAt: Date;
}

export interface MeetingSuggestion {
  id: string;
  conversationId: string;
  participantIds: string[];
  timeOptions: TimeSlot[];
  createdAt: Date;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface TimeSlot {
  start: Date;
  end: Date;
  participantAvailability: Record<string, boolean>;
}

// Offline queue
export interface QueuedMessage {
  localId: string;
  message: Omit<Message, 'id'>;
  retryCount: number;
  lastAttempt?: Date;
}

// Auth state
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// UI state types
export type ModalType = 'none' | 'profile' | 'settings' | 'newChat' | 'aiSummary' | 'aiActions' | 'aiDecisions';

