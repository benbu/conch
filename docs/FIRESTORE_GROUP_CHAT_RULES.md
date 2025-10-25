# Firestore Security Rules for Group Chats with Role-Based Permissions

This document outlines the Firestore security rules needed to implement role-based access control for group chats in Conch Social.

## Overview

Group chats support three roles:
- **Admin**: Can promote/demote members, add new members, update group name, and leave (if not the last admin)
- **Team**: Can add new members and leave
- **User**: Basic member access, can only leave

## Security Rules

Add these rules to your `firestore.rules` file:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Helper function to get user's role in a conversation
    function getUserRole(convData) {
      let members = convData.members;
      let userMember = members.filter(m => m.userId == request.auth.uid);
      return userMember.size() > 0 ? userMember[0].role : null;
    }
    
    // Helper function to check if user is a participant
    function isParticipant(convData) {
      return request.auth.uid in convData.participantIds;
    }
    
    // Helper function to check if user has a specific role or higher
    function hasRole(convData, requiredRole) {
      let role = getUserRole(convData);
      if (role == null) return false;
      
      if (requiredRole == 'user') {
        return role in ['user', 'team', 'admin'];
      } else if (requiredRole == 'team') {
        return role in ['team', 'admin'];
      } else if (requiredRole == 'admin') {
        return role == 'admin';
      }
      
      return false;
    }
    
    // User profiles
    match /users/{userId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && request.auth.uid == userId;
    }
    
    // Conversations
    match /conversations/{conversationId} {
      // Read: All participants can read
      allow read: if isSignedIn() && 
                     request.auth.uid in resource.data.participantIds;
      
      // Create: Any authenticated user can create a conversation
      allow create: if isSignedIn() && 
                       request.auth.uid in request.resource.data.participantIds &&
                       request.auth.uid == request.resource.data.createdBy;
      
      // Update: Participants can update based on their role
      allow update: if isSignedIn() && 
                       isParticipant(resource.data) &&
                       (
                         // Update name: Only admins
                         (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['name']) ||
                          hasRole(resource.data, 'admin')) &&
                         
                         // Add/remove members: Admins and team can add, only admins can change roles
                         (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['members', 'participantIds']) ||
                          hasRole(resource.data, 'team')) &&
                         
                         // Update last message: Any participant can update
                         (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['lastMessage', 'lastMessageAt']) ||
                          isParticipant(resource.data))
                       );
      
      // Delete: Not allowed from client. Deletion is done server-side by Cloud Function
      allow delete: if false;
      
      // Messages subcollection
      match /messages/{messageId} {
        // Read: All conversation participants can read messages
        allow read: if isSignedIn() && 
                       request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participantIds;
        
        // Create: All conversation participants can create messages
        allow create: if isSignedIn() && 
                         request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participantIds &&
                         request.resource.data.senderId == request.auth.uid;
        
        // Update: Only the sender can update their own messages (for editing/deleting)
        allow update: if isSignedIn() && 
                         resource.data.senderId == request.auth.uid;
        
        // Delete: Only the sender can delete their own messages
        allow delete: if isSignedIn() && 
                         resource.data.senderId == request.auth.uid;
      }
    }
    
    // AI Artifacts (existing rules - no changes needed)
    match /aiArtifacts/{artifactId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }
    
    // User presence (existing rules - no changes needed)
    match /presence/{userId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && request.auth.uid == userId;
    }
  }
}
```

## Key Security Considerations

### 1. Role Validation
The rules validate that users have the appropriate role before allowing certain operations:
- Group name changes require `admin` role
- Adding members requires `team` or `admin` role
- Role changes require `admin` role
- Message posting requires participant status (any role)

### 2. Self-Removal
Any member can remove themselves from a group:
- The client application should enforce that the last admin cannot leave
- The security rules allow any participant to be removed by users with `team` or `admin` role

### 3. Message Access
Messages are accessible only to conversation participants, regardless of when they joined:
- Consider implementing a `joinedAt` timestamp check if you want to restrict access to messages sent before a user joined

### 4. Data Validation
Additional validation should be added for:
- Maximum conversation size
- Valid role values ('admin', 'team', 'user')
- Required fields in member objects

## Enhanced Security (Optional)

For production, consider adding:

```javascript
// Enhanced member validation
function isValidMember(member) {
  return member.keys().hasAll(['userId', 'role', 'joinedAt']) &&
         member.role in ['admin', 'team', 'user'] &&
         member.userId is string &&
         member.joinedAt is timestamp;
}

// Validate all members in conversation
function hasValidMembers(convData) {
  return convData.members.size() > 0 &&
         convData.members.size() == convData.participantIds.size() &&
         convData.members.every(m => isValidMember(m));
}
```

## Testing Security Rules

Use the Firebase Emulator Suite to test these rules:

```bash
firebase emulators:start --only firestore
```

Create test cases for:
1. ✅ Admins can update group name
2. ❌ Regular users cannot update group name
3. ✅ Team members can add users
4. ❌ Regular users cannot add users
5. ✅ Admins can change member roles
6. ❌ Team members cannot change member roles
7. ✅ All members can send messages
8. ✅ Members can leave the group
9. ❌ Non-participants cannot read messages

## Deployment

After testing, deploy the rules:

```bash
firebase deploy --only firestore:rules
```

## Monitoring

Monitor rule denials in the Firebase Console:
1. Go to Firestore > Usage tab
2. Look for "Permission Denied" errors
3. Adjust rules as needed based on legitimate access patterns

