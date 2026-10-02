#!/usr/bin/env node
// MCP server (stdio, newline-delimited JSON-RPC 2.0) for Najjab, the first hours of a cyber incident in the Gulf.
// No dependencies. Every tool is read-only and works offline from the bundled data.
import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import * as core from '../docs/assets/core.js';

const bundle = JSON.parse(readFileSync(new URL('../docs/data/bundle.json', import.meta.url), 'utf8'));
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const SUPPORTED = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];

const COUNTRIES = Object.keys(bundle.countries);
const TYPES = Object.keys(bundle.incident_types);
const LANG = { type: 'string', enum: ['en', 'ar'], default: 'en', description: 'Language for the answer: en or ar.' };
const FORMAT = { type: 'string', enum: ['markdown', 'json'], default: 'markdown', description: 'markdown for reading, json for further processing.' };
const LIMIT = { type: 'integer', minimum: 1, maximum: 100, default: 25, description: 'Maximum items to return.' };
const OFFSET = { type: 'integer', minimum: 0, default: 0, description: 'Items to skip, for paging.' };
const COUNTRY = { type: 'string', enum: COUNTRIES, description: 'Country code: KW Kuwait, SA Saudi Arabia, AE UAE, QA Qatar, BH Bahrain, OM Oman.' };
const COUNTRY_LIST = { type: 'array', items: COUNTRY, minItems: 1, description: 'Every country the organization operates in, for example ["KW", "SA"].' };
const TYPE = { type: 'string', enum: TYPES, description: 'ransomware, bec (business email compromise), data-breach or cloud-key (exposed cloud access keys).' };
const SECTOR = { type: 'string', enum: Object.keys(bundle.sectors), default: 'general', description: 'general, banking, insurance, payments, telecom, government or critical (critical infrastructure).' };
const SEVERITY = { type: 'string', enum: Object.keys(bundle.severities), default: 'high', description: 'The grade your own classification gives: critical, high, medium or low.' };
const PERSONAL = { type: 'boolean', default: false, description: 'True when personal data was affected. A data-breach always counts as personal data.' };
const AT = { type: 'string', description: 'When the incident was discovered, ISO 8601 with offset, for example "2026-10-04T08:00:00+03:00".' };
const INCIDENT = { countries: COUNTRY_LIST, incident_type: TYPE, discovered_at: AT, sector: SECTOR, severity: SEVERITY, personal_data: PERSONAL };
const RO = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

const tools = [
  { name: 'najjab_overview', title: 'Coverage overview', description: 'What Najjab covers: the six Gulf countries, the authorities and duties in the register, how each duty was verified, and the authorities still being verified. Start here.', inputSchema: { type: 'object', properties: { lang: LANG, response_format: FORMAT }, additionalProperties: false }, annotations: RO },
  { name: 'najjab_list_obligations', title: 'List notification duties', description: 'Notification duties in the register with authority, who they apply to, the deadline in words, the official source and the verification level. Filter by country, trigger (cyber-incident or personal-data-breach) or sector. Paged.', inputSchema: { type: 'object', properties: { country: COUNTRY, trigger: { type: 'string', enum: Object.keys(bundle.triggers) }, sector: SECTOR, limit: LIMIT, offset: OFFSET, lang: LANG, response_format: FORMAT }, additionalProperties: false }, annotations: RO },
  { name: 'najjab_get_obligation', title: 'Get one duty', description: 'One duty by id (for example "kw-cbk-incident" or "sa-sdaia-pdb") with every deadline row, the summary, the official source with its reference and link, and the secondary sources when the official text could not be read automatically.', inputSchema: { type: 'object', properties: { id: { type: 'string', description: 'Duty id such as "qa-ncsa-nia".' }, lang: LANG, response_format: FORMAT }, required: ['id'], additionalProperties: false }, annotations: RO },
  { name: 'najjab_deadlines', title: 'Deadlines for an incident', description: 'Every notification duty an incident triggers across the given countries, soonest first, with the due time computed from the discovery time, follow up updates and closure reports, and notes when the severity grade changes the answer.', inputSchema: { type: 'object', properties: { ...INCIDENT, lang: LANG, response_format: FORMAT }, required: ['countries', 'incident_type', 'discovered_at'], additionalProperties: false }, annotations: RO },
  { name: 'najjab_playbook', title: 'Response playbook', description: 'The playbook for an incident type: how it shows up, the first hour, containment, eradication, recovery, the evidence to keep and what to do after.', inputSchema: { type: 'object', properties: { incident_type: TYPE, lang: LANG, response_format: FORMAT }, required: ['incident_type'], additionalProperties: false }, annotations: RO },
  { name: 'najjab_tabletop', title: 'Tabletop exercise', description: 'A ready tabletop exercise for an incident type: the scenario, the developments with the minute each is revealed, and the questions for the room.', inputSchema: { type: 'object', properties: { incident_type: TYPE, lang: LANG, response_format: FORMAT }, required: ['incident_type'], additionalProperties: false }, annotations: RO },
  { name: 'najjab_calendar', title: 'Calendar of deadlines', description: 'An iCalendar (.ics) file with one event per timed deadline the incident triggers and a reminder 15 minutes before each, ready to import into Outlook, Google Calendar or Apple Calendar.', inputSchema: { type: 'object', properties: { ...INCIDENT, lang: LANG }, required: ['countries', 'incident_type', 'discovered_at'], additionalProperties: false }, annotations: RO },
  { name: 'najjab_draft_notice', title: 'Draft a notice', description: 'A plain notice in Arabic or English that gathers the facts every regulator asks for first, addressed to the authorities the incident triggers. Use the authority\'s own form and channel where one exists.', inputSchema: { type: 'object', properties: { ...INCIDENT, organization: { type: 'string' }, contact: { type: 'string' }, summary: { type: 'string' }, systems: { type: 'string' }, records: { type: 'string' }, actions: { type: 'string' }, next_update: { type: 'string' }, lang: LANG }, required: ['countries', 'incident_type', 'discovered_at'], additionalProperties: false }, annotations: RO },
];

class ToolError extends Error {}
const pickLang = (a) => (a && a.lang === 'ar' ? 'ar' : 'en');
const tr = core.tr;

function result(obj, markdown, args) {
  const text = args.response_format === 'json' ? JSON.stringify(obj, null, 2) : markdown;
  return { content: [{ type: 'text', text }], structuredContent: obj };
}
function paged(items, args) {
  const limit = Math.min(100, Math.max(1, Number(args.limit) || 25));
  const offset = Math.max(0, Number(args.offset) || 0);
  return { total: items.length, limit, offset, items: items.slice(offset, offset + limit) };
}
function incidentInput(args) {
  const countries = Array.isArray(args.countries) ? args.countries : [];
  const bad = countries.filter((c) => !bundle.countries[c]);
  if (!countries.length || bad.length) throw new ToolError(`countries must list codes from ${COUNTRIES.join(', ')}${bad.length ? `, not ${bad.join(', ')}` : ''}.`);
  if (!bundle.incident_types[args.incident_type]) throw new ToolError(`incident_type must be one of ${TYPES.join(', ')}.`);
  if (args.sector && !bundle.sectors[args.sector]) throw new ToolError(`sector must be one of ${Object.keys(bundle.sectors).join(', ')}.`);
  if (args.severity && !bundle.severities[args.severity]) throw new ToolError(`severity must be one of ${Object.keys(bundle.severities).join(', ')}.`);
  let discovered;
  try { discovered = core.toDate(args.discovered_at); } catch { throw new ToolError('discovered_at must be an ISO 8601 date and time with offset, for example "2026-10-04T08:00:00+03:00".'); }
  return { countries, type: args.incident_type, sector: args.sector || 'general', severity: args.severity || 'high', personal: Boolean(args.personal_data), discovered };
}
function dutyRow(ob, lang) {
  return {
    id: ob.id,
    country: ob.country,
    authority: tr(bundle.authorities[ob.authority], lang),
    trigger: ob.trigger,
    applies_to: tr(ob.applies_to, lang),
    summary: tr(ob.summary, lang),
    source: core.sourceLine(bundle, ob, lang),
    url: ob.source.url || null,
    verification: ob.verification,
  };
}
const badge = (v, lang) => tr(bundle.verification_levels[v], lang);

const handlers = {
  najjab_overview(args) {
    const lang = pickLang(args);
    const countries = COUNTRIES.map((c) => ({ code: c, name: tr(bundle.countries[c], lang), duties: bundle.obligations.filter((o) => o.country === c).length }));
    const levels = Object.entries(bundle.verification_levels).map(([id, v]) => ({ id, name: tr(v, lang), meaning: tr(v.about, lang), duties: bundle.obligations.filter((o) => o.verification === id).length }));
    const pending = bundle.pending.map((p) => ({ country: p.country, name: tr(p, lang) }));
    const out = { name: tr({ en: bundle.project.name_en, ar: bundle.project.name_ar }, lang), about: tr(bundle.project.about, lang), updated: bundle.project.updated, duties: bundle.obligations.length, authorities: Object.keys(bundle.authorities).length, countries, verification: levels, pending, incident_types: TYPES.map((t) => ({ id: t, name: tr(bundle.incident_types[t], lang) })), disclaimer: core.ui(bundle, 'disclaimer', lang) };
    const md = [
      `# ${out.name}`, '', out.about, '',
      `Duties: ${out.duties}. Authorities: ${out.authorities}. Data checked on ${out.updated}.`, '',
      '## Countries', ...countries.map((c) => `- ${c.code} ${c.name}: ${c.duties}`), '',
      '## Verification', ...levels.map((l) => `- ${l.name} (${l.duties}): ${l.meaning}`), '',
      '## Still being verified', ...pending.map((p) => `- ${p.country} ${p.name}`), '',
      out.disclaimer,
    ].join('\n');
    return result(out, md, args);
  },
  najjab_list_obligations(args) {
    const lang = pickLang(args);
    let list = bundle.obligations;
    if (args.country) list = list.filter((o) => o.country === args.country);
    if (args.trigger) list = list.filter((o) => o.trigger === args.trigger);
    if (args.sector && args.sector !== 'general') list = list.filter((o) => o.sectors.includes('all') || o.sectors.includes(args.sector));
    const page = paged(list.map((o) => dutyRow(o, lang)), args);
    const md = [`# Notification duties (${page.total})`, '', ...page.items.map((d) => `- **${d.id}** ${d.country} ${d.authority}: ${d.summary} ${core.ui(bundle, 'reg_source', lang)}: ${d.source}. ${badge(d.verification, lang)}.`)].join('\n');
    return result(page, md, args);
  },
  najjab_get_obligation(args) {
    const lang = pickLang(args);
    const ob = core.obligation(bundle, String(args.id || '').trim());
    if (!ob) throw new ToolError(`No duty with id "${args.id}". Call najjab_list_obligations to see the ids.`);
    const rows = ob.deadlines.map((d) => ({ ...d }));
    const out = { ...dutyRow(ob, lang), sectors: ob.sectors, deadlines: rows, secondary: ob.secondary || [], verification_meaning: tr(bundle.verification_levels[ob.verification].about, lang) };
    const md = [`# ${out.authority}`, '', out.summary, '', `Applies to: ${out.applies_to}`, `Source: ${out.source}${out.url ? ` (${out.url})` : ''}`, `Verification: ${badge(ob.verification, lang)}. ${out.verification_meaning}`, ...(out.secondary.length ? ['Confirmed by:', ...out.secondary.map((u) => `- ${u}`)] : [])].join('\n');
    return result(out, md, args);
  },
  najjab_deadlines(args) {
    const lang = pickLang(args);
    const a = core.assess(bundle, incidentInput(args));
    const duties = a.duties.map((d) => {
      const ob = core.obligation(bundle, d.id);
      return {
        id: d.id,
        country: d.country,
        authority: tr(bundle.authorities[d.authority], lang),
        verification: d.verification,
        note: core.noteText(bundle, d.note, lang) || null,
        triggered: Boolean(d.lead),
        items: d.items.map((i) => ({ stage: core.stageText(bundle, i.stage, lang), kind: i.kind, text: core.itemText(bundle, i, lang), due: i.due ? i.due.toISOString() : null })),
        source: core.sourceLine(bundle, ob, lang),
        url: ob.source.url || null,
      };
    });
    const out = { discovered_at: a.discovered.toISOString(), countries: a.countries, sector: a.sector, severity: a.severity, personal_data: a.personal, duties };
    const md = [
      `# ${core.ui(bundle, 'clock', lang)} (${duties.filter((d) => d.triggered).length})`, '',
      ...duties.map((d) => [
        `## ${d.authority} (${d.country})`,
        ...d.items.map((i) => `- ${i.stage}: ${i.text}${i.due ? ` (${lang === 'ar' ? 'الموعد' : 'due'} ${i.due})` : ''}`),
        ...(d.note ? [`- ${d.note}`] : []),
        `- ${core.ui(bundle, 'reg_source', lang)}: ${d.source}. ${badge(d.verification, lang)}.`,
      ].join('\n')),
      '', core.ui(bundle, 'disclaimer', lang),
    ].join('\n');
    return result(out, md, args);
  },
  najjab_playbook(args) {
    const lang = pickLang(args);
    if (!bundle.playbooks[args.incident_type]) throw new ToolError(`incident_type must be one of ${TYPES.join(', ')}.`);
    const p = core.playbook(bundle, args.incident_type, lang);
    const md = [`# ${p.title}`, ...p.phases.flatMap((ph) => ['', `## ${ph.title}`, ...ph.steps.map((s) => `- ${s}`)])].join('\n');
    return result(p, md, args);
  },
  najjab_tabletop(args) {
    const lang = pickLang(args);
    if (!bundle.tabletop[args.incident_type]) throw new ToolError(`incident_type must be one of ${TYPES.join(', ')}.`);
    const x = core.exercise(bundle, args.incident_type, lang);
    const md = [`# ${x.title}`, '', x.setup, '', ...x.injects.map((i) => `- ${core.ui(bundle, 'tt_at', lang, { m: i.at })}: ${i.text}`), '', `## ${core.ui(bundle, 'tt_questions', lang)}`, ...x.questions.map((q) => `- ${q}`)].join('\n');
    return result(x, md, args);
  },
  najjab_calendar(args) {
    const lang = pickLang(args);
    const cal = core.calendar(bundle, incidentInput(args), lang);
    return { content: [{ type: 'text', text: cal.text }], structuredContent: { events: cal.events, ics: cal.text } };
  },
  najjab_draft_notice(args) {
    const lang = pickLang(args);
    const text = core.draftNotice(bundle, incidentInput(args), args, lang);
    return { content: [{ type: 'text', text }], structuredContent: { lang, text, note: core.ui(bundle, 'draft_note', lang) } };
  },
};

function send(msg) { process.stdout.write(`${JSON.stringify(msg)}\n`); }
const reply = (id, res) => send({ jsonrpc: '2.0', id, result: res });
const fail = (id, code, message) => send({ jsonrpc: '2.0', id, error: { code, message } });

function handle(msg) {
  if (!msg || typeof msg !== 'object' || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') {
    if (msg && msg.id !== undefined && msg.id !== null) fail(msg.id, -32600, 'Invalid request');
    return;
  }
  const { id, method, params } = msg;
  if (id === undefined || id === null) return; // notifications need no reply
  switch (method) {
    case 'initialize': {
      const asked = params?.protocolVersion;
      reply(id, {
        protocolVersion: SUPPORTED.includes(asked) ? asked : SUPPORTED[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: pkg.name, title: 'Najjab MCP server', version: pkg.version },
        instructions: 'Read-only tools for the first hours of a cyber incident in Kuwait, Saudi Arabia, the UAE, Qatar, Bahrain and Oman: which authorities must be notified and by when, computed from the discovery time, with the official source and verification level of every duty, plus response playbooks, tabletop exercises and a notice draft. Cite the source returned with each duty, and treat the answers as a practical reference, not legal advice.',
      });
      return;
    }
    case 'ping': reply(id, {}); return;
    case 'tools/list': reply(id, { tools }); return;
    case 'tools/call': {
      const h = handlers[params?.name];
      if (!h) { fail(id, -32602, `Unknown tool: ${params?.name}`); return; }
      try {
        reply(id, h(params.arguments || {}));
      } catch (e) {
        const text = e instanceof ToolError ? e.message : 'The tool failed on this input. Check the arguments against the tool schema.';
        if (!(e instanceof ToolError)) process.stderr.write(`tool ${params.name} failed: ${e.stack}\n`);
        reply(id, { isError: true, content: [{ type: 'text', text }] });
      }
      return;
    }
    default: fail(id, -32601, `Method not found: ${method}`);
  }
}

// --selftest drives every tool in-process and checks the answers, without a client.
if (process.argv.includes('--selftest')) {
  let pass = 0;
  let failn = 0;
  const ok = (cond, label) => { if (cond) pass += 1; else { failn += 1; console.error('FAIL: ' + label); } };
  const call = (name, a = {}) => handlers[name](a);
  const at = '2026-10-04T08:00:00+03:00';
  const plus = (h) => new Date(Date.parse(at) + h * 3600000).toISOString();
  try {
    ok(tools.length === 8, 'eight tools');
    const ov = call('najjab_overview').structuredContent;
    ok(ov.duties === 18 && ov.countries.length === 6 && ov.pending.length === 4, 'overview counts 18 duties, 6 countries, 4 pending');
    ok(call('najjab_list_obligations', { country: 'SA' }).structuredContent.total === 5, 'five Saudi duties');
    ok(call('najjab_list_obligations', { trigger: 'personal-data-breach' }).structuredContent.total === 8, 'eight personal data duties');
    const gcc = call('najjab_deadlines', { countries: ['BH', 'AE'], sector: 'banking', incident_type: 'ransomware', severity: 'high', discovered_at: at }).structuredContent;
    ok(gcc.duties[0].id === 'bh-cbb-banks' && gcc.duties[0].items[0].due === plus(1), 'CBB due in one hour');
    ok(gcc.duties.some((d) => d.id === 'ae-cbuae-oprisk' && d.items[0].due === plus(4)), 'CBUAE due in four hours');
    const g = call('najjab_get_obligation', { id: 'qa-ncsa-nia', lang: 'ar' }).structuredContent;
    ok(g.verification === 'official' && /[\u0600-\u06FF]/.test(g.summary), 'NIA duty in Arabic, official');
    const k = call('najjab_deadlines', { countries: ['KW'], sector: 'banking', incident_type: 'ransomware', severity: 'high', discovered_at: at }).structuredContent;
    ok(k.duties[0].id === 'kw-cbk-incident' && k.duties[0].items[0].due === plus(1), 'CBK high incident due in one hour');
    const m = call('najjab_deadlines', { countries: ['KW'], sector: 'banking', incident_type: 'ransomware', severity: 'medium', discovered_at: at }).structuredContent;
    ok(m.duties[0].items[0].due === plus(4), 'CBK medium incident due in four hours');
    const q = call('najjab_deadlines', { countries: ['QA'], incident_type: 'bec', severity: 'critical', discovered_at: at }).structuredContent;
    ok(q.duties[0].id === 'qa-ncsa-nia' && q.duties[0].items[0].due === plus(2), 'Qatar critical incident due in two hours');
    const qh = call('najjab_deadlines', { countries: ['QA'], incident_type: 'bec', severity: 'high', discovered_at: at }).structuredContent;
    ok(qh.duties[0].triggered === false && qh.duties[0].note, 'Qatar NIA not triggered below critical, with a note');
    const s = call('najjab_deadlines', { countries: ['SA'], incident_type: 'data-breach', discovered_at: at }).structuredContent;
    ok(s.duties.some((d) => d.id === 'sa-sdaia-pdb' && d.items[0].due === plus(72)), 'SDAIA due in 72 hours');
    const t = call('najjab_deadlines', { countries: ['KW'], sector: 'telecom', incident_type: 'data-breach', discovered_at: at }).structuredContent;
    ok(t.duties.some((d) => d.id === 'kw-citra-pdb' && d.items[0].due === plus(24)), 'CITRA due in 24 hours');
    const e = call('najjab_deadlines', { countries: ['AE'], incident_type: 'data-breach', discovered_at: at }).structuredContent;
    ok(e.duties.length === 1 && e.duties[0].items[0].due === null, 'UAE duty has no fixed period');
    const p = call('najjab_playbook', { incident_type: 'bec' }).structuredContent;
    ok(p.phases.length === 7 && p.phases[1].steps.length >= 5, 'BEC playbook has seven phases');
    ok(call('najjab_tabletop', { incident_type: 'ransomware', lang: 'ar' }).structuredContent.injects.length === 4, 'ransomware exercise has four developments');
    const d = call('najjab_draft_notice', { countries: ['KW'], sector: 'banking', incident_type: 'ransomware', discovered_at: at, organization: 'Example Co', lang: 'ar' }).structuredContent;
    ok(d.text.includes('Example Co') && d.text.includes('بنك الكويت المركزي'), 'Arabic draft addressed to CBK');
    const cal = call('najjab_calendar', { countries: ['KW', 'BH'], sector: 'banking', incident_type: 'ransomware', discovered_at: at }).structuredContent;
    ok(cal.events === 4 && cal.ics.startsWith('BEGIN:VCALENDAR') && cal.ics.includes('DTSTART:20261004T060000Z'), 'calendar has four timed deadlines');
    let threw = false; try { call('najjab_get_obligation', { id: 'nope' }); } catch (x) { threw = x instanceof ToolError; } ok(threw, 'unknown duty throws ToolError');
    threw = false; try { call('najjab_deadlines', { countries: ['XX'], incident_type: 'bec', discovered_at: at }); } catch (x) { threw = x instanceof ToolError; } ok(threw, 'unknown country throws ToolError');
    threw = false; try { call('najjab_deadlines', { countries: ['KW'], incident_type: 'bec', discovered_at: 'soon' }); } catch (x) { threw = x instanceof ToolError; } ok(threw, 'bad time throws ToolError');
  } catch (x) { failn += 1; console.error('THREW: ' + x.stack); }
  console.log(`selftest: ${pass} passed, ${failn} failed`);
  process.exit(failn ? 1 : 0);
}

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on('line', (text) => {
  if (!text.trim()) return;
  let msg;
  try { msg = JSON.parse(text); } catch { fail(null, -32700, 'Parse error'); return; }
  if (Array.isArray(msg)) { for (const one of msg) handle(one); return; }
  handle(msg);
});
rl.on('close', () => process.exit(0));
