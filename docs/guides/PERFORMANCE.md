# Performance Guide

Phase 35-37 で整理したパフォーマンス最適化方針。

## Query Optimization (Phase 35)

### Priority Matrix

| Issue | Impact | Solution |
|-------|--------|----------|
| N+1 queries | HIGH | Use Supabase JOIN (select with nested tables) |
| Missing indexes | HIGH | Add composite indexes for frequent WHERE conditions |
| Full table scan | MEDIUM | Add pagination (default 50, max 100) |
| SELECT * | LOW | Select only needed columns |

### Recommended Indexes

See `docs/sql/query-optimization.sql` for the full index list.

Key indexes:
- `idx_tasks_workspace_status` - Task list by status
- `idx_audit_logs_workspace_time` - Admin audit log view
- `idx_workspace_members_user` - Auth permission check

### Pagination Pattern

```typescript
import { parsePagination, buildPaginationResult } from '@/lib/utils/pagination';

const { page, pageSize, offset } = parsePagination(searchParams);
const { data, count } = await supabase
  .from('tasks')
  .select('*', { count: 'exact' })
  .range(offset, offset + pageSize - 1);

return { data, pagination: buildPaginationResult(page, pageSize, count || 0) };
```

## Frontend Performance (Phase 36)

### Core Web Vitals Targets

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | < 2.5s | 2.5s - 4.0s | > 4.0s |
| INP | < 200ms | 200ms - 500ms | > 500ms |
| CLS | < 0.1 | 0.1 - 0.25 | > 0.25 |

### Optimization Techniques

1. **Image optimization**: Use `next/image` with `priority` for LCP images
2. **Dynamic imports**: Lazy-load heavy components (modals, charts)
3. **Font optimization**: Use `next/font` for zero-layout-shift fonts
4. **Bundle splitting**: Automatic with Next.js App Router

### Dynamic Import Example

```typescript
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <div>Loading...</div>,
});
```

## Cache Strategy (Phase 37)

### Data-type Cache Settings

| Data Type | Stale Time | GC Time | Refresh Strategy |
|-----------|-----------|---------|-----------------|
| User session | 5 min | 30 min | On focus |
| Task list | 30 sec | 5 min | After mutation |
| OKR data | 1 min | 5 min | After mutation |
| Brand/Canvas | 5 min | 30 min | After mutation |
| Audit logs | 0 | 0 | On demand |

### Optimistic Update Flow

```
1. User clicks "Complete Task"
2. UI immediately shows task as done (optimistic)
3. API request sent in background
4. On success: confirm state (no-op)
5. On failure: rollback to previous state + show error toast
```

See `lib/utils/apply-command.ts` for the pure function implementation.
