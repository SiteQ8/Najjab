// External link check: every source, secondary and authority link in the data, plus the links in README and NOTICE.
// A 404 or 410 fails. Sites that refuse automated clients (401, 403, 429, 503) and network errors are reported, not failed,
// because they block robots rather than readers. Run: npm run links
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const bundle = JSON.parse(readFileSync(join(root, 'docs/data/bundle.json'), 'utf8'));
const urls = new Map();
const add = (u, where) => { if (/^https?:\/\//.test(u)) urls.set(u, urls.get(u) || where); };
for (const [id, a] of Object.entries(bundle.authorities)) if (a.url) add(a.url, `authority ${id}`);
for (const o of bundle.obligations) {
  if (o.source.url) add(o.source.url, `${o.id} source`);
  for (const u of o.secondary || []) add(u, `${o.id} secondary`);
}
for (const f of ['README.md', 'NOTICE.md']) {
  for (const m of readFileSync(join(root, f), 'utf8').matchAll(/https?:\/\/[^\s)|>"'`]+/g)) add(m[0].replace(/[.,;*]+$/, ''), f);
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
async function probe(u) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(u, { method, redirect: 'follow', headers: { 'user-agent': UA, accept: 'text/html,application/pdf,*/*' }, signal: AbortSignal.timeout(25000) });
      if (method === 'HEAD' && (res.status === 405 || res.status === 403 || res.status === 404 || res.status >= 500)) continue;
      return res.status;
    } catch (e) {
      if (method === 'GET') return `error ${e.cause?.code || e.name}`;
    }
  }
  return 'error';
}

const rows = await Promise.all([...urls].map(async ([u, where]) => ({ u, where, status: await probe(u) })));
let broken = 0;
for (const r of rows.sort((a, b) => a.where.localeCompare(b.where))) {
  const s = r.status;
  const verdict = typeof s === 'number' && s < 400 ? 'ok' : (s === 404 || s === 410 ? 'BROKEN' : 'refused');
  if (verdict === 'BROKEN') broken += 1;
  console.log(`${verdict.padEnd(7)} ${String(s).padEnd(14)} ${r.where.padEnd(28)} ${r.u}`);
}
console.log(`links: ${rows.length} checked, ${broken} broken`);
process.exit(broken ? 1 : 0);
