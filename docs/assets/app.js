// Najjab site: renders the incident form, the next deadline, the route, the slips and the work tabs from the data bundle.
import * as core from './core.js';

const KEY = 'najjab:v1';
const THEME_KEY = 'najjab:theme';
const TABS = ['playbook', 'draft', 'tabletop', 'register'];
const FIELDS = ['organization', 'contact', 'summary', 'systems', 'records', 'actions', 'next_update'];
const FIELD_LABEL = { organization: 'f_org', contact: 'f_contact', summary: 'f_summary', systems: 'f_systems', records: 'f_records', actions: 'f_actions', next_update: 'f_next' };
const LONG = new Set(['summary', 'actions']);
const URGENCY = ['u-over', 'u-now', 'u-soon', 'u-later'];
const SVG = 'http://www.w3.org/2000/svg';
const $ = (id) => document.getElementById(id);
let B;
let S;
let A = null;
let R = { span: 0, stations: [] };
let drawn = false;
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

// One drawn icon set: 16px grid, 1.5px stroke, round ends.
const ICONS = {
  check: ['M3.25 8.5l3 3 6.5-7'],
  chevron: ['M4 6.25l4 4 4-4'],
  copy: ['M5.75 5.75h6.5a1.5 1.5 0 0 1 1.5 1.5v5.5a1.5 1.5 0 0 1-1.5 1.5h-5.5a1.5 1.5 0 0 1-1.5-1.5z', 'M10.25 5.75V3.75a1.5 1.5 0 0 0-1.5-1.5h-5a1.5 1.5 0 0 0-1.5 1.5v5a1.5 1.5 0 0 0 1.5 1.5h2'],
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
// Keep a number with the word after it, so a period such as 72 hours never breaks across two lines.
const bind = (s) => s.replace(/(\d) (?=\S)/g, '$1\u00A0');

// Fill a template whose {t} slot is an element rather than text.
function fillWith(template, vars, slot) {
  const [before, after = ''] = core.fill(template, vars).split('{t}');
  return [before, slot, after].filter((x) => x !== '');
}

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

/* Theme: the visitor's choice, or the system's when they have made none */
function currentTheme() {
  const set = document.documentElement.dataset.theme;
  if (set === 'light' || set === 'dark') return set;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function applyTheme(choice) {
  const root = document.documentElement;
  if (choice === 'light' || choice === 'dark') root.dataset.theme = choice;
  else delete root.dataset.theme;
  const ground = getComputedStyle(root).getPropertyValue('--ground').trim();
  for (const m of document.querySelectorAll('meta[name="theme-color"]')) if (choice) m.setAttribute('content', ground);
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
  $('route').setAttribute('aria-label', t('route'));
  $('route').setAttribute('role', 'group');
  const other = S.lang === 'ar' ? 'en' : 'ar';
  $('lang').textContent = B.ui.lang_name[other];
  $('lang').setAttribute('lang', other);
  themeLabel();
  renderToggle();
}

/* Incident form */
function renderForm() {
  const form = $('form');
  form.replaceChildren();
  const countries = h('fieldset', {}, h('legend', { text: t('countries') }), h('div', { class: 'chips' }, Object.keys(B.countries).map((c) => h('label', { class: 'chip' },
    h('input', { type: 'checkbox', name: 'country', value: c, checked: S.countries.includes(c), onchange: (e) => {
      S.countries = Object.keys(B.countries).filter((k) => (k === c ? e.target.checked : S.countries.includes(k)));
      S.zones = S.zones.filter((z) => S.countries.includes(B.zones[z].country));
      renderZones();
      changed('countries');
    } }),
    h('span', {}, icon('check'), P(B.countries[c]))))));
  const sector = h('div', { class: 'field' },
    h('label', { class: 'field-label', for: 'sector', text: t('sector') }),
    h('select', { id: 'sector', onchange: (e) => { S.sector = e.target.value; changed('sector'); } },
      Object.keys(B.sectors).map((s) => h('option', { value: s, text: P(B.sectors[s]), selected: s === S.sector }))));
  const types = h('fieldset', {}, h('legend', { text: t('type') }), h('div', { class: 'opts' }, Object.keys(B.incident_types).map((k) => h('label', { class: 'opt' },
    h('input', { type: 'radio', name: 'type', value: k, checked: S.type === k, onchange: () => { S.type = k; renderPersonal(); changed('type'); } }),
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
  form.append(countries, h('div', { id: 'zones-wrap' }), sector, types, grades, h('div', { id: 'personal-wrap' }), time);
  renderZones();
  renderPersonal();
}

function renderZones() {
  const wrap = $('zones-wrap');
  const open = Object.keys(B.zones).filter((z) => S.countries.includes(B.zones[z].country));
  if (!open.length) { wrap.replaceChildren(); return; }
  wrap.replaceChildren(h('fieldset', {}, h('legend', { text: t('zones') }),
    h('div', { class: 'chips' }, open.map((z) => h('label', { class: 'chip' },
      h('input', { type: 'checkbox', name: 'zone', value: z, checked: S.zones.includes(z), onchange: (e) => {
        S.zones = Object.keys(B.zones).filter((k) => (k === z ? e.target.checked : S.zones.includes(k)));
        changed('zones');
      } }),
      h('span', {}, icon('check'), P(B.zones[z]))))),
    h('p', { class: 'hint', text: t('zones_hint') })));
}

function renderPersonal() {
  const locked = B.incident_types[S.type].triggers.includes('personal-data-breach');
  $('personal-wrap').replaceChildren(h('label', { class: `toggle${locked ? ' locked' : ''}` },
    h('input', { type: 'checkbox', id: 'personal', checked: locked || S.personal, disabled: locked, onchange: (e) => { S.personal = e.target.checked; changed('personal'); } }),
    h('span', { text: t('personal') }), ' ',
    h('small', { class: 'hint', text: locked ? t('personal_locked') : P(B.incident_types[S.type].personal_hint) })));
}

/* On a phone the incident folds into one summary line above the clock */
function renderSummary() {
  const items = [
    S.countries.length ? S.countries.map((c) => P(B.countries[c])).join(and()) : t('summary_none'),
    ...S.zones.map((z) => P(B.zones[z])),
    P(B.sectors[S.sector]),
    P(B.incident_types[S.type]),
    P(B.severities[S.severity]),
    core.when(new Date(S.discovered), S.lang),
  ];
  $('incident-summary').replaceChildren(...items.map((x) => h('li', { text: x })));
}
function renderToggle() {
  const open = $('incident').classList.contains('open');
  const btn = $('incident-toggle');
  btn.textContent = open ? t('done') : t('edit');
  btn.setAttribute('aria-expanded', String(open));
}

/* The clock */
function sealFor(d) {
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

// Neighbouring elements that are read as one line get a real space between them; flex gaps alone leave the words joined.
const spaced = (nodes) => nodes.flatMap((n, i) => (i ? [' ', n] : [n]));

function sourceBits(ob) {
  const line = core.sourceLine(B, ob, S.lang);
  const level = B.verification_levels[ob.verification];
  const bits = [h('span', { class: `tag v-${ob.verification}`, title: P(level.about) }, ob.verification === 'official' ? icon('check') : null, P(level))];
  bits.push(ob.source.url ? h('a', { href: ob.source.url, rel: 'noopener noreferrer', target: '_blank', text: line }) : h('span', { text: line }));
  if (ob.secondary && ob.secondary.length) {
    bits.push(h('span', { text: t('confirmed_by') }));
    for (const u of ob.secondary) bits.push(h('a', { href: u, rel: 'noopener noreferrer', target: '_blank', text: new URL(u).hostname.replace(/^www\./, '') }));
  }
  return spaced(bits);
}

function slip(d) {
  const ob = core.obligation(B, d.id);
  const seal = sealFor(d);
  const li = h('li', { class: `slip ${seal.cls}`.trim(), id: `slip-${d.id}`, tabindex: '-1' });
  if (seal.count) li.dataset.due = d.lead.due.toISOString();
  li.append(h('div', { class: 'seal', 'aria-hidden': 'true' }, seal.count ? [h('span', { class: 'count' }), h('span', { class: 'count-label' })] : h('span', { class: 'word', text: seal.word })));
  const body = h('div', { class: 'slip-body' },
    h('h3', { class: 'who' }, P(B.authorities[d.authority]), ' ', h('span', { class: 'where', text: P(B.countries[d.country]) })),
    h('p', { class: 'when' }, d.lead ? itemLine(d.lead) : t('note_conditional')),
    d.lead && d.lead.due ? dueLine(d.lead.due, d.country) : null,
    d.note ? h('p', { class: 'note', text: bind(core.noteText(B, d.note, S.lang)) }) : null,
    h('p', { class: 'applies', text: `${t('applies_to')} ${lowerFirst(P(ob.applies_to))}` }));
  li.append(body);
  const rest = d.items.filter((i) => i !== d.lead);
  if (rest.length) {
    li.append(h('div', { class: 'perf' }, h('ul', {}, rest.map((i) => h('li', {}, itemLine(i), i.due && i.kind === 'deadline' ? [' ', h('span', { class: 'tz', text: core.when(i.due, S.lang) })] : null)))));
  }
  li.append(h('p', { class: 'src' }, sourceBits(ob)));
  return li;
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

// A station or marker on the route: a zero-width anchor at its place on the road, with a dot and a label.
function marker(cls, x, label, extra = {}) {
  const tag = extra.href ? 'a' : 'div';
  const el = h(tag, { class: cls, ...extra }, h('span', { class: 'dot', 'aria-hidden': 'true' }), label);
  el.style.insetInlineStart = `${(x * 100).toFixed(3)}%`;
  el.dataset.x = String(x);
  return el;
}

function stationText(s) {
  const who = [...new Set(s.items.map((i) => core.fill(t('route_item'), { stage: core.stageText(B, i.stage, S.lang), who: P(B.authorities[i.authority]) })))];
  return `${clockTime(s.due)} ${who.join(and())}`;
}

// A station's label: the time alone on the day of discovery, the weekday and time within the week, the date and time beyond it.
function clockTime(date) {
  const [weekday, day, month, time] = core.when(date, S.lang).split(' ');
  const start = new Date(S.discovered);
  if (date.toDateString() === start.toDateString()) return time;
  if (date - start < 6 * 24 * 3600000) return `${weekday} ${time}`;
  return `${day} ${month} ${time}`;
}

function renderRoute() {
  const wrap = $('route-wrap');
  const box = $('route');
  R = A ? core.route(A) : { span: 0, stations: [] };
  if (!R.stations.length) { wrap.hidden = true; box.replaceChildren(); return; }
  wrap.hidden = false;
  const start = new Date(S.discovered);
  const parts = [h('div', { class: 'route-track', 'aria-hidden': 'true' }), h('div', { class: 'route-trail', id: 'route-trail', 'aria-hidden': 'true' }),
    marker('route-start', 0, h('span', { class: 'rlabel row-1', text: t('route_start', { time: clockTime(start) }) }), { 'aria-hidden': 'true' })];
  for (const s of R.stations) {
    const label = h('span', { class: 'rlabel row-0' }, clockTime(s.due), s.items.length > 1 ? [' ', h('span', { class: 'rcount', text: String(s.items.length) })] : null);
    parts.push(marker('station', s.x, label, { href: `#slip-${s.items[0].id}`, 'aria-label': stationText(s), 'data-due': s.due.toISOString(), onclick: goToSlip }));
  }
  parts.push(marker('lantern', 0, h('span', { class: 'rlabel row-1', text: t('route_now') }), { id: 'lantern', 'aria-hidden': 'true' }));
  box.replaceChildren(...parts);
  if (!drawn && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    drawn = true;
    box.classList.add('draw');
    box.addEventListener('animationend', () => box.classList.remove('draw'), { once: true });
  }
  drawn = true;
  placeLantern();
  layoutLabels();
}

// A station takes the reader to its slip and rings it briefly, so the eye lands on the right one.
function goToSlip(e) {
  const el = document.getElementById(e.currentTarget.getAttribute('href').slice(1));
  if (!el) return;
  e.preventDefault();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  el.focus({ preventScroll: true });
  el.classList.add('arrived');
  clearTimeout(el.ringTimer);
  el.ringTimer = setTimeout(() => el.classList.remove('arrived'), tokenMs('--t-hold'));
}

// The playhead rides at the present moment; its label is laid out again only when it has moved a few pixels.
function placeLantern() {
  const lantern = $('lantern');
  if (!lantern || !R.stations.length) return;
  const hours = (Date.now() - Date.parse(S.discovered)) / 3600000;
  const x = core.routeAt(hours, R.span);
  const width = $('route').clientWidth || 1;
  // Past the last deadline there is no road left: the trail runs full and the lantern steps off it.
  const past = hours >= R.span;
  if (past !== lantern.hidden) {
    lantern.hidden = past;
    lantern.dataset.px = '';
    lantern.dataset.laid = '';
  }
  if (Math.abs(Number(lantern.dataset.px || -99) - x * width) < 0.5) return;
  const moved = Math.abs(Number(lantern.dataset.laid || -99) - x * width) >= 4;
  lantern.dataset.x = String(x);
  lantern.dataset.px = String(x * width);
  lantern.style.insetInlineStart = `${(x * 100).toFixed(3)}%`;
  $('route-trail').style.width = `${(x * 100).toFixed(3)}%`;
  if (moved) { lantern.dataset.laid = String(x * width); layoutLabels(); }
}

// Labels sit above the road, or below it when they would touch a neighbour; a label with no room hides and its station keeps its name for screen readers.
function layoutLabels() {
  const box = $('route');
  if (!box || !box.isConnected) return;
  const width = box.clientWidth;
  if (!width) return;
  const half = parseFloat(getComputedStyle(box).getPropertyValue('--dot')) / 2 || 0;
  const items = [...box.querySelectorAll('.station, .lantern:not([hidden]), .route-start')].map((el) => ({ el, label: el.querySelector('.rlabel'), x: Number(el.dataset.x) }));
  for (const it of items) {
    it.label.classList.remove('gone', 'at-start', 'at-end', 'at-mid');
    const w = it.label.offsetWidth;
    const px = it.x * width;
    const align = px - w / 2 < -half ? 'at-start' : px + w / 2 > width + half ? 'at-end' : 'at-mid';
    it.label.classList.add(align);
    it.from = align === 'at-start' ? px - half : align === 'at-end' ? px - w + half : px - w / 2;
    it.to = it.from + w;
  }
  const rows = [[], []];
  const space = parseFloat(getComputedStyle(box).getPropertyValue('--s-3')) || 0;
  const fits = (row, it) => rows[row].every((o) => it.to + space <= o.from || it.from >= o.to + space);
  const start = items.find((it) => it.el.classList.contains('route-start'));
  const lantern = items.find((it) => it.el.classList.contains('lantern'));
  const stations = items.filter((it) => it.el.classList.contains('station')).sort((a, b) => a.x - b.x);
  // Below the road: the lantern first, then the discovery time when there is room beside it.
  if (lantern) rows[1].push(lantern);
  if (start) { if (fits(1, start)) rows[1].push(start); else start.label.classList.add('gone'); }
  for (const it of stations) {
    const row = fits(0, it) ? 0 : fits(1, it) ? 1 : -1;
    it.label.classList.toggle('row-0', row !== 1);
    it.label.classList.toggle('row-1', row === 1);
    if (row === -1) it.label.classList.add('gone');
    else rows[row].push(it);
  }
}

function renderFinding() {
  const box = $('finding');
  if (!A || !A.duties.length) { box.replaceChildren(); return; }
  const timed = A.duties.some((d) => d.items.some((i) => i.kind === 'deadline'));
  if (!timed) { box.replaceChildren(t('finding_none')); return; }
  const { next, passed } = core.nextDue(A);
  const parts = [];
  if (next) {
    const lead = h('strong', { class: 'lead', id: 'lead-count', 'data-due': next.item.due.toISOString() });
    const vars = { stage: core.stageText(B, next.item.stage, S.lang), who: P(B.authorities[next.duty.authority]) };
    parts.push(...fillWith(t('finding_next'), vars, lead));
  } else {
    parts.push(t('finding_all_passed'));
  }
  if (passed && next) parts.push(' ', h('span', { class: 'passed', text: t(passed === 1 ? 'finding_passed_one' : 'finding_passed', { n: passed }) }));
  box.replaceChildren(...parts);
  fillLead(Date.now());
  box.dataset.key = next ? `${next.duty.id}:${next.item.stage}:${next.item.due.getTime()}:${passed}` : `none:${passed}`;
}

function renderClock() {
  renderBrief();
  const box = $('slips');
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
      $('calendar').disabled = !A.duties.some((d) => d.items.some((i) => i.due));
      box.replaceChildren(h('ol', { class: 'slips' }, A.duties.map(slip)));
    }
  }
  renderFinding();
  renderRoute();
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
  for (const li of document.querySelectorAll('.slip[data-due]')) {
    const ms = Date.parse(li.dataset.due) - now;
    const u = `u-${core.urgency(ms)}`;
    for (const c of URGENCY) li.classList.toggle(c, c === u);
    const count = li.querySelector('.count');
    count.textContent = core.clock(ms);
    // Past a hundred hours the count gains a digit, so it steps down a size to stay inside the seal.
    count.classList.toggle('wide', count.textContent.length > 8);
    li.querySelector('.count-label').textContent = ms < 0 ? t('seal_over') : t('seal_left');
  }
  for (const st of document.querySelectorAll('.station[data-due]')) {
    const u = `u-${core.urgency(Date.parse(st.dataset.due) - now)}`;
    for (const c of URGENCY) st.classList.toggle(c, c === u);
  }
  const lead = $('lead-count');
  if (lead) {
    if (Date.parse(lead.dataset.due) - now < 0) renderFinding();
    else fillLead(now);
  }
  placeLantern();
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
      h('ul', { class: 'steps' }, ph.steps.map((s, i) => h('li', {}, h('label', {},
        h('input', { type: 'checkbox', checked: Boolean(S.checks[keys[i]]), onchange: (e) => {
          if (e.target.checked) S.checks[keys[i]] = true; else delete S.checks[keys[i]];
          save();
          refresh();
        } }),
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
  const list = h('ol', { class: 'injects' }, shown.map((i, n) => h('li', { class: freshInject && n === shown.length - 1 ? 'fresh' : null }, h('span', { class: 'at', text: t('tt_at', { m: i.at }) }), ' ', i.text)));
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
  const filter = h('label', { class: 'reg-filter' }, h('span', { text: t('reg_country') }),
    h('select', { onchange: (e) => { S.reg = e.target.value; save(); rerender('register'); } },
      h('option', { value: 'all', text: t('reg_all'), selected: S.reg === 'all' }),
      Object.keys(B.countries).map((c) => h('option', { value: c, text: P(B.countries[c]), selected: S.reg === c }))));
  const groups = codes.map((c) => h('section', { class: 'reg-group' }, h('h4', { text: P(B.countries[c]) }),
    B.obligations.filter((o) => o.country === c).map((ob) => h('article', { class: 'duty' },
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

function renderFoot() {
  const repo = B.project.repo;
  $('foot').replaceChildren(
    h('div', { class: 'foot-main' },
      h('p', { text: t('disclaimer') }),
      h('p', { text: t('updated', { date: B.project.updated }) }),
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
    $('slips').textContent = 'تعذّر تحميل البيانات فأعد تحميل الصفحة. Najjab could not load its data, reload the page.';
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
  new ResizeObserver(() => layoutLabels()).observe($('route'));
  document.fonts.ready.then(() => layoutLabels());
  setInterval(tick, 1000);
}

boot();
