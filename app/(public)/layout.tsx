/**
 * app/(public)/layout.tsx
 *
 * Public pages layout (no authentication required).
 * Used for privacy policy, terms of service, and other public-facing pages.
 */

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
