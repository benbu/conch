import { hasProcessed, markProcessed, recordNotified, resetDeduper, shouldNotify } from '../../services/notifications/notificationDeduper';

describe('notificationDeduper', () => {
  beforeEach(() => resetDeduper());

  it('allows first notification and records it', () => {
    const ok = shouldNotify('c1', 'm1', 1000);
    expect(ok).toBe(true);
    recordNotified('c1', 'm1');
    expect(hasProcessed('m1')).toBe(true);
  });

  it('blocks older or equal timestamps compared to last', () => {
    recordNotified('c1', 'm1');
    markProcessed('m1');
    const block = shouldNotify('c1', 'm0', 900, 1000);
    expect(block).toBe(false);
  });

  it('allows strictly newer timestamp', () => {
    recordNotified('c1', 'm1');
    markProcessed('m1');
    const ok = shouldNotify('c1', 'm2', 1100, 1000);
    expect(ok).toBe(true);
  });
});


