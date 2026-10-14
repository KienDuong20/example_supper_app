#!/usr/bin/env node
/**
 * Tiny static "CDN" for dist/ — zero dependencies, on purpose predictable:
 *   - serves files exactly by path (query string like ?mbf_v= is ignored)
 *   - no redirects, no directory listing (a folder → 404)
 *   - Cache-Control: no-cache, so a hot deploy is visible on the next load
 *
 * Usage: node tools/cdn.js [port]     (default 8080)
 *
 * Production equivalent: https://cdn.mobifone.app/miniapps (real CDN in front of deploy/cdn-static).
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST = path.resolve(__dirname, '..', 'dist');
const PORT = Number(process.argv[2]) || 8080;
const TYPES = {'.html': 'text/html; charset=utf-8', '.json': 'application/json', '.js': 'text/javascript', '.css': 'text/css'};

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = path.join(DIST, urlPath);
    const ok = file.startsWith(DIST + path.sep) && fs.existsSync(file) && fs.statSync(file).isFile();
    console.log(`${ok ? 200 : 404} ${req.method} ${req.url}`);
    if (!ok) {
      res.writeHead(404, {'Content-Type': 'text/plain'});
      return res.end('Not found');
    }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(file).pipe(res);
  })
  .listen(PORT, () => console.log(`CDN serving ${DIST} at http://localhost:${PORT}`));
