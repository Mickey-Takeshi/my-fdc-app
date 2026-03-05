# Auth / Authz Deep Dive

## 1. JWT and Session Management in Supabase Auth

### How Supabase Auth Works

Supabase Auth issues JWTs (JSON Web Tokens) upon successful authentication. These tokens contain claims about the user and are used to authorize requests.

### Token Structure

A Supabase JWT contains:

| Claim | Description |
|-------|-------------|
| `sub` | User UUID (unique identifier) |
| `email` | User's email address |
| `role` | Supabase role (typically `authenticated`) |
| `aud` | Audience (typically `authenticated`) |
| `exp` | Expiration timestamp |
| `iat` | Issued-at timestamp |
| `app_metadata` | Provider info, roles assigned by admin |
| `user_metadata` | Profile data (name, avatar, etc.) |

### Token Lifecycle

1. **Access Token**: Short-lived (default 1 hour). Sent with every API request.
2. **Refresh Token**: Long-lived. Used to obtain new access tokens when the current one expires.
3. **Automatic Refresh**: The `@supabase/ssr` library handles token refresh automatically via cookies.

### FDC Session Management

FDC uses a dual-session approach:

- **Supabase Auth Cookies**: Managed by `@supabase/ssr` via `createServerClient()`. Handles JWT storage and refresh automatically.
- **fdc_session Cookie**: A lightweight JSON cookie containing basic user info (`id`, `email`, `name`, `provider`). Used by the proxy and client-side components for quick session checks without decoding JWTs.

```
Login Flow:
  Google OAuth -> Supabase Auth -> /api/auth/callback
    -> Set Supabase cookies (JWT)
    -> Set fdc_session cookie (JSON)
    -> Redirect to /dashboard

Demo Login Flow:
  Password check -> Set fdc_session cookie (client-side)
    -> localStorage backup
    -> Redirect to /dashboard
```

---

## 2. Why FDC Uses Server-Side Auth Instead of RLS

### The Decision

FDC performs authorization checks in API route handlers (server-side) using `getSessionUser()` and `requireRole()`, rather than relying solely on Supabase Row Level Security (RLS) policies.

### Pros of Server-Side Auth (FDC Approach)

| Advantage | Detail |
|-----------|--------|
| Full control | Authorization logic is in TypeScript, testable with Vitest |
| Complex rules | Can implement business logic that is difficult to express in SQL policies |
| Debugging | Easier to debug with logging (Pino) and breakpoints |
| Performance | Service Role bypasses RLS, avoiding policy evaluation overhead on every query |
| Flexibility | Can combine multiple data sources (DB + external APIs) in auth decisions |
| Audit logging | Can log authorization decisions with context |

### Cons of Server-Side Auth

| Disadvantage | Detail |
|-------------|--------|
| No DB-level protection | Direct database access (e.g., Supabase Dashboard, SQL editor) bypasses server checks |
| Requires discipline | Every API route must call `getSessionUser()` -- missing a check is a security hole |
| Duplication risk | Auth logic may be duplicated across routes |

### Cons of RLS-Only Approach

| Disadvantage | Detail |
|-------------|--------|
| SQL complexity | Complex policies are hard to write, test, and debug |
| Performance | Policies run on every query, even simple reads |
| Limited logic | Cannot easily integrate external services or complex business rules |
| Testing difficulty | Policies are tested via SQL, not standard test frameworks |

### FDC Compromise

FDC uses both layers as defense-in-depth:

1. **Server-side auth** (primary): `getSessionUser()` + `requireRole()` in every API route.
2. **RLS policies** (secondary): Basic workspace-scoping policies protect against direct DB access.
3. **Service Role** usage: API routes use the Service Role key to bypass RLS for performance, after server-side auth has verified permissions.

---

## 3. RBAC Model

### Role Hierarchy

```
sa (SUPER_ADMIN)   -- System-wide administrator
  |
  v
owner (OWNER)      -- Workspace creator, full control
  |
  v
admin (ADMIN)      -- Workspace management, member management
  |
  v
member (MEMBER)    -- Basic data access within workspace
```

### Role Definitions

| Role | Scope | Capabilities |
|------|-------|-------------|
| SUPER_ADMIN (sa) | System-wide | View all tenants, system metrics, manage any workspace |
| OWNER | Workspace | Full workspace control, delete workspace, transfer ownership |
| ADMIN | Workspace | Manage members, invitations, workspace settings |
| MEMBER | Workspace | Create/edit tasks, leads, clients, action maps, OKR |

### Permission Matrix

```typescript
// From lib/server/permissions.ts
const PERMISSIONS = {
  canManageTasks: (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.MEMBER,
  canManageMembers: (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.ADMIN,
  canUpdateWorkspace: (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.ADMIN,
  canDeleteWorkspace: (role) => role === 'OWNER',
  canTransferOwnership: (role) => role === 'OWNER',
};
```

### Role Hierarchy Implementation

```typescript
// From lib/types/workspace.ts
type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER';

const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3,
};
```

### Super Admin Check

Super Admin status is stored in the `users.account_type` column. SA checks bypass workspace-level RBAC:

```typescript
// SA check pattern used in admin API routes
if (!userRow || userRow.account_type !== 'SUPER_ADMIN') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

---

## 4. Permission Check Flow

### Standard API Route Pattern

```
Request
  |
  v
getSessionUser(request)        -- Extract user from fdc_session cookie
  |                               Returns null if not authenticated
  v
getWorkspaceRole(userId, wsId) -- Look up role in workspace_members table
  |                               Returns null if not a member
  v
requireRole(userId, wsId, min) -- Compare role against minimum required
  |                               Returns null if insufficient permissions
  v
Fetch / Mutate Data            -- Proceed with the database operation
  |
  v
Return Response
```

### Concrete Example (Task Creation)

```typescript
// 1. Authenticate
const user = await getSessionUser(request);
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// 2. Get workspace context
const workspaceId = body.workspace_id;

// 3. Check workspace access
const role = await requireRole(user.id, workspaceId, 'MEMBER');
if (!role) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// 4. Fetch or mutate data
const { data, error } = await supabase
  .from('tasks')
  .insert({ ...body, workspace_id: workspaceId })
  .select()
  .single();
```

### Admin Route Pattern (SA)

```typescript
// 1. Authenticate
const user = await getSessionUser(request);
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// 2. Check SA status (system-wide, not workspace-scoped)
const { data: userRow } = await supabase
  .from('users')
  .select('account_type')
  .eq('id', user.id)
  .single();

if (!userRow || userRow.account_type !== 'SUPER_ADMIN') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// 3. Proceed with admin operation
```

---

## 5. OAuth Flow Details (Google PKCE)

### What is PKCE?

PKCE (Proof Key for Code Exchange) is an extension to the OAuth 2.0 authorization code flow. It prevents authorization code interception attacks, which is important for public clients (browsers, mobile apps).

### FDC Google OAuth Flow

```
1. User clicks "Google Login"
   |
   v
2. supabase.auth.signInWithOAuth({ provider: 'google' })
   - Supabase generates a code_verifier and code_challenge
   - Stores code_verifier in cookies
   - Redirects to Google's authorization endpoint
   |
   v
3. User authenticates with Google
   - Grants requested scopes (calendar, tasks)
   - Google redirects back with authorization code
   |
   v
4. Redirect to Supabase callback
   - Supabase exchanges code + code_verifier for tokens
   - Returns code to FDC callback URL
   |
   v
5. /api/auth/callback (FDC)
   - Calls exchangeCodeForSession(code)
   - Supabase verifies code_verifier (PKCE)
   - Returns session with access_token, refresh_token, provider_token
   |
   v
6. FDC callback processes tokens
   - Upserts user in the users table
   - Encrypts provider_token (AES-256-GCM) for Google API access
   - Sets Supabase auth cookies
   - Sets fdc_session cookie
   - Redirects to /dashboard
```

### Requested Google Scopes

```
https://www.googleapis.com/auth/calendar.readonly
https://www.googleapis.com/auth/calendar.events
https://www.googleapis.com/auth/tasks
```

### Token Storage

| Token | Storage | Encryption |
|-------|---------|-----------|
| Supabase access_token | HTTP cookie (managed by @supabase/ssr) | Cookie-level |
| Supabase refresh_token | HTTP cookie (managed by @supabase/ssr) | Cookie-level |
| Google provider_token | Supabase DB (users.google_access_token) | AES-256-GCM |
| Google refresh_token | Supabase DB (users.google_refresh_token) | AES-256-GCM |

---

## 6. Security Headers

### Current Configuration (next.config.ts)

| Header | Value | Purpose |
|--------|-------|---------|
| Content-Security-Policy | See below | Controls which resources the browser is allowed to load |
| X-Content-Type-Options | `nosniff` | Prevents MIME type sniffing attacks |
| X-Frame-Options | `DENY` | Prevents clickjacking by disallowing iframe embedding |
| X-XSS-Protection | `1; mode=block` | Legacy XSS filter (modern browsers rely on CSP instead) |
| Referrer-Policy | `strict-origin-when-cross-origin` | Controls how much referrer info is sent with requests |
| Permissions-Policy | `camera=(), microphone=(), geolocation=()` | Disables access to sensitive browser APIs |

### CSP Breakdown

```
default-src 'self'
  -- Only allow resources from the same origin by default

script-src 'self' 'unsafe-eval' 'unsafe-inline'
  -- Allow scripts from same origin + eval (needed for Next.js dev mode)
  -- Note: 'unsafe-inline' is required for React's inline style injection

style-src 'self' 'unsafe-inline'
  -- Allow styles from same origin + inline styles (CSS modules)

img-src 'self' data: https:
  -- Allow images from same origin, data URIs, and any HTTPS source

connect-src 'self' https://*.supabase.co https://tasks.googleapis.com
            https://www.googleapis.com https://accounts.google.com
  -- Allow API connections to Supabase and Google APIs

font-src 'self'
  -- Only allow fonts from same origin

frame-src https://accounts.google.com
  -- Only allow iframes from Google (OAuth popup)
```

### Production Hardening Recommendations

For production environments, consider:

1. Replace `'unsafe-eval'` with nonce-based CSP once Next.js supports it.
2. Replace `'unsafe-inline'` in `script-src` with hash-based or nonce-based policies.
3. Add `upgrade-insecure-requests` directive.
4. Add `Strict-Transport-Security` (HSTS) header for HTTPS enforcement.

---

## 7. Logout Security

### Current Logout Flow

```typescript
// From AuthContext
const logout = async () => {
  // 1. Clear Supabase session
  await supabase.auth.signOut();

  // 2. Clear fdc_session cookie
  document.cookie = 'fdc_session=; path=/; max-age=0';

  // 3. Clear localStorage
  localStorage.removeItem('fdc_session');

  // 4. Redirect to login page
  window.location.href = '/login';
};
```

### Shared PC Considerations

On shared or public computers, additional precautions are needed:

| Risk | Mitigation |
|------|-----------|
| Session persistence | Clear all cookies and localStorage on logout |
| Browser "Remember Me" | Do not offer persistent sessions on shared PCs |
| Browser history | Users should use incognito/private browsing |
| Auto-fill | Credentials entered in forms may be saved by the browser |
| Back button | After logout, cached pages may still be visible |

### Recommendations for Shared PC Environments

1. **Session timeout**: Implement idle timeout (e.g., 15 minutes of inactivity triggers automatic logout).
2. **Cache-Control headers**: Add `Cache-Control: no-store, no-cache, must-revalidate` to authenticated pages.
3. **Clear all storage on logout**: Ensure `sessionStorage`, `localStorage`, and `indexedDB` data is removed.
4. **Token revocation**: Call Supabase `signOut({ scope: 'global' })` to invalidate all sessions across devices if the user suspects their account is compromised.

---

## 8. MFA / TOTP Overview (Future Implementation)

### What is TOTP?

TOTP (Time-based One-Time Password) is a second factor for authentication. The user generates a 6-digit code from an authenticator app (Google Authenticator, Authy, etc.) that changes every 30 seconds.

### Supabase MFA Support

Supabase Auth has built-in support for TOTP-based MFA:

```typescript
// Enrollment (one-time setup)
const { data } = await supabase.auth.mfa.enroll({
  factorType: 'totp',
  friendlyName: 'My Authenticator App',
});
// data.totp.qr_code -- QR code for the authenticator app
// data.totp.uri -- otpauth:// URI

// Verification (on each login)
const { data: challenge } = await supabase.auth.mfa.challenge({
  factorId: factor.id,
});

const { data: verify } = await supabase.auth.mfa.verify({
  factorId: factor.id,
  challengeId: challenge.id,
  code: '123456', // User-provided TOTP code
});
```

### Implementation Plan for FDC

1. **Phase A: Enrollment UI**
   - Add MFA settings section in `/settings` page.
   - Display QR code for TOTP enrollment.
   - Require verification of first code to confirm setup.
   - Store backup codes securely.

2. **Phase B: Challenge UI**
   - After password/OAuth login, check if MFA is enrolled.
   - If enrolled, show TOTP input screen before redirecting to dashboard.
   - Allow "remember this device" option (30 days).

3. **Phase C: Admin Enforcement**
   - Allow workspace OWNER/ADMIN to require MFA for all members.
   - Add MFA status to the admin members list.
   - Block access to sensitive operations without MFA.

### Assurance Levels (AAL)

Supabase tracks authentication assurance levels:

| Level | Meaning |
|-------|---------|
| aal1 | Single factor (password or OAuth) |
| aal2 | Two factors (password/OAuth + TOTP) |

Use `supabase.auth.mfa.getAuthenticatorAssuranceLevel()` to check the current level and enforce aal2 for sensitive operations.

---

## 9. Session Management Best Practices

### Token Expiry Configuration

| Setting | Recommended Value | Reason |
|---------|------------------|--------|
| Access token TTL | 1 hour (default) | Short-lived reduces exposure if token is leaked |
| Refresh token TTL | 7 days | Balance between UX (stay logged in) and security |
| Idle timeout | 15-30 minutes | Protect shared/public computer scenarios |

### Cookie Security Settings

```typescript
// FDC cookie configuration
{
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
  sameSite: 'lax',           // Prevents CSRF on cross-site POST
  // httpOnly: true,          // Recommended for production
  // secure: true,            // Recommended for HTTPS-only
}
```

### Recommendations

1. **Set httpOnly on fdc_session cookie**: Prevents JavaScript access, mitigating XSS-based session theft. Currently, the fdc_session cookie is set without httpOnly because client-side code reads it for quick auth checks. Consider migrating to a server-side session check pattern.

2. **Set secure flag**: Ensures cookies are only sent over HTTPS. Enable this for all production deployments.

3. **Rotate refresh tokens**: Supabase rotates refresh tokens automatically. Ensure the rotation is not disabled in the Supabase dashboard.

4. **Monitor session anomalies**: Track unusual patterns such as:
   - Multiple active sessions from different geographic locations.
   - Rapid token refresh requests (may indicate token theft).
   - Sessions active after explicit logout.

5. **Implement session listing**: Allow users to view and revoke their active sessions from the settings page (using `supabase.auth.mfa.listFactors()` and session management APIs).

6. **Rate limit authentication endpoints**: The `/api/auth/callback` and login endpoints should be rate-limited to prevent brute force attacks. FDC already has rate limiting via `lib/server/sanitize.ts`.
