<!-- 9eef7e52-6ff9-455c-b32d-1fefbaaa54d2 29adf24f-9292-415c-8303-e92eacd67d1d -->
# Fix Firestore Timestamp Conversion for lastMessage.createdAt

## Problem

When conversations are loaded from Firestore, the `lastMessage.createdAt` field remains a Firestore Timestamp object instead of being converted to a JavaScript Date. This causes a crash in the explore screen when it tries to call `.getTime()` on the timestamp.

## Root Cause

In `services/firestoreService.ts`:

- Lines 104-105 properly convert top-level `createdAt` and `lastMessageAt` using `.toDate()`
- Line 106 passes `lastMessage` through as-is without converting its nested `createdAt` field
- Same issue exists in both `subscribeToConversations` (line 106) and `getUserConversations` (line 73)

## Solution

Convert the `lastMessage.createdAt` Timestamp to a Date when reading conversation data from Firestore.

### File Changes

**`services/firestoreService.ts`**

1. In `getUserConversations` function (around line 73):

- Convert `lastMessage.createdAt` to Date if it exists

2. In `subscribeToConversations` function (around line 106):

- Convert `lastMessage.createdAt` to Date if it exists

Both locations need to check if `lastMessage` exists and if it has a `createdAt` field, then convert it using `.toDate()`.

## Testing

After the fix, sending a message to someone should work without errors in the explore screen, as the timestamp will be properly converted to a Date object that has the `.getTime()` method.