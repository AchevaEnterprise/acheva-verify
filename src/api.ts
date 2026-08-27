import type { VerificationResult } from './types';

const API_URL = (
  (import.meta.env.VITE_API_URL as string | undefined) ??
  'http://localhost:3000'
).replace(/\/+$/, '');

/**
 * Look up a serial. The endpoint is public — no key, no account — because the
 * person holding a printed sheet has neither.
 *
 * A network failure is NOT reported as "not genuine": telling someone their
 * document is fake because the wifi dropped would be worse than saying nothing.
 */
export async function verifySerial(
  serial: string,
): Promise<{ ok: true; result: VerificationResult } | { ok: false; error: string }> {
  try {
    const response = await fetch(
      `${API_URL}/verify/${encodeURIComponent(serial.trim())}`,
    );

    if (response.status === 429) {
      return {
        ok: false,
        error: 'Too many checks from this connection. Wait a minute and try again.',
      };
    }
    if (!response.ok) {
      return { ok: false, error: 'Acheva could not be reached. Try again shortly.' };
    }

    const body = (await response.json()) as { data?: VerificationResult };
    if (!body?.data) {
      return { ok: false, error: 'Acheva returned an unexpected response.' };
    }
    return { ok: true, result: body.data };
  } catch {
    return {
      ok: false,
      error: 'No connection to Acheva. Check your network and try again.',
    };
  }
}
