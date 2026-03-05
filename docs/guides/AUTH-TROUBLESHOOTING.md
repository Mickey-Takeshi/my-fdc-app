# Auth Troubleshooting Guide

Common authentication issues and their solutions for the FDC Modular Starter.

---

## redirect_uri_mismatch

**Symptom**: Google OAuth returns `redirect_uri_mismatch` error.

**Cause**: The redirect URI configured in Google Cloud Console does not match the one sent by your application.

**Solution**:
1. Go to Google Cloud Console > APIs & Services > Credentials
2. Edit your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", add:
   - Local: `http://localhost:3000/api/auth/callback`
   - Test: `https://test.example.com/api/auth/callback`
   - Production: `https://app.example.com/api/auth/callback`
4. Verify no trailing slashes in the URIs
5. Wait a few minutes for Google to propagate changes

---

## Environment Variable Newlines

**Symptom**: Auth fails silently. Keys appear correct but do not work.

**Cause**: Trailing `0a` (newline) bytes in environment variables, often introduced by `echo` when setting Vercel env vars.

**Diagnosis**:
```bash
# Check for trailing bytes
printf '%s' "$SUPABASE_SERVICE_ROLE_KEY" | xxd | tail -1
# Should end with the last character of your key, NOT 0a
```

**Solution**:
```bash
# Use printf instead of echo when setting Vercel env vars
printf '%s' 'your-key-value' | vercel env add SUPABASE_SERVICE_ROLE_KEY production
```

---

## PKCE Code Exchange Failure

**Symptom**: User completes Google login but is redirected back to `/login` without a session.

**Cause**: The PKCE code verifier cookie is missing or expired.

**Solution**:
1. Check that cookies are not being blocked by the browser
2. Verify the Supabase project URL matches `NEXT_PUBLIC_SUPABASE_URL`
3. Check the callback route at `/api/auth/callback` for errors in server logs
4. Ensure the Supabase Auth settings have the correct Site URL and Redirect URLs

---

## Token Encryption Key Mismatch

**Symptom**: Google Calendar/Tasks API calls fail with decryption errors after deployment.

**Cause**: `TOKEN_ENCRYPTION_KEY` differs between the environment where tokens were stored and the environment trying to read them.

**Solution**:
1. Ensure the same `TOKEN_ENCRYPTION_KEY` is used across all environments that share a database
2. If you need to rotate the key, users must re-authenticate their Google connection
3. Generate a proper key: `openssl rand -base64 32`

---

## Session Not Persisting After OAuth

**Symptom**: User logs in successfully but loses session on page refresh.

**Cause**: Cookie configuration mismatch between Supabase and the application domain.

**Solution**:
1. Verify the Supabase project Site URL matches your deployment URL
2. Check that the `/api/auth/callback` route is correctly exchanging the code for a session
3. Inspect browser cookies for `sb-*` entries
4. For local development, ensure you are using `http://localhost:3000` (not `127.0.0.1`)

---

## Google API Scope Errors

**Symptom**: Calendar or Tasks API returns 403 Forbidden.

**Cause**: The OAuth consent screen does not include the required scopes, or the user did not grant them.

**Solution**:
1. In Google Cloud Console > OAuth consent screen, verify these scopes are listed:
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/tasks`
2. Have the user disconnect and re-connect their Google account to re-grant scopes
3. Check that the Supabase Auth provider configuration includes the required scopes

---

## Supabase Auth Callback 500 Error

**Symptom**: `/api/auth/callback` returns a 500 Internal Server Error.

**Cause**: Missing or invalid server-side environment variables.

**Solution**:
1. Verify `SUPABASE_SERVICE_ROLE_KEY` is set and valid
2. Verify `TOKEN_ENCRYPTION_KEY` is set and is a valid 32-byte base64 key
3. Check server logs (Vercel Functions logs or local terminal) for the specific error
4. Ensure the Supabase project is not paused (free-tier projects pause after inactivity)

---

## Multi-Environment Testing

When testing auth flows across multiple environments:

1. Each environment needs its own redirect URI in Google Cloud Console
2. Use separate `.env.local` files per git worktree
3. Test with different ports to avoid cookie conflicts:
   ```bash
   # main branch
   PORT=3000 npm run dev
   # test branch
   PORT=3001 npm run dev
   ```
4. Clear browser cookies between environment switches if sessions conflict

---

**Last Updated**: 2026-03-05
