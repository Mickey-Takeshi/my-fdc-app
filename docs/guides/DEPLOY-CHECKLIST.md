# FDC Deployment Checklist

## Pre-Deploy

- [ ] All environment variables set in hosting provider:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `TOKEN_ENCRYPTION_KEY` (32+ character key for AES-256-GCM)
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
- [ ] `npm run build` passes locally without errors
- [ ] `npm run test:unit` passes all tests
- [ ] `npm run lint` passes without errors
- [ ] `npm run type-check` passes without errors

## Supabase Configuration

- [ ] RLS policies applied (see `docs/sql/rls-policies.sql`)
- [ ] Google OAuth provider configured in Supabase Auth
- [ ] Redirect URLs updated for production domain
- [ ] Database migrations up to date

## Vercel / Hosting

- [ ] Production branch set to `main`
- [ ] Build command: `npm run build`
- [ ] Output directory: `.next`
- [ ] Node.js version: 22.x
- [ ] Environment variables configured in dashboard

## Post-Deploy

- [ ] Verify login flow (Google OAuth + demo login)
- [ ] Verify CSP headers in browser DevTools (Network tab)
- [ ] Verify API routes respond correctly
- [ ] Check browser console for CSP violations
- [ ] Test Core Web Vitals with Lighthouse or PageSpeed Insights

## Performance

- [ ] Image optimization enabled (AVIF + WebP)
- [ ] Security headers active (CSP, X-Frame-Options, etc.)
- [ ] No console errors in production

---

**Last Updated**: 2026-03-05
**Phase**: 22 (Deploy + Performance)
