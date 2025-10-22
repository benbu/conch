type ConversationId = string;
type MessageId = string;

/**
 * Simple in-memory deduper for notifications to avoid spamming.
 * - Tracks last-notified message per conversation
 * - Tracks processed message IDs
 */
class DeduperState {
  lastNotifiedByConversation: Record<ConversationId, MessageId> = {};
  processedMessageIds: Set<MessageId> = new Set();
}

const state = new DeduperState();

export function markProcessed(messageId: MessageId): void {
  state.processedMessageIds.add(messageId);
}

export function hasProcessed(messageId: MessageId): boolean {
  return state.processedMessageIds.has(messageId);
}

export function shouldNotify(
  conversationId: ConversationId,
  candidateMessageId: MessageId,
  createdAtMs?: number,
  lastCreatedAtMs?: number
): boolean {
  const lastId = state.lastNotifiedByConversation[conversationId];
  if (lastId && hasProcessed(lastId) && lastCreatedAtMs !== undefined && createdAtMs !== undefined) {
    if (createdAtMs <= lastCreatedAtMs) return false;
  }
  return true;
}

export function recordNotified(conversationId: ConversationId, messageId: MessageId): void {
  state.lastNotifiedByConversation[conversationId] = messageId;
  state.processedMessageIds.add(messageId);
}

export function resetDeduper(): void {
  state.processedMessageIds.clear();
  for (const key of Object.keys(state.lastNotifiedByConversation)) delete state.lastNotifiedByConversation[key];
}


