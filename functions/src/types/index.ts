/**
 * Type definitions for Conch Social Cloud Functions
 */

export interface Message {
  id: string;
  senderId: string;
  text: string;
  attachments?: string[];
  createdAt: Date;
  deliveryStatus: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export interface Conversation {
  id: string;
  title: string;
  participantIds: string[];
  createdBy: string;
  createdAt: Date;
  lastMessageAt: Date;
}

export interface AISummary {
  id: string;
  conversationId: string;
  text: string;
  createdAt: Date;
  sourceMessageIds: string[];
}

export interface ActionItem {
  title: string;
  ownerId?: string;
  dueAt?: Date;
  completed: boolean;
}

export interface AIActions {
  id: string;
  conversationId: string;
  items: ActionItem[];
  createdAt: Date;
  sourceMessageIds: string[];
}

export interface AIDecision {
  id: string;
  conversationId: string;
  statement: string;
  createdAt: Date;
  sourceMessageIds: string[];
}

export interface PriorityMessage {
  messageId: string;
  score: number;
  reason: string;
}

export interface AIPriority {
  id: string;
  conversationId: string;
  priorityMessages: PriorityMessage[];
  createdAt: Date;
}

export interface MeetingTimeOption {
  startTime: Date;
  endTime: Date;
  participantAvailability: Record<string, boolean>;
}

export interface SuggestedMeeting {
  id: string;
  conversationId: string;
  participants: string[];
  timeOptions: MeetingTimeOption[];
  createdAt: Date;
}

export interface AIRequest {
  conversationId: string;
  userId: string;
  options?: {
    messageLimit?: number;
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
}

