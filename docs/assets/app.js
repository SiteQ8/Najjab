// Najjab site: renders the incident form, the live deadlines and the work tabs from the data bundle.
import * as core from './core.js';

const KEY = 'najjab:v1';
const TABS = ['playbook', 'draft', 'tabletop', 'register'];
const FIELDS = ['organization', 'contact', 'summary', 'systems', 'records', 'actions', 'next_update'];
const FIELD_LABEL = { organization: 'f_org', contact: 'f_contact', summary: 'f_summary', systems: 'f_systems', records: 'f_records', actions: 'f_actions', next_update: 'f_next' };
const LONG = new Set(['summary', 'actions']);
const $ = (id) => document.getElementById(id);
let B;
let S;

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
const t = (key, vars) => core.ui(B, key, S.lang, vars);
const P = (pair) => core.tr(pair, S.lang);
const personal = () => S.personal || B.incident_types[S.type].triggers.includes('personal-data-breach');
const incident = () => ({ countries: S.countries, zones: S.zones, sector: S.sector, type: S.type, severity: S.severity, personal: personal(), discovered: S.discovered });
const lowerFirst = (s) => (S.lang === 'en' ? s.charAt(0).toLowerCase() + s.slice(1) : s);

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
  renderClock();
  if (what !== 'time') renderWork();
  else renderDraftOutputs();
  tick();
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
  $('print').textContent = t('print');
  $('calendar').textContent = t('calendar');
  const other = S.lang === 'ar' ? 'en' : 'ar';
  $('lang').textContent = B.ui.lang_name[other];
  $('lang').setAttribute('lang', other);
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
    h('span', { text: P(B.countries[c]) })))));
  const sector = h('div', { class: 'field' },
    h('label', { class: 'field-label', for: 'sector', text: t('sector') }),
    h('select', { id: 'sector', onchange: (e) => { S.sector = e.target.value; changed('sector'); } },
      Object.keys(B.sectors).map((s) => h('option', { value: s, text: P(B.sectors[s]), selected: s === S.sector }))));
  const types = h('fieldset', {}, h('legend', { text: t('type') }), h('div', { class: 'types' }, Object.keys(B.incident_types).map((k) => h('label', { class: 'chip' },
    h('input', { type: 'radio', name: 'type', value: k, checked: S.type === k, onchange: () => { S.type = k; renderPersonal(); changed('type'); } }),
    h('span', { text: P(B.incident_types[k]) })))));
  const grades = h('fieldset', {}, h('legend', { text: t('severity') }), h('div', { class: 'chips' }, Object.keys(B.severities).map((k) => h('label', { class: 'chip' },
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
      h('span', { text: P(B.zones[z]) })))),
    h('p', { class: 'hint', text: t('zones_hint') })));
}

function renderPersonal() {
  const locked = B.incident_types[S.type].triggers.includes('personal-data-breach');
  $('personal-wrap').replaceChildren(h('label', { class: `toggle${locked ? ' locked' : ''}` },
    h('input', { type: 'checkbox', id: 'personal', checked: locked || S.personal, disabled: locked, onchange: (e) => { S.personal = e.target.checked; changed('personal'); } }),
    h('span', { text: t('personal') }),
    h('small', { class: 'hint', text: locked ? t('personal_locked') : P(B.incident_types[S.type].personal_hint) })));
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
  return h('p', { class: 'due' }, t('due_local', { time: mine }), theirs !== mine ? h('span', { class: 'tz', text: t('due_country', { time: theirs, country: P(country) }) }) : null);
}

function itemLine(item) {
  return [h('b', { text: core.stageText(B, item.stage, S.lang) }), core.itemText(B, item, S.lang)];
}

function sourceBits(ob) {
  const line = core.sourceLine(B, ob, S.lang);
  const bits = [h('span', { class: `badge v-${ob.verification}`, title: P(B.verification_levels[ob.verification].about), text: P(B.verification_levels[ob.verification]) })];
  bits.push(ob.source.url ? h('a', { href: ob.source.url, rel: 'noopener noreferrer', target: '_blank', text: line }) : h('span', { text: line }));
  if (ob.secondary && ob.secondary.length) {
    bits.push(h('span', { text: t('confirmed_by') }));
    for (const u of ob.secondary) bits.push(h('a', { href: u, rel: 'noopener noreferrer', target: '_blank', text: new URL(u).hostname.replace(/^www\./, '') }));
  }
  return bits;
}

function slip(d) {
  const ob = core.obligation(B, d.id);
  const seal = sealFor(d);
  const li = h('li', { class: `slip ${seal.cls}`.trim() });
  if (seal.count) li.dataset.due = d.lead.due.toISOString();
  li.append(h('div', { class: 'seal', 'aria-hidden': 'true' }, seal.count ? [h('span', { class: 'count' }), h('span', { class: 'count-label' })] : h('span', { class: 'word', text: seal.word })));
  const body = h('div', { class: 'slip-body' },
    h('h3', { class: 'who' }, P(B.authorities[d.authority]), h('span', { class: 'where', text: P(B.countries[d.country]) })),
    h('p', { class: 'when' }, d.lead ? itemLine(d.lead) : t('note_conditional')),
    d.lead && d.lead.due ? dueLine(d.lead.due, d.country) : null,
    d.note ? h('p', { class: 'note', text: core.noteText(B, d.note, S.lang) }) : null,
    h('p', { class: 'applies', text: `${t('applies_to')} ${lowerFirst(P(ob.applies_to))}` }));
  li.append(body);
  const rest = d.items.filter((i) => i !== d.lead);
  if (rest.length) {
    li.append(h('div', { class: 'perf' }, h('ul', {}, rest.map((i) => h('li', {}, itemLine(i), i.due && i.kind === 'deadline' ? h('span', { class: 'tz', text: ` ${core.when(i.due, S.lang)}` }) : null)))));
  }
  li.append(h('p', { class: 'src' }, sourceBits(ob)));
  return li;
}

function renderBrief() {
  const pairs = [
    [t('countries'), S.countries.map((c) => P(B.countries[c])).join(S.lang === 'ar' ? ' و' : ', ')],
    ...(S.zones.length ? [[t('zones'), S.zones.map((z) => P(B.zones[z])).join(S.lang === 'ar' ? ' و' : ', ')]] : []),
    [t('sector'), P(B.sectors[S.sector])],
    [t('type'), P(B.incident_types[S.type])],
    [t('severity'), P(B.severities[S.severity])],
    [t('personal'), personal() ? t('yes') : t('no')],
    [t('discovered'), core.when(new Date(S.discovered), S.lang)],
  ];
  $('brief').replaceChildren(...pairs.flatMap(([k, v]) => [h('dt', { text: k }), h('dd', { text: v })]));
}

function renderClock() {
  renderBrief();
  const box = $('slips');
  const count = $('count');
  if (!S.countries.length) {
    count.textContent = '';
    $('calendar').disabled = true;
    box.replaceChildren(h('p', { class: 'empty', text: t('clock_empty') }));
    return;
  }
  const a = core.assess(B, incident());
  if (!a.duties.length) {
    count.textContent = '';
    $('calendar').disabled = true;
    box.replaceChildren(h('p', { class: 'empty', text: t('clock_none') }));
    return;
  }
  count.textContent = t('count_fmt', { n: a.duties.filter((d) => d.lead).length });
  $('calendar').disabled = !a.duties.some((d) => d.items.some((i) => i.due));
  box.replaceChildren(h('ol', { class: 'slips' }, a.duties.map(slip)));
}

function tick() {
  const now = Date.now();
  for (const li of document.querySelectorAll('.slip[data-due]')) {
    const ms = Date.parse(li.dataset.due) - now;
    const u = ms < 0 ? 'u-over' : ms < 3600000 ? 'u-now' : ms < 6 * 3600000 ? 'u-soon' : 'u-later';
    for (const c of ['u-over', 'u-now', 'u-soon', 'u-later']) li.classList.toggle(c, c === u);
    li.querySelector('.count').textContent = core.clock(ms);
    li.querySelector('.count-label').textContent = ms < 0 ? t('seal_over') : t('seal_left');
  }
  const el = $('tt-elapsed');
  if (el && S.tt.started) el.textContent = `${t('tt_elapsed')} ${core.clock(now - Date.parse(S.tt.started))}`;
}

/* Work tabs */
function renderWork() {
  const tabs = $('tabs');
  const panels = $('panels');
  tabs.replaceChildren(...TABS.map((id) => h('button', {
    class: 'tab', role: 'tab', id: `tab-${id}`, type: 'button', 'aria-controls': `panel-${id}`, 'aria-selected': String(S.tab === id), tabindex: S.tab === id ? '0' : '-1', text: t(`tab_${id}`),
    onclick: () => selectTab(id),
    onkeydown: (e) => {
      const step = { ArrowRight: S.lang === 'ar' ? -1 : 1, ArrowLeft: S.lang === 'ar' ? 1 : -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      selectTab(TABS[(TABS.indexOf(S.tab) + step + TABS.length) % TABS.length], true);
    },
  })));
  const build = { playbook: panelPlaybook, draft: panelDraft, tabletop: panelTabletop, register: panelRegister };
  panels.replaceChildren(...TABS.map((id) => {
    const p = h('div', { class: 'panel', role: 'tabpanel', id: `panel-${id}`, 'aria-labelledby': `tab-${id}`, tabindex: '0' });
    p.hidden = S.tab !== id;
    p.append(...build[id]());
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
    const progress = h('span', { class: 'progress' });
    const det = h('details', { class: 'phase', open: ph.id === 'first_hour' });
    const refresh = () => {
      progress.textContent = t('progress', { done: done(), total: keys.length });
      det.classList.toggle('done', done() === keys.length);
    };
    det.append(h('summary', {}, h('span', { class: 'mark', 'aria-hidden': 'true' }), h('span', { text: ph.title }), progress),
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
    h('h4', { text: t(lang === 'ar' ? 'draft_ar' : 'draft_en') }),
    h('pre', { class: 'notice', id: `notice-${lang}`, dir: lang === 'ar' ? 'rtl' : 'ltr', lang }),
    h('button', { class: 'btn', type: 'button', text: t('copy'), onclick: (e) => copy($(`notice-${lang}`).textContent, e.currentTarget) }));
  return [h('p', { class: 'lead-note', text: t('draft_note') }), h('div', { class: 'draft' }, fields, h('div', { class: 'outputs' }, out('ar'), out('en')))];
}

function renderDraftOutputs() {
  for (const lang of ['ar', 'en']) {
    const pre = $(`notice-${lang}`);
    if (pre) pre.textContent = core.draftNotice(B, incident(), S.draft, lang);
  }
}

async function copy(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const range = document.createRange();
    range.selectNodeContents(btn.previousElementSibling);
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
  btn.textContent = t('copied');
  setTimeout(() => { btn.textContent = t('copy'); }, 1600);
}

function panelTabletop() {
  const x = core.exercise(B, S.type, S.lang);
  if (S.tt.type !== S.type) S.tt = { type: S.type, started: null, shown: 0 };
  const list = h('ol', { class: 'injects' }, x.injects.slice(0, S.tt.shown).map((i) => h('li', {}, h('span', { class: 'at', text: t('tt_at', { m: i.at }) }), i.text)));
  const all = S.tt.shown >= x.injects.length;
  const next = h('button', { class: 'btn primary', type: 'button', disabled: all, text: S.tt.started ? t('tt_next') : t('tt_start'), onclick: () => {
    if (!S.tt.started) S.tt.started = new Date().toISOString();
    S.tt.shown = Math.min(x.injects.length, S.tt.shown + 1);
    save();
    rerender('tabletop');
  } });
  const reset = h('button', { class: 'btn', type: 'button', text: t('tt_reset'), onclick: () => { S.tt = { type: S.type, started: null, shown: 0 }; save(); rerender('tabletop'); } });
  const useScenario = h('button', { class: 'btn', type: 'button', text: t('tt_load'), onclick: () => {
    S.countries = [...x.countries];
    S.sector = x.sector;
    save();
    renderForm();
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
  p.replaceChildren(...build[id]());
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
    h('p', { text: t('disclaimer') }),
    h('p', { text: t('updated', { date: B.project.updated }) }),
    h('p', {}, t('mcp_note'), ' ', h('a', { href: repo, rel: 'noopener', text: t('source_code') })),
    h('p', {}, h('a', { href: B.project.author_url, rel: 'noopener', text: t('built_by') })));
}

function renderAll() {
  renderStatic();
  renderForm();
  renderClock();
  renderWork();
  renderFoot();
  tick();
}

async function boot() {
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
  $('print').addEventListener('click', () => window.print());
  $('calendar').addEventListener('click', downloadCalendar);
  window.addEventListener('beforeprint', () => { for (const d of document.querySelectorAll('#panel-playbook details')) { d.dataset.wasOpen = d.open ? '1' : ''; d.open = true; } $('panel-playbook').hidden = false; });
  window.addEventListener('afterprint', () => { for (const d of document.querySelectorAll('#panel-playbook details')) d.open = d.dataset.wasOpen === '1'; $('panel-playbook').hidden = S.tab !== 'playbook'; });
  setInterval(tick, 1000);
}

boot();
