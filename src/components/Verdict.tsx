import type { VerificationResult } from '../types';
import { formatDate } from '../format';

/**
 * The answer, stated before anything else on the page.
 *
 * "Genuine" is deliberately not the end of it: a genuine serial only proves the
 * document was issued by Acheva, not that the paper in front of you still says
 * what it said then. So the banner always carries the instruction to compare —
 * that comparison is the actual check, and the page below exists to make it
 * possible.
 */
export function Verdict({ result }: { result: VerificationResult }) {
  if (result.status === 'NOT_FOUND') {
    return (
      <div className="rounded-xl border border-[color:var(--color-fail)]/30 bg-[color:var(--color-fail)]/5 p-5">
        <p className="text-lg font-semibold text-[color:var(--color-fail)]">
          No document with this serial
        </p>
        <p className="mt-1 text-sm text-neutral-700">
          Acheva has never issued a document with that serial. Check for a typing
          mistake first — the characters <strong>O</strong>, <strong>I</strong>{' '}
          and <strong>L</strong> never appear in a real serial, so if you read one
          of those it was probably a <strong>0</strong>, <strong>1</strong> or{' '}
          <strong>7</strong>. If the serial is definitely right, treat the
          document as unverified.
        </p>
      </div>
    );
  }

  if (result.status === 'REVOKED') {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-5">
        <p className="text-lg font-semibold text-amber-800">
          Withdrawn — do not rely on this document
        </p>
        <p className="mt-1 text-sm text-neutral-700">
          This document was issued by Acheva on {formatDate(result.issuedAt)} and
          has since been withdrawn
          {result.revokedReason ? `: ${result.revokedReason}` : ''}. Ask the
          issuing department for a current copy.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[color:var(--color-brand)]/30 bg-[color:var(--color-brand-tint)] p-5">
      <p className="text-lg font-semibold text-[color:var(--color-brand-dark)]">
        Genuine — issued by Acheva on {formatDate(result.issuedAt)}
      </p>
      <p className="mt-1 text-sm text-neutral-700">
        Now compare the document below with the one in your hand. They must match
        exactly — the names, the scores and the totals. A genuine serial proves
        Acheva issued this document; it cannot tell you whether the paper you are
        holding was altered afterwards.
      </p>

      {result.supersededByNewerRecord && (
        <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          A newer copy of this result has since been issued — a score may have
          been moderated after your copy was printed. What is shown below is what
          your copy said when it was issued.
        </p>
      )}
    </div>
  );
}
