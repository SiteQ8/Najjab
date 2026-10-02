// Najjab engine, shared by the site and the MCP server.
// Pure functions over the data bundle: no DOM, no network, no dependencies.

export const SCHEMA = 'najjab/1';
export const RANK = { low: 1, medium: 2, high: 3, critical: 4 };
const HOUR = 3600000;
const ORDER = { immediate: 0, deadline: 1, promptly: 2, 'undue-delay': 3, 'by-regulation': 4, 'no-fixed': 5, cadence: 6, event: 7 };

export const tr = (pair, lang) => (pair ? (lang === 'ar' ? pair.ar : pair.en) : '');
export const fill = (template, vars = {}) => String(template).replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m));
export const ui = (bundle, key, lang, vars) => fill(tr(bundle.ui[key], lang), vars);

export function toDate(value) {
  const d = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(d.getTime())) throw new RangeError(`"${value}" is not a valid date and time`);
  return d;
}

export function triggersFor(bundle, type, personal) {
  const t = bundle.incident_types[type];
  if (!t) throw new RangeError(`Unknown incident type "${type}". Use one of: ${Object.keys(bundle.incident_types).join(', ')}`);
  const set = new Set(t.triggers);
  if (personal) set.add('personal-data-breach');
  return [...set];
}

const sectorOk = (ob, sector) => ob.sectors.includes('all') || ob.sectors.includes(sector);
const lowest = (grades) => grades.reduce((a, b) => (RANK[a] <= RANK[b] ? a : b));
const highest = (grades) => grades.reduce((a, b) => (RANK[a] >= RANK[b] ? a : b));

// The deadline rows of one duty that apply at a severity grade, with a note when the grade changes the answer.
export function rowsAt(ob, severity) {
  const rank = RANK[severity] || 0;
  const graded = ob.deadlines.filter((d) => d.severity);
  const thresholds = ob.deadlines.filter((d) => d.min_severity);
  const plain = ob.deadlines.filter((d) => !d.severity && !d.min_severity);
  let rows = [];
  let note = null;
  if (graded.length) {
    const grades = [...new Set(graded.map((d) => d.severity))];
    const top = highest(grades);
    const exact = graded.filter((d) => d.severity === severity);
    if (exact.length) rows = exact;
    else if (rank > RANK[top]) { rows = graded.filter((d) => d.severity === top); note = { kind: 'top-tier' }; }
    else note = { kind: 'only', grades: grades.sort((a, b) => RANK[a] - RANK[b]) };
  }
  const passing = thresholds.filter((d) => rank >= RANK[d.min_severity]);
  if (thresholds.length && !passing.length && !rows.length) note = { kind: 'from', grade: lowest(thresholds.map((d) => d.min_severity)) };
  return { rows: [...rows, ...passing, ...plain], note };
}

function resolve(bundle, ob, row, discovered, severity) {
  if (row.rule === 'as-incident') {
    const ref = bundle.obligations.find((o) => o.id === row.ref_obligation);
    const initial = ref ? rowsAt(ref, severity).rows.filter((r) => r.stage === 'initial') : [];
    if (!initial.length) return [{ stage: row.stage, kind: 'promptly', via: ref ? ref.id : null }];
    return initial.flatMap((r) => resolve(bundle, ref, r, discovered, severity)).map((i) => ({ ...i, stage: row.stage, via: ref.id }));
  }
  const base = { stage: row.stage };
  if (row.from) base.from = row.from;
  if (row.condition) base.condition = row.condition;
  if (typeof row.hours === 'number') return [{ ...base, kind: 'deadline', hours: row.hours, due: new Date(discovered.getTime() + row.hours * HOUR) }];
  if (typeof row.days === 'number') return [{ ...base, kind: 'deadline', days: row.days, due: new Date(discovered.getTime() + row.days * 24 * HOUR) }];
  if (row.rule === 'immediately') return [{ ...base, kind: 'immediate', due: new Date(discovered.getTime()) }];
  if (row.rule === 'promptly') return [{ ...base, kind: 'promptly' }];
  if (row.rule === 'no-fixed-period') return [{ ...base, kind: 'no-fixed' }];
  if (row.rule === 'by-regulation') return [{ ...base, kind: 'by-regulation' }];
  if (row.rule === 'without-undue-delay') return [{ ...base, kind: 'undue-delay' }];
  if (row.every_hours) return [{ ...base, kind: 'cadence', every_hours: row.every_hours }];
  if (row.every) return [{ ...base, kind: 'cadence', every: row.every }];
  if (row.when) return [{ ...base, kind: 'event', when: row.when }];
  throw new Error(`Unreadable deadline in ${ob.id}`);
}

function compare(a, b) {
  if (!a.lead !== !b.lead) return a.lead ? -1 : 1;
  if (!a.lead) return a.id.localeCompare(b.id);
  const oa = ORDER[a.lead.kind];
  const ob = ORDER[b.lead.kind];
  if (oa !== ob) return oa - ob;
  if (a.lead.due && b.lead.due && a.lead.due.getTime() !== b.lead.due.getTime()) return a.lead.due - b.lead.due;
  return a.id.localeCompare(b.id);
}

// Every notification duty an incident triggers, soonest first.
export function assess(bundle, input) {
  const countries = (input.countries || []).filter((c) => bundle.countries[c]);
  const sector = bundle.sectors[input.sector] ? input.sector : 'general';
  const severity = bundle.severities[input.severity] ? input.severity : 'high';
  const discovered = toDate(input.discovered);
  const personal = Boolean(input.personal) || bundle.incident_types[input.type]?.triggers.includes('personal-data-breach') || false;
  const triggers = triggersFor(bundle, input.type, personal);
  const duties = [];
  for (const ob of bundle.obligations) {
    if (!countries.includes(ob.country) || !triggers.includes(ob.trigger) || !sectorOk(ob, sector)) continue;
    const { rows, note } = rowsAt(ob, severity);
    const items = rows.flatMap((r) => resolve(bundle, ob, r, discovered, severity));
    const lead = items.find((i) => i.stage === 'initial') || items[0] || null;
    duties.push({ id: ob.id, country: ob.country, authority: ob.authority, trigger: ob.trigger, verification: ob.verification, note, lead, items });
  }
  duties.sort(compare);
  return { discovered, countries, sector, severity, type: input.type, personal, triggers, duties };
}

// Arabic counts agree with the number: 1 and 2 have their own forms, 3 to 10 take the plural, 11 and up the singular.
export function span(n, unit, lang) {
  if (lang !== 'ar') return `${n} ${unit}${n === 1 ? '' : 's'}`;
  const f = unit === 'hour' ? ['ساعة', 'ساعتين', 'ساعات', 'ساعة'] : ['يوم', 'يومين', 'أيام', 'يوماً'];
  if (n === 1) return f[0];
  if (n === 2) return f[1];
  return n <= 10 ? `${n} ${f[2]}` : `${n} ${f[3]}`;
}

// What a resolved item asks for, in words.
export function itemText(bundle, item, lang) {
  let text;
  switch (item.kind) {
    case 'deadline': {
      const amount = item.hours !== undefined ? span(item.hours, 'hour', lang) : span(item.days, 'day', lang);
      text = lang === 'ar' ? `خلال ${amount}` : `Within ${amount}`;
      if (item.from) text += ` ${ui(bundle, `from_${item.from}`, lang)}`;
      break;
    }
    case 'immediate': text = ui(bundle, 'rule_immediately', lang); break;
    case 'promptly': text = ui(bundle, item.via ? 'via_incident' : 'rule_promptly', lang); break;
    case 'no-fixed': text = ui(bundle, 'rule_no_fixed', lang); break;
    case 'by-regulation': text = ui(bundle, 'rule_by_regulation', lang); break;
    case 'undue-delay': text = ui(bundle, 'rule_undue_delay', lang); break;
    case 'cadence':
      text = item.every === 'daily' ? ui(bundle, 'every_daily', lang) : (lang === 'ar' ? `كل ${span(item.every_hours, 'hour', lang)}` : `Every ${span(item.every_hours, 'hour', lang)}`);
      break;
    case 'event': text = ui(bundle, `when_${item.when}`, lang); break;
    default: text = '';
  }
  if (item.condition) text += ` ${ui(bundle, `cond_${item.condition}`, lang)}`;
  return text;
}

export const stageText = (bundle, stage, lang) => ui(bundle, `stage_${stage}`, lang);

export function noteText(bundle, note, lang) {
  if (!note) return '';
  if (note.kind === 'top-tier') return ui(bundle, 'note_top_tier', lang);
  if (note.kind === 'only') {
    const grades = lang === 'ar'
      ? note.grades.map((g) => `ال${bundle.severities[g].ar}`).join(' و')
      : note.grades.map((g) => bundle.severities[g].en.toLowerCase()).join(' and ');
    return ui(bundle, 'note_only', lang, { grades });
  }
  if (note.kind === 'from') {
    const grade = lang === 'ar' ? bundle.severities[note.grade].ar : bundle.severities[note.grade].en.toLowerCase();
    return ui(bundle, 'note_from', lang, { grade });
  }
  return '';
}

// Countdown text: hours can run past 24, as the deadlines do.
export function clock(ms) {
  const s = Math.floor(Math.abs(ms) / 1000);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}

// Day, date and 24 hour time, assembled from parts so no locale punctuation slips into the text.
export function when(date, lang, timeZone) {
  const opts = { weekday: lang === 'ar' ? 'long' : 'short', day: 'numeric', month: lang === 'ar' ? 'long' : 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
  if (timeZone) opts.timeZone = timeZone;
  const parts = Object.fromEntries(new Intl.DateTimeFormat(lang === 'ar' ? 'ar-u-nu-latn' : 'en-GB', opts).formatToParts(date).map((p) => [p.type, p.value]));
  return `${parts.weekday} ${parts.day} ${parts.month} ${parts.hour}:${parts.minute}`;
}

export function sourceLine(bundle, ob, lang) {
  const parts = [tr(ob.source.title, lang), tr(ob.source.ref, lang)];
  if (ob.source.gazette) parts.push(tr(ob.source.gazette, lang));
  return parts.filter(Boolean).join(lang === 'ar' ? ' و' : ', ');
}

export const obligation = (bundle, id) => bundle.obligations.find((o) => o.id === id) || null;

export function playbook(bundle, type, lang) {
  const book = bundle.playbooks[type];
  if (!book) throw new RangeError(`Unknown incident type "${type}". Use one of: ${Object.keys(bundle.playbooks).join(', ')}`);
  return {
    type,
    title: tr(bundle.incident_types[type], lang),
    phases: bundle.phases.map((ph) => ({ id: ph, title: ui(bundle, `phase_${ph}`, lang), steps: book[ph].map((s) => tr(s, lang)) })),
  };
}

export function exercise(bundle, type, lang) {
  const ex = bundle.tabletop[type];
  if (!ex) throw new RangeError(`Unknown incident type "${type}". Use one of: ${Object.keys(bundle.tabletop).join(', ')}`);
  return {
    type,
    title: tr(bundle.incident_types[type], lang),
    setup: tr(ex.setup, lang),
    countries: ex.countries,
    sector: ex.sector,
    injects: ex.injects.map((i) => ({ at: i.at, text: tr(i.text, lang) })),
    questions: ex.questions.map((q) => tr(q, lang)),
  };
}

// A plain notice that gathers the facts every regulator asks for first.
export function draftNotice(bundle, input, fields = {}, lang = 'en') {
  const a = assess(bundle, input);
  const L = (k) => ui(bundle, k, lang);
  const val = (v) => (v !== undefined && v !== null && String(v).trim()) || L('not_stated');
  const to = [...new Set(a.duties.filter((d) => d.lead).map((d) => tr(bundle.authorities[d.authority], lang)))];
  const first = bundle.countries[a.countries[0]];
  const time = first ? ui(bundle, 'due_country', lang, { time: when(a.discovered, lang, first.tz), country: tr(first, lang) }) : when(a.discovered, lang);
  const lines = [
    L('n_subject'),
    '',
    `${L('n_to')}: ${to.length ? to.join(lang === 'ar' ? ' و' : ', ') : L('not_stated')}`,
    `${L('n_org')}: ${val(fields.organization)}`,
    `${L('n_contact')}: ${val(fields.contact)}`,
    `${L('n_time')}: ${time}`,
    `${L('n_type')}: ${tr(bundle.incident_types[a.type], lang)}`,
    `${L('n_severity')}: ${tr(bundle.severities[a.severity], lang)}`,
    `${L('n_systems')}: ${val(fields.systems)}`,
    `${L('n_personal')}: ${a.personal ? L('yes') : L('no')}`,
  ];
  if (a.personal) lines.push(`${L('n_records')}: ${val(fields.records)}`);
  lines.push(`${L('n_summary')}: ${val(fields.summary)}`, `${L('n_actions')}: ${val(fields.actions)}`, `${L('n_next')}: ${val(fields.next_update)}`);
  return lines.join('\n');
}
