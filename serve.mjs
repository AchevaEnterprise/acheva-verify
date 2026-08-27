#!/usr/bin/env node
/**
 * A static server for local development. No dependencies — the app has none,
 * and a dev server that needed an install would undermine the point.
 *
 * Any unknown path falls back to index.html, so `/ACV-7F3A-92BD-4KX2` (what a
 * QR code opens) works exactly as it will in production.
 *
 *   node serve.mjs            → http://localhost:4500
 *   PORT=5000 node serve.mjs
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.env.PORT ?? 4500);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  // `normalize` then the prefix check keeps `../` out of the served root.
  const requested = normalize(join(ROOT, decodeURIComponent(url.pathname)));
  const safe = requested.startsWith(ROOT) ? requested : ROOT;

  const candidates = [safe, join(ROOT, 'index.html')];

  for (const candidate of candidates) {
    try {
      const body = await readFile(candidate);
      res.writeHead(200, {
        'Content-Type': TYPES[extname(candidate)] ?? 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      res.end(body);
      return;
    } catch {
      // Fall through to index.html — this is the deep-link rewrite.
    }
  }

  res.writeHead(404).end('Not found');
}).listen(PORT, () => {
  console.log(`Acheva verify → http://localhost:${PORT}`);
  console.log(`Deep link     → http://localhost:${PORT}/ACV-XXXX-XXXX-XXXX`);
});
