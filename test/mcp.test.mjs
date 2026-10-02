import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './helpers.mjs';

const SERVER = join(root, 'mcp/server.mjs');

test('mcp selftest passes', () => {
  const r = spawnSync(process.execPath, [SERVER, '--selftest'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /0 failed/);
});

test('mcp answers a JSON-RPC session over stdio', () => {
  const at = '2026-10-04T08:00:00+03:00';
  const reqs = [
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } },
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    { jsonrpc: '2.0', id: 2, method: 'tools/list' },
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'najjab_deadlines', arguments: { countries: ['QA', 'KW'], sector: 'banking', incident_type: 'ransomware', severity: 'critical', discovered_at: at, lang: 'ar' } } },
    { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'najjab_get_obligation', arguments: { id: 'missing' } } },
    { jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'najjab_draft_notice', arguments: { countries: ['BH'], incident_type: 'data-breach', discovered_at: at } } },
    { jsonrpc: '2.0', id: 6, method: 'nope' },
    { jsonrpc: '2.0', id: 7, method: 'ping' },
  ];
  const input = reqs.map((r) => JSON.stringify(r)).join('\n') + '\n';
  const r = spawnSync(process.execPath, [SERVER], { input, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const lines = r.stdout.trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const byId = new Map(lines.map((m) => [m.id, m]));
  assert.equal(lines.length, 7, 'the notification gets no reply');
  assert.equal(byId.get(1).result.protocolVersion, '2025-06-18');
  assert.equal(byId.get(1).result.serverInfo.name, 'najjab');
  assert.equal(byId.get(2).result.tools.length, 7, 'seven tools listed');
  for (const t of byId.get(2).result.tools) assert.equal(t.annotations.readOnlyHint, true, `${t.name} read-only`);
  const d = byId.get(3).result.structuredContent;
  assert.equal(d.duties[0].id, 'kw-cbk-incident');
  assert.equal(d.duties[1].id, 'qa-ncsa-nia');
  assert.ok(/[\u0600-\u06FF]/.test(d.duties[0].authority), 'Arabic answer');
  assert.equal(byId.get(4).result.isError, true);
  assert.match(byId.get(5).result.content[0].text, /Personal Data Protection Authority/);
  assert.equal(byId.get(6).error.code, -32601);
  assert.deepEqual(byId.get(7).result, {});
});

test('README documents every tool by name', () => {
  const readme = readFileSync(join(root, 'README.md'), 'utf8');
  const src = readFileSync(SERVER, 'utf8');
  const names = [...src.matchAll(/name: '(najjab_[a-z_]+)'/g)].map((m) => m[1]);
  assert.equal(new Set(names).size, 7);
  for (const n of names) assert.ok(readme.includes(n), `README mentions ${n}`);
});
