import { Message } from '../../types';

export function mapMessage(doc: any, conversationId: string): Message {
  const d = doc.data();
  return {
    id: doc.id,
    conversationId,
    senderId: d.senderId,
    text: d.text,
    attachments: d.attachments || [],
    deliveryStatus: d.deliveryStatus,
    createdAt: d.createdAt?.toDate?.() || new Date(),
    updatedAt: d.updatedAt?.toDate?.(),
  };
}


