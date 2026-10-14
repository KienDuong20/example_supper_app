#!/usr/bin/env node
/**
 * Build every mini app into the "CDN" folder (dist/) and generate the runtime manifest.
 *
 *   miniapps/<id>/manifest.json + app.js + _sdk/sdk.js + _template/index.html
 *     → dist/<id>/<version>/index.html   (one self-contained file)
 *     → dist/runtime.json                (what the host fetches; = GET /api/v1/mini-apps/runtime)
 *
 * Usage: node tools/build.js            (all mini apps)
 *        node tools/build.js miniapp-hello
 *
 * Production equivalent: scripts/miniapps/build-all.sh → deploy/cdn-static + SQL for the platform DB.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'miniapps');
const DIST = path.join(ROOT, 'dist');

const template = fs.readFileSync(path.join(SRC, '_template/index.html'), 'utf8');
const sdk = fs.readFileSync(path.join(SRC, '_sdk/sdk.js'), 'utf8');

const only = process.argv[2];
const ids = fs.readdirSync(SRC).filter((d) => d.startsWith('miniapp-'));

const runtime = [];
for (const id of ids) {
  const manifest = JSON.parse(fs.readFileSync(path.join(SRC, id, 'manifest.json'), 'utf8'));
  const bundlePath = `${id}/${manifest.version}/index.html`;
  runtime.push({ ...manifest, bundlePath });

  if (only && only !== id) continue;

  const appJs = fs.readFileSync(path.join(SRC, id, 'app.js'), 'utf8');
  const meta = { id, name: manifest.name, version: manifest.version };
  // Function replacers: avoid `$&`-style patterns in source being interpreted by String.replace.
  const html = template
    .replace('{{TITLE}}', () => manifest.name)
    .replace('{{META_JSON}}', () => JSON.stringify(meta).replace(/</g, '\\u003c'))
    .replace('{{SDK}}', () => sdk)
    .replace('{{APP}}', () => appJs);

  const out = path.join(DIST, bundlePath);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  console.log(`built  ${bundlePath}`);
}

fs.mkdirSync(DIST, { recursive: true });
fs.writeFileSync(
  path.join(DIST, 'runtime.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), apps: runtime }, null, 2),
);
console.log(`wrote  runtime.json (${runtime.length} apps)`);
