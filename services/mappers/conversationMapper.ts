import { Conversation } from '../../types';

export function mapConversation(doc: any): Conversation {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title,
    name: data.name,
    type: data.type,
    participantIds: data.participantIds,
    members: data.members?.map((m: any) => ({
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt?.toDate?.() || new Date(),
    })),
    createdBy: data.createdBy,
    createdAt: data.createdAt?.toDate?.() || new Date(),
    lastMessageAt: data.lastMessageAt?.toDate?.() || new Date(),
    lastMessage: data.lastMessage
      ? {
          ...data.lastMessage,
          createdAt: data.lastMessage.createdAt?.toDate?.() || new Date(),
        }
      : undefined,
  };
}


