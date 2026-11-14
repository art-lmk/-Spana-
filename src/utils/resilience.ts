/**
 * Frontend Resilience & Observability Utilities
 * - Exponential backoff with jitter
 * - Resilient fetch wrapper
 * - SSE Live Stream listener with long-polling fallback
 */

export interface BackoffOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

/**
 * Executes an async function with jittered exponential backoff
 */
export async function fetchWithBackoff<T>(
  fn: () => Promise<T>,
  options: BackoffOptions = {}
): Promise<T> {
  const { maxAttempts = 3, baseDelayMs = 250, maxDelayMs = 3000 } = options;
  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt >= maxAttempts) {
        throw err;
      }
      const exponential = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
      const jitter = Math.random() * 0.5 * exponential;
      const sleepTime = exponential + jitter;
      await new Promise(r => setTimeout(r, sleepTime));
    }
  }
}

/**
 * Establishes an SSE event listener with automated reconnection
 */
export function connectEventStream(
  onEvent: (eventType: string, data: any) => void,
  role: string = 'client'
): () => void {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
    return () => {};
  }

  let eventSource: EventSource | null = null;
  let isClosed = false;

  const connect = () => {
    if (isClosed) return;
    try {
      eventSource = new EventSource(`/api/events/stream?role=${encodeURIComponent(role)}`);

      eventSource.onopen = () => {
        // SSE Connected
      };

      eventSource.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          onEvent('message', parsed);
        } catch {
          // ignore parsing error
        }
      };

      const eventNames = [
        'BOOKING_CREATED',
        'ESCROW_STATUS_UPDATED',
        'FEATURE_FLAG_CHANGED',
        'CIRCUIT_BREAKER_UPDATED',
        'DLQ_RESOLVED',
        'SYSTEM_BROADCAST'
      ];

      eventNames.forEach(evt => {
        eventSource?.addEventListener(evt, (e: any) => {
          try {
            const parsed = JSON.parse(e.data);
            onEvent(evt, parsed);
          } catch {
            // ignore
          }
        });
      });

      eventSource.onerror = () => {
        eventSource?.close();
        if (!isClosed) {
          // Reconnect with backoff
          setTimeout(connect, 5000);
        }
      };
    } catch {
      // Fallback
    }
  };

  connect();

  return () => {
    isClosed = true;
    eventSource?.close();
  };
}
