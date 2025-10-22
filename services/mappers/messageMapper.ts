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
    readBy: d.readBy
      ? Object.fromEntries(
          Object.entries(d.readBy).map(([k, v]: any) => [k, v?.toDate ? v.toDate() : v])
        )
      : undefined,
    createdAt: d.createdAt?.toDate?.() || new Date(),
    updatedAt: d.updatedAt?.toDate?.(),
  };
}


