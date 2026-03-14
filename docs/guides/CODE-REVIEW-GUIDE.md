# Code Review Guide

FDC Modular Starter -- code review conventions, refactoring principles, and technical debt management.

---

## 1. Review Comment Prefixes

Every review comment must start with one of these prefixes so the author can prioritize:

| Prefix | Meaning | Blocking? |
|---|---|---|
| `[must]` | Must fix before merge. Bugs, security issues, data loss risks. | Yes |
| `[should]` | Strongly recommended. Design improvements, readability, maintainability. | Soft block |
| `[nit]` | Nitpick. Style, naming, minor formatting. OK to skip. | No |
| `[question]` | Reviewer does not understand something. Needs clarification, not necessarily a change. | No |
| `[praise]` | Something done well. Reinforce good patterns. | No |

### Examples

```
[must] This endpoint does not check workspace membership before returning data.
       An authenticated user could read data from any workspace.

[should] Consider extracting this 40-line block into a separate function.
         It would make the handler easier to test independently.

[nit] Unused import on line 3.

[question] Why is this using `setTimeout` instead of `requestAnimationFrame`?
           Is there a specific timing requirement?

[praise] Clean separation of the validation logic into its own function.
         This makes the handler much easier to follow.
```

---

## 2. Code Review Perspectives

Review every PR from these four angles:

### 2a. Bugs

- Edge cases: empty arrays, null values, zero-length strings
- Off-by-one errors in pagination or array slicing
- Race conditions in async operations
- Missing error handling in try/catch blocks
- Incorrect HTTP status codes (e.g., returning 200 for a failed operation)

### 2b. Security

- SQL injection: Are user inputs parameterized?
- XSS: Is user-generated content sanitized before rendering?
- Authentication: Does every API route call `getSessionUser()`?
- Authorization: Does every API route call `requireRole()` with the correct role?
- Secrets: Are environment variables used instead of hardcoded values?
- CORS: Are allowed origins explicitly listed?

### 2c. Performance

- N+1 queries: Is the code making a DB call inside a loop?
- Missing pagination: Does the endpoint return unbounded result sets?
- Large payloads: Is the response selecting only necessary columns?
- Client-side re-renders: Are expensive computations memoized?
- Bundle size: Does the import pull in a large library for a small feature?

### 2d. Readability

- Naming: Do variable and function names describe their purpose?
- Single responsibility: Does each function do one thing?
- Comments: Are complex algorithms explained? Are obvious things left uncommented?
- Consistent patterns: Does the code follow existing project conventions?
- Type safety: Are types specific (not `any`) and do they reflect the domain?

---

## 3. Refactoring Principles

### 3a. Small PRs (under 300 lines)

- **Why**: Large PRs get rubber-stamped. Small PRs get real feedback.
- **How**: Break work into logical steps. One PR per concern.
- **Exception**: Auto-generated code (migrations, type definitions) may exceed 300 lines. Label these clearly.

### 3b. Maintain tests

- Every refactoring PR must pass all existing tests without modification.
- If tests need to change, explain why in the PR description.
- Add new tests when extracting logic into new functions.

### 3c. Separate from feature work

- Never mix refactoring and feature changes in the same PR.
- A refactoring PR changes structure without changing behavior.
- A feature PR adds or modifies behavior.
- This separation makes rollbacks safer and reviews easier.

### 3d. Refactoring checklist

Before submitting a refactoring PR:

1. `npm run type-check` passes
2. `npm run build` passes
3. All existing tests pass without modification
4. No `console.log` or `debugger` statements introduced
5. PR description explains the motivation and what changed structurally

---

## 4. Technical Debt Management

### Identifying debt

| Signal | Example |
|---|---|
| Copy-paste code | Same validation logic in 5 API routes |
| Workarounds | `// HACK: ...` or `// TODO: fix later` |
| Missing types | `as any` casts or untyped function parameters |
| Dead code | Functions or components with 0 imports |
| Outdated dependencies | Major version behind on core packages |

### Recording debt

When you spot technical debt during a review but it is out of scope for the current PR:

1. Add a comment with `[should]` or `[nit]` prefix
2. Create a GitHub Issue labeled `tech-debt`
3. Include the file path, line number, and a one-line description

### Prioritizing debt

| Priority | Criteria | Action |
|---|---|---|
| High | Security risk or data integrity | Fix in the next sprint |
| Medium | Developer friction or maintenance burden | Schedule within the quarter |
| Low | Style or minor duplication | Fix opportunistically |

### Debt budget

Reserve 10--20% of each sprint for technical debt reduction. This prevents the codebase from degrading over time.

---

## 5. Breaking Change Detection

### What counts as a breaking change?

1. **API contract changes**: Renamed or removed fields in request/response JSON
2. **Database schema changes**: Dropped columns, changed types, new NOT NULL constraints
3. **Type signature changes**: Modified exported interfaces used by other modules
4. **Environment variable changes**: New required variables or renamed existing ones
5. **Dependency upgrades**: Major version bumps of core packages

### Review checklist for breaking changes

- [ ] Are existing API consumers (frontend pages) updated?
- [ ] Is there a database migration? Does it handle existing data?
- [ ] Are environment variables documented in `.env.example`?
- [ ] Is the CHANGELOG updated with a **Breaking Changes** section?
- [ ] Is there a rollback plan if the deploy fails?

### Backward-compatible strategies

- **Add, then migrate, then remove**: Add new field -> migrate consumers -> remove old field
- **Feature flags**: Deploy behind a flag, enable gradually, remove flag after verification
- **API versioning**: For public APIs, version the endpoint (`/api/v2/tasks`)

---

## 6. Claude Code Self-Review Prompts

Before requesting human review, use Claude Code to self-review with these prompts:

### Security review

```
Review this diff for security issues. Check for:
- Missing authentication or authorization
- SQL injection or XSS vulnerabilities
- Hardcoded secrets or sensitive data in logs
- Improper input validation
```

### Performance review

```
Review this diff for performance issues. Check for:
- N+1 database queries
- Missing pagination on list endpoints
- Unnecessary re-renders in React components
- Large bundle imports that could be tree-shaken
```

### Type safety review

```
Review this diff for type safety. Check for:
- Usage of 'any' type
- Missing return types on functions
- Unsafe type assertions (as Type)
- Zod schemas that don't match TypeScript types
```

### Consistency review

```
Review this diff against the existing codebase patterns. Check for:
- Naming conventions (camelCase for variables, PascalCase for components)
- Error handling patterns (consistent use of try/catch with [prefix] logging)
- Import organization (@/ alias paths, grouped by type)
- API route structure (auth check, validation, business logic, response)
```

### Pre-merge final check

```
Run a final review of all changes in this branch:
1. Are there any console.log statements that should be removed?
2. Are there any TODO or FIXME comments that should be resolved?
3. Do all new files have at least one import from source code?
4. Does npm run type-check pass?
5. Does npm run build pass?
```

---

## 7. Review Workflow Summary

1. **Author** opens a PR with a clear description and test plan
2. **Author** runs Claude Code self-review prompts (section 6)
3. **Reviewer** reviews from all four perspectives (section 2)
4. **Reviewer** uses prefixed comments (section 1)
5. **Author** addresses `[must]` and `[should]` comments
6. **Author** acknowledges `[nit]` and `[question]` comments
7. **Reviewer** approves when all `[must]` items are resolved
8. **Author** merges and verifies the deploy
