<!-- f02e6d27-b3c5-4f2f-918d-d60fa2051433 0df4b713-f146-4a97-8cc3-c150d09b9abe -->
# Chat List: Show Top Participants by Message Count

## What we’ll build

- Display, for each conversation in `app/(tabs)/index.tsx`, a comma-separated list of the other participants’ names (excluding current user).
- If there are more than 5 other participants, show the top 5 by message count computed from the last ~200 messages of that conversation.
- If the resulting comma-joined string exceeds 30 chars, display only the first 5 chars of each selected name, joined by commas.

## Files to update

- `stores/chatStore.ts`
- `hooks/useConversations.ts`
- `app/(tabs)/index.tsx`

## Implementation details

1) Store additions in `stores/chatStore.ts`:

   - Add state: `computedConversationNames: Record<string, string>`.
   - Add action: `setComputedConversationName(conversationId: string, name: string)`.
   - Optional selector for convenient access.

2) Compute names in `hooks/useConversations.ts`:

   - After conversations load and participants are fetched, for each conversation:
     - Fetch recent messages via `getMessages(conv.id, 200)`.
     - Count messages per `senderId`, excluding `user.id`.
     - Rank other participants by count, pick up to 5.
     - Map to display names using `conversationParticipants[conv.id]`.
     - Format with 30-char rule. If length > 30, show first 5 chars of each selected name, comma-separated.
     - Save via `setComputedConversationName(conv.id, formattedName)`.
   - Edge cases: if participants or messages not ready, fall back to non-ranked list of other participants (up to 5) until counts arrive.

Example helper (inline or separate util):

   ```ts
   function formatParticipantNames(
     otherUsers: User[],
     counts: Record<string, number>
   ): string {
     const ranked = [...otherUsers]
       .sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0))
       .slice(0, 5);
     const full = ranked.map(u => u.displayName).join(',');
     if (full.length <= 30) return full;
     return ranked.map(u => u.displayName.slice(0, 5)).join(',');
   }
   ```

3) Render in `app/(tabs)/index.tsx`:

   - Use the new `computedConversationNames[item.id]` as the title text when present.
   - Fallbacks:
     - If computed unavailable: show comma list of other participants (up to 5, unranked) using known `participants` in store, else the existing `Group (n)`/`Chat` fallback.

## Notes

- Choice 1a honored: exclude current user from both ranking and display.
- Choice 2a honored: client-only using last ~200 messages.
- Performance: Runs after conversation snapshot; each conversation triggers up to one `getMessages(convId, 200)` call. Acceptable for modest counts; can batch/debounce later if needed.

### To-dos

- [ ] Add computedConversationNames and setter to chatStore
- [ ] Compute and set names in useConversations using last 200 messages
- [ ] Render computed names in app/(tabs)/index.tsx with fallbacks