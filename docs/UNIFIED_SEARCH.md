# Unified Search Feature

**Implemented:** October 21, 2025  
**Status:** ✅ Complete

## Overview

The Unified Search feature transforms the Discover tab into a powerful search experience that searches both **people** and **messages** across all conversations. The search includes intelligent local filtering with optional deeper database search when results are limited.

## Key Features

### 1. Real-Time Local Filtering

- **Instant Results**: As users type, the search instantly filters local data without any delay
- **No Debouncing**: Provides immediate feedback on every keystroke
- **Dual Search**: Searches both users and messages simultaneously

**What's Searched Locally:**
- Recent conversation participants (users the current user has chatted with)
- Last messages from all conversations
- User display names and email addresses
- Message text content

### 2. Intelligent Deeper Search

When local results are limited (≤3 items) and the query is at least 3 characters, a "Search for more results" button appears.

**Trigger Conditions:**
- Search query ≥ 3 characters
- Local results ≤ 3 items
- User hasn't already performed deeper search

**Deep Search Includes:**
- All users in the database (not just conversation participants)
- Messages across all conversations (paginated for performance)
- Results sorted by relevance and recency

### 3. Grouped Results Display

Results are organized into clear sections using React Native's `SectionList`:

**People Section:**
- User avatar (first letter of display name)
- Display name
- Email address
- "Chat" action button

**Messages Section:**
- Conversation name
- Message preview (up to 2 lines)
- Timestamp (formatted with date-fns)
- Message avatar icon

### 4. Smart Navigation

**From User Results:**
- Checks if direct conversation already exists
- Opens existing conversation OR creates new one
- Navigates to chat screen automatically

**From Message Results:**
- Navigates to conversation with `messageId` parameter
- Triggers scroll-to-message functionality
- Highlights target message for 2 seconds
- Yellow background with gold border for visual feedback

## Implementation Details

### File Structure

```
app/(tabs)/explore.tsx         # Main search screen
services/searchService.ts       # Search logic and Firestore queries
app/chat/[id].tsx              # Chat screen with scroll-to-message
```

### Key Components

#### Search Input
```typescript
<TextInput
  placeholder="Search people and messages..."
  value={searchQuery}
  onChangeText={setSearchQuery}
  autoCapitalize="none"
  autoCorrect={false}
/>
```

#### Local Filtering (useMemo)
```typescript
const localFilteredResults = useMemo(() => {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return { users: [], messages: [] };

  const filteredUsers = localUsers.filter(
    (u) => u.displayName?.toLowerCase().includes(q) ||
           u.email?.toLowerCase().includes(q)
  );

  const filteredMessages = localMessages.filter(
    (m) => m.message.text?.toLowerCase().includes(q)
  );

  return { users: filteredUsers, messages: filteredMessages };
}, [searchQuery, localUsers, localMessages]);
```

#### Deep Search Button
```typescript
{showDeepSearchButton && (
  <TouchableOpacity
    style={styles.deepSearchButton}
    onPress={handleDeepSearch}
  >
    <Text>🔍 Search for more results</Text>
  </TouchableOpacity>
)}
```

### Scroll-to-Message Feature

When a message search result is tapped:

1. **Navigation**: Passes `messageId` as query parameter
   ```typescript
   router.push(`/chat/${conversationId}?messageId=${messageId}`);
   ```

2. **Parameter Extraction**: Chat screen reads the parameter
   ```typescript
   const targetMessageId = Array.isArray(params.messageId) 
     ? params.messageId?.[0] 
     : params.messageId;
   ```

3. **Scroll Effect**: Automatically scrolls when messages load
   ```typescript
   useEffect(() => {
     if (targetMessageId && messages.length > 0 && !loading) {
       const messageIndex = messages.findIndex(m => m.id === targetMessageId);
       if (messageIndex !== -1) {
         flatListRef.current?.scrollToIndex({
           index: messageIndex,
           animated: true,
           viewPosition: 0.5,
         });
         setHighlightedMessageId(targetMessageId);
         setTimeout(() => setHighlightedMessageId(null), 2000);
       }
     }
   }, [targetMessageId, messages.length, loading]);
   ```

4. **Visual Highlight**: Yellow background for 2 seconds
   ```typescript
   highlightedMessageContainer: {
     backgroundColor: '#FFF9C4',
     borderLeftWidth: 4,
     borderLeftColor: '#FFC107',
     paddingLeft: 8,
   }
   ```

### Search Service Enhancements

**Updated SearchResult Interface:**
```typescript
export interface SearchResult {
  type: 'message' | 'conversation' | 'user';
  id: string;
  data: Message | Conversation | User;
  conversationId?: string;
  conversationTitle?: string;  // NEW
  highlights?: string[];
  timestamp?: Date;             // NEW
}
```

**Enhanced Message Search:**
- Includes conversation title with each result
- Adds timestamp for sorting
- Sorts results by recency (newest first)

## User Experience Flow

### Search Flow

1. **User opens Search tab**
   - Empty state shows: "Search for people and messages across all your conversations"

2. **User starts typing**
   - Local results appear instantly
   - Grouped into People and Messages sections

3. **Limited results scenario**
   - If ≤3 results and query ≥3 chars
   - "Search for more results" button appears

4. **User clicks deep search**
   - Loading indicator shows
   - Comprehensive database search runs
   - Results replace local results
   - Button disappears (no duplicate searches)

5. **Query changes**
   - Deep search resets
   - Back to local filtering
   - Button can appear again if conditions met

### Navigation Flow

#### From People Result:
```
Tap user → Check existing conversation → 
  If exists: Open chat →
  If not: Create conversation → Open chat
```

#### From Message Result:
```
Tap message → Navigate with messageId → 
Chat loads → Scroll to message → 
Highlight message → Remove highlight after 2s
```

## Performance Considerations

### Local Search Optimization
- `useMemo` prevents unnecessary re-filtering
- Only re-runs when `searchQuery`, `localUsers`, or `localMessages` change
- No network calls until deep search requested

### Deep Search Optimization
- Only triggered explicitly by user
- Debounced internally by search service
- Limited results per query (100 messages per conversation)
- Results cached until query changes

### Scroll Optimization
- `onScrollToIndexFailed` handler for robustness
- Retries scroll after 100ms if first attempt fails
- Handles cases where message isn't in initial render

## Edge Cases Handled

1. **Message not in loaded messages**: Handled by scroll failure callback
2. **Conversation doesn't exist yet**: Creates new conversation before navigating
3. **Empty search query**: Shows helpful empty state
4. **No results**: Clear "No results found" message
5. **Network failure during deep search**: Error caught, empty results shown
6. **User changes mind**: Query change resets deep search state

## AI Settings Navigation

### Implementation

Added menu item to Profile screen:
```typescript
<TouchableOpacity
  style={styles.menuItem}
  onPress={() => router.push('/(tabs)/ai-settings')}
>
  <Text style={styles.menuItemText}>✨ AI Settings</Text>
  <Text style={styles.menuItemChevron}>›</Text>
</TouchableOpacity>
```

**Location:** After "Edit Profile" in the settings section

**Navigation Path:** Profile → ✨ AI Settings → AI Settings Screen

## Tab Title Update

Changed from "Discover" to "Search" to better reflect the unified search functionality:

```typescript
<Tabs.Screen
  name="explore"
  options={{
    title: 'Search',
    tabBarIcon: ({ color }) => <IconSymbol size={28} name="magnifyingglass" color={color} />,
  }}
/>
```

## Future Enhancements

Potential improvements for future iterations:

1. **Search History**: Save recent searches
2. **Search Filters**: Filter by date, sender, conversation
3. **Fuzzy Matching**: Handle typos and partial matches
4. **Search Highlighting**: Highlight matching text in results
5. **Voice Search**: Speech-to-text search input
6. **Search Analytics**: Track popular searches
7. **Infinite Scroll**: Load more results as user scrolls
8. **Search Suggestions**: Auto-complete based on history

## Testing Recommendations

### Manual Testing Checklist

- [ ] Type in search - results appear instantly
- [ ] Search for known user - appears in People section
- [ ] Search for message text - appears in Messages section
- [ ] Trigger deep search (≤3 results) - button appears
- [ ] Click deep search - loading shows, results update
- [ ] Tap user result - opens/creates conversation
- [ ] Tap message result - opens chat and scrolls to message
- [ ] Message highlights - yellow background for 2 seconds
- [ ] Change query - deep search resets
- [ ] Empty query - shows empty state
- [ ] No results - shows "No results found"
- [ ] Navigate to AI Settings from Profile - opens AI Settings screen

### Edge Case Testing

- [ ] Search with special characters
- [ ] Very long search queries
- [ ] Rapid typing (stress test local filtering)
- [ ] Multiple deep searches in succession
- [ ] Navigate away during deep search
- [ ] Message not visible (requires pagination)
- [ ] User with no conversations yet

## Related Documentation

- [Search Service](../services/searchService.ts) - Core search logic
- [Firebase Integration](./SETUP.md) - Firestore configuration
- [Navigation Guide](./NAVIGATION.md) - Routing and navigation patterns
- [AI Settings Screen](../app/(tabs)/ai-settings.tsx) - AI feature controls

## Metrics to Track

- Average search query length
- Local vs deep search usage ratio
- Most common search terms
- Search-to-action conversion rate
- Time from search to message navigation
- Deep search trigger frequency
- AI Settings access frequency

---

**Last Updated:** October 21, 2025  
**Maintained By:** Development Team  
**Questions?** See [Contributing Guide](../CONTRIBUTING.md)

