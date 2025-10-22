import { useRef } from 'react';
import { updateMessageStatus } from '../services/firestoreService';
import { Message } from '../types';

/**
 * Returns a stable onViewableItemsChanged handler that marks messages as read
 * when at least 60% visible. Uses an internal Set to avoid duplicate writes.
 */
export function useViewableReadReceipts(
  conversationId: string | null,
  currentUserId: string | undefined,
  conversationType: 'direct' | 'group' | undefined
) {
  const markedRef = useRef<Set<string>>(new Set());

  const handler = useRef(({ viewableItems }: any) => {
    if (!conversationId || !currentUserId) return;
    if (conversationType !== 'direct') return;
    viewableItems.forEach((vi: any) => {
      const item: Message | undefined = vi?.item;
      if (!item) return;
      if (item.senderId === currentUserId) return;
      const already = markedRef.current.has(item.id);
      const isUnreadDirect = item.deliveryStatus !== 'read';
      if (!already && isUnreadDirect) {
        markedRef.current.add(item.id);
        updateMessageStatus(conversationId, item.id, 'read')
          .catch(() => {
            markedRef.current.delete(item.id);
          });
      }
    });
  });

  const viewabilityConfig = { itemVisiblePercentThreshold: 60 } as const;

  return { onViewableItemsChanged: handler, viewabilityConfig };
}


