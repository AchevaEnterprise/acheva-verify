import { useCallback, useEffect, useState } from 'react';
import { verifySerial } from './api';
import type { VerificationResult } from './types';
import { Verdict } from './components/Verdict';
import { SheetView } from './components/SheetView';

/**
 * The serial from the address bar, if the page was opened by scanning a QR.
 * `/ACV-7F3A-92BD-4KX2` — one path segment, no router needed for one route.
 */
function serialFromPath(): string {
  return decodeURIComponent(window.location.pathname.replace(/^\/+/, '')).trim();
}

export function App() {
  const [serial, setSerial] = useState(serialFromPath);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const check = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    setChecking(true);
    setError(null);
    setResult(null);

    const response = await verifySerial(trimmed);
    if (response.ok) {
      setResult(response.result);
    } else {
      setError(response.error);
    }
    setChecking(false);
  }, []);

  // Scanning a QR lands directly on the answer — asking someone who just
  // scanned a code to then press a button would be pointless friction.
  useEffect(() => {
    const fromUrl = serialFromPath();
    if (fromUrl) void check(fromUrl);
  }, [check]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        <p className="text-sm font-semibold tracking-wide text-[color:var(--color-brand-dark)]">
          ACHEVA
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          Verify a document
        </h1>
        <p className="mt-2 max-w-2xl text-neutral-600">
          Enter the serial printed at the foot of a result sheet or statement of
          results, or scan its QR code. You will see the document exactly as
          Acheva issued it, so you can check it against the copy in your hand.
        </p>
      </header>

      <form
        className="mb-8 flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          void check(serial);
        }}
      >
        <label className="sr-only" htmlFor="serial">
          Document serial
        </label>
        <input
          id="serial"
          name="serial"
          value={serial}
          onChange={(event) => setSerial(event.target.value)}
          placeholder="ACV-7F3A-92BD-4KX2"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 font-mono text-base tracking-wider outline-none placeholder:font-sans placeholder:tracking-normal placeholder:text-neutral-400 focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand)]/30"
        />
        <button
          type="submit"
          disabled={checking || !serial.trim()}
          className="shrink-0 rounded-lg bg-[color:var(--color-brand)] px-6 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-[color:var(--color-brand-dark)]"
        >
          {checking ? 'Checking…' : 'Verify'}
        </button>
      </form>

      {error && (
        <div
          role="alert"
          className="mb-8 rounded-xl border border-neutral-300 bg-white p-5"
        >
          <p className="font-semibold">Could not check this serial</p>
          {/* Never "not genuine" — a network failure says nothing about the
              document, and implying otherwise would be worse than silence. */}
          <p className="mt-1 text-sm text-neutral-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <Verdict result={result} />
          {result.document && <SheetView sheet={result.document} />}
        </div>
      )}

      <footer className="mt-12 border-t border-neutral-200 pt-6 text-sm text-neutral-500">
        <p>
          Acheva records every document it issues. This page shows what was
          issued — it is not a substitute for the institution&rsquo;s official
          transcript.
        </p>
      </footer>
    </main>
  );
}
