import { Message, User } from '../../types';

export function createOptimisticMessage(
  conversationId: string,
  user: User,
  text: string,
  attachments?: any[]
): Message {
  const localId = `local-${Date.now()}`;
  return {
    id: localId,
    conversationId,
    senderId: user.id,
    sender: user,
    text,
    attachments: attachments || [],
    deliveryStatus: 'sending',
    createdAt: new Date(),
    localId,
  };
}


