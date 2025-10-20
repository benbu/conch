# Product Context

## Why This Project Exists

Remote team collaboration has become the norm, but existing messaging tools fall short for teams working across multiple time zones. Conversations become long and unwieldy, critical decisions get buried in chat history, and coordinating meetings across time zones remains a manual, frustrating process.

Conch Social exists to solve these specific pain points for distributed teams by combining reliable messaging with intelligent AI assistance that helps teams stay aligned without the cognitive overhead.

## Problems It Solves

### 1. Information Overload
**Problem:** Team members returning from time off or joining long-running conversations struggle to catch up on hundreds of messages.

**Solution:** AI-powered thread summaries provide concise catch-ups on demand, highlighting key points without requiring users to read entire conversation histories.

### 2. Lost Action Items
**Problem:** Tasks mentioned in chat discussions often get forgotten or require manual tracking in separate tools.

**Solution:** Automatic action item extraction that identifies tasks, assigns owners, and tracks due dates directly from conversation context.

### 3. Buried Decisions
**Problem:** Important decisions made during discussions become hard to find later, leading to repeated debates or confusion.

**Solution:** AI-powered decision tracking that identifies, highlights, and stores key resolutions for easy reference.

### 4. Time Zone Coordination Chaos
**Problem:** Scheduling meetings across multiple time zones requires tedious back-and-forth and manual calendar checking.

**Solution:** Proactive scheduling assistant that detects scheduling intent, accesses linked calendars, and suggests mutually available meeting times inline.

### 5. Priority Blindness
**Problem:** Urgent messages get lost in the noise of routine chat, causing delays in critical responses.

**Solution:** AI priority detection that identifies and highlights time-sensitive or high-importance messages.

## How It Works

### Core Messaging Experience
- Real-time chat powered by Firebase Firestore with instant updates
- Support for text messages, images, and file attachments
- Message delivery and read receipts for accountability
- Offline support with automatic message queuing and resend
- 1:1 and group conversations with user search

### AI Productivity Layer
All AI features are **user-initiated only** and never automatic:

1. **Thread Summaries:** User requests summary → AI analyzes conversation history → Returns concise overview
2. **Action Extraction:** User triggers analysis → AI identifies tasks with owners and dates → Displays actionable list
3. **Decision Tracking:** User marks decision → AI extracts and stores decision statement → Creates searchable record
4. **Priority Detection:** User runs scan → AI evaluates message importance → Highlights critical items
5. **Meeting Suggestions:** User indicates scheduling need → AI checks calendars → Suggests available time slots for approval

### Privacy & Control
- All AI permissions are opt-in per chat
- Users must explicitly approve AI meeting suggestions before they're posted
- Data deletion guaranteed on account removal
- Full user control over connected calendars
- Transparent about what data AI processes

## User Experience Goals

### Speed & Responsiveness
- Messages render in ≤ 50ms
- Chat screen loads in ≤ 300ms
- Real-time updates feel instant

### Reliability
- 99.9% message delivery success rate
- Graceful offline degradation with clear status indicators
- Automatic recovery when connectivity returns

### Simplicity
- Intuitive navigation with clear visual hierarchy
- AI features accessible but not intrusive
- Minimal taps to complete common actions

### Accessibility
- Full support for screen readers
- High-contrast mode for visibility
- Keyboard navigation support
- Proper semantic labeling

### Cross-Platform Consistency
- Identical feature set on iOS, Android, and Web
- Consistent visual design and interaction patterns
- Synchronized state across all devices

