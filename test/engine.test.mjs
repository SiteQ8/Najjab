import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../docs/assets/core.js';
import { bundle as b } from './helpers.mjs';

const at = '2026-10-04T08:00:00+03:00';
const plus = (h) => new Date(Date.parse(at) + h * 3600000).getTime();
const run = (input) => core.assess(b, { discovered: at, sector: 'general', severity: 'high', ...input });
const duty = (a, id) => a.duties.find((d) => d.id === id);

test('Kuwait bank, high ransomware: CBK in one hour, then updates every four hours and a closure report', () => {
  const a = run({ countries: ['KW'], sector: 'banking', type: 'ransomware' });
  assert.equal(a.duties[0].id, 'kw-cbk-incident');
  const d = duty(a, 'kw-cbk-incident');
  assert.equal(d.lead.due.getTime(), plus(1));
  assert.deepEqual(d.items.map((i) => i.stage), ['initial', 'update', 'closure']);
  assert.equal(d.items[1].every_hours, 4);
  assert.ok(duty(a, 'kw-ncsc-rs1'), 'NCSC duty applies to everyone');
});

test('a critical incident takes the highest grade an authority defines, and says so', () => {
  const d = duty(run({ countries: ['KW'], sector: 'banking', type: 'ransomware', severity: 'critical' }), 'kw-cbk-incident');
  assert.equal(d.lead.due.getTime(), plus(1));
  assert.equal(d.note.kind, 'top-tier');
});

test('grades below an authority threshold are listed as not triggered with the reason', () => {
  const q = duty(run({ countries: ['QA'], type: 'bec', severity: 'high' }), 'qa-ncsa-nia');
  assert.equal(q.lead, null);
  assert.match(core.noteText(b, q.note, 'ar'), /الحرجة/);
  const s = duty(run({ countries: ['SA'], sector: 'payments', type: 'cloud-key', severity: 'low' }), 'sa-sama-payments');
  assert.equal(s.lead, null);
  assert.equal(core.noteText(b, s.note, 'en'), 'Applies from medium severity upward.');
});

test('personal data adds the data protection duties, and a data breach always counts', () => {
  assert.equal(duty(run({ countries: ['SA'], type: 'ransomware' }), 'sa-sdaia-pdb'), undefined);
  assert.equal(duty(run({ countries: ['SA'], type: 'ransomware', personal: true }), 'sa-sdaia-pdb').lead.due.getTime(), plus(72));
  const a = run({ countries: ['KW', 'BH', 'OM', 'AE'], sector: 'telecom', type: 'data-breach' });
  assert.equal(duty(a, 'kw-citra-pdb').lead.due.getTime(), plus(24));
  assert.equal(duty(a, 'bh-pdpa').lead.condition, 'likely-rights');
  assert.equal(duty(a, 'ae-pdpl').lead.kind, 'by-regulation');
});

test('the CBK personal data duty follows the incident timeline of the same grade', () => {
  const a = run({ countries: ['KW'], sector: 'banking', type: 'data-breach', severity: 'medium' });
  const d = duty(a, 'kw-cbk-pdb');
  assert.equal(d.lead.due.getTime(), plus(4));
  assert.equal(d.lead.via, 'kw-cbk-incident');
});

test('sectors filter the regulators: SAMA banking rules do not reach a payments startup and back', () => {
  const pay = run({ countries: ['SA'], sector: 'payments', type: 'cloud-key', severity: 'medium' });
  assert.ok(duty(pay, 'sa-sama-payments'));
  assert.equal(duty(pay, 'sa-sama-csf'), undefined);
  const bank = run({ countries: ['SA'], sector: 'banking', type: 'cloud-key', severity: 'medium' });
  assert.ok(duty(bank, 'sa-sama-csf') && duty(bank, 'sa-sama-itgf'));
  assert.equal(duty(bank, 'sa-sama-payments'), undefined);
});

test('duties are ordered: immediate first, then by due time, open-ended last', () => {
  const a = run({ countries: ['KW', 'SA', 'QA'], sector: 'banking', type: 'data-breach', severity: 'medium' });
  const kinds = a.duties.filter((d) => d.lead).map((d) => d.lead.kind);
  assert.equal(kinds[0], 'immediate');
  const dues = a.duties.filter((d) => d.lead && d.lead.kind === 'deadline').map((d) => d.lead.due.getTime());
  assert.deepEqual(dues, [...dues].sort((x, y) => x - y));
  assert.equal(a.duties[a.duties.length - 1].lead, null, 'not triggered goes last');
});

test('Gulf central banks: Bahrain in one hour, the UAE in four with a 72 hour high-risk notice', () => {
  const a = run({ countries: ['BH', 'AE'], sector: 'banking', type: 'ransomware', severity: 'high' });
  const bh = duty(a, 'bh-cbb-banks');
  assert.equal(bh.lead.due.getTime(), plus(1));
  assert.deepEqual(bh.items.map((i) => i.stage), ['initial', 'preliminary', 'report']);
  const ae = duty(a, 'ae-cbuae-oprisk');
  assert.equal(ae.lead.due.getTime(), plus(4));
  assert.deepEqual(ae.items.map((i) => i.stage), ['initial', 'preliminary', 'high_risk', 'restored']);
  const medium = duty(run({ countries: ['AE'], sector: 'banking', type: 'ransomware', severity: 'medium' }), 'ae-cbuae-oprisk');
  assert.ok(!medium.items.some((i) => i.stage === 'high_risk'), 'the 72 hour notice starts at high');
  assert.equal(a.duties[0].id, 'bh-cbb-banks', 'soonest first');
});

test('the calendar file holds one event per timed deadline, in UTC, folded to 75 octets', () => {
  const input = { countries: ['KW', 'BH'], sector: 'banking', type: 'ransomware', severity: 'high', discovered: at };
  const cal = core.calendar(b, input, 'ar', new Date('2026-10-04T05:00:00Z'));
  assert.equal(cal.events, 4);
  assert.equal((cal.text.match(/BEGIN:VEVENT/g) || []).length, 4);
  assert.ok(cal.text.startsWith('BEGIN:VCALENDAR\r\n') && cal.text.endsWith('END:VCALENDAR\r\n'));
  assert.match(cal.text, /DTSTART:20261004T060000Z/);
  assert.match(cal.text, /TRIGGER:-PT15M/);
  for (const line of cal.text.split('\r\n')) assert.ok(new TextEncoder().encode(line).length <= 75, `folded: ${line}`);
  const unfolded = cal.text.replace(/\r\n /g, '');
  assert.match(unfolded, /SUMMARY:بنك الكويت المركزي \| الإبلاغ الأول/);
  assert.equal(core.calendar(b, { countries: ['AE'], type: 'data-breach', discovered: at }, 'en').events, 0, 'no fixed time, no event');
});

test('free zone duties appear only for the zones chosen, alongside the federal ones', () => {
  const base = { countries: ['AE', 'QA'], type: 'data-breach' };
  const none = run(base);
  assert.ok(!none.duties.some((d) => d.zone), 'no zone, no zone duties');
  assert.ok(duty(none, 'ae-pdpl') && duty(none, 'qa-pdppl'), 'federal and national duties stay');
  const a = run({ ...base, zones: ['difc', 'qfc'] });
  assert.equal(duty(a, 'ae-difc-dp').lead.kind, 'practicable');
  assert.equal(duty(a, 'qa-qfc-dp').lead.due.getTime(), plus(72));
  assert.equal(duty(a, 'ae-adgm-dp'), undefined);
  const orphan = run({ countries: ['KW'], type: 'data-breach', zones: ['adgm'] });
  assert.equal(duty(orphan, 'ae-adgm-dp'), undefined, 'a zone needs its country');
  assert.equal(core.itemText(b, duty(a, 'ae-difc-dp').items[1], 'ar'), 'في أقرب وقت ممكن عملياً إذا كان الخطر على أصحاب البيانات كبيراً');
});

test('Arabic counts agree with the number', () => {
  assert.equal(core.span(1, 'hour', 'ar'), 'ساعة');
  assert.equal(core.span(2, 'hour', 'ar'), 'ساعتين');
  assert.equal(core.span(4, 'hour', 'ar'), '4 ساعات');
  assert.equal(core.span(24, 'hour', 'ar'), '24 ساعة');
  assert.equal(core.span(5, 'day', 'ar'), '5 أيام');
  assert.equal(core.span(1, 'hour', 'en'), '1 hour');
  assert.equal(core.span(72, 'hour', 'en'), '72 hours');
});

test('times are written without locale commas and the countdown passes 24 hours', () => {
  const s = core.when(new Date(at), 'ar', 'Asia/Kuwait');
  assert.ok(!/[،,]/.test(s), s);
  assert.match(s, /08:00$/);
  assert.equal(core.clock(72 * 3600000), '72:00:00');
  assert.equal(core.clock(-61000), '00:01:01');
});

test('the notice draft is addressed to the triggered authorities in either language', () => {
  const input = { countries: ['KW', 'QA'], sector: 'banking', type: 'ransomware', severity: 'critical', discovered: at };
  const ar = core.draftNotice(b, input, { organization: 'Example Co' }, 'ar');
  assert.match(ar, /بنك الكويت المركزي/);
  assert.match(ar, /الوكالة الوطنية للأمن السيبراني/);
  assert.match(ar, /Example Co/);
  const en = core.draftNotice(b, input, {}, 'en');
  assert.match(en, /Central Bank of Kuwait/);
  assert.match(en, /Not stated yet/);
});

test('bad input fails with a clear message', () => {
  assert.throws(() => run({ countries: ['KW'], type: 'meteor' }), /Unknown incident type/);
  assert.throws(() => core.assess(b, { countries: ['KW'], type: 'bec', discovered: 'soon' }), /not a valid date/);
});
