/**
 * サーキットブレーカー（E氏設計）
 *
 * States: CLOSED → OPEN → HALF_OPEN → CLOSED
 * - CLOSED: 通常動作
 * - OPEN: 3回連続失敗で遷移。15分間API呼び出しスキップ
 * - HALF_OPEN: 15分後に1件試行。成功→CLOSED、失敗→OPEN
 */

import { logger } from '../logger';

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerState {
  state: CircuitState;
  failureCount: number;
  lastFailureAt: number;
  lastTransitionAt: number;
}

const FAILURE_THRESHOLD = 3;
const RECOVERY_TIMEOUT_MS = 15 * 60 * 1000; // 15分

// In-memory store (for single-instance; use Vercel KV for multi-instance)
const circuits = new Map<string, CircuitBreakerState>();

function getState(configId: string): CircuitBreakerState {
  return (
    circuits.get(configId) ?? {
      state: 'CLOSED',
      failureCount: 0,
      lastFailureAt: 0,
      lastTransitionAt: Date.now(),
    }
  );
}

export function canExecute(configId: string): boolean {
  const cb = getState(configId);

  switch (cb.state) {
    case 'CLOSED':
      return true;
    case 'OPEN': {
      // Check if recovery timeout has elapsed
      if (Date.now() - cb.lastFailureAt >= RECOVERY_TIMEOUT_MS) {
        cb.state = 'HALF_OPEN';
        cb.lastTransitionAt = Date.now();
        circuits.set(configId, cb);
        logger.info({ configId }, 'Circuit breaker transitioning to HALF_OPEN');
        return true;
      }
      return false;
    }
    case 'HALF_OPEN':
      return true;
  }
}

export function recordSuccess(configId: string): void {
  const cb = getState(configId);
  cb.state = 'CLOSED';
  cb.failureCount = 0;
  cb.lastTransitionAt = Date.now();
  circuits.set(configId, cb);

  logger.info({ configId }, 'Circuit breaker: success recorded, state CLOSED');
}

export function recordFailure(configId: string): void {
  const cb = getState(configId);
  cb.failureCount++;
  cb.lastFailureAt = Date.now();

  if (cb.state === 'HALF_OPEN' || cb.failureCount >= FAILURE_THRESHOLD) {
    cb.state = 'OPEN';
    cb.lastTransitionAt = Date.now();
    logger.warn({ configId, failureCount: cb.failureCount }, 'Circuit breaker OPEN');
  }

  circuits.set(configId, cb);
}

export function getCircuitState(configId: string): CircuitState {
  return getState(configId).state;
}
