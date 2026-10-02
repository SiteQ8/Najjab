import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { root, textFiles } from './helpers.mjs';

const read = (p) => readFileSync(join(root, p), 'utf8');
const html = read('docs/index.html');
const app = read('docs/assets/app.js');
const css = read('docs/assets/styles.css') + read('docs/assets/fonts.css');

test('page declares a strict, self-only CSP', () => {
  assert.match(html, /Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'/);
  assert.match(html, /object-src 'none'/);
  assert.match(html, /base-uri 'self'/);
});

test('page is right-to-left Arabic by default and links its own assets', () => {
  assert.match(html, /<html lang="ar" dir="rtl">/);
  for (const a of ['assets/app.js', 'assets/styles.css', 'assets/fonts.css', 'favicon.svg']) assert.ok(html.includes(a), a);
  assert.match(html, /https:\/\/najjab\.3li\.info\//);
});

test('no inline scripts, styles or handlers, and nothing loads from another site', () => {
  assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>[^<]/.test(html), 'no inline script');
  assert.ok(!/\sstyle=/.test(html), 'no inline style attributes');
  assert.ok(!/\son[a-z]+\s*=\s*["']/i.test(html), 'no inline handlers');
  assert.ok(!/style=|\.innerHTML|insertAdjacentHTML|document\.write/.test(app), 'app builds nodes, never markup strings or style attributes');
  assert.ok(!/url\(\s*['"]?https?:/.test(css), 'fonts and images are self-hosted');
  const remote = [...html.matchAll(/(?:src|href)="(https?:[^"]+)"/g)].map((m) => m[1]).filter((u) => !u.startsWith('https://najjab.3li.info/'));
  assert.deepEqual(remote, [], 'no remote assets in the page');
});

test('the published folder is complete', () => {
  for (const f of ['docs/CNAME', 'docs/.nojekyll', 'docs/robots.txt', 'docs/sitemap.xml', 'docs/og.png', 'docs/favicon.svg', 'docs/fonts/OFL.txt', 'docs/data/bundle.json', 'LICENSE', 'NOTICE.md', 'README.md', 'CHANGELOG.md']) {
    assert.ok(existsSync(join(root, f)), f);
  }
  for (const m of css.matchAll(/url\('\.\.\/fonts\/([^']+)'\)/g)) assert.ok(existsSync(join(root, 'docs/fonts', m[1])), m[1]);
});

test('the bundle is current', () => {
  const r = spawnSync(process.execPath, [join(root, 'scripts/build.mjs'), '--check'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr || r.stdout);
});

test('house style holds in every text file', () => {
  const dash = /[\u2010-\u2015]/;
  const banned = new RegExp(['cla' + 'ude', 'anthro' + 'pic', '\\bnb' + 'k\\b'].join('|'), 'i');
  for (const f of textFiles()) {
    const s = read(f);
    assert.ok(!dash.test(s), `${f}: no Unicode dashes`);
    assert.ok(!banned.test(s), `${f}: no tool or employer attribution`);
  }
});
