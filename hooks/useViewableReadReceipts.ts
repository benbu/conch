import { useRef } from 'react';
import { markMessageAsRead } from '../services/repositories/readReceiptRepository';
import { Message } from '../types';

/**
 * Returns a stable onViewableItemsChanged handler that marks messages as read
 * when at least 60% visible. Uses an internal Set to avoid duplicate writes.
 */
export function useViewableReadReceipts(
  conversationId: string | null,
  currentUserId: string | undefined
) {
  const markedRef = useRef<Set<string>>(new Set());

  const handler = useRef(({ viewableItems }: any) => {
    if (!conversationId || !currentUserId) return;
    viewableItems.forEach((vi: any) => {
      const item: Message | undefined = vi?.item;
      if (!item) return;
      if (item.senderId === currentUserId) return;
      const already = markedRef.current.has(item.id);
      const isUnread = !item.readBy || !item.readBy[currentUserId];
      if (!already && isUnread) {
        markedRef.current.add(item.id);
        markMessageAsRead(conversationId, item.id).catch(() => {
          markedRef.current.delete(item.id);
        });
      }
    });
  });

  const viewabilityConfig = { itemVisiblePercentThreshold: 60 } as const;

  return { onViewableItemsChanged: handler, viewabilityConfig };
}


