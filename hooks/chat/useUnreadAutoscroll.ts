import { MutableRefObject, useEffect, useRef } from 'react';
import { FlatList } from 'react-native';
import { useChatStore } from '../../stores/chatStore';
import { Message } from '../../types';

export function useUnreadAutoscroll(
  conversationId: string | null,
  targetMessageId: string | string[] | undefined,
  loading: boolean,
  messages: Message[],
  hasMore: boolean,
  loadMoreMessages: () => Promise<number>,
  userId?: string,
  setDidScrollToUnread?: (v: boolean) => void,
  flatListRef?: MutableRefObject<FlatList | null>
) {
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!conversationId || targetMessageId || loading) return;
    if (!userId || messages.length === 0) return;

    const tryScroll = async () => {
      for (let i = 0; i < 10; i++) {
        const currentMessages = useChatStore.getState().getMessagesByConversationId(conversationId);
        const idx = currentMessages.findIndex((m) => m.senderId !== userId && (!m.readBy || !m.readBy[userId]));
        if (idx !== -1) {
          setTimeout(() => {
            if (cancelledRef.current) return;
            flatListRef?.current?.scrollToIndex?.({ index: idx, animated: false, viewPosition: 0 });
            setDidScrollToUnread?.(true);
          }, 250);
          return;
        }
        if (!hasMore) break;
        const loaded = await loadMoreMessages();
        if (loaded === 0) break;
      }

      setTimeout(() => {
        if (cancelledRef.current) return;
        flatListRef?.current?.scrollToEnd?.({ animated: false });
        setDidScrollToUnread?.(true);
      }, 250);
    };

    tryScroll();
    return () => {
      cancelledRef.current = true;
    };
  }, [conversationId, targetMessageId, loading, messages, hasMore, userId]);
}


