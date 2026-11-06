// Browser check of the published page: renders, counts down, walks the route, switches language and theme, folds on a phone, and logs no errors.
// Run: npm run test:ui (needs Playwright; set PW_MODULE and PW_CHROME when they are not on the default paths).
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../', import.meta.url));
const { chromium } = require(process.env.PW_MODULE || 'playwright');
const PORT = Number(process.env.PORT) || 8899;
const shots = process.env.SHOTS || '';

const server = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', join(root, 'docs')], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined, args: ['--no-sandbox'] });
const errors = [];
// Language purity: all text on the page, hidden panels included, minus the parts meant to be in the other language.
const pageText = (pg, exclude) => pg.evaluate((ex) => {
  const clone = document.body.cloneNode(true);
  for (const sel of [...ex, 'script', 'noscript']) clone.querySelectorAll(sel).forEach((n) => n.remove());
  return clone.textContent;
}, exclude);
const ARABIC = /[\u0600-\u06FF]/;
const STRAY = /\b(null|undefined|NaN|\[object Object\])\b/;
try {
  const page = await browser.newPage({ viewport: { width: 1360, height: 1000 } });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`http://localhost:${PORT}/?c=KW&s=banking&t=ransomware&v=high&p=0&lang=ar`, { waitUntil: 'networkidle' });
  assert.equal(await page.getAttribute('html', 'dir'), 'rtl');
  await page.waitForSelector('.slip');
  const first = await page.textContent('.slip .who');
  assert.match(first, /بنك الكويت المركزي/);
  const c1 = await page.textContent('.slip .count');
  await page.waitForTimeout(1200);
  const c2 = await page.textContent('.slip .count');
  assert.notEqual(c1, c2, 'the countdown ticks');
  if (shots) await page.screenshot({ path: `${shots}/desktop-ar.png`, fullPage: false });
  // The next deadline leads the clock, and the route has a station for it that rings its slip.
  assert.match(await page.textContent('#finding'), /بنك الكويت المركزي/);
  assert.match(await page.textContent('#lead-count'), /^\d{2,}:\d{2}:\d{2}$/);
  const stations = page.locator('#route .station');
  assert.ok(await stations.count() >= 1, 'the route has stations');
  const target = (await stations.first().getAttribute('href')).slice(1);
  await stations.first().locator('.dot').click();
  assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.id), target, 'a station takes focus to its slip');
  assert.ok(await page.locator(`#${target}.arrived`).count() === 1, 'the slip is rung');
  // Let the pointer's ring clear first, then arrive by keyboard.
  await page.waitForSelector(`#${target}.arrived`, { state: 'detached' });
  await page.locator('#lang').focus();
  await page.waitForTimeout(800);
  const last = page.locator('#route .station').last();
  const target2 = (await last.getAttribute('href')).slice(1);
  await page.keyboard.press('Tab');
  await last.focus();
  await page.keyboard.press('Enter');
  const ring = await page.evaluate((id) => getComputedStyle(document.getElementById(id)).outlineColor, target2);
  assert.match(ring, /^rgb\(/, `a keyboard arrival rings at once (${ring})`);
  // The incident column scrolls on its own, so the time of discovery is always reachable.
  await page.locator('#discovered').scrollIntoViewIfNeeded();
  const box = await page.locator('#discovered').boundingBox();
  assert.ok(box && box.y >= 0 && box.y + box.height <= 1000, 'the discovery time can be reached beside the clock');
  const latin = ((await pageText(page, ['#notice-en', '#lang'])).match(/[A-Za-z][A-Za-z0-9.\-/:+&]*/g) || []).filter((w) => !/^[A-Z0-9]/.test(w) && !w.includes('.'));
  assert.deepEqual(latin, [], 'no lowercase English inside the Arabic page');
  assert.ok(!STRAY.test(await pageText(page, [])), 'no stray null, undefined or NaN in the Arabic page');
  // Arabic letters join across element boundaries, so no Arabic letter may touch another one across an inline element edge.
  const joined = await page.evaluate(() => {
    const letter = /[ؠ-يٮ-ۓ]/;
    const bad = [];
    for (const el of document.querySelectorAll('body span, body b, body strong, body a, body small, body em')) {
      if (getComputedStyle(el).display !== 'inline') continue;
      const text = el.textContent;
      const shown = (n) => n && (n.nodeType === Node.TEXT_NODE || getComputedStyle(n).display !== 'none') ? n.textContent : '';
      const before = shown(el.previousSibling);
      const after = shown(el.nextSibling);
      if (letter.test(before.slice(-1)) && letter.test(text.charAt(0))) bad.push(`${before.slice(-12)}|${text.slice(0, 12)}`);
      if (letter.test(text.slice(-1)) && letter.test(after.charAt(0))) bad.push(`${text.slice(-12)}|${after.slice(0, 12)}`);
    }
    return bad;
  });
  assert.deepEqual(joined, [], 'Arabic words in neighbouring elements are kept apart by a space');
  // The same for anything read as one line, flex children included: a gap drawn by CSS is not a space when the line is read or copied.
  const runTogether = await page.evaluate(() => {
    const word = /[0-9A-Za-z\u0620-\u064A\u066E-\u06D3]/;
    const bad = [];
    const lines = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, summary, label, dt, dd, button, li:not(.slip), .foot-links, .rlabel');
    for (const line of lines) {
      const parts = [...line.childNodes].filter((n) => (n.nodeType === Node.TEXT_NODE ? n.textContent !== '' : !['SELECT', 'INPUT', 'TEXTAREA'].includes(n.tagName) && getComputedStyle(n).display !== 'none'));
      for (let i = 1; i < parts.length; i++) {
        const a = parts[i - 1].textContent;
        const b = parts[i].textContent;
        if (word.test(a.slice(-1)) && word.test(b.charAt(0))) bad.push(`${a.slice(-12)}|${b.slice(0, 12)}`);
      }
    }
    return bad;
  });
  assert.deepEqual(runTogether, [], 'words in neighbouring parts of one line are kept apart by a space');
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#calendar')]);
  assert.match(download.suggestedFilename(), /^najjab-\d{4}-\d{2}-\d{2}\.ics$/);
  // Qatar, critical: the NIA two hour duty appears.
  await page.click('label.chip:has(input[value="QA"])');
  await page.click('.seg label:has(input[value="critical"])');
  assert.equal(await page.locator('.slip', { hasText: 'الوكالة الوطنية للأمن السيبراني' }).count(), 1);
  // Free zones show up with their country and add their duties.
  await page.click('label.chip:has(input[value="AE"])');
  await page.click('label.chip:has(input[value="difc"])');
  await page.click('label.opt:has(input[value="data-breach"])');
  assert.equal(await page.locator('.slip', { hasText: 'مفوض حماية البيانات في مركز دبي المالي العالمي' }).count(), 1);
  // Work tabs.
  await page.click('#tab-draft');
  assert.match(await page.textContent('#notice-ar'), /بنك الكويت المركزي/);
  await page.click('#tab-tabletop');
  await page.click('#panel-tabletop .btn.primary');
  assert.equal(await page.locator('#panel-tabletop .injects li').count(), 1);
  await page.click('#tab-register');
  assert.ok(await page.locator('#panel-register .duty').count() >= 22);
  await page.click('#tab-playbook');
  // Theme: the switch flips the ground and remembers the choice.
  const ground = () => page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
  const before = await ground();
  await page.click('#theme');
  assert.notEqual(await ground(), before, 'the theme switch changes the ground');
  const chosen = await page.getAttribute('html', 'data-theme');
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.getAttribute('html', 'data-theme'), chosen, 'the theme is remembered');
  await page.waitForSelector('.slip');
  // English.
  await page.click('#lang');
  assert.equal(await page.getAttribute('html', 'dir'), 'ltr');
  assert.match(await page.textContent('#clock-title'), /Who to notify/);
  const leak = (await pageText(page, ['#notice-ar', '#lang'])).split(/\s+/).filter((w) => ARABIC.test(w));
  assert.deepEqual(leak, [], 'no Arabic inside the English page');
  assert.ok(!STRAY.test(await pageText(page, [])), 'no stray null, undefined or NaN in the English page');
  if (shots) await page.screenshot({ path: `${shots}/desktop-en.png`, fullPage: true });
  const mobile = await browser.newPage({ viewport: { width: 390, height: 860 }, deviceScaleFactor: 2 });
  mobile.on('pageerror', (e) => errors.push(e.message));
  await mobile.goto(`http://localhost:${PORT}/?c=KW,SA&s=banking&t=data-breach&v=medium&lang=ar`, { waitUntil: 'networkidle' });
  await mobile.waitForSelector('.slip');
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `no sideways scroll on a phone (overflow ${overflow}px)`);
  // On a phone the incident folds into its summary above the clock, and the actions take short names.
  assert.equal(await mobile.isVisible('#form'), false, 'the incident starts folded on a phone');
  assert.ok(await mobile.isVisible('#incident-summary'), 'its summary shows');
  assert.ok(await mobile.isVisible('#calendar-short') && !(await mobile.isVisible('#calendar-long')), 'short action names on a phone');
  await mobile.click('#incident-toggle');
  assert.ok(await mobile.isVisible('#form'), 'the incident opens');
  assert.equal(await mobile.getAttribute('#incident-toggle', 'aria-expanded'), 'true');
  const overflowOpen = await mobile.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflowOpen <= 1, `no sideways scroll with the incident open (overflow ${overflowOpen}px)`);
  assert.ok(!STRAY.test(await pageText(mobile, [])), 'no stray null, undefined or NaN on a phone');
  if (shots) await mobile.screenshot({ path: `${shots}/mobile-ar.png`, fullPage: true });
  // Worst cases on the narrowest phone: every country and zone at once, and an incident found weeks ago.
  const narrow = await browser.newPage({ viewport: { width: 320, height: 720 } });
  narrow.on('pageerror', (e) => errors.push(e.message));
  for (const [lang, ago] of [['en', 20 * 60e3], ['ar', 20 * 60e3], ['en', 400 * 3600e3], ['ar', 9000 * 3600e3]]) {
    const found = encodeURIComponent(new Date(Date.now() - ago).toISOString());
    await narrow.goto(`http://localhost:${PORT}/?c=KW,BH,AE,SA,QA,OM&z=difc,adgm,qfc&s=banking&t=ransomware&v=critical&p=1&d=${found}&lang=${lang}`, { waitUntil: 'networkidle' });
    await narrow.waitForSelector('.slip');
    await narrow.waitForTimeout(1100);
    const spill = await narrow.evaluate(() => {
      const out = [];
      const doc = document.documentElement;
      if (doc.scrollWidth > doc.clientWidth + 1) out.push(`page ${doc.scrollWidth}>${doc.clientWidth}`);
      for (const s of document.querySelectorAll('.seal')) for (const c of s.children) if (c.scrollWidth > s.clientWidth) out.push(`seal "${c.textContent}" ${c.scrollWidth}>${s.clientWidth}`);
      for (const l of document.querySelectorAll('.rlabel:not(.gone)')) {
        const r = l.getBoundingClientRect();
        if (r.width && (r.left < 0 || r.right > innerWidth)) out.push(`route label "${l.textContent}" ${Math.round(r.left)}..${Math.round(r.right)}`);
      }
      return out;
    });
    assert.deepEqual(spill, [], `nothing spills on a 320px phone (${lang}, found ${Math.round(ago / 3600e3)} hours ago)`);
  }
  assert.ok(await narrow.locator('#lantern[hidden]').count() === 1, 'the lantern steps off the road once every deadline has passed');
  // A notice due immediately leads its slip, and is neither a station nor a deadline that has passed.
  const saudi = encodeURIComponent(new Date(Date.now() - 40 * 60e3).toISOString());
  await narrow.goto(`http://localhost:${PORT}/?c=SA&s=banking&t=data-breach&v=high&p=1&d=${saudi}&lang=ar`, { waitUntil: 'networkidle' });
  await narrow.waitForSelector('.slip');
  assert.equal(await narrow.textContent('.slip .word'), 'فوراً', 'the seal of a notice due immediately says so');
  assert.equal(await narrow.locator('#finding .passed').count(), 0, 'forty minutes in, nothing with a fixed time has passed');
  assert.equal(await narrow.locator('#route .station.u-over').count(), 0, 'no station is drawn overdue');
  // Only immediate notices and no fixed time: the finding leads with the immediate notice, and there is nothing for a calendar.
  await narrow.goto(`http://localhost:${PORT}/?c=SA&s=payments&t=ransomware&v=high&p=0&lang=ar`, { waitUntil: 'networkidle' });
  await narrow.waitForSelector('.slip');
  assert.match(await narrow.textContent('#finding'), /فوراً/);
  assert.ok(await narrow.isDisabled('#calendar'), 'no calendar file without a fixed time');
  assert.equal(await narrow.locator('.slip .due').count(), 0, 'a notice due immediately prints no due time');
  // Nothing applies at the chosen grade: the finding says so instead of asking for prompt notice.
  await narrow.goto(`http://localhost:${PORT}/?c=SA&s=banking&t=ransomware&v=low&p=0&lang=en`, { waitUntil: 'networkidle' });
  await narrow.waitForSelector('.slip');
  assert.match(await narrow.textContent('#finding'), /None of these duties applies/);
  // With no fixed time anywhere, the duty count still shows above the slips.
  await narrow.goto(`http://localhost:${PORT}/?c=KW&s=general&t=ransomware&v=high&lang=ar`, { waitUntil: 'networkidle' });
  await narrow.waitForSelector('.slip');
  assert.ok(await narrow.isVisible('#count'), 'the duty count shows when the route has nothing to draw');
  assert.match(await narrow.textContent('#count'), /1/);
  // The lead never goes blank when its deadline passes and the next one takes over.
  const edge = encodeURIComponent(new Date(Date.now() - (60 * 60e3 - 2500)).toISOString());
  await narrow.goto(`http://localhost:${PORT}/?c=KW,BH&s=banking&t=data-breach&v=high&p=1&d=${edge}&lang=en`, { waitUntil: 'networkidle' });
  await narrow.waitForSelector('#lead-count');
  const leads = [];
  for (let i = 0; i < 40; i++) { leads.push(await narrow.textContent('#lead-count')); await narrow.waitForTimeout(100); }
  assert.ok(leads.every((x) => /^\d{2,}:\d{2}:\d{2}$/.test(x)), `the lead always shows a count (${leads.filter((x) => !/^\d/.test(x)).length} blank)`);
  const secs = leads.map((x) => x.split(':').reduce((acc, v) => acc * 60 + Number(v), 0));
  assert.ok(secs.some((v, i) => i && v > secs[i - 1]), 'the lead moved on to the next deadline');
  // Printing from a browser set to dark still prints black on white.
  await narrow.emulateMedia({ media: 'print', colorScheme: 'dark' });
  const ink = await narrow.evaluate(() => [getComputedStyle(document.body).backgroundColor, getComputedStyle(document.body).color]);
  assert.deepEqual(ink, ['rgb(255, 255, 255)', 'rgb(0, 0, 0)'], 'print ignores the dark preference');
  await narrow.emulateMedia({ media: 'screen', colorScheme: 'light' });
  assert.deepEqual(errors, [], 'no console errors');
  console.log('ui: all checks passed');
} finally {
  await browser.close();
  server.kill();
}
