<!-- 975f72bf-25c7-425b-a92e-fd6d3c9e98a8 efcf72fb-44a0-412c-bfcb-1a15f940b4b6 -->
# Fix Chat Loading Flicker (ChatScreen)

## Diagnosis

- `FlatList` uses `onEndReached` while older messages are loaded at the top; on small lists this fires repeatedly on mount.
- `useMessages` reuses `loading` for both initial load and pagination, so the header spinner toggles rapidly.

Code references (current behavior):

```239:261:app/chat/[id].tsx
<FlatList
  ...
  onEndReached={handleLoadMore}
  onEndReachedThreshold={0.5}
  ListHeaderComponent={
    loading ? <ActivityIndicator style={styles.loadingMore} /> : null
  }
/>
```

```141:160:hooks/useMessages.ts

const loadMoreMessages = useCallback(async () => {

if (!conversationId || loading || messages.length === 0) return;

try {

setMessageLoading(conversationId, true);

const oldestMessage = messages[0];

const { getMessagesBefore } = await import('../services/firestoreService');

const olderMessages = await getMessagesBefore(conversationId, oldestMessage.createdAt);

if (olderMessages.length > 0) {

const allMessages = [...olderMessages, ...messages];

setMessages(conversationId, allMessages);

await cacheMessages(conversationId, allMessages);

}

setMessageLoading(conversationId, false);

return olderMessages.length;

} catch (error) {

console.error('Error loading more messages:', error);

setMessageLoading(conversationId, false);

return 0;

}

}, [...])

```

## Changes

1) `hooks/useMessages.ts`

- Add local `loadingMore` and `hasMore` state; keep store `loading` for initial load only.
- Update `loadMoreMessages` to:
  - Return early if `loadingMore` or `!hasMore` or no messages.
  - Set `loadingMore` true while fetching; set false afterward.
  - If fetched count < page size, set `hasMore` false.
- Export `loadingMore` and `hasMore` from the hook.

2) `app/chat/[id].tsx`

- Remove `onEndReached` usage for top-pagination.
- Add `onScroll` handler to detect near-top (`contentOffset.y <= 32`) and call `loadMoreMessages` (debounced via a ref lock) only when `hasMore` and not `loadingMore`.
- Show header spinner only when `loadingMore` (not `loading`). Keep full-screen spinner for first load as-is.

3) Optional (micro-hardening)

- Add a 500ms throttle for the top-pagination trigger to avoid burst calls on momentum.

## Validation

- Open a chat with few messages: no repeated spinner flicker.
- Scroll up in a long chat: header spinner appears once; more messages prepend; no repeated toggles after `hasMore` becomes false.
- Offline: no change to initial loading; queue behavior unaffected.

### To-dos

- [ ] Add loadingMore/hasMore to useMessages and update loadMoreMessages
- [ ] Change ChatScreen to trigger load-more at top via onScroll guard
- [ ] Show header spinner only when loadingMore; keep initial spinner logic
- [ ] Add simple throttle/ref lock around loadMore trigger to avoid bursts
- [ ] Test mounts, short lists, long lists, and offline cases