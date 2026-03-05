# Bundle Optimization Guide (Phase 87)

## Overview

This guide documents bundle size optimization strategies applied to the FDC Modular Starter,
focusing on dynamic imports to reduce initial page load size.

## Problem: Large Initial Bundles

Statically imported modal components are included in the main page bundle even though users
may never open them during a session. This increases Time to Interactive (TTI).

## Applied Optimizations

### Dynamic Imports for Modal Components

Modal components are conditionally rendered (only shown on user interaction).
Using `next/dynamic` defers their loading until actually needed.

**Pattern Applied:**

```typescript
import dynamic from 'next/dynamic';

const HeavyModal = dynamic(
  () => import('./_components/HeavyModal'),
  { ssr: false }
);
```

### Components Converted to Dynamic Imports

| Page | Component | Reason |
|------|-----------|--------|
| leads/page.tsx | AddProspectForm | Modal - shown on button click |
| leads/page.tsx | ProspectDetailModal | Modal - shown on card click |
| leads/page.tsx | ApproachStatsSection | Below fold - shown only with data |
| clients/page.tsx | AddClientForm | Modal - shown on button click |
| clients/page.tsx | ClientDetailModal | Modal - shown on row click |
| tasks/page.tsx | AddTaskForm | Modal - shown on button click |
| tasks/page.tsx | TaskDetailModal | Modal - shown on card click |
| okr/page.tsx | AddObjectiveForm | Modal - shown on button click |
| action-maps/page.tsx | AddActionMapForm | Modal - shown on button click |

### Why `ssr: false`

Modal components are interactive-only and never rendered during server-side rendering.
Setting `ssr: false` means:
- No server-side rendering overhead
- Component loads only when the client triggers it
- Reduces the SSR HTML payload

## Guidelines

### When to Use Dynamic Imports

1. **Modal / Dialog components**: Only rendered on user interaction
2. **Below-the-fold content**: Not visible on initial viewport
3. **Feature-gated components**: Only shown to certain users
4. **Heavy visualization libraries**: Charts, graphs, editors

### When NOT to Use Dynamic Imports

1. **Above-the-fold content**: Causes layout shift (CLS)
2. **Navigation components**: Always visible, needed for interaction
3. **Small components**: Overhead of dynamic import exceeds savings
4. **Components needed for SEO**: Search engines may not execute dynamic imports

### Adding a Loading State

For components that take time to load, add a loading placeholder:

```typescript
const ChartComponent = dynamic(
  () => import('./_components/Chart'),
  {
    loading: () => <div className="skeleton" style={{ height: 300 }} />,
    ssr: false,
  }
);
```

### Barrel Import Avoidance

Avoid re-exporting from index files when only specific exports are needed:

```typescript
// BAD: Imports entire barrel (may include unused exports)
import { SpecificUtil } from '@/lib/utils';

// GOOD: Import directly from the module
import { SpecificUtil } from '@/lib/utils/specific-util';
```

The FDC codebase follows this pattern - each type file is imported directly
(e.g., `@/lib/types/task` instead of `@/lib/types`).

## Measuring Bundle Size

```bash
# Analyze bundle with Next.js
ANALYZE=true npm run build

# Or use the built-in Next.js output
npm run build
# Check .next/analyze/ for bundle analysis
```
