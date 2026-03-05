# Duplicate / Orphan File Cleanup Report

Phase 38 -- Executed 2026-03-05

---

## 1. Scan Summary

Scanned directories:

| Directory | File Count |
|---|---|
| `lib/hooks/` | 3 |
| `lib/types/` | 16 |
| `lib/utils/` | 4 |
| `lib/server/` | 7 |
| `lib/client/` | 1 |
| `lib/contexts/` | 1 |
| `components/` | 12 |
| **Total** | **44** |

---

## 2. Same-Named Files

| Filename | Locations | Verdict |
|---|---|---|
| `supabase.ts` | `lib/client/supabase.ts`, `lib/server/supabase.ts` | **Kept** -- different purpose (browser client vs server service-role client) |

No true duplicates found.

---

## 3. Orphan Analysis (0 imports from source code)

### 3a. Files Deleted

| File | Reason |
|---|---|
| `lib/hooks/useOptimistic.ts` | Placeholder hook, never imported by any page or component |
| `lib/hooks/useTaskReducer.ts` | Placeholder hook, never imported by any page or component |
| `lib/utils/performance.ts` | Utility module with 0 imports across the entire codebase |
| `lib/server/logger.ts` | Server logger with 0 imports (all API routes use their own inline logging) |
| `components/SyncStatusIndicator.tsx` | UI component with 0 imports (not mounted in any layout or page) |
| `components/UndoSnackbar.tsx` | UI component with 0 imports (not mounted in any layout or page) |
| `components/landing/default/ServicesSection.tsx` | Landing section not imported by `LandingPage.tsx` |
| `components/landing/default/ServicesSection.module.css` | CSS module for deleted `ServicesSection.tsx` |

### 3b. Files Kept (with justification)

| File | Imports | Reason Kept |
|---|---|---|
| `lib/types/index.ts` | 136 (via `@/lib/types`) | Central type barrel file |
| `lib/types/action-map.ts` | 8 | Used by action-map API routes and pages |
| `lib/types/admin.ts` | 7 | Used by admin API routes and pages |
| `lib/types/approach.ts` | 5 | Used by approach API routes and pages |
| `lib/types/brand.ts` | 8 | Used by brand API routes and pages |
| `lib/types/client.ts` | 4 | Used by client API routes and pages |
| `lib/types/commands.ts` | 1 | Used by `lib/utils/apply-command.ts` |
| `lib/types/google-calendar.ts` | 3 | Used by Google Calendar API routes |
| `lib/types/google-tasks.ts` | 4 | Used by Google Tasks API routes |
| `lib/types/lean-canvas.ts` | 5 | Used by lean-canvas API routes and pages |
| `lib/types/mvv.ts` | 3 | Used by MVV API routes and pages |
| `lib/types/okr.ts` | 6 | Used by OKR API routes and pages |
| `lib/types/prospect.ts` | 8 | Used by leads API routes and pages |
| `lib/types/settings.ts` | 1 | Used by settings page |
| `lib/types/task.ts` | 15 | Used by task API routes and pages |
| `lib/types/workspace.ts` | 5 | Used by workspace API routes and hooks |
| `lib/server/auth.ts` | 37 | Used by all API routes for session validation |
| `lib/server/encryption.ts` | 2 | Used by `google-auth.ts` |
| `lib/server/google-auth.ts` | 5 | Used by Google API routes |
| `lib/server/permissions.ts` | 30 | Used by all API routes for RBAC |
| `lib/server/sanitize.ts` | 1 | Used by sanitize test |
| `lib/server/supabase.ts` | 36 | Used by all API routes for DB access |
| `lib/client/supabase.ts` | 2 | Used by login page and app layout |
| `lib/contexts/AuthContext.tsx` | 2 | Used by app layout and admin page |
| `lib/hooks/useWorkspace.ts` | 10 | Used by all app pages |
| `lib/utils/apply-command.ts` | 1 | Used by apply-command test |
| `lib/utils/error-messages.ts` | 1 | Used by error-messages test |
| `lib/utils/pagination.ts` | 1 | Used by pagination test |
| `components/ServiceWorkerRegistration.tsx` | 1 | Used by root layout |
| `components/landing/default/LandingPage.tsx` | 2 | Used by root page and app layout |
| All other landing sub-components | internal | Imported via relative paths by `LandingPage.tsx` |

---

## 4. Verification Steps

1. `npm run type-check` -- PASSED (before deletion)
2. `git rm` -- 8 files removed
3. `npm run type-check` -- PASSED (after deletion)
4. `npm run build` -- PASSED (after deletion)

---

## 5. Future Prevention Tips

### Import count checks

Run this command periodically to find files with 0 imports:

```bash
for f in $(find lib components -type f \( -name "*.ts" -o -name "*.tsx" \)); do
  ip="@/${f%.*}"
  c=$(grep -rlF "$ip" --include="*.ts" --include="*.tsx" app/ lib/ components/ tests/ 2>/dev/null | grep -cvF "$f")
  if [ "$c" -eq 0 ]; then echo "ORPHAN: $f"; fi
done
```

### Prevention rules

1. **Delete on merge** -- When removing a feature, delete all related files in the same PR.
2. **Review new files** -- Every new file in a PR must have at least one import from source code.
3. **Barrel file discipline** -- If a file is only reachable through an `index.ts` barrel, the barrel must actually re-export it.
4. **Periodic scan** -- Run the orphan scan above before each major release.
5. **Same-name awareness** -- `lib/client/supabase.ts` and `lib/server/supabase.ts` are intentionally different. Document any same-name files to avoid confusion.
