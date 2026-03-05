# Environment Setup Guide

## Environment Matrix

| Environment | URL | Branch | Purpose |
|-------------|-----|--------|---------|
| Production | app.example.com | main | Live service |
| Test | test.example.com | test | Pre-production testing |
| Local | localhost:3000 | any | Development |

## Setup Steps

1. Copy `.env.example` to `.env.local`
   ```bash
   cp .env.example .env.local
   ```
2. Fill in Supabase credentials (from Supabase Dashboard > Settings > API)
3. Fill in Google OAuth credentials (from Google Cloud Console > APIs & Services > Credentials)
4. Generate TOKEN_ENCRYPTION_KEY:
   ```bash
   openssl rand -base64 32
   ```

## Environment Variables Reference

| Variable | Required | Side | Description |
|----------|----------|------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Client | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Client | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server | Supabase service role key (admin access) |
| `GOOGLE_CLIENT_ID` | Yes | Server | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Server | Google OAuth client secret |
| `TOKEN_ENCRYPTION_KEY` | Yes | Server | AES-256-GCM encryption key for Google tokens |
| `NEXT_PUBLIC_APP_NAME` | No | Client | Application display name |
| `PORT` | No | Server | Override default port (3000) |

## Git Worktree (parallel development)

When working on multiple branches simultaneously (e.g., main + test), use git worktrees to avoid constant branch switching:

```bash
# Create test branch worktree
git worktree add ../fdc-test test

# List worktrees
git worktree list

# Remove worktree
git worktree remove ../fdc-test
```

Each worktree has its own working directory but shares the same git history. You can run separate dev servers on different ports:

```bash
# Terminal 1: main branch (default port 3000)
cd /path/to/fdc-modular-starter
npm run dev

# Terminal 2: test branch (port 3001)
cd /path/to/fdc-test
PORT=3001 npm run dev
```

## Auth Flow

### Login Flow

```
User -> /login -> Supabase PKCE -> Google OAuth -> /api/auth/callback -> Session
```

1. User clicks "Login with Google" on `/login`
2. Supabase initiates PKCE (Proof Key for Code Exchange) flow
3. User authenticates with Google
4. Google redirects to `/api/auth/callback`
5. Callback exchanges code for session, stores encrypted tokens
6. User is redirected to `/dashboard`

### Google API Flow

```
User -> Settings -> Google Connect -> /api/google/callback -> Token Storage
```

1. User requests Google Calendar/Tasks access from Settings
2. OAuth flow with Calendar + Tasks scopes
3. Callback stores provider_token and refresh_token (AES-256-GCM encrypted)
4. Tokens are auto-refreshed when expired

## Vercel Deployment

When setting environment variables on Vercel:

```bash
# Use printf (not echo) to avoid trailing newline issues
printf '%s' 'your-value' | vercel env add VARIABLE_NAME production
```

Verify no trailing bytes:
```bash
vercel env pull .env.vercel && xxd .env.vercel | tail
```

---

**Last Updated**: 2026-03-05
