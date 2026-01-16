function buildCSP(): string {
  let supabaseDomain = '';
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (url) supabaseDomain = new URL(url).hostname;
  } catch {}

  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src 'self' ${supabaseDomain ? `https://${supabaseDomain}` : ''} https://*.supabase.co https://accounts.google.com https://www.googleapis.com https://oauth2.googleapis.com wss://*.supabase.co`,
    "frame-src 'self' https://accounts.google.com",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join('; ');
}

export const securityHeaders = [
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Content-Security-Policy', value: buildCSP() },
];

export function getCSPForEnvironment(): string {
  if (process.env.NODE_ENV === 'development') {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' ws: wss: https:",
      "font-src 'self' data: https:",
      "frame-src 'self' https:",
    ].join('; ');
  }
  return buildCSP();
}
