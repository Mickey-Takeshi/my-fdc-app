# FDC Security Guide

## Overview

FDC Modular Starter implements a defense-in-depth security strategy with multiple layers of protection.

## Architecture

### Authentication

- **Supabase Auth** handles user authentication via Google OAuth and demo login
- Session tokens are managed via HTTP-only cookies
- Google API tokens (Calendar/Tasks) are encrypted with AES-256-GCM before storage

### Authorization

- **Server-side RBAC** via `requireRole()` in `lib/server/permissions.ts`
- Three roles: OWNER > ADMIN > MEMBER
- All API routes verify user identity with `getSessionUser()` before processing
- Workspace-scoped data access ensures tenant isolation

### Data Access

- **Service Role Key** is used in API routes and bypasses Row Level Security (RLS)
- RLS policies (see `docs/sql/rls-policies.sql`) protect direct Supabase client access
- All data is scoped to workspaces via `workspace_members` table

### Input Validation

- **Zod v4** schemas validate all API request bodies
- `lib/server/sanitize.ts` provides HTML entity encoding for string inputs
- In-memory rate limiting prevents abuse of API endpoints

### Security Headers (CSP)

Configured in `next.config.ts`:

| Header | Value |
|--------|-------|
| Content-Security-Policy | Restricts script, style, image, connect, font, and frame sources |
| X-Content-Type-Options | nosniff |
| X-Frame-Options | DENY |
| X-XSS-Protection | 1; mode=block |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | camera=(), microphone=(), geolocation=() |

## OWASP Top 10 Coverage

| # | Vulnerability | FDC Mitigation |
|---|--------------|----------------|
| A01 | Broken Access Control | RBAC + workspace scoping + RLS policies |
| A02 | Cryptographic Failures | AES-256-GCM token encryption + HTTPS only |
| A03 | Injection | Zod validation + parameterized queries (Supabase) + HTML sanitization |
| A04 | Insecure Design | Defense-in-depth: auth + RBAC + RLS + CSP |
| A05 | Security Misconfiguration | CSP headers + strict TypeScript + environment variable validation |
| A06 | Vulnerable Components | Regular dependency updates + npm audit |
| A07 | Auth Failures | Supabase Auth (PKCE flow) + session management |
| A08 | Data Integrity Failures | Zod schema validation on all inputs |
| A09 | Logging Failures | Structured logging with Pino + audit logs |
| A10 | SSRF | No user-controlled URL fetching in server routes |

## Environment Variables

All secrets are stored in `.env.local` and never committed to version control:

- `SUPABASE_SERVICE_ROLE_KEY` - Service role for server-side Supabase access
- `TOKEN_ENCRYPTION_KEY` - AES-256-GCM key for Google API token encryption
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth credentials

## Best Practices

1. Never use `any` type - strict TypeScript catches type errors at compile time
2. Always validate request bodies with Zod before processing
3. Use `createServiceClient()` for server-side Supabase access
4. Use `getSessionUser()` to verify authentication in all API routes
5. Use `requireRole()` to enforce RBAC in admin-level operations
6. Run `npm audit` regularly to check for dependency vulnerabilities

---

**Last Updated**: 2026-03-05
**Phase**: 20 (Security)
