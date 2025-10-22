import { mapMessage } from '../../services/mappers/messageMapper';

function fakeTimestamp(d: Date) {
  return { toDate: () => d } as any;
}

describe('messageMapper', () => {
  it('maps Firestore doc to Message with normalized dates and readBy', () => {
    const created = new Date('2025-01-02T03:04:05Z');
    const updated = new Date('2025-01-03T03:04:05Z');

    const doc: any = {
      id: 'm1',
      data: () => ({
        senderId: 'u1',
        text: 'hello',
        attachments: [],
        deliveryStatus: 'sent',
        readBy: { u2: fakeTimestamp(created) },
        createdAt: fakeTimestamp(created),
        updatedAt: fakeTimestamp(updated),
      }),
    };

    const msg = mapMessage(doc, 'c1');
    expect(msg.id).toBe('m1');
    expect(msg.conversationId).toBe('c1');
    expect(msg.senderId).toBe('u1');
    expect(msg.text).toBe('hello');
    expect(msg.deliveryStatus).toBe('sent');
    expect(msg.createdAt instanceof Date).toBe(true);
    expect(msg.updatedAt instanceof Date).toBe(true);
    expect(msg.readBy && msg.readBy['u2'] instanceof Date).toBe(true);
  });

  it('handles missing optional fields', () => {
    const now = new Date('2025-02-01T00:00:00Z');
    const doc: any = {
      id: 'm2',
      data: () => ({
        senderId: 'u1',
        text: 'no attach',
        createdAt: fakeTimestamp(now),
      }),
    };

    const msg = mapMessage(doc, 'c2');
    expect(msg.attachments).toEqual([]);
    expect(msg.updatedAt).toBeUndefined();
  });
});


