<!-- e918db2d-9698-4be6-820f-69506b7d2868 41cbbbfd-3e65-4556-bd46-3c3d6a8058a8 -->
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

- No gesture stealing: rely on keyboard + periodic timer + explicit calls in high-traffic components (chat input, send) instead of a global touch-capture wrapper.
- Can extend later to lightweight global touch via gesture-handler if needed.

### To-dos

- [ ] Create usePresenceHeartbeat hook with interval, AppState, keyboard, away timer
- [ ] Wire heartbeat hook in app/_layout.tsx; send heartbeat on login
- [ ] Emit heartbeat on InputBar focus/typing/send
- [ ] Add optional heartbeat(userId) helper to presenceService.ts
- [ ] Manually verify: login, typing, navigation keeps online; idle -> away; background -> offline