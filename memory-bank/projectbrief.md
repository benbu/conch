# Project Brief: Conch Social

## Overview
Conch Social is a production-grade **cross-platform mobile messenger** built with **React Native + Expo**, designed for **Remote Team Professionals** who collaborate asynchronously across time zones. It combines reliable, real-time chat with **AI-powered productivity tools** that reduce information overload, track decisions, and simplify coordination.

## Core Requirements

### Primary Goals
1. **Reliable Messaging Core:** Cross-platform (iOS, Android, Web) chat with real-time updates via Firestore
2. **AI Productivity Suite:** Smart summarization, task extraction, decision tracking, and meeting suggestions
3. **Offline-Resilient UX:** Message caching, outbox queuing, and offline reading
4. **Security & Privacy:** Firebase Rules, scoped access, encrypted transport, and transparent AI permissions
5. **Advanced Option B:** Proactive Assistant that detects scheduling intent and suggests available times based on user calendars

### Non-Goals (v1)
- Voice or video calling
- Heavy local data storage (Room replaced by lightweight async storage caching)
- Native-only Android code

## Target Persona
**Remote Team Professional** — engineers, designers, and managers in globally distributed teams.

### Key Problems They Face
- Hard to keep track of decisions in long threads
- Repeated questions or missed tasks due to context loss
- Scheduling conflicts due to multiple time zones

### How Conch Social Helps
- **Thread Summaries:** AI-powered catch-up for long conversations
- **Action Item Extraction:** Automatic task list generation
- **Priority Detection:** Identify urgent or critical messages
- **Decision Tracking:** Highlight and store key resolutions
- **Proactive Assistant (Advanced Option B):** Suggests meeting times and syncs with Google/Microsoft calendars

## Success Criteria
- **Performance:** Message render ≤ 50 ms; load ≤ 300 ms
- **Reliability:** 99.9% message success rate
- **Security:** Firebase Auth + Rules + HTTPS
- **Accessibility:** React Native Accessibility APIs + high-contrast mode

## Key Constraints
- Must work offline with graceful degradation
- All AI actions are user-initiated only, never automatic
- Users must approve AI meeting suggestions before posting
- Cross-platform consistency across iOS, Android, and Web

## Technology Stack
- **Frontend:** React Native (Expo, TypeScript)
- **Backend:** Firebase (Auth, Firestore, Cloud Functions, Cloud Storage, FCM)
- **AI Layer:** Vercel AI SDK integrated within Cloud Functions
- **State Management:** Zustand or Recoil
- **Navigation:** React Navigation

## Milestones
1. **MVP:** Auth, messaging, Firestore sync, offline cache
2. **Early:** AI summaries, actions, and decisions
3. **Final:** Scheduling assistant with calendar integration and UX polish

