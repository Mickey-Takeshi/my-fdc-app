# Render Optimization Guide (Phase 88)

## Overview

This guide documents React re-render optimization patterns applied to the FDC Modular Starter,
focusing on `React.memo` for list item components.

## Problem: Unnecessary Re-renders

When a parent component re-renders (e.g., due to state changes), all child components
re-render too, even if their props haven't changed. In list views with many items,
this causes noticeable performance degradation.

## Applied Optimizations

### React.memo for List Item Components

Components rendered inside `.map()` loops benefit from `React.memo`, which skips
re-rendering when props are shallowly equal.

**Pattern Applied:**

```typescript
import { memo } from 'react';

interface ItemProps {
  item: ItemType;
  onSelect: (item: ItemType) => void;
}

const ListItem = memo(function ListItem({ item, onSelect }: ItemProps) {
  return (
    <div onClick={() => onSelect(item)}>
      {item.name}
    </div>
  );
});

export default ListItem;
```

### Components Optimized with React.memo

| Component | Location | Reason |
|-----------|----------|--------|
| KanbanCard | leads/_components/ | Rendered per lead in kanban columns |
| ListView | leads/_components/ | Table with many rows |
| TodoCard | tasks/_components/ | Rendered per task in quadrant columns |
| ActionMapCard | action-maps/_components/ | Rendered per action map |
| ObjectiveCard | okr/_components/ | Rendered per objective |

## Guidelines

### When to Use React.memo

1. **List item components**: Components rendered inside `.map()` loops
2. **Pure display components**: Output depends only on props
3. **Components with expensive renders**: Complex DOM trees or calculations
4. **Components receiving stable callback props**: When parent uses `useCallback`

### When NOT to Use React.memo

1. **Components that always re-render**: Props change on every render
2. **Very simple components**: Memo comparison cost > render cost
3. **Components with many props that change**: Shallow comparison is wasteful
4. **Root-level page components**: Only one instance, no sibling re-renders

### useCallback for Callback Props

When passing callbacks to memoized components, use `useCallback` to maintain
referential stability:

```typescript
// Parent component
const handleSelect = useCallback((item: Item) => {
  setSelectedItem(item);
}, []);

// Child receives stable reference
<MemoizedChild onSelect={handleSelect} />
```

The FDC codebase uses `useCallback` for data-fetching functions (e.g., `fetchTasks`,
`fetchLeads`) to prevent unnecessary `useEffect` re-triggers.

### Custom Comparison Function

For complex props, provide a custom comparison:

```typescript
const ExpensiveItem = memo(
  function ExpensiveItem({ item, config }: Props) {
    // ... render
  },
  (prevProps, nextProps) => {
    // Only re-render when item.id or item.updatedAt changes
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.updatedAt === nextProps.item.updatedAt
    );
  }
);
```

### React DevTools Profiler

Use the React DevTools Profiler to identify unnecessary re-renders:

1. Open React DevTools > Profiler tab
2. Click "Record" and perform interactions
3. Look for components that re-render without prop changes
4. Apply `memo()` to those components

### Avoiding Common Pitfalls

**Inline objects break memo:**

```typescript
// BAD: New object on every render
<MemoizedChild style={{ color: 'red' }} />

// GOOD: Stable reference
const style = useMemo(() => ({ color: 'red' }), []);
<MemoizedChild style={style} />
```

**Inline arrow functions break memo:**

```typescript
// BAD: New function on every render
<MemoizedChild onClick={() => handleClick(id)} />

// GOOD: Stable reference via useCallback
const handleItemClick = useCallback(() => handleClick(id), [id]);
<MemoizedChild onClick={handleItemClick} />
```

## Performance Measurement

### Key Metrics

- **React Profiler**: Measure render duration for components
- **Chrome DevTools Performance**: Track scripting time during interactions
- **Lighthouse**: Monitor Total Blocking Time (TBT) and Time to Interactive (TTI)

### Expected Impact

- Kanban board with 50+ leads: Reduced re-renders when dragging cards
- Task board with 100+ tasks: Faster status toggle response
- OKR page with multiple objectives: Smoother KR value updates
