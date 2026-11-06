// Najjab site: renders the incident form, the first notice, the wall of hours, the duties and the work tabs from the data bundle.
import * as core from './core.js';

const KEY = 'najjab:v1';
const THEME_KEY = 'najjab:theme';
const TABS = ['playbook', 'draft', 'tabletop', 'register'];
const FIELDS = ['organization', 'contact', 'summary', 'systems', 'records', 'actions', 'next_update'];
const FIELD_LABEL = { organization: 'f_org', contact: 'f_contact', summary: 'f_summary', systems: 'f_systems', records: 'f_records', actions: 'f_actions', next_update: 'f_next' };
const LONG = new Set(['summary', 'actions']);
const URGENCY = ['u-over', 'u-now', 'u-soon', 'u-later'];
const KINDS = { gone: 'key_gone', 'u-now': 'key_now', 'u-soon': 'key_soon', 'u-later': 'key_later', 'u-over': 'key_over', night: 'key_night' };
const HOUR = 3600000;
const TICKS = [0, 3, 6, 9, 12, 15, 18, 21];
const SVG = 'http://www.w3.org/2000/svg';
const $ = (id) => document.getElementById(id);
let B;
let S;
let A = null;
let wallDay = null;
let wallHour = null;
let paintedMinute = -1;
let keySig = '';
let firstWall = true;
let freshInject = false;

// Build elements without innerHTML; handlers are attached as listeners, never as attributes.
function h(tag, props = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (k === 'checked' || k === 'disabled' || k === 'value' || k === 'open') n[k] = v;
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c !== null && c !== undefined && c !== false) n.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return n;
}

// One drawn icon set: 16px grid, 1.5px stroke, square ends like the tiles.
const ICONS = {
  check: ['M3.25 8.5l3 3 6.5-7'],
  chevron: ['M4 6.25l4 4 4-4'],
  copy: ['M5.75 5.75h8v8h-8z', 'M10.25 5.75v-3.5h-8v8h3.5'],
};
function icon(name, cls = '') {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('class', `i ${cls}`.trim());
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  for (const d of ICONS[name]) {
    const p = document.createElementNS(SVG, 'path');
    p.setAttribute('d', d);
    svg.append(p);
  }
  return svg;
}

const t = (key, vars) => core.ui(B, key, S.lang, vars);
const P = (pair) => core.tr(pair, S.lang);
const and = () => (S.lang === 'ar' ? ' و' : ', ');
const personal = () => S.personal || B.incident_types[S.type].triggers.includes('personal-data-breach');
const incident = () => ({ countries: S.countries, zones: S.zones, sector: S.sector, type: S.type, severity: S.severity, personal: personal(), discovered: S.discovered });
const tokenMs = (token) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(token)) || 0;
const lowerFirst = (s) => (S.lang === 'en' ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
// Keep a number with the word after it, so a period such as 72 hours never breaks across two lines.
const bind = (s) => s.replace(/(\d) (?=\S)/g, '$1 ');
// Day, date, month and time as separate words, from the one formatter the engine uses.
const parts = (date) => { const [weekday, day, month, time] = core.when(date, S.lang).split(' '); return { weekday, day, month, time }; };
const dayKey = (ms) => { const d = new Date(ms); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); };

// Fill a template whose {t} slot is an element rather than text.
function fillWith(template, vars, slot) {
  const [before, after = ''] = core.fill(template, vars).split('{t}');
  return [before, slot, after].filter((x) => x !== '');
}

// Neighbouring elements that are read as one line get a real space between them; flex gaps alone leave the words joined.
const spaced = (nodes) => nodes.flatMap((n, i) => (i ? [' ', n] : [n]));

function defaults() {
  return { lang: 'ar', countries: ['KW'], zones: [], sector: 'banking', type: 'ransomware', severity: 'high', personal: false, discovered: new Date().toISOString(), checks: {}, draft: {}, tab: 'playbook', tt: { type: null, started: null, shown: 0 }, reg: 'all' };
}

function load() {
  let s = defaults();
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && typeof saved === 'object') s = { ...s, ...saved };
  } catch { /* storage unavailable */ }
  const q = new URLSearchParams(location.search);
  if (q.has('c')) s.countries = q.get('c').split(',');
  if (q.has('z')) s.zones = q.get('z').split(',').filter(Boolean);
  if (q.has('s')) s.sector = q.get('s');
  if (q.has('t')) s.type = q.get('t');
  if (q.has('v')) s.severity = q.get('v');
  if (q.has('p')) s.personal = q.get('p') === '1';
  if (q.has('d')) s.discovered = q.get('d');
  if (q.has('lang')) s.lang = q.get('lang');
  s.lang = s.lang === 'en' ? 'en' : 'ar';
  s.countries = (Array.isArray(s.countries) ? s.countries : []).filter((c) => B.countries[c]);
  s.zones = (Array.isArray(s.zones) ? s.zones : []).filter((z) => B.zones[z] && s.countries.includes(B.zones[z].country));
  if (!B.sectors[s.sector]) s.sector = 'general';
  if (!B.incident_types[s.type]) s.type = 'ransomware';
  if (!B.severities[s.severity]) s.severity = 'high';
  s.discovered = Number.isNaN(Date.parse(s.discovered)) ? new Date().toISOString() : new Date(s.discovered).toISOString();
  if (!TABS.includes(s.tab)) s.tab = 'playbook';
  for (const k of ['checks', 'draft', 'tt']) if (!s[k] || typeof s[k] !== 'object') s[k] = defaults()[k];
  return s;
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* storage unavailable */ }
  const q = new URLSearchParams({ c: S.countries.join(','), z: S.zones.join(','), s: S.sector, t: S.type, v: S.severity, p: personal() ? '1' : '0', d: S.discovered, lang: S.lang });
  history.replaceState(null, '', `${location.pathname}?${q}`);
}

function toLocalInput(iso) {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function changed(what) {
  save();
  renderSummary();
  renderClock();
  if (what !== 'time') renderWork();
  else renderDraftOutputs();
  tick();
}

/* Theme: the visitor's choice, or the system's when they have made none. The browser's bar takes the band's colour. */
function currentTheme() {
  const set = document.documentElement.dataset.theme;
  if (set === 'light' || set === 'dark') return set;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function applyTheme(choice) {
  const root = document.documentElement;
  if (choice === 'light' || choice === 'dark') root.dataset.theme = choice;
  else delete root.dataset.theme;
  const band = getComputedStyle(root).getPropertyValue('--band').trim();
  for (const m of document.querySelectorAll('meta[name="theme-color"]')) if (choice) m.setAttribute('content', band);
}
function themeLabel() {
  const btn = $('theme');
  const next = currentTheme() === 'dark' ? 'theme_light' : 'theme_dark';
  btn.setAttribute('aria-label', t(next));
  btn.setAttribute('title', t(next));
}

/* Static text */
function renderStatic() {
  const root = document.documentElement;
  root.lang = S.lang;
  root.dir = S.lang === 'ar' ? 'rtl' : 'ltr';
  const name = S.lang === 'ar' ? B.project.name_ar : B.project.name_en;
  document.title = `${name} | ${t('clock')}`;
  $('wordmark').textContent = name;
  $('tagline').textContent = t('tagline');
  $('skip').textContent = t('skip');
  $('incident-title').textContent = t('incident');
  $('clock-title').textContent = t('clock');
  $('print-long').textContent = t('print');
  $('print-short').textContent = t('print_short');
  $('calendar-long').textContent = t('calendar');
  $('calendar-short').textContent = t('calendar_short');
  const other = S.lang === 'ar' ? 'en' : 'ar';
  $('lang').textContent = B.ui.lang_name[other];
  $('lang').setAttribute('lang', other);
  themeLabel();
  renderToggle();
}

/* Incident form: square boxes and round radios, both filled in turquoise once chosen */
function checkTile(cls, name, value, label, checked, onchange) {
  return h('label', { class: cls },
    h('input', { type: 'checkbox', name, value, checked, onchange }),
    h('span', { class: 'box', 'aria-hidden': 'true' }, icon('check')),
    h('span', { text: label }));
}

function renderForm() {
  const form = $('form');
  form.replaceChildren();
  const countries = h('fieldset', {}, h('legend', { text: t('countries') }), h('div', { class: 'chips' }, Object.keys(B.countries).map((c) => checkTile('chip', 'country', c, P(B.countries[c]), S.countries.includes(c), (e) => {
    S.countries = Object.keys(B.countries).filter((k) => (k === c ? e.target.checked : S.countries.includes(k)));
    S.zones = S.zones.filter((z) => S.countries.includes(B.zones[z].country));
    renderZones();
    changed('countries');
  }))));
  const sector = h('div', { class: 'field' },
    h('label', { class: 'field-label', for: 'sector', text: t('sector') }),
    h('div', { class: 'select' },
      h('select', { id: 'sector', onchange: (e) => { S.sector = e.target.value; changed('sector'); } },
        Object.keys(B.sectors).map((s) => h('option', { value: s, text: P(B.sectors[s]), selected: s === S.sector }))),
      icon('chevron')));
  const types = h('fieldset', {}, h('legend', { text: t('type') }), h('div', { class: 'opts' }, Object.keys(B.incident_types).map((k) => h('label', { class: 'opt' },
    h('input', { type: 'radio', name: 'type', value: k, checked: S.type === k, onchange: () => { S.type = k; renderPersonal(); changed('type'); } }),
    h('span', { class: 'dot', 'aria-hidden': 'true' }),
    h('span', { text: P(B.incident_types[k]) })))));
  const grades = h('fieldset', {}, h('legend', { text: t('severity') }), h('div', { class: 'seg' }, Object.keys(B.severities).map((k) => h('label', {},
    h('input', { type: 'radio', name: 'severity', value: k, checked: S.severity === k, onchange: () => { S.severity = k; changed('severity'); } }),
    h('span', { text: P(B.severities[k]) })))), h('p', { class: 'hint', text: t('severity_hint') }));
  const time = h('div', { class: 'field' },
    h('label', { class: 'field-label', for: 'discovered', text: t('discovered') }),
    h('div', { class: 'row' },
      h('input', { type: 'datetime-local', id: 'discovered', step: '60', value: toLocalInput(S.discovered), onchange: (e) => {
        const d = new Date(e.target.value);
        if (Number.isNaN(d.getTime())) return;
        S.discovered = d.toISOString();
        changed('time');
      } }),
      h('button', { class: 'btn', type: 'button', text: t('now'), onclick: () => {
        S.discovered = new Date().toISOString();
        $('discovered').value = toLocalInput(S.discovered);
        changed('time');
      } })),
    h('p', { class: 'hint', text: t('discovered_hint') }));
  // The time of discovery leads: every countdown on the page counts from it.
  form.append(time, countries, h('div', { id: 'zones-wrap' }), sector, types, grades, h('div', { id: 'personal-wrap' }));
  renderZones();
  renderPersonal();
}

function renderZones() {
  const wrap = $('zones-wrap');
  const open = Object.keys(B.zones).filter((z) => S.countries.includes(B.zones[z].country));
  if (!open.length) { wrap.replaceChildren(); return; }
  wrap.replaceChildren(h('fieldset', {}, h('legend', { text: t('zones') }),
    h('div', { class: 'chips wide' }, open.map((z) => checkTile('chip', 'zone', z, P(B.zones[z]), S.zones.includes(z), (e) => {
      S.zones = Object.keys(B.zones).filter((k) => (k === z ? e.target.checked : S.zones.includes(k)));
      changed('zones');
    }))),
    h('p', { class: 'hint', text: t('zones_hint') })));
}

function renderPersonal() {
  const locked = B.incident_types[S.type].triggers.includes('personal-data-breach');
  $('personal-wrap').replaceChildren(h('label', { class: `toggle${locked ? ' locked' : ''}` },
    h('input', { type: 'checkbox', id: 'personal', role: 'switch', checked: locked || S.personal, disabled: locked, onchange: (e) => { S.personal = e.target.checked; changed('personal'); } }),
    h('span', { class: 'switch', 'aria-hidden': 'true' }),
    h('span', { class: 'toggle-text', text: t('personal') }), ' ',
    h('small', { class: 'hint', text: locked ? t('personal_locked') : P(B.incident_types[S.type].personal_hint) })));
}

/* On a phone the incident folds into one summary line above the clock */
function renderSummary() {
  const items = [
    core.when(new Date(S.discovered), S.lang),
    S.countries.length ? S.countries.map((c) => P(B.countries[c])).join(and()) : t('summary_none'),
    ...S.zones.map((z) => P(B.zones[z])),
    P(B.sectors[S.sector]),
    P(B.incident_types[S.type]),
    P(B.severities[S.severity]),
  ];
  $('incident-summary').replaceChildren(...items.map((x) => h('li', { text: x })));
}
function renderToggle() {
  const open = $('incident').classList.contains('open');
  const btn = $('incident-toggle');
  btn.textContent = open ? t('done') : t('edit');
  btn.setAttribute('aria-expanded', String(open));
}

/* The duties: one ruled row per authority, its countdown on a tile */
function tileFor(d) {
  const lead = d.lead;
  if (!lead) return { cls: 'u-off', word: t('seal_off') };
  if (lead.kind === 'deadline') return { cls: '', count: true };
  if (lead.kind === 'immediate') return { cls: 'u-now', word: t('rule_immediately') };
  if (lead.kind === 'promptly' || lead.kind === 'practicable' || lead.kind === 'undue-delay') return { cls: 'u-open', word: t('seal_promptly') };
  if (lead.kind === 'by-regulation') return { cls: 'u-open', word: t('seal_open') };
  return { cls: 'u-open', word: t('seal_none') };
}

function dueLine(date, countryCode) {
  const country = B.countries[countryCode];
  const mine = core.when(date, S.lang);
  const theirs = core.when(date, S.lang, country.tz);
  return h('p', { class: 'due' }, t('due_local', { time: mine }), theirs !== mine ? [' ', h('span', { class: 'tz', text: t('due_country', { time: theirs, country: P(country) }) })] : null);
}

function itemLine(item) {
  // A real space between the stage and its text: Arabic letters would otherwise join across the two elements.
  return [h('b', { text: core.stageText(B, item.stage, S.lang) }), ' ', bind(core.itemText(B, item, S.lang))];
}

function sourceBits(ob) {
  const line = core.sourceLine(B, ob, S.lang);
  const level = B.verification_levels[ob.verification];
  const bits = [h('span', { class: `tag v-${ob.verification}`, title: P(level.about) }, P(level))];
  bits.push(ob.source.url ? h('a', { href: ob.source.url, rel: 'noopener noreferrer', target: '_blank', text: line }) : h('span', { text: line }));
  if (ob.secondary && ob.secondary.length) {
    bits.push(h('span', { text: t('confirmed_by') }));
    for (const u of ob.secondary) bits.push(h('a', { href: u, rel: 'noopener noreferrer', target: '_blank', text: new URL(u).hostname.replace(/^www\./, '') }));
  }
  return spaced(bits);
}

function dutyRow(d) {
  const ob = core.obligation(B, d.id);
  const tile = tileFor(d);
  const li = h('li', { class: `duty ${tile.cls}`.trim(), id: `duty-${d.id}`, tabindex: '-1' });
  if (tile.count) li.dataset.due = d.lead.due.toISOString();
  li.append(h('div', { class: 'cd', 'aria-hidden': 'true' }, tile.count ? [h('span', { class: 'count' }), h('span', { class: 'count-label' })] : h('span', { class: 'word', text: tile.word })));
  li.append(h('div', { class: 'who-col' },
    h('h3', { class: 'who', text: P(B.authorities[d.authority]) }),
    h('p', { class: 'where', text: P(B.countries[d.country]) }),
    h('p', { class: 'applies', text: `${t('applies_to')} ${lowerFirst(P(ob.applies_to))}` })));
  const rest = d.items.filter((i) => i !== d.lead);
  const why = d.note ? bind(core.noteText(B, d.note, S.lang)) : t('note_conditional');
  li.append(h('div', { class: 'when-col' },
    h('p', { class: 'when' }, d.lead ? itemLine(d.lead) : why),
    d.lead && d.lead.kind === 'deadline' ? dueLine(d.lead.due, d.country) : null,
    d.lead && d.note ? h('p', { class: 'note', text: why }) : null,
    rest.length ? h('ul', { class: 'more' }, rest.map((i) => h('li', {}, itemLine(i), i.due && i.kind === 'deadline' ? [' ', h('span', { class: 'tz', text: core.when(i.due, S.lang) })] : null))) : null));
  li.append(h('div', { class: 'src-col' }, h('p', { class: 'src' }, sourceBits(ob))));
  return li;
}

// Duties with a moment to meet lead under the shared labels; the rest follow under their own rule.
function dutyGroups() {
  const timed = A.duties.filter((d) => d.lead && (d.lead.kind === 'deadline' || d.lead.kind === 'immediate'));
  const open = A.duties.filter((d) => d.lead && !timed.includes(d));
  const off = A.duties.filter((d) => !d.lead);
  const out = [];
  if (timed.length) {
    out.push(h('div', { class: 'duties-head', 'aria-hidden': 'true' }, ['col_left', 'col_who', 'col_when', 'col_src'].map((k) => h('span', { text: t(k) }))));
    out.push(h('ol', { class: 'duties' }, timed.map(dutyRow)));
  }
  if (open.length) out.push(h('h3', { class: 'group-title', text: t('group_open') }), h('ol', { class: 'duties' }, open.map(dutyRow)));
  if (off.length) out.push(h('h3', { class: 'group-title', text: t('group_off') }), h('ol', { class: 'duties' }, off.map(dutyRow)));
  return out;
}

function renderBrief() {
  const pairs = [
    [t('countries'), S.countries.map((c) => P(B.countries[c])).join(and())],
    ...(S.zones.length ? [[t('zones'), S.zones.map((z) => P(B.zones[z])).join(and())]] : []),
    [t('sector'), P(B.sectors[S.sector])],
    [t('type'), P(B.incident_types[S.type])],
    [t('severity'), P(B.severities[S.severity])],
    [t('personal'), personal() ? t('yes') : t('no')],
    [t('discovered'), core.when(new Date(S.discovered), S.lang)],
  ];
  $('brief').replaceChildren(...pairs.flatMap(([k, v]) => [h('dt', { text: k }), h('dd', { text: v })]));
}

/* The wall of hours */

// What a glazed tile holds, read aloud: the time, how many notices, and each one by stage and authority.
function stationText(s) {
  const same = (i) => s.items.filter((o) => o.stage === i.stage && o.authority === i.authority).length > 1;
  const names = s.items.map((i) => {
    const vars = { stage: core.stageText(B, i.stage, S.lang), who: P(B.authorities[i.authority]) };
    return same(i) ? t('wall_item_for', { ...vars, what: lowerFirst(P(B.triggers[core.obligation(B, i.id).trigger])) }) : t('wall_item', vars);
  });
  const count = s.items.length > 1 ? ` ${t('wall_count', { n: s.items.length })}` : '';
  return `${clockTime(s.due)}${count} ${names.join(and())}`;
}

// A time as the wall and its tiles name it: the time alone on the day of discovery, the weekday within the week, the date beyond it.
function clockTime(date) {
  const { weekday, day, month, time } = parts(date);
  const start = new Date(S.discovered);
  if (date.toDateString() === start.toDateString()) return time;
  if (date - start < 6 * 24 * HOUR) return `${weekday} ${time}`;
  return `${day} ${month} ${time}`;
}

function dayRow(r, withMonth, isToday) {
  const { weekday, day, month } = parts(r.date);
  const cells = [h('span', { class: `day${isToday ? ' today' : ''}`, text: withMonth ? `${weekday} ${day} ${month}` : `${weekday} ${day}` })];
  const byHour = new Map();
  for (const s of r.stations) {
    const hr = s.due.getHours();
    if (!byHour.has(hr)) byHour.set(hr, []);
    byHour.get(hr).push(s);
  }
  for (let hr = 0; hr < 24; hr++) {
    const start = new Date(r.date.getFullYear(), r.date.getMonth(), r.date.getDate(), hr).getTime();
    const here = byHour.get(hr);
    let tile;
    if (here) {
      const n = here.reduce((sum, s) => sum + s.items.length, 0);
      tile = h('a', { class: 'tile due', href: `#duty-${here[0].items[0].id}`, 'aria-label': here.map(stationText).join(and()), onclick: goToDuty },
        n > 1 ? h('span', { class: 'n', text: String(n) }) : null);
      tile.dataset.dues = here.map((s) => s.due.getTime()).join(' ');
    } else {
      tile = h('span', { class: `tile${hr < 6 || hr >= 18 ? ' night' : ''}` });
    }
    tile.dataset.start = String(start);
    cells.push(tile);
  }
  // Glazed tiles that touch share one target where the wall is too narrow for a thumb: the first leads to the earliest duty.
  for (let i = 1; i < cells.length; i++) {
    if (!cells[i].classList.contains('due') || !cells[i - 1].classList.contains('due')) continue;
    let head = i - 1;
    while (cells[head].classList.contains('joined')) head -= 1;
    cells[head].classList.add('run-head');
    cells[head].style.setProperty('--run', String(i - head + 1));
    cells[i].classList.add('joined');
  }
  return cells;
}

function gapRow(r, withMonth) {
  const a = parts(r.from);
  const b = parts(r.to);
  const from = withMonth || a.month !== b.month ? `${a.day} ${a.month}` : a.day;
  const to = a.month !== b.month ? `${b.day} ${b.month}` : b.day;
  return [h('span', { class: 'day gap-day', text: t('wall_range', { from, to }) }),
    h('span', { class: 'gap', text: t('wall_gap', { span: core.span(r.days, 'day', S.lang) }) })];
}

function renderWall() {
  const wrap = $('wall-wrap');
  const box = $('wall');
  const now = Date.now();
  const W = A ? core.wall(A, now) : { rows: [] };
  wallDay = dayKey(now);
  wallHour = new Date(now).getHours();
  paintedMinute = -1;
  keySig = '';
  if (!W.rows.length) { wrap.hidden = true; box.replaceChildren(); return; }
  wrap.hidden = false;
  box.setAttribute('role', 'group');
  box.setAttribute('aria-label', t('wall'));
  const today = W.rows.some((r) => r.kind === 'day' && r.date.getTime() === wallDay);
  const grid = h('div', { class: 'wall-grid' }, h('span', { class: 'wall-zone', text: t('wall_zone') }));
  for (const hr of TICKS) {
    const mark = h('span', { class: `tick${hr % 6 ? ' minor' : ''}`, 'aria-hidden': 'true', text: String(hr).padStart(2, '0') });
    mark.style.gridColumn = String(hr + 2);
    grid.append(mark);
  }
  if (today) {
    const at = wallHour <= 1 ? ' at-start' : wallHour >= 22 ? ' at-end' : '';
    const nowTick = h('span', { class: `tick now${at}`, id: 'wall-now', text: t('wall_now', { time: parts(new Date(now)).time }) });
    nowTick.style.gridColumn = String(wallHour + 2);
    grid.append(nowTick);
  }
  let month = null;
  W.rows.forEach((r) => {
    const m = (r.kind === 'gap' ? r.from : r.date).getMonth();
    const withMonth = m !== month;
    month = r.kind === 'gap' ? r.to.getMonth() : m;
    grid.append(...(r.kind === 'gap' ? gapRow(r, withMonth) : dayRow(r, withMonth, r.date.getTime() === wallDay)));
  });
  box.replaceChildren(grid, h('ul', { class: 'key', id: 'wall-key' }));
  paintWall(now);
  layoutTicks();
  // The tiles set once, row after row in reading order, the first time the wall is drawn.
  if (firstWall && !reduced()) {
    let row = -1;
    let last = 0;
    for (const el of grid.children) {
      if (el.classList.contains('day')) row += 1;
      if (el.classList.contains('gap')) el.style.setProperty('--d', `${row * 36}ms`);
      if (!el.classList.contains('tile')) continue;
      const delay = row * 36 + new Date(Number(el.dataset.start)).getHours() * 7;
      last = Math.max(last, delay);
      el.style.setProperty('--d', `${delay}ms`);
    }
    box.classList.add('draw');
    setTimeout(() => box.classList.remove('draw'), last + tokenMs('--t-set') + 50);
  }
  firstWall = false;
}

// The present hour carries the ring, time gone fills turquoise, and each glazed tile takes its most pressing notice's colour.
function paintWall(now) {
  const box = $('wall');
  if (!box || $('wall-wrap').hidden) return;
  const found = Date.parse(S.discovered);
  const minute = Math.floor(now / 60000);
  if (minute !== paintedMinute) {
    paintedMinute = minute;
    for (const tile of box.querySelectorAll('.tile')) {
      const start = Number(tile.dataset.start);
      const end = start + HOUR;
      tile.classList.toggle('present', now >= start && now < end);
      if (tile.classList.contains('due')) continue;
      const from = Math.max(start, found);
      const to = Math.min(end, now);
      const whole = from <= start && to >= end;
      tile.classList.toggle('gone', whole);
      let fill = tile.querySelector('.fill');
      if (!whole && to > from) {
        if (!fill) { fill = h('span', { class: 'fill' }); tile.append(fill); }
        fill.style.insetInlineStart = `${(((from - start) / HOUR) * 100).toFixed(2)}%`;
        fill.style.width = `${(((to - from) / HOUR) * 100).toFixed(2)}%`;
      } else if (fill) fill.remove();
    }
    const nowTick = $('wall-now');
    if (nowTick) { nowTick.textContent = t('wall_now', { time: parts(new Date(now)).time }); layoutTicks(); }
  }
  for (const tile of box.querySelectorAll('.tile.due')) {
    const ahead = tile.dataset.dues.split(' ').map(Number).filter((ms) => ms >= now);
    const u = ahead.length ? `u-${core.urgency(Math.min(...ahead) - now)}` : 'u-over';
    for (const c of URGENCY) tile.classList.toggle(c, c === u);
  }
  paintKey(now, found);
}

// An hour mark that would touch the present time's label steps aside; the label always wins.
function layoutTicks() {
  const box = $('wall');
  if (!box || $('wall-wrap').hidden) return;
  const marks = [...box.querySelectorAll('.tick:not(.now)')];
  for (const m of marks) m.classList.remove('hidden');
  const now = $('wall-now');
  const r = now && now.getBoundingClientRect();
  if (!r || !r.width) return;
  const room = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--s-3')) || 0;
  for (const m of marks) {
    const q = m.getBoundingClientRect();
    if (q.width && q.right + room > r.left && q.left - room < r.right) m.classList.add('hidden');
  }
}

// The key lists only the kinds the wall shows, each with its own tile as the swatch.
function paintKey(now, found) {
  const box = $('wall');
  const kinds = [];
  if (now > found && box.querySelector('.tile.gone, .tile .fill')) kinds.push('gone');
  for (const u of ['u-now', 'u-soon', 'u-later', 'u-over']) if (box.querySelector(`.tile.due.${u}`)) kinds.push(u);
  if (box.querySelector('.tile.night:not(.gone)')) kinds.push('night');
  const sig = kinds.join(' ');
  if (sig !== keySig) {
    keySig = sig;
    $('wall-key').replaceChildren(...kinds.map((k) => h('li', {}, h('span', { class: `sw ${k}`, 'aria-hidden': 'true' }),
      k === 'gone' ? spaced([h('span', { text: t(KINDS[k]) }), h('span', { class: 'val', id: 'key-gone' })]) : h('span', { text: t(KINDS[k]) }))));
  }
  const val = $('key-gone');
  if (val) val.textContent = core.clock(now - found);
}

// A glazed tile takes the reader to its duty and rings it briefly, so the eye lands on the right one.
function goToDuty(e) {
  const el = document.getElementById(e.currentTarget.getAttribute('href').slice(1));
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
  el.classList.add('arrived');
  el.focus({ preventScroll: true });
  clearTimeout(el.ringTimer);
  el.ringTimer = setTimeout(() => el.classList.remove('arrived'), tokenMs('--t-hold'));
}

/* The first notice and its countdown */
function renderFinding() {
  const box = $('finding');
  if (!A || !A.duties.length) { box.replaceChildren(); return; }
  const live = A.duties.filter((d) => d.lead);
  if (!live.length) { box.replaceChildren(t('finding_off')); return; }
  // A notice due immediately is named first: it has no moment to count down to, and nothing comes before it.
  const first = live.find((d) => d.lead.kind === 'immediate');
  const now = first ? t('finding_now', { stage: core.stageText(B, first.lead.stage, S.lang), who: P(B.authorities[first.authority]) }) : null;
  const timed = live.some((d) => d.items.some((i) => i.kind === 'deadline'));
  if (!timed) { box.replaceChildren(now || t('finding_none')); return; }
  const { next, passed } = core.nextDue(A);
  const out = now ? [h('span', { class: 'now', text: now }), ' '] : [];
  if (next) {
    const lead = h('strong', { class: 'lead', id: 'lead-count', 'data-due': next.item.due.toISOString() });
    const stage = core.stageText(B, next.item.stage, S.lang);
    const vars = { stage: now ? lowerFirst(stage) : stage, who: P(B.authorities[next.duty.authority]) };
    out.push(...fillWith(t(now ? 'finding_then' : 'finding_next'), vars, lead));
  } else {
    out.push(t('finding_all_passed'));
  }
  if (passed && next) out.push(' ', h('span', { class: 'passed', text: t(passed === 1 ? 'finding_passed_one' : 'finding_passed', { n: passed }) }));
  box.replaceChildren(...out);
  fillLead(Date.now());
  box.dataset.key = next ? `${next.duty.id}:${next.item.stage}:${next.item.due.getTime()}:${passed}` : `none:${passed}`;
}

function renderClock() {
  renderBrief();
  const box = $('duties');
  const count = $('count');
  A = null;
  if (!S.countries.length) {
    count.textContent = '';
    $('calendar').disabled = true;
    box.replaceChildren(h('p', { class: 'empty', text: t('clock_empty') }));
  } else {
    A = core.assess(B, incident());
    if (!A.duties.length) {
      count.textContent = '';
      $('calendar').disabled = true;
      box.replaceChildren(h('p', { class: 'empty', text: t('clock_none') }));
    } else {
      const n = A.duties.filter((d) => d.lead).length;
      count.textContent = t(n === 1 ? 'count_fmt_one' : 'count_fmt', { n });
      $('calendar').disabled = !A.duties.some((d) => d.items.some((i) => i.kind === 'deadline'));
      box.replaceChildren(...dutyGroups());
    }
  }
  renderFinding();
  renderWall();
}

// The lead countdown and its urgency; called by the finding as it is built and by every tick after.
function fillLead(now) {
  const lead = $('lead-count');
  if (!lead) return;
  const left = Date.parse(lead.dataset.due) - now;
  lead.textContent = core.clock(left);
  const u = `u-${core.urgency(left)}`;
  for (const c of URGENCY) lead.classList.toggle(c, c === u);
}

function tick() {
  const now = Date.now();
  for (const li of document.querySelectorAll('.duty[data-due]')) {
    const ms = Date.parse(li.dataset.due) - now;
    const u = `u-${core.urgency(ms)}`;
    for (const c of URGENCY) li.classList.toggle(c, c === u);
    const count = li.querySelector('.count');
    count.textContent = core.clock(ms);
    // Past a hundred hours the count gains a digit, so it steps down a size to stay inside its tile.
    count.classList.toggle('wide', count.textContent.length > 8);
    li.querySelector('.count-label').textContent = ms < 0 ? t('seal_over') : t('seal_left');
  }
  const lead = $('lead-count');
  if (lead) {
    if (Date.parse(lead.dataset.due) - now < 0) renderFinding();
    else fillLead(now);
  }
  // A new day or a new hour moves the present tile and may add a row, so the wall is laid again; otherwise it is repainted.
  if (A && (dayKey(now) !== wallDay || new Date(now).getHours() !== wallHour)) renderWall();
  else paintWall(now);
  const el = $('tt-elapsed');
  if (el && S.tt.started) el.textContent = `${t('tt_elapsed')} ${core.clock(now - Date.parse(S.tt.started))}`;
}

/* Work tabs */
function renderWork() {
  const tabs = $('tabs');
  const panels = $('panels');
  tabs.replaceChildren(...TABS.map((id) => h('button', {
    class: 'tab', role: 'tab', id: `tab-${id}`, type: 'button', 'aria-controls': `panel-${id}`, 'aria-selected': String(S.tab === id), tabindex: S.tab === id ? '0' : '-1',
    onclick: () => selectTab(id),
    onkeydown: (e) => {
      const step = { ArrowRight: S.lang === 'ar' ? -1 : 1, ArrowLeft: S.lang === 'ar' ? 1 : -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      selectTab(TABS[(TABS.indexOf(S.tab) + step + TABS.length) % TABS.length], true);
    },
  }, h('span', { class: 'label long', text: t(`tab_${id}`) }), h('span', { class: 'label short', text: t(`tab_${id}_short`) }))));
  const build = { playbook: panelPlaybook, draft: panelDraft, tabletop: panelTabletop, register: panelRegister };
  panels.replaceChildren(...TABS.map((id) => {
    const p = h('div', { class: 'panel', role: 'tabpanel', id: `panel-${id}`, 'aria-labelledby': `tab-${id}`, tabindex: '0' });
    p.hidden = S.tab !== id;
    p.append(...build[id]().filter(Boolean));
    return p;
  }));
  renderDraftOutputs();
}

function selectTab(id, focus) {
  S.tab = id;
  save();
  for (const x of TABS) {
    const tab = $(`tab-${x}`);
    tab.setAttribute('aria-selected', String(x === id));
    tab.tabIndex = x === id ? 0 : -1;
    $(`panel-${x}`).hidden = x !== id;
  }
  if (focus) $(`tab-${id}`).focus();
}

function panelPlaybook() {
  const book = core.playbook(B, S.type, S.lang);
  return [h('h3', { text: book.title }), ...book.phases.map((ph) => {
    const keys = ph.steps.map((_, i) => `${S.type}:${ph.id}:${i}`);
    const done = () => keys.filter((k) => S.checks[k]).length;
    const text = h('span');
    const progress = h('span', { class: 'progress' }, icon('check'), text);
    const det = h('details', { class: 'phase', open: ph.id === 'first_hour' });
    const refresh = () => {
      text.textContent = t('progress', { done: done(), total: keys.length });
      det.classList.toggle('done', done() === keys.length);
    };
    det.append(h('summary', {}, icon('chevron', 'chev'), h('span', { text: ph.title }), ' ', progress),
      h('ul', { class: 'steps' }, ph.steps.map((s, i) => h('li', {}, h('label', { class: 'step' },
        h('input', { type: 'checkbox', checked: Boolean(S.checks[keys[i]]), onchange: (e) => {
          if (e.target.checked) S.checks[keys[i]] = true; else delete S.checks[keys[i]];
          save();
          refresh();
        } }),
        h('span', { class: 'box', 'aria-hidden': 'true' }, icon('check')),
        h('span', { text: s }))))));
    refresh();
    return det;
  })];
}

function panelDraft() {
  const fields = h('div', { class: 'fields' }, FIELDS.filter((f) => f !== 'records' || personal()).map((f) => h('label', {},
    h('span', { text: t(FIELD_LABEL[f]) }),
    h(LONG.has(f) ? 'textarea' : 'input', { value: S.draft[f] || '', ...(LONG.has(f) ? { rows: '3' } : { type: 'text' }), oninput: (e) => {
      S.draft[f] = e.target.value;
      save();
      renderDraftOutputs();
    } }))));
  const out = (lang) => h('section', {},
    h('h4', { class: 'panel-sub', text: t(lang === 'ar' ? 'draft_ar' : 'draft_en') }),
    h('pre', { class: 'notice', id: `notice-${lang}`, dir: lang === 'ar' ? 'rtl' : 'ltr', lang }),
    h('button', { class: 'btn small copy', type: 'button', 'data-for': `notice-${lang}`, onclick: (e) => copy(e.currentTarget) }, icon('copy'), h('span', { class: 'label-swap', text: t('copy') })));
  return [h('p', { class: 'lead-note', text: t('draft_note') }), h('div', { class: 'draft' }, fields, h('div', { class: 'outputs' }, out('ar'), out('en')))];
}

function renderDraftOutputs() {
  for (const lang of ['ar', 'en']) {
    const pre = $(`notice-${lang}`);
    if (pre) pre.textContent = core.draftNotice(B, incident(), S.draft, lang);
  }
}

// Swap a button's icon and label with a short blur, so the two states read as one change.
function swapLabel(btn, iconName, text) {
  const label = btn.querySelector('.label-swap');
  label.classList.add('swapping');
  setTimeout(() => {
    btn.querySelector('svg').replaceWith(icon(iconName));
    label.textContent = text;
    label.classList.remove('swapping');
  }, tokenMs('--t-swap'));
}

async function copy(btn) {
  const pre = $(btn.dataset.for);
  try {
    await navigator.clipboard.writeText(pre.textContent);
  } catch {
    const range = document.createRange();
    range.selectNodeContents(pre);
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
  swapLabel(btn, 'check', t('copied'));
  setTimeout(() => { if (btn.isConnected) swapLabel(btn, 'copy', t('copy')); }, tokenMs('--t-copied'));
}

function panelTabletop() {
  const x = core.exercise(B, S.type, S.lang);
  if (S.tt.type !== S.type) S.tt = { type: S.type, started: null, shown: 0 };
  const shown = x.injects.slice(0, S.tt.shown);
  const list = h('ol', { class: 'injects' }, shown.map((i, n) => h('li', { class: freshInject && n === shown.length - 1 ? 'fresh' : null }, h('span', { class: 'at', text: t('tt_at', { m: i.at }) }), ' ', h('span', { text: i.text }))));
  freshInject = false;
  const all = S.tt.shown >= x.injects.length;
  const next = h('button', { class: 'btn primary', type: 'button', disabled: all, text: S.tt.started ? t('tt_next') : t('tt_start'), onclick: () => {
    if (!S.tt.started) S.tt.started = new Date().toISOString();
    S.tt.shown = Math.min(x.injects.length, S.tt.shown + 1);
    freshInject = true;
    save();
    rerender('tabletop');
  } });
  const reset = h('button', { class: 'btn', type: 'button', text: t('tt_reset'), onclick: () => { S.tt = { type: S.type, started: null, shown: 0 }; save(); rerender('tabletop'); } });
  const useScenario = h('button', { class: 'btn', type: 'button', text: t('tt_load'), onclick: () => {
    S.countries = [...x.countries];
    S.zones = S.zones.filter((z) => S.countries.includes(B.zones[z].country));
    S.sector = x.sector;
    save();
    renderForm();
    renderSummary();
    renderClock();
    renderDraftOutputs();
    tick();
  } });
  return [
    h('h3', { text: x.title }),
    h('p', { class: 'setup', text: x.setup }),
    h('div', { class: 'tt-controls' }, next, reset, useScenario, h('span', { class: 'elapsed', id: 'tt-elapsed' })),
    list,
    all ? h('p', { class: 'tt-done', text: t('tt_done') }) : null,
    h('h4', { text: t('tt_questions') }),
    h('ol', { class: 'questions' }, x.questions.map((q) => h('li', { text: q }))),
  ];
}

function panelRegister() {
  const codes = S.reg === 'all' ? Object.keys(B.countries) : [S.reg];
  const filter = h('label', { class: 'reg-filter' }, h('span', { text: t('reg_country') }), ' ',
    h('div', { class: 'select' },
      h('select', { onchange: (e) => { S.reg = e.target.value; save(); rerender('register'); } },
        h('option', { value: 'all', text: t('reg_all'), selected: S.reg === 'all' }),
        Object.keys(B.countries).map((c) => h('option', { value: c, text: P(B.countries[c]), selected: S.reg === c }))),
      icon('chevron')));
  const groups = codes.map((c) => h('section', { class: 'reg-group' }, h('h4', { text: P(B.countries[c]) }),
    B.obligations.filter((o) => o.country === c).map((ob) => h('article', { class: 'reg-duty' },
      h('h5', { text: P(B.authorities[ob.authority]) }),
      h('p', { class: 'applies', text: `${t('applies_to')} ${lowerFirst(P(ob.applies_to))}` }),
      h('p', { text: P(ob.summary) }),
      h('p', { class: 'src' }, sourceBits(ob))))));
  const pending = B.pending.filter((p) => codes.includes(p.country));
  return [filter, ...groups, pending.length ? h('section', { class: 'pending' },
    h('h4', { text: t('pending_title') }),
    h('p', { class: 'hint', text: t('pending_note') }),
    h('ul', {}, pending.map((p) => h('li', { text: `${P(p)} (${P(B.countries[p.country])})` })))) : null];
}

function rerender(id) {
  const build = { playbook: panelPlaybook, draft: panelDraft, tabletop: panelTabletop, register: panelRegister };
  const p = $(`panel-${id}`);
  p.replaceChildren(...build[id]().filter(Boolean));
  if (id === 'draft') renderDraftOutputs();
  tick();
}

function downloadCalendar() {
  const cal = core.calendar(B, incident(), S.lang);
  if (!cal.events) { $('count').textContent = t('cal_none'); return; }
  const url = URL.createObjectURL(new Blob([cal.text], { type: 'text/calendar;charset=utf-8' }));
  const link = h('a', { href: url, download: `najjab-${S.discovered.slice(0, 10)}.ics` });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// A calendar date in words, with western digits in both languages.
function longDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat(S.lang === 'ar' ? 'ar-u-nu-latn' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(y, m - 1, d));
}

function renderFoot() {
  const repo = B.project.repo;
  $('foot').replaceChildren(
    h('div', { class: 'foot-main' },
      h('p', { text: t('disclaimer') }),
      h('p', { text: t('updated', { date: longDate(B.project.updated) }) }),
      h('p', { text: t('mcp_note') })),
    h('div', { class: 'foot-links' }, spaced([
      h('a', { href: repo, rel: 'noopener', text: t('source_code') }),
      h('a', { href: B.project.author_url, rel: 'noopener', text: t('built_by') })])));
}

function renderAll() {
  renderStatic();
  renderForm();
  renderSummary();
  renderClock();
  renderWork();
  renderFoot();
  tick();
}

async function boot() {
  let saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch { /* storage unavailable */ }
  applyTheme(saved);
  try {
    const res = await fetch('data/bundle.json');
    if (!res.ok) throw new Error(String(res.status));
    B = await res.json();
  } catch {
    $('duties').textContent = 'تعذّر تحميل البيانات فأعد تحميل الصفحة. Najjab could not load its data, reload the page.';
    return;
  }
  S = load();
  renderAll();
  save();
  $('lang').addEventListener('click', () => { S.lang = S.lang === 'ar' ? 'en' : 'ar'; save(); renderAll(); });
  $('theme').addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(THEME_KEY, next); } catch { /* storage unavailable */ }
    applyTheme(next);
    themeLabel();
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', themeLabel);
  $('incident-toggle').addEventListener('click', () => { $('incident').classList.toggle('open'); renderToggle(); });
  $('print').addEventListener('click', () => window.print());
  $('calendar').addEventListener('click', downloadCalendar);
  window.addEventListener('beforeprint', () => { for (const d of document.querySelectorAll('#panel-playbook details')) { d.dataset.wasOpen = d.open ? '1' : ''; d.open = true; } $('panel-playbook').hidden = false; });
  window.addEventListener('afterprint', () => { for (const d of document.querySelectorAll('#panel-playbook details')) d.open = d.dataset.wasOpen === '1'; $('panel-playbook').hidden = S.tab !== 'playbook'; });
  new ResizeObserver(() => layoutTicks()).observe($('wall-wrap'));
  document.fonts.ready.then(() => layoutTicks());
  setInterval(tick, 1000);
}

boot();
