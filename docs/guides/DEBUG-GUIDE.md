# Debug Guide

FDC Modular Starter -- debugging techniques and best practices.

---

## 1. HAR File Analysis

### What is a HAR file?

HAR (HTTP Archive) is a JSON-based format that records all HTTP requests and responses between the browser and server. It captures headers, payloads, timing, and status codes.

### When to use HAR analysis

- API calls returning unexpected status codes
- Investigating slow page loads
- Reproducing issues that happen intermittently
- Sharing network-level evidence with teammates

### How to capture a HAR file

1. Open Chrome DevTools (F12 or Cmd+Option+I)
2. Go to the **Network** tab
3. Check **Preserve log** to keep entries across navigation
4. Reproduce the issue
5. Right-click the request list and select **Save all as HAR with content**

### Reading a HAR file

Open the `.har` file in a text editor or use https://toolbox.googleapps.com/apps/har_analyzer/.

Key fields to inspect:

```
entries[].request.url        -- which endpoint was called
entries[].request.method     -- GET, POST, PUT, DELETE
entries[].response.status    -- 200, 401, 403, 500, etc.
entries[].response.content   -- response body (check for error messages)
entries[].time               -- total round-trip time in ms
entries[].timings            -- breakdown: dns, connect, send, wait, receive
```

### Security note

HAR files contain cookies and authorization headers. Always strip sensitive tokens before sharing:

```bash
# Remove Authorization headers from HAR JSON
jq 'del(.log.entries[].request.headers[] | select(.name == "Authorization"))' file.har > file-safe.har
```

---

## 2. Chrome DevTools Tips

### Network tab

- **Filter by type**: Click XHR to see only API calls, ignore static assets
- **Throttling**: Use the "Slow 3G" preset to simulate slow connections
- **Block request URL**: Right-click a request and select "Block request URL" to test error handling
- **Copy as cURL**: Right-click a request and select "Copy as cURL" to replay it in the terminal

### Console tab

- **Preserve log**: Check this to keep logs across page navigations
- **Filter by log level**: Click the "Errors" or "Warnings" button to focus
- **Group similar**: Right-click and select "Group similar" to collapse repetitive messages

### Application tab

- **Local Storage / Session Storage**: Inspect cached data
- **Cookies**: Check authentication cookies (`sb-*` for Supabase)
- **Service Workers**: Verify registration and cache state

### Sources tab

- **Breakpoints**: Set conditional breakpoints to pause only when a condition is met
- **XHR breakpoints**: Pause when a specific URL pattern is fetched
- **Event listener breakpoints**: Pause on click, submit, or error events

---

## 3. Timezone Debugging (UTC vs JST)

### The problem

The server (Vercel) runs in UTC. Japan Standard Time (JST) is UTC+9. Date boundaries differ:

```
2026-03-05 00:00 JST  =  2026-03-04 15:00 UTC
2026-03-05 08:59 JST  =  2026-03-04 23:59 UTC
```

### Common bugs

1. **"Today's tasks" showing yesterday**: The server filters by UTC date, but the user expects JST date
2. **Created timestamps off by a day**: `new Date()` on the server returns UTC; formatting without timezone produces wrong local date
3. **Scheduled jobs firing at wrong time**: A cron set to `0 0 * * *` fires at midnight UTC = 09:00 JST

### Debugging checklist

- **Always log both**: `console.log('[debug] utc:', new Date().toISOString(), 'jst:', new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }))`
- **Database timestamps**: Supabase stores `timestamptz` in UTC. Use `AT TIME ZONE 'Asia/Tokyo'` in SQL queries for JST conversion
- **Frontend display**: Use `Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo' })` instead of `toLocaleDateString()`
- **Test across the boundary**: Always test at 00:00--09:00 JST (15:00--00:00 UTC previous day)

### Quick timezone conversion in console

```javascript
// Current time in both zones
console.log('[tz] UTC:', new Date().toISOString());
console.log('[tz] JST:', new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }));
```

---

## 4. Frontend vs Backend Issue Separation

### Step 1: Reproduce and classify

| Symptom | Likely Side |
|---|---|
| White screen / component not rendering | Frontend |
| API returns 4xx or 5xx | Backend |
| Data appears but is wrong | Check both -- backend may return bad data, or frontend may transform incorrectly |
| Spinner never stops | Frontend (fetch not completing) or Backend (slow query) |
| Feature works in one browser but not another | Frontend |

### Step 2: Isolate the API layer

Test the API directly with curl or the Network tab:

```bash
curl -s -X GET http://localhost:3000/api/tasks \
  -H "Cookie: sb-access-token=..." \
  | jq .
```

- If the API response is correct, the bug is in the frontend
- If the API response is wrong, the bug is in the backend

### Step 3: Frontend debugging

1. Check the component tree with React DevTools
2. Verify props being passed to child components
3. Check state values in hooks (useWorkspace, useAuth)
4. Look for stale closures in event handlers

### Step 4: Backend debugging

1. Check Vercel Function Logs for the specific route
2. Add temporary `console.log` with a prefix (see section 5)
3. Verify Supabase query results in the Supabase Dashboard SQL editor
4. Check RLS policies if data is missing

---

## 5. console.log Best Practices with [prefix] Pattern

### The pattern

Always prefix log messages with a bracketed tag:

```typescript
console.log('[auth] Session user:', user.id);
console.log('[api/tasks] GET query params:', { page, limit });
console.log('[workspace] Fetched workspace:', workspace.id);
console.log('[google-sync] Token refresh result:', result.status);
```

### Prefix conventions

| Prefix | Usage |
|---|---|
| `[auth]` | Authentication and session |
| `[api/ROUTE]` | API route handlers |
| `[db]` | Database queries and results |
| `[workspace]` | Workspace context and data |
| `[google-sync]` | Google Calendar/Tasks sync |
| `[perf]` | Performance measurements |
| `[debug]` | Temporary debugging (must be removed before merge) |
| `[tz]` | Timezone-related debugging |

### Structured logging for API routes

```typescript
// At the start of every API handler
console.log(`[api/tasks] ${request.method} started`, {
  userId: user.id,
  workspaceId,
  params: Object.fromEntries(url.searchParams),
});

// At the end
console.log(`[api/tasks] ${request.method} completed`, {
  status: 200,
  count: results.length,
  durationMs: Date.now() - startTime,
});
```

### What NOT to log

```typescript
// NEVER log sensitive data
console.log('[auth] password:', password);           // NO
console.log('[auth] token:', accessToken);            // NO
console.log('[db] connection string:', dbUrl);        // NO
console.log('[api] full request body:', body);        // NO (may contain PII)

// OK to log identifiers and counts
console.log('[auth] userId:', user.id);               // OK
console.log('[db] query returned rows:', rows.length); // OK
```

---

## 6. Debug Cleanup Before Production Release

### Pre-release checklist

1. **Search for `[debug]` prefix**: Any log with `[debug]` must be removed

```bash
grep -rn "\[debug\]" --include="*.ts" --include="*.tsx" app/ lib/ components/
```

2. **Search for `console.log` in committed code**: Verify each is intentional

```bash
grep -rn "console\.log" --include="*.ts" --include="*.tsx" app/ lib/ components/ | grep -v "// keep" | grep -v node_modules
```

3. **Check for `debugger` statements**:

```bash
grep -rn "debugger" --include="*.ts" --include="*.tsx" app/ lib/ components/
```

4. **Check for TODO/FIXME comments tied to debugging**:

```bash
grep -rn "TODO.*debug\|FIXME.*debug" --include="*.ts" --include="*.tsx" app/ lib/ components/
```

5. **Verify error boundaries**: Ensure production error messages do not leak stack traces or internal paths to the user.

### Allowed production logs

- `console.error` in catch blocks with `[error]` prefix
- `console.warn` for deprecation warnings with `[warn]` prefix
- Structured API logs at `info` level for observability

### ESLint rule recommendation

Add to `.eslintrc` to catch accidental console.log in PRs:

```json
{
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

This will flag `console.log` and `console.info` as warnings during development, making them easy to find and remove before production.
