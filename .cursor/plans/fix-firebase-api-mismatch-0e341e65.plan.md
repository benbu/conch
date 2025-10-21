<!-- 0e341e65-ec60-484a-8eba-79dcade03db9 829be5d5-db74-4b7d-b5b3-f1d13a926175 -->
# Fix Firebase v9 Modular API Mismatch in Search Service

## Problem

`services/searchService.ts` uses Firebase v8 compat syntax (`db.collection()`) but `lib/firebase.ts` initializes Firebase using v9 modular API (`getFirestore()`), causing the error: `db.collection is not a function`.

## Solution

Update `services/searchService.ts` to use v9 modular API syntax.

### Changes Required

**File: `services/searchService.ts`**

1. **Update imports** (line 6):
   ```typescript
   import { collection, query, where, getDocs, doc, orderBy, limit } from 'firebase/firestore';
   import { auth, db } from '../lib/firebase';
   ```

2. **Convert `searchMessages()` function** (lines 22-83):

   - Replace `db.collection('conversations').where(...).get()` with `getDocs(query(collection(db, 'conversations'), where(...)))`
   - Replace nested `.collection().doc().collection()` with `collection(db, 'conversations', docId, 'messages')`

3. **Convert `searchConversations()` function** (lines 88-123):

   - Replace `db.collection('conversations').where(...).get()` with v9 syntax

4. **Convert `searchUsers()` function** (lines 128-164):

   - Replace `db.collection('users').limit(20).get()` with `getDocs(query(collection(db, 'users'), limit(20)))`

### Key Syntax Changes

- `db.collection('name')` → `collection(db, 'name')`
- `.where(...)` → `where(...)` (as query constraint)
- `.get()` → `getDocs(query)`
- `snapshot.docs` → remains the same
- `doc.data()` → remains the same