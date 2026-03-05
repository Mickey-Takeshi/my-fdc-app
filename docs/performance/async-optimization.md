# Async Optimization Guide (Phase 86)

## Overview

This guide documents async/await optimization patterns applied to the FDC Modular Starter codebase,
focusing on eliminating unnecessary sequential (waterfall) patterns.

## Problem: Async Waterfall

Sequential `await` calls that are independent of each other create unnecessary delays:

```typescript
// BAD: Sequential - total time = fetchA time + fetchB time
const a = await fetchA();
const b = await fetchB();

// GOOD: Parallel - total time = max(fetchA time, fetchB time)
const [a, b] = await Promise.all([fetchA(), fetchB()]);
```

## Applied Optimizations

### 1. enrichObjectives (app/api/objectives/route.ts)

**Before**: KeyResults and ActionMaps were fetched sequentially.

```typescript
const { data: krRows } = await supabase.from('key_results').select('*')...;
const { data: actionMaps } = await supabase.from('action_maps').select(...)...;
```

**After**: Both queries run in parallel via `Promise.all`.

```typescript
const [{ data: krRows }, { data: actionMaps }] = await Promise.all([
  supabase.from('key_results').select('*')...,
  supabase.from('action_maps').select(...)...,
]);
```

### 2. enrichActionMaps (app/api/action-maps/route.ts)

**Before**: ActionItems and Tasks were fetched sequentially.

**After**: Both queries run in parallel via `Promise.all`.

### 3. Google Tasks Sync (app/api/google/tasks/sync/route.ts)

**Before**: `requireRole` and `getGoogleAccessToken` were called sequentially.

**After**: Both are independent (only need `user.id`) and now run in parallel.

## Guidelines

### When to Parallelize

Use `Promise.all` when:
- Multiple async operations are **independent** (no data dependency)
- Operations query different tables or external services
- Auth/permission checks can run alongside token retrieval

### When NOT to Parallelize

Keep sequential when:
- The second operation depends on the result of the first
- Early return patterns save unnecessary work (e.g., auth check before data fetch)
- Error in the first operation should prevent the second from running

### Early Return Pattern

Always place auth checks before data-fetching to short-circuit unauthorized requests:

```typescript
// GOOD: Auth check first, then data fetch
const user = await getSessionUser(request);
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Only fetch data after auth passes
const data = await fetchData(user.id);
```

### Promise.all Error Handling

`Promise.all` rejects as soon as any promise rejects. Use `Promise.allSettled` when
you need all results regardless of individual failures:

```typescript
const results = await Promise.allSettled([fetchA(), fetchB()]);
const successfulResults = results
  .filter((r): r is PromiseFulfilledResult<Data> => r.status === 'fulfilled')
  .map((r) => r.value);
```

## Codebase Status

Most client-side pages already use `Promise.all` for parallel data fetching:
- `dashboard/page.tsx`: tasks + objectives in parallel
- `leads/page.tsx`: leads + approaches in parallel
- `clients/page.tsx`: clients + leads in parallel
- `okr/page.tsx`: objectives + action-maps in parallel
- `action-maps/page.tsx`: action-maps + tasks in parallel
- `admin/metrics/route.ts`: all count queries in parallel

Server-side enrichment functions have been optimized in Phase 86.
