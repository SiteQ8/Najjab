// Browser check of the published page: renders, counts down, switches language, and logs no errors.
// Run: npm run test:ui (needs Playwright; set PW_MODULE and PW_CHROME when they are not on the default paths).
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../', import.meta.url));
const { chromium } = require(process.env.PW_MODULE || 'playwright');
const PORT = 8899;
const shots = process.env.SHOTS || '';

const server = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', join(root, 'docs')], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined, args: ['--no-sandbox'] });
const errors = [];
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
  // Qatar, critical: the NIA two hour duty appears.
  await page.click('label.chip:has(input[value="QA"])');
  await page.click('label.chip:has(input[value="critical"])');
  assert.equal(await page.locator('.slip', { hasText: 'الوكالة الوطنية للأمن السيبراني' }).count(), 1);
  // Work tabs.
  await page.click('#tab-draft');
  assert.match(await page.textContent('#notice-ar'), /بنك الكويت المركزي/);
  await page.click('#tab-tabletop');
  await page.click('#panel-tabletop .btn.primary');
  assert.equal(await page.locator('#panel-tabletop .injects li').count(), 1);
  await page.click('#tab-register');
  assert.ok(await page.locator('#panel-register .duty').count() >= 14);
  await page.click('#tab-playbook');
  // English.
  await page.click('#lang');
  assert.equal(await page.getAttribute('html', 'dir'), 'ltr');
  assert.match(await page.textContent('#clock-title'), /Who to notify/);
  if (shots) await page.screenshot({ path: `${shots}/desktop-en.png`, fullPage: true });
  const mobile = await browser.newPage({ viewport: { width: 390, height: 860 }, deviceScaleFactor: 2 });
  mobile.on('pageerror', (e) => errors.push(e.message));
  await mobile.goto(`http://localhost:${PORT}/?c=KW,SA&s=banking&t=data-breach&v=medium&lang=ar`, { waitUntil: 'networkidle' });
  await mobile.waitForSelector('.slip');
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `no sideways scroll on a phone (overflow ${overflow}px)`);
  if (shots) await mobile.screenshot({ path: `${shots}/mobile-ar.png`, fullPage: true });
  assert.deepEqual(errors, [], 'no console errors');
  console.log('ui: all checks passed');
} finally {
  await browser.close();
  server.kill();
}
