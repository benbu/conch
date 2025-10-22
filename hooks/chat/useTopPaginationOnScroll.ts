import { useRef } from 'react';

export function useTopPaginationOnScroll(
  loadingMore: boolean,
  hasMore: boolean,
  loadMore: () => void
) {
  const topLoadThrottleRef = useRef(0);
  const onScroll = ({ nativeEvent }: any) => {
    const y = nativeEvent?.contentOffset?.y ?? 0;
    if (y <= 32) {
      const now = Date.now();
      if (now - topLoadThrottleRef.current < 500) return;
      if (loadingMore || !hasMore) return;
      topLoadThrottleRef.current = now;
      loadMore();
    }
  };
  return onScroll;
}


