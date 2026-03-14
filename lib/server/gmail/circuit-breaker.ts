/**
 * サーキットブレーカー
 * States: CLOSED -> OPEN -> HALF_OPEN -> CLOSED
 *
 * Vercel KV が未設定の場合はインメモリで動作
 */

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitStatus {
  state: CircuitState;
  failureCount: number;
  lastFailureAt: number;
  openedAt: number | null;
}

const FAILURE_THRESHOLD = 3;
const OPEN_DURATION_MS = 15 * 60 * 1000; // 15分

// インメモリフォールバック
const memoryStore = new Map<string, CircuitStatus>();

function getDefault(): CircuitStatus {
  return { state: 'CLOSED', failureCount: 0, lastFailureAt: 0, openedAt: null };
}

export async function getCircuitStatus(configId: string): Promise<CircuitStatus> {
  const key = `circuit:gmail:${configId}`;
  return memoryStore.get(key) ?? getDefault();
}

export async function canExecute(configId: string): Promise<boolean> {
  const status = await getCircuitStatus(configId);

  if (status.state === 'CLOSED') return true;

  if (status.state === 'OPEN' && status.openedAt) {
    const elapsed = Date.now() - status.openedAt;
    if (elapsed >= OPEN_DURATION_MS) {
      // HALF_OPEN: 1件試行
      await updateStatus(configId, { ...status, state: 'HALF_OPEN' });
      return true;
    }
    return false;
  }

  return status.state === 'HALF_OPEN';
}

export async function recordSuccess(configId: string): Promise<void> {
  await updateStatus(configId, getDefault());
}

export async function recordFailure(configId: string): Promise<void> {
  const status = await getCircuitStatus(configId);
  const newCount = status.failureCount + 1;

  if (newCount >= FAILURE_THRESHOLD) {
    await updateStatus(configId, {
      state: 'OPEN',
      failureCount: newCount,
      lastFailureAt: Date.now(),
      openedAt: Date.now(),
    });
  } else {
    await updateStatus(configId, {
      ...status,
      failureCount: newCount,
      lastFailureAt: Date.now(),
    });
  }
}

async function updateStatus(configId: string, status: CircuitStatus): Promise<void> {
  const key = `circuit:gmail:${configId}`;
  memoryStore.set(key, status);
}
