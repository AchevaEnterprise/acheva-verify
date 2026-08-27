# acheva-verify-WEB-UI

The public document verifier behind **verify.acheva.app**.

Someone holding a printed Acheva result sheet scans its QR code — or types the
serial from its foot — and sees the document exactly as Acheva issued it, so
they can compare it against the paper in their hand.

```bash
npm install
VITE_API_URL=http://localhost:3000 npm run dev   # → http://localhost:4500
npm run build
```

## How it fits together

1. Downloading a result from the staff portal calls
   `POST /results/:id/sheet/issue`, which mints a serial and stores a snapshot
   of exactly what that copy said.
2. The serial and a QR pointing at `verify.acheva.app/<serial>` are printed on
   the document.
3. This app calls `GET /verify/:serial` — **public, no account, no key** —
   and renders the snapshot.

## Things worth knowing before changing it

- **It renders the SNAPSHOT, not the live record.** A sheet printed before a
  moderation must still verify against itself. When the record has since
  changed the API sets `supersededByNewerRecord` and the page says so.
- **"Genuine" is never the whole answer.** A serial proves Acheva issued the
  document; it cannot prove the paper was not altered afterwards. Every genuine
  verdict therefore tells the reader to compare the two, and that comparison is
  the actual check. Do not reduce the page to a green tick.
- **A network failure is not "not genuine".** Telling someone their document is
  fake because their connection dropped would be worse than saying nothing.
- The unknown-serial message points at `O`, `I` and `L` first: those never
  appear in a real serial, so reading one almost always means a misread.
- No router. One route param, parsed from `location.pathname`. Any host serving
  this must rewrite all paths to `index.html`.
- `noindex, nofollow` — a crawler walking serials is precisely what we do not
  want.
