<!-- 1c443ab5-a0a5-4447-b60e-f074bd2de095 9d362115-0827-4d16-ab91-33c359166ddc -->
# Redesign Group Chat Header

## Overview

Restructure both group chat and direct chat headers to show avatars centered with title information in a floating transparent bar below.

## Changes Required

### 1. Update `app/chat/[id].tsx`

**Modify HeaderTitle Component (lines 292-333)**

- For group chats: Display `OverlappingAvatars` centered in the header
- For direct chats: Display a single user avatar (circular photo) centered in the header
- Remove all text from the header title area for both chat types

**Modify HeaderLeft Component (lines 336-348)**

- Remove the custom `HeaderLeft` override entirely to restore default back button for all chat types
- This ensures back button appears in top left for both group and direct chats

**Add Floating Title Bar Component**

- Create new component that displays:
- **Group chats**: Group name + member count (e.g., "Team Project • 5 members")
- **Direct chats**: Username + presence status (e.g., "John Doe • Online")
- Style with:
- Semi-transparent white background (`rgba(255, 255, 255, 0.95)`)
- Centered text
- Positioned to hover over top of chat messages
- Light shadow for depth
- Touchable for group name editing (admins only)

**Update Layout Structure (lines 366-395)**

- Insert floating title bar between ConnectionBanner and FlatList
- Use absolute positioning or wrapper View with proper z-index
- Ensure it hovers above messages without blocking interaction

### 2. Create Single Avatar Component (Optional)

- May need simple avatar component for direct chats to match the overlapping avatars styling
- Or extend `OverlappingAvatars` to handle single user case

### 3. Files to Modify

- `app/chat/[id].tsx` - Main chat screen with header configuration and layout

## Implementation Details

Key changes:

1. Move `<OverlappingAvatars>` from `HeaderLeft` to `HeaderTitle` for group chats
2. Add single avatar display in `HeaderTitle` for direct chats
3. Remove `HeaderLeft` override completely to restore back button
4. Create floating transparent bar showing title info for both chat types
5. Position floating bar to hover over messages with proper styling

### To-dos

- [ ] Modify HeaderTitle to show OverlappingAvatars centered and remove HeaderLeft override
- [ ] Create floating title bar component with transparent background showing group name and member count
- [ ] Integrate floating title bar into chat screen layout with proper positioning