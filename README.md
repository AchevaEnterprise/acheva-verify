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

## Going live at verify.acheva.app

Two separate jobs: host the files, then point the subdomain at the host.

`acheva.app` runs on **Namecheap BasicDNS** (`dns1/dns2.registrar-servers.com`)
and the landing page is already on **Vercel** — so Namecheap is only needed for
one CNAME record.

1. **Deploy as its OWN Vercel project.** Not a path on the landing-page
   project: that one would serve the landing page at this subdomain. From this
   folder, `npx vercel`. Framework preset **Other**, no build command, output
   directory `.` — `vercel.json` here already supplies the deep-link rewrite
   and the security headers.
2. **Add the domain** in that project → Settings → Domains → `verify.acheva.app`.
   Vercel prints the CNAME target it wants.
3. **In Namecheap** → Domain List → acheva.app → Advanced DNS → Add New Record:
   `CNAME` · Host `verify` · Value = the target from step 2 · TTL Automatic.
4. **Redeploy the API.** `GET /verify/:serial` must exist on the deployed
   backend — check with
   `curl -o /dev/null -w '%{http_code}' https://<api>/verify/ACV-0000-0000-0000`,
   which must return **200** (the endpoint answers `NOT_FOUND` in the body, never
   with a 404 status). A 404 means the verification-portal module is not on that
   deployment yet.
5. **Set `VERIFY_PORTAL_URL=https://verify.acheva.app`** on the API, so minted
   serials encode the live address. It defaults to that value, but a default is
   a poor place for the address printed on paper.

Do steps 4 and 5 before or with step 3. A live page in front of an API without
the route reports "could not check this serial" for every genuine document,
which is worse than the subdomain simply not resolving yet.

**`.app` is on the HSTS preload list** — the browser refuses plain HTTP for it
entirely. The host supplies the certificate automatically, but it also means
the API must be HTTPS or the fetch is blocked as mixed content. `config.js`
picks the API by hostname so a deploy cannot accidentally ship pointing at
localhost.

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
