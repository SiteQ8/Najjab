// Preflight: rebuild the bundle, run structural guards, the MCP selftest and the test suite.
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const problems = [];
const run = (args, label) => {
  const r = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8' });
  if (r.status !== 0) problems.push(`${label} failed:\n${r.stdout}\n${r.stderr}`);
  return r;
};
run([join(root, 'scripts/build.mjs')], 'build');
for (const f of ['docs/.nojekyll', 'docs/CNAME', 'docs/robots.txt', 'docs/sitemap.xml', 'docs/data/bundle.json', 'docs/favicon.svg', 'docs/og.png', 'docs/fonts/OFL.txt', 'LICENSE', 'NOTICE.md', 'README.md', 'package.json']) {
  if (!existsSync(join(root, f))) problems.push(`missing ${f}`);
}
const TEXT = new Set(['.js', '.mjs', '.json', '.md', '.html', '.css']);
const marker = new RegExp(['TO' + 'DO', 'FIX' + 'ME', 'X' + 'XX'].map((w) => `\\b${w}\\b`).join('|'));
const secret = /gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----/;
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (['node_modules', '.git'].includes(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!TEXT.has(extname(name))) continue;
    const s = readFileSync(p, 'utf8');
    if (marker.test(s)) problems.push(`unfinished marker in ${p}`);
    if (secret.test(s)) problems.push(`something that looks like a credential in ${p}`);
  }
}
walk(root);
run([join(root, 'mcp/server.mjs'), '--selftest'], 'mcp selftest');
const t = run(['--test', ...['data', 'engine', 'mcp', 'site'].map((n) => join(root, 'test', n + '.test.mjs'))], 'tests');
if (problems.length) {
  console.error('PREFLIGHT FAILED');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
console.log('preflight passed');
console.log(t.stdout.split('\n').filter((l) => /^# (tests|pass|fail)/.test(l)).join('\n'));
