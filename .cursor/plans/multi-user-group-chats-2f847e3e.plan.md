<!-- 2f847e3e-c48f-4b98-99a2-d3207b0a2f43 892389c7-ecec-41f5-bdfb-1cc7c0cb4549 -->
# Multi-User Group Chat Implementation

## Overview

Add support for multi-user group chats with role-based permissions, allowing users to select multiple participants, manage members, and view group details with overlapping avatars.

## Key Features

- Multi-select users before creating a chat
- Three roles: admin (can promote & add members), team (can add members), user (basic access)
- Overlapping avatars showing first 3 members + count
- Member management modal with add/promote/leave functionality
- Editable group names
- Minimum 3 participants for group chats (2 = direct)

## Implementation Steps

### 1. Update Type Definitions (`types/index.ts`)

Add role-based participant tracking:

```typescript
export interface ConversationMember {
  userId: string;
  role: 'admin' | 'team' | 'user';
  joinedAt: Date;
}

export interface Conversation {
  // ... existing fields
  members?: ConversationMember[]; // Replaces participantIds logic
  name?: string; // Custom editable name for groups
}
```

### 2. Update Firestore Service (`services/firestoreService.ts`)

**Modify `createConversation`**:

- Accept `members: ConversationMember[]` parameter
- Store member roles in Firestore
- Set creator as admin by default

**Add new functions**:

- `updateConversationName(convId, name)` - Update group name
- `addMemberToConversation(convId, userId, role)` - Add new member
- `updateMemberRole(convId, userId, role)` - Promote/demote member
- `removeMemberFromConversation(convId, userId)` - Remove/leave chat
- `getUserRole(convId, userId)` - Get user's role in conversation

### 3. Multi-Select UI in Explore Screen (`app/(tabs)/explore.tsx`)

**Add state**:

```typescript
const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
```

**UI Changes**:

- Add checkbox/selection indicator to user result items
- Show floating action button with selected count when users are selected
- Add "Create Group Chat" button (appears when ≥2 users selected)
- Add "Start Chat" button (appears when 1 user selected)
- Allow toggling selection mode with long-press or dedicated button

**Flow**:

1. User enters multi-select mode
2. Selects 2+ users
3. Taps "Create Group" → Opens group name input modal → Creates chat
4. For single user → Direct chat (existing flow)

### 4. Group Name Modal Component (`components/GroupNameModal.tsx`)

New modal component for:

- Setting initial group name when creating
- Editing existing group name (admin only)

**Props**: `visible`, `onClose`, `onSubmit(name)`, `initialName?`, `participantCount`

### 5. Overlapping Avatars Component (`components/OverlappingAvatars.tsx`)

New component showing:

- First 3 user avatars overlapped by 75%
- "+X more" badge if more than 3 members
- Clickable to open member list

**Props**: `members: User[]`, `maxVisible: number`, `onPress`

### 6. Member Management Modal (`components/MemberManagementModal.tsx`)

Full-screen or sheet modal showing:

- All members with their roles (badges)
- "Add Members" button (visible for admin/team)
- Role change dropdown (visible for admins, on other members)
- "Leave Group" button at bottom (hidden for last admin)
- Each member shows avatar, name, role badge

**Actions**:

- Admins: Can promote/demote members, add members, leave (if not last admin)
- Team: Can add members, leave
- Users: Can only leave

### 7. Update Chat Screen Header (`app/chat/[id].tsx`)

**For group chats**:

- Replace single user presence with `<OverlappingAvatars />`
- Show group name (editable on tap for admins)
- Clicking avatars opens `<MemberManagementModal />`

**For direct chats**:

- Keep existing single-user presence display

### 8. Update Chat Store (`stores/chatStore.ts`)

Add to store:

- `updateConversationName(convId, name)`
- `addConversationMember(convId, member)`
- `updateConversationMemberRole(convId, userId, role)`
- `removeConversationMember(convId, userId)`

### 9. Update Conversation Hook (`hooks/useConversations.ts`)

Add functions:

- `updateGroupName(convId, name)`
- `addGroupMember(convId, userId, role)`
- `updateMemberRole(convId, userId, role)`
- `leaveGroup(convId)`

### 10. Firestore Security Rules

Update rules to check role-based permissions:

- Read: All members can read
- Write messages: All members can write
- Add members: Only admin/team
- Update roles: Only admins
- Leave: All members can remove themselves
- Update name: Only admins

### 11. Update Conversation List (`app/(tabs)/index.tsx`)

Display group chats differently:

- Show group name or auto-generated name
- Show overlapping avatars in list item (mini version, 2-3 avatars)
- Show member count for groups

## Files to Create

- `components/OverlappingAvatars.tsx`
- `components/GroupNameModal.tsx`
- `components/MemberManagementModal.tsx`
- `hooks/useGroupMembers.ts` (optional, for member management logic)

## Files to Modify

- `types/index.ts`
- `services/firestoreService.ts`
- `app/(tabs)/explore.tsx`
- `app/chat/[id].tsx`
- `app/(tabs)/index.tsx`
- `hooks/useConversations.ts`
- `stores/chatStore.ts`

## Edge Cases to Handle

- Last admin leaving (must promote someone else first)
- Removing yourself vs being removed by admin
- Creating group with duplicate users
- Direct chat → group chat conversion (when adding 3rd person)
- Empty group names (use auto-generated fallback)
- Permission checks before all actions

### To-dos

- [ ] Update type definitions to include ConversationMember with roles and group-specific fields
- [ ] Add Firestore functions for member management (add, update role, remove, update name)
- [ ] Create OverlappingAvatars component showing first 3 members with +X more badge
- [ ] Create GroupNameModal component for setting/editing group names
- [ ] Create MemberManagementModal component with role management and add members functionality
- [ ] Add multi-select mode to explore screen for selecting multiple users
- [ ] Update chat screen header to show overlapping avatars for group chats
- [ ] Update conversation list to display group chats with mini avatars and member count
- [ ] Add member management actions to chat store
- [ ] Update useConversations hook with group management functions
- [ ] Document Firestore security rules for role-based permissions