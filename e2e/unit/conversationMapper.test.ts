import { mapConversation } from '../../services/mappers/conversationMapper';

function fakeTimestamp(d: Date) {
  return { toDate: () => d } as any;
}

describe('conversationMapper', () => {
  it('maps Firestore doc to Conversation with normalized member dates', () => {
    const created = new Date('2025-01-02T03:04:05Z');
    const last = new Date('2025-01-02T04:04:05Z');
    const joined = new Date('2025-01-01T00:00:00Z');

    const doc: any = {
      id: 'c1',
      data: () => ({
        title: 't',
        name: 'n',
        type: 'group',
        participantIds: ['u1', 'u2'],
        members: [{ userId: 'u1', role: 'admin', joinedAt: fakeTimestamp(joined) }],
        createdBy: 'u1',
        createdAt: fakeTimestamp(created),
        lastMessageAt: fakeTimestamp(last),
        lastMessage: { text: 'hi', senderId: 'u2', createdAt: fakeTimestamp(last) },
      }),
    };

    const conv = mapConversation(doc);
    expect(conv.id).toBe('c1');
    expect(conv.members && conv.members[0].joinedAt instanceof Date).toBe(true);
    expect(conv.lastMessage && conv.lastMessage.createdAt instanceof Date).toBe(true);
  });
});


