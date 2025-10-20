# Conch Social — Product Requirements Document (React Native + Expo)

**Platform:** React Native (Expo, TypeScript, React Navigation)

**Backend:** Firebase (Auth, Firestore, Cloud Functions, Cloud Storage, Cloud Messaging)

**AI Runtime:** Vercel AI SDK integrated within Cloud Functions and client-side hooks for AI actions, handling function-calling and lightweight RAG over conversation history stored in Firestore/Storage.

---

## 1) Product Summary

Conch Social is a production-grade **cross-platform mobile messenger** built with **React Native + Expo**, designed for **Remote Team Professionals** who collaborate asynchronously across time zones. It combines reliable, real-time chat with **AI-powered productivity tools** that reduce information overload, track decisions, and simplify coordination.

---

## 2) Goals & Non‑Goals

### 2.1 Goals

1. **Reliable Messaging Core:** Cross-platform (iOS, Android, Web) chat with real-time updates via Firestore.
2. **AI Productivity Suite:** Smart summarization, task extraction, decision tracking, and meeting suggestions.
3. **Offline-Resilient UX:** Message caching, outbox queuing, and offline reading.
4. **Security & Privacy:** Firebase Rules, scoped access, encrypted transport, and transparent AI permissions.
5. **Advanced Option B:** **Proactive Assistant** that detects scheduling intent and suggests available times based on user calendars.

### 2.2 Non‑Goals (v1)

* Voice or video calling.
* Heavy local data storage (Room replaced by lightweight async storage caching).
* Native-only Android code.

---

## 3) Target Persona

**Remote Team Professional** — engineers, designers, and managers in globally distributed teams.

**Key Problems**

* Hard to keep track of decisions in long threads.
* Repeated questions or missed tasks due to context loss.
* Scheduling conflicts due to multiple time zones.

**How Conch Social Helps**

* **Thread Summaries:** AI-powered catch-up for long conversations.
* **Action Item Extraction:** Automatic task list generation.
* **Priority Detection:** Identify urgent or critical messages.
* **Decision Tracking:** Highlight and store key resolutions.
* **Proactive Assistant (Advanced Option B):** Suggests meeting times and syncs with Google/Microsoft calendars.

---

## 4) User Stories

### 4.1 Authentication & Profile

* As a user, I can log in using email, Google, Apple, or phone number via Firebase Auth.
* As a user, I can set my time zone, work hours, and display name.

### 4.2 Messaging

* As a user, I can send and receive text messages in real time.
* As a user, I can share images or attachments (Firebase Storage).
* As a user, I can see message delivery and read receipts.
* As a user, I can read cached messages offline and resend queued messages when reconnected.
* As a user, I can search for other users and start 1:1 or group chats.

### 4.3 AI Features

* **Summaries:** Request concise thread summaries.
* **Action Extraction:** List actionable items and due dates.
* **Decision Tracking:** Detect and record decisions in chat.
* **Priority Detection:** Highlight high-importance messages.
* **Proactive Assistant (Option B):** Suggests meeting times and syncs with calendars.

All AI actions are **user-initiated only**, never automatic.

### 4.4 Settings & Privacy

* AI permissions are opt-in per chat.
* Data deletion on account removal.
* User control over connected calendars.

---

## 5) Functional Requirements

### 5.1 Messaging Core

* Firestore listeners for real-time updates.
* Message states: sending, sent, delivered, read.
* Image uploads via Firebase Storage.
* FCM notifications for new messages.

### 5.2 AI Features

* Cloud Functions (Node.js + Vercel AI SDK) for summaries, actions, and scheduling.
* Cached results stored under each conversation’s `aiArtifacts` collection.
* Scheduling integrated with Google/Microsoft calendars (OAuth-based).

### 5.3 Offline

* AsyncStorage for message cache.
* Queue system using background tasks for resend.

---

## 6) Non‑Functional Requirements

* **Performance:** Message render ≤ 50 ms; load ≤ 300 ms.
* **Reliability:** 99.9% message success.
* **Security:** Firebase Auth + Rules + HTTPS.
* **Accessibility:** React Native Accessibility APIs + high-contrast mode.

---

## 7) System Architecture

* **Client:** React Native (Expo, TypeScript), Firebase JS SDK, Zustand or Recoil for state management, React Navigation for routing.
* **Backend:** Firebase Firestore, Storage, Functions, FCM.
* **AI Layer:** Vercel AI SDK integrated into Firebase Functions.

**Scheduling Workflow:**

1. Detect scheduling intent.
2. Fetch working hours/time zones from user profiles.
3. Retrieve available times from linked calendars.
4. Generate meeting slots and suggest inline in chat.

---

## 8) Data Model (Firestore)

```
/users/{userId}
  displayName, photoURL, tz, workHours
/conversations/{conversationId}
  title, createdBy, createdAt, lastMessageAt
/conversations/{conversationId}/messages/{messageId}
  senderId, text, attachments[], createdAt, deliveryStatus
/aiArtifacts/{conversationId}/summaries/{summaryId}
  text, createdAt, sourceMessageIds[]
/aiArtifacts/{conversationId}/actions/{actionId}
  items[{title, ownerId, dueAt}]
/aiArtifacts/{conversationId}/decisions/{decisionId}
  statement, createdAt, sourceMessageIds[]
/aiArtifacts/{conversationId}/suggestedMeetings/{meetingId}
  participants[], timeOptions[], createdAt
```

---

## 9) Cloud Functions APIs

* `/ai/summarizeThread` → summary text
* `/ai/extractActions` → task list
* `/ai/detectPriority` → important messages
* `/ai/trackDecision` → key decisions
* `/ai/suggestMeetings` → meeting suggestions (calendar-integrated)

---

## 10) UX Overview

* **Home Screen:** Chat list ordered by recency.
* **Chat Screen:** Messages with delivery/read indicators and AI quick actions.
* **AI Sheet:** Summaries, Actions, and Decisions.
* **Meeting Assistant Popup:** Inline calendar slots suggested for approval.

---

## 11) Milestones

* **MVP:** Auth, messaging, Firestore sync, offline cache.
* **Early:** AI summaries, actions, and decisions.
* **Final:** Scheduling assistant with calendar integration and UX polish.

---

## 12) Risks & Mitigations

* **Network Variability:** Use Expo’s offline APIs for caching.
* **AI Latency:** Show progress spinners and use cached summaries.
* **Calendar Permissions:** Transparent OAuth consent screens.

---

## 13) Confirmed Decisions

* Scheduling syncs with Google/Microsoft calendars via OAuth.
* Users must approve AI meeting suggestions before posting.
* All AI actions are user-initiated and never automatic.
* Summaries only refresh on user request.
