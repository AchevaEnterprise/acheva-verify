# acheva-verify

The public document verifier behind **verify.acheva.app**.

Someone holding a printed Acheva result sheet scans its QR code — or types the
serial from its foot — and sees the document exactly as Acheva issued it, so
they can compare it against the paper in their hand.

```bash
npm run dev                      # → http://localhost:4500
PORT=5000 npm run dev
```

No install, no build, no dependencies. Edit `config.js` to point at an API.

## Why it is plain HTML

This is one screen that people open from a phone camera, usually on mobile
data, usually once. A framework runtime would cost more than the entire page:

| | gzipped |
|---|---|
| React + Vite + Tailwind (first attempt) | 64 kB |
| **This** | **7 kB** |

It also has no dependency tree to patch, and deploys by copying four files onto
any static host.

## How it fits together

1. Downloading a result from the staff portal calls
   `POST /results/:id/sheet/issue`, which mints a serial and stores a snapshot
   of exactly what that copy said.
2. The serial and a QR pointing at `verify.acheva.app/<serial>` are printed on
   the document.
3. This page calls `GET /verify/:serial` — **public, no account, no key** —
   and renders the snapshot.

## Things worth knowing before changing it

- **It renders the SNAPSHOT, not the live record.** A sheet printed before a
  moderation must still verify against itself. When the record has since
  changed, the API sets `supersededByNewerRecord` and the page says so.
- **"Genuine" is never the whole answer.** A serial proves Acheva issued the
  document; it cannot prove the paper was not altered afterwards. Every genuine
  verdict therefore asks the reader to compare the two, and the sheet is laid
  out in the printed order so that comparison is easy. Do not reduce this page
  to a green tick.
- **A network failure is reported as "could not check", never "not genuine".**
  Telling someone their document is fake because their connection dropped would
  be worse than saying nothing.
- The unknown-serial message points at `O`, `I` and `L` first: those never
  appear in a real serial, so reading one almost always means a misread.
- Every value is rendered with `textContent`, never by building HTML strings —
  no interpolation means nothing to escape wrong.
- **Deep links need a rewrite.** `_redirects` (Netlify) and `vercel.json` are
  included; for nginx use `try_files $uri /index.html`. `?s=SERIAL` and
  `#SERIAL` are accepted as fallbacks on hosts without one.
- `noindex, nofollow` — a crawler walking serials is precisely what we do not
  want.
