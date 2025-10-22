import { MutableRefObject, useEffect } from 'react';
import { FlatList } from 'react-native';
import { Message } from '../../types';

export function useScrollToTargetMessage(
  targetMessageId: string | string[] | undefined,
  messages: Message[],
  loading: boolean,
  flatListRef: MutableRefObject<FlatList | null>,
  setHighlightedMessageId: (id: string | null) => void
) {
  useEffect(() => {
    const targetId = Array.isArray(targetMessageId) ? targetMessageId[0] : targetMessageId;
    if (!targetId) return;
    if (messages.length === 0 || loading) return;

    const messageIndex = messages.findIndex((m) => m.id === targetId);
    if (messageIndex === -1) return;

    const t = setTimeout(() => {
      flatListRef.current?.scrollToIndex?.({ index: messageIndex, animated: true, viewPosition: 0.5 });
      setHighlightedMessageId(targetId);
      setTimeout(() => setHighlightedMessageId(null), 2000);
    }, 300);

    return () => clearTimeout(t);
  }, [targetMessageId, messages.length, loading]);
}


