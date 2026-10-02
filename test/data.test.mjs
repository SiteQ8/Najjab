import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { root, bundle as b, pairs, pair, arabicSentence, arabicLabel } from './helpers.mjs';

test('every text exists in both languages and follows the Arabic writing rules', () => {
  const all = pairs(b);
  assert.ok(all.length >= 350, `expected hundreds of bilingual texts, found ${all.length}`);
  for (const { en, ar, path } of all) {
    pair(en, ar, path);
    if (en.trim().endsWith('.')) arabicSentence(ar, path);
    else arabicLabel(ar, path);
  }
});

test('the register holds 22 duties across all six countries and three free zones', () => {
  assert.equal(b.obligations.length, 22);
  for (const z of Object.keys(b.zones)) assert.ok(b.obligations.some((o) => o.zone === z), `${z} has a duty`);
  for (const o of b.obligations.filter((x) => x.zone)) assert.equal(b.zones[o.zone].country, o.country, `${o.id}: zone in its country`);
  assert.deepEqual(Object.keys(b.countries), ['KW', 'SA', 'AE', 'QA', 'BH', 'OM']);
  for (const c of Object.keys(b.countries)) assert.ok(b.obligations.some((o) => o.country === c), `${c} has at least one duty`);
  assert.equal(new Set(b.obligations.map((o) => o.id)).size, b.obligations.length, 'ids are unique');
});

test('every duty names its authority, trigger, sectors and a deadline', () => {
  for (const o of b.obligations) {
    const a = b.authorities[o.authority];
    assert.ok(a, `${o.id}: authority exists`);
    assert.equal(a.country, o.country, `${o.id}: authority is in the same country`);
    assert.ok(b.triggers[o.trigger], `${o.id}: trigger exists`);
    assert.ok(o.sectors.length && o.sectors.every((s) => s === 'all' || b.sectors[s]), `${o.id}: sectors are known`);
    assert.ok(o.deadlines.some((d) => d.stage === 'initial'), `${o.id}: has a first notice`);
  }
});

test('verification is honest: official duties link the text, secondary ones name who confirmed them', () => {
  for (const o of b.obligations) {
    assert.ok(b.verification_levels[o.verification], `${o.id}: known verification level`);
    assert.ok(o.source.title && o.source.ref, `${o.id}: source title and reference`);
    if (o.verification === 'official') assert.ok(o.source.url || o.source.gazette, `${o.id}: official text is linked or cited in the gazette`);
    if (o.verification === 'secondary') assert.ok((o.secondary || []).length > 0, `${o.id}: secondary sources listed`);
    for (const u of [o.source.url, ...(o.secondary || [])].filter(Boolean)) assert.match(u, /^https:\/\//, `${o.id}: https link`);
  }
  assert.equal(b.obligations.filter((o) => o.verification === 'official').length, 16);
  assert.equal(b.obligations.filter((o) => o.verification === 'secondary').length, 6);
});

test('the deadlines encode what the sources say', () => {
  const ob = (id) => b.obligations.find((o) => o.id === id);
  const first = (id, sev) => ob(id).deadlines.find((d) => d.stage === 'initial' && (!sev || d.severity === sev));
  assert.equal(first('kw-cbk-incident', 'high').hours, 1);
  assert.equal(first('kw-cbk-incident', 'medium').hours, 4);
  assert.equal(first('kw-citra-pdb').hours, 24);
  assert.equal(first('qa-ncsa-nia', 'critical').hours, 2);
  for (const id of ['sa-sdaia-pdb', 'qa-pdppl', 'bh-pdpa', 'om-pdpl']) assert.equal(first(id).hours, 72, `${id} is 72 hours`);
  assert.equal(first('sa-sama-csf').rule, 'immediately');
  assert.equal(ob('sa-sama-itgf').deadlines.find((d) => d.stage === 'report').days, 5);
  assert.equal(first('ae-pdpl').rule, 'by-regulation');
  assert.equal(first('sa-nca-ecc').rule, 'no-fixed-period');
  assert.equal(first('bh-cbb-banks').hours, 1);
  assert.equal(ob('bh-cbb-banks').deadlines.find((d) => d.stage === 'preliminary').hours, 2);
  assert.equal(ob('bh-cbb-banks').deadlines.find((d) => d.stage === 'report').days, 10);
  assert.equal(first('ae-cbuae-oprisk').hours, 4);
  assert.equal(ob('ae-cbuae-oprisk').deadlines.find((d) => d.stage === 'preliminary').hours, 24);
  assert.equal(ob('ae-cbuae-oprisk').deadlines.find((d) => d.stage === 'high_risk').hours, 72);
  assert.equal(first('qa-qcb-data').rule, 'promptly');
  assert.equal(first('bh-ncsc-irp').rule, 'no-fixed-period');
  assert.equal(first('om-cdc').rule, 'no-fixed-period');
  assert.equal(first('ae-difc-dp').rule, 'as-soon-as-practicable');
  assert.equal(first('ae-adgm-dp').hours, 72);
  assert.equal(first('qa-qfc-dp').hours, 72);
});

test('every incident type has a full playbook and a tabletop exercise', () => {
  for (const t of Object.keys(b.incident_types)) {
    for (const ph of b.phases) assert.ok(b.playbooks[t][ph].length > 0, `${t}: ${ph}`);
    const x = b.tabletop[t];
    assert.ok(x.injects.length >= 4 && x.questions.length >= 3, `${t}: four developments and three questions at least`);
    assert.ok(x.countries.every((c) => b.countries[c]) && b.sectors[x.sector], `${t}: scenario countries and sector exist`);
  }
});

test('versions and the domain agree', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  assert.equal(b.project.version, pkg.version);
  assert.equal(readFileSync(join(root, 'docs/CNAME'), 'utf8').trim(), b.project.domain);
  assert.equal(pkg.homepage, `https://${b.project.domain}`);
});
