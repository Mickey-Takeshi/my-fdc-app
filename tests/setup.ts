import '@testing-library/jest-dom';
import { vi } from 'vitest';

// グローバルモック
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// fetch モック
global.fetch = vi.fn();
