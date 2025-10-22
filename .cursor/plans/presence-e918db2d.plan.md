<!-- e918db2d-9698-4be6-820f-69506b7d2868 a427ead6-ac21-4f96-89a1-8a08651203f4 -->
# Presence Heartbeat and Activity Updates

## Scope

Implement a centralized heartbeat that:

- Sends `online` + refreshes `lastSeen` every 15s while app is active
- Triggers immediate heartbeat on user interactions (keyboard, key UI actions)
- Sends a heartbeat on login
- Keeps existing away/offline logic intact (away after 5 min idle, offline on background)

## Key Files to Change

- `app/_layout.tsx`: wire global heartbeat hook; ensure login triggers heartbeat; simplify away timer wiring
- `hooks/usePresenceHeartbeat.ts` (new): centralized heartbeat + activity detector (interval + keyboard + nav focus)
- `components/chat/InputBar.tsx`: emit heartbeat on focus/typing/send
- `services/presenceService.ts`: (optional) add small `heartbeat(userId)` wrapper that defers to `setUserOnline`

## Implementation Details

- Heartbeat cadence: 15s interval while `AppState === 'active'` and `!appearOffline`
- Throttle interactions: min 5s between heartbeats to avoid write spam
- On login: call `setUserOnline(user.id)` following `startPresenceTracking`
- Reset away timer on any heartbeat; set away after 5 min of inactivity
- Keep existing background transition -> set `offline` immediately

## Essential Snippets

- New hook outline `hooks/usePresenceHeartbeat.ts`:
```ts
export function usePresenceHeartbeat(userId?: string, appearOffline?: boolean) {
  // refs: lastHeartbeatAt, awayTimer, appState
  // sendHeartbeat: throttled -> setUserOnline(userId)
  // startInterval/stopInterval for 15s
  // Keyboard listeners -> sendHeartbeat()
  // AppState listener: active => sendHeartbeat()+startInterval+startAwayTimer; background => clear timers + updatePresence(userId, 'offline')
  // expose onActivity() to be called by UI (e.g., InputBar)
}
```

- `app/_layout.tsx` integration (conceptual):
```ts
useEffect(() => { if (user) startPresenceTracking(user.id, user.appearOffline ?? false); }, [user?.id]);
usePresenceHeartbeat(user?.id, user?.appearOffline);
```

- `components/chat/InputBar.tsx` calls:
```ts
const { onActivity } = usePresenceHeartbeatContext(); // or import a simple emitActivity()
// onFocus/onChangeText/onSend -> onActivity()
```


## Notes

- Activity-gated: no unconditional interval heartbeats. Only send if there was interaction within the last 15s, with at most one heartbeat per 15s.
- Avoid gesture stealing; rely on keyboard + explicit emits in key components and a lightweight scheduler; can add global touch later if needed.

## Updated Implementation Details

- Track `lastInteractionAt` and `lastHeartbeatAt`
- On any interaction: set `lastInteractionAt`; if `now - lastHeartbeatAt >= 15s` then send heartbeat immediately
- Scheduler (5s while active): if `lastInteractionAt > lastHeartbeatAt` AND `now - lastHeartbeatAt >= 15s`, send heartbeat
- On login: after `startPresenceTracking`, call `setUserOnline(user.id)` once
- Reset away timer on any interaction/heartbeat; set away after 5 min of inactivity
- Background: cancel timers and set `offline` immediately

### To-dos

- [ ] Create usePresenceHeartbeat hook with interval, AppState, keyboard, away timer
- [ ] Wire heartbeat hook in app/_layout.tsx; send heartbeat on login
- [ ] Emit heartbeat on InputBar focus/typing/send
- [ ] Add optional heartbeat(userId) helper to presenceService.ts
- [ ] Manually verify: login, typing, navigation keeps online; idle -> away; background -> offline