<!-- a316c3ad-82d1-4484-9007-3e1dc7b5b861 ca1aff37-a451-40d8-9534-ae55d91d9fb5 -->
# Fix Zustand selector instability causing infinite render loop

## What we'll change

- Update `stores/chatStore.ts` selectors to avoid creating new array/boolean instances per read.
- Refactor `hooks/useMessages.ts` to select actions individually (not the entire store) to prevent unnecessary updates.
- Optionally harden other selectors returning objects to use stable references or shallow equality where needed.

## Edits

1) `stores/chatStore.ts`

- Add stable module-level fallbacks and use nullish coalescing:
- `const EMPTY_MESSAGES: Message[] = [];`
- `const FALSE = false;`
- Change selectors:
- Before: `state.messages[id] || []`
- After: `state.messages[id] ?? EMPTY_MESSAGES`
- Before: `state.messageLoading[id] || false`
- After: `state.messageLoading[id] ?? FALSE`
- Change helpers that return fallbacks:
- `getMessagesByConversationId`: return `EMPTY_MESSAGES` instead of `[]`.

2) `hooks/useMessages.ts`

- Replace `const { setMessages, addMessage, updateMessage, setMessageLoading } = useChatStore();`
with individual selections:
- `const setMessages = useChatStore(s => s.setMessages)`
- `const addMessage = useChatStore(s => s.addMessage)`
- `const updateMessage = useChatStore(s => s.updateMessage)`
- `const setMessageLoading = useChatStore(s => s.setMessageLoading)`
- Keep existing stable fallbacks `EMPTY_MESSAGES` and `selectEmptyMessages` in this hook.

3) (Optional, quick follow-up) `stores/uiStore.ts`

- `selectToast` currently returns a new object each read. If it’s used with `useUIStore(selectToast)`, switch to either:
- return a tuple/array with a stable fallback; or
- use `zustand/shallow` equality at call sites; or
- export separate primitive selectors, e.g. `selectToastMessage`, `selectToastType`.

## Validation

- Open `app/chat/[id].tsx` and navigate between chats.
- Ensure the warning "The result of getSnapshot should be cached..." no longer appears.
- Verify no regressions: messages load, pagination works, optimistic sends still replace correctly.

## Risks

- Returning a shared `EMPTY_MESSAGES` must never be mutated; ensure code only creates new arrays when setting state (already the case).

## Minimal code snippets

- Selector stabilization (chat store):
- Before: `export const selectMessages = (id: string) => (s: ChatStore) => s.messages[id] || [];`
- After: `export const selectMessages = (id: string) => (s: ChatStore) => s.messages[id] ?? EMPTY_MESSAGES;`
- Action selection (useMessages):
- `const setMessages = useChatStore(s => s.setMessages);`

## Todos

- setup-stable-fallbacks: Add EMPTY_MESSAGES/FALSE and update chat selectors
- refactor-useMessages-actions: Select actions individually in useMessages
- audit-optional-ui-selectors: Optionally harden `selectToast` usage if warnings persist

### To-dos

- [x] Add stable fallbacks and update `chatStore` selectors to avoid new arrays/booleans
- [x] Refactor `useMessages` to select actions individually, not whole store
- [ ] Audit and harden `uiStore` object-returning selectors if needed