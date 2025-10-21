<!-- fb3e5d94-cbb2-4032-b387-80a683f1a1ba 153b6bc6-db64-4366-b00d-ad048c1ef366 -->
# Unified Search and AI Settings Navigation

## Overview

This plan will add an AI Settings navigation option to the Profile page and refactor the Discover (explore) page into a unified search experience that searches both users and chat messages with intelligent deeper search functionality.

## Changes

### 1. Add AI Settings to Profile Screen

**File:** `app/(tabs)/profile.tsx`

Add a new menu item in the settings section (after "Edit Profile") that navigates to the AI Settings screen:

```typescript
<TouchableOpacity
  style={styles.menuItem}
  onPress={() => router.push('/(tabs)/ai-settings')}
>
  <Text style={styles.menuItemText}>✨ AI Settings</Text>
  <Text style={styles.menuItemChevron}>›</Text>
</TouchableOpacity>
```

### 2. Transform Explore Screen to Unified Search

**File:** `app/(tabs)/explore.tsx`

Completely refactor to implement:

- Real-time autocomplete that filters both known users and messages as user types
- Track filtered result count - when it drops to ≤3 items, show "Search for more" button
- Grouped display: "People" section followed by "Messages" section
- Message results show conversation name, message preview, and timestamp
- Tapping a message opens the conversation and scrolls to that message

Key implementation details:

- Use `useMemo` to filter local/cached results (recent users from conversations + recent messages)
- Show "Search for more results" button when local results ≤ 3 items
- Button triggers `searchService.globalSearch()` for deeper database search
- Display results in two sections with clear headers

### 3. Update Search Service

**File:** `services/searchService.ts`

Enhance the `searchMessages` function:

- Return conversation title/info with each message result
- Add timestamp formatting
- Ensure proper sorting (most recent first)

### 4. Add Scroll-to-Message Functionality

**File:** `app/chat/[id].tsx`

Add support for scrolling to a specific message when conversation is opened with a message ID:

- Accept optional `messageId` param from navigation
- Use `scrollToIndex` or `scrollToItem` on FlatList when messageId is provided
- Highlight the target message briefly (optional visual feedback)

### 5. Update Tab Layout Title

**File:** `app/(tabs)/_layout.tsx`

Change the "Discover" tab title to "Search":

```typescript
<Tabs.Screen
  name="explore"
  options={{
    title: 'Search',
    tabBarIcon: ({ color }) => <IconSymbol size={28} name="magnifyingglass" color={color} />,
  }}
/>
```

## Key Implementation Notes

- Local filtering should be instant (no debounce)
- Deeper search should only trigger when explicitly requested via button
- Message search results need conversation context for navigation
- Scroll-to-message should handle cases where message isn't in initial load (may need to paginate backward)

### To-dos

- [ ] Add AI Settings menu item to profile screen
- [ ] Refactor explore screen to unified search with local filtering
- [ ] Implement 'Search for more' button when results ≤ 3
- [ ] Display results in grouped sections (People, Messages)
- [ ] Enhance searchService to return conversation context with messages
- [ ] Implement scroll-to-message functionality in chat screen
- [ ] Update tab title from 'Discover' to 'Search'