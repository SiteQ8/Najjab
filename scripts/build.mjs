// Build the data bundle the site and the MCP server load. Run with --check to validate without writing.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (name) => JSON.parse(readFileSync(join(root, 'data', 'src', name), 'utf8'));
const check = process.argv.includes('--check');
const errors = [];
const fail = (m) => errors.push(m);

const project = src('project.json');
const reg = src('obligations.json');
const pb = src('playbooks.json');
const tt = src('tabletop.json');
const ui = src('ui.json');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

const STAGES = new Set(['initial', 'preliminary', 'update', 'report', 'high_risk', 'data_subjects', 'restored', 'closure']);
const RULES = new Set(['immediately', 'promptly', 'as-soon-as-practicable', 'no-fixed-period', 'by-regulation', 'without-undue-delay', 'as-incident']);
const FROM = new Set(['discovery', 'awareness', 'identification']);
const WHEN = new Set(['resolution', 'monthly', 'resumed', 'normal']);

if (project.version !== pkg.version) fail(`project.json version ${project.version} differs from package.json ${pkg.version}`);

const ids = new Set();
for (const ob of reg.obligations) {
  const where = `obligation ${ob.id}`;
  if (ids.has(ob.id)) fail(`${where} is duplicated`);
  ids.add(ob.id);
  if (!reg.countries[ob.country]) fail(`${where} has unknown country ${ob.country}`);
  const auth = reg.authorities[ob.authority];
  if (!auth) fail(`${where} has unknown authority ${ob.authority}`);
  else if (auth.country !== ob.country) fail(`${where} authority belongs to ${auth.country}`);
  if (!reg.triggers[ob.trigger]) fail(`${where} has unknown trigger ${ob.trigger}`);
  if (ob.zone && (!reg.zones[ob.zone] || reg.zones[ob.zone].country !== ob.country)) fail(`${where} has a zone outside its country: ${ob.zone}`);
  for (const s of ob.sectors) if (s !== 'all' && !reg.sectors[s]) fail(`${where} has unknown sector ${s}`);
  if (!reg.verification_levels[ob.verification]) fail(`${where} has unknown verification ${ob.verification}`);
  if (ob.verification === 'secondary' && !(ob.secondary || []).length) fail(`${where} is secondary but lists no secondary source`);
  if (ob.verification === 'official' && !ob.source.url && !ob.source.gazette) fail(`${where} is official but has no url or gazette`);
  if (!ob.deadlines.length) fail(`${where} has no deadlines`);
  for (const d of ob.deadlines) {
    if (!STAGES.has(d.stage)) fail(`${where} has unknown stage ${d.stage}`);
    if (d.rule && !RULES.has(d.rule)) fail(`${where} has unknown rule ${d.rule}`);
    if (d.from && !FROM.has(d.from)) fail(`${where} has unknown anchor ${d.from}`);
    if (d.when && !WHEN.has(d.when)) fail(`${where} has unknown event ${d.when}`);
    if (d.severity && !reg.severities[d.severity]) fail(`${where} has unknown severity ${d.severity}`);
    if (d.min_severity && !reg.severities[d.min_severity]) fail(`${where} has unknown severity ${d.min_severity}`);
    if (d.condition && !ui[`cond_${d.condition}`]) fail(`${where} has a condition with no wording: ${d.condition}`);
    if (d.rule === 'as-incident' && !reg.obligations.some((o) => o.id === d.ref_obligation)) fail(`${where} points to a missing obligation`);
    const shapes = ['hours', 'days', 'rule', 'every_hours', 'every', 'when'].filter((k) => d[k] !== undefined);
    if (shapes.length !== 1) fail(`${where} deadline must have exactly one of hours, days, rule, every_hours, every or when`);
  }
}
for (const t of Object.keys(reg.incident_types)) {
  const book = pb.playbooks[t];
  if (!book) fail(`no playbook for ${t}`);
  else for (const ph of pb.phases) if (!(book[ph] || []).length) fail(`playbook ${t} has no ${ph} steps`);
  const ex = tt.exercises[t];
  if (!ex) fail(`no tabletop exercise for ${t}`);
  else {
    if (!ex.injects.length || !ex.questions.length) fail(`tabletop ${t} needs injects and questions`);
    for (const c of ex.countries) if (!reg.countries[c]) fail(`tabletop ${t} has unknown country ${c}`);
    if (!reg.sectors[ex.sector]) fail(`tabletop ${t} has unknown sector ${ex.sector}`);
    const ats = ex.injects.map((i) => i.at);
    if (ats.some((a, i) => i > 0 && a <= ats[i - 1])) fail(`tabletop ${t} injects must move forward in time`);
  }
}
for (const ph of pb.phases) if (!ui[`phase_${ph}`]) fail(`no label for phase ${ph}`);

const bundle = {
  schema: 'najjab/1',
  project,
  countries: reg.countries,
  zones: reg.zones,
  sectors: reg.sectors,
  severities: reg.severities,
  triggers: reg.triggers,
  incident_types: reg.incident_types,
  verification_levels: reg.verification_levels,
  authorities: reg.authorities,
  pending: reg.pending,
  obligations: reg.obligations,
  phases: pb.phases,
  playbooks: pb.playbooks,
  tabletop: tt.exercises,
  ui,
};

if (errors.length) {
  console.error('BUILD FAILED');
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}

const out = join(root, 'docs', 'data', 'bundle.json');
const text = JSON.stringify(bundle, null, 1) + '\n';
if (check) {
  let current = '';
  try { current = readFileSync(out, 'utf8'); } catch { /* missing */ }
  if (current !== text) {
    console.error('docs/data/bundle.json is stale: run npm run build');
    process.exit(1);
  }
  console.log('bundle is current');
} else {
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, text);
  console.log(`bundle written: ${reg.obligations.length} duties, ${Object.keys(reg.authorities).length} authorities, ${Object.keys(reg.countries).length} countries`);
}
