# State Management Patterns

Phase 34 で整理した状態管理の設計方針。

## State Categories

| Type | Examples | Recommended Tool |
|------|----------|-----------------|
| Server State | Users, Tasks, OKR | fetch + useState (current) |
| Client State | Modal open/close, form input | useState / useReducer |
| Global State | Auth, Workspace | React Context |

## Current FDC Architecture

FDC uses a simple but effective pattern:

- **Server State**: Direct `fetch()` calls with `useState` in page components
- **Client State**: `useState` for UI interactions
- **Global State**: React Context (`AuthContext`)

## Cache Strategy Guide

| Data Type | Refresh Strategy | Notes |
|-----------|-----------------|-------|
| User profile | On page load | Via session cookie |
| Task list | After mutation | Re-fetch after create/update/delete |
| OKR data | After mutation | Re-fetch after changes |
| Brand / Canvas / MVV | After mutation | Infrequent updates |
| Audit logs | On demand | No client-side cache |

## Server State vs Client State

### Server State (API data)
- Owned by the server (database)
- Shared across users
- Can become stale
- Needs synchronization

### Client State (UI data)
- Exists only in the browser
- Private to the current user session
- Always up-to-date
- No synchronization needed

## When to Use What

### React Context (current FDC approach)
- Auth state (logged-in user)
- Data that rarely changes
- Values consumed by many components

### useState (current FDC approach)
- Form inputs
- Modal visibility
- Loading / error states
- Local UI state

## Future Considerations

- **React Query / SWR**: When data fetching patterns become complex
- **Zustand**: When global state needs frequent updates from many components
- **Server Components**: When migrating to RSC data patterns (Next.js App Router)

## Optimistic UI Pattern

```
User action
  -> Update local state immediately (optimistic)
  -> Send API request in background
  -> On success: confirm (no-op)
  -> On failure: rollback local state + show error
```

See `lib/utils/apply-command.ts` for the reference implementation.
