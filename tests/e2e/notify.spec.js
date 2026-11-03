import { test, expect } from '@playwright/test';
// t245u: web/PWA prayer notifications through the service worker
const swReady = page => page.waitForFunction(() => navigator.serviceWorker?.controller, null, { timeout: 15000 });
const plans = page => page.evaluate(() => new Promise(res => { const r = indexedDB.open('qs-notify', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => { const q = r.result.transaction('kv').objectStore('kv').get('plans'); q.onsuccess = () => res(q.result || {}) } }));
test('Settings → Prayer notifications: per-prayer toggles, tap targets, status, honest note', async ({ page }, ti) => {
  await page.goto('/#/settings'); const f = page.locator('#s_ntf'); await expect(f).toBeVisible();
  await expect(f.locator('[data-nal]')).toHaveCount(6);
  for (const l of await f.locator('.ntf-ck').all()) expect((await l.boundingBox()).height).toBeGreaterThanOrEqual(44);
  await expect(page.locator('#ntfSt')).toContainText(/Status/);
  if (ti.project.name === 'iphone') { await expect(page.locator('#ntfIos')).toContainText('Add to Home Screen'); await expect(page.locator('#s_nOn')).toBeDisabled() }
  else await expect(page.locator('#ntfIos')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
test('Turn on → plan saved for the service worker, test + catch-up notifications are shown', async ({ page }, ti) => {
  test.skip(ti.project.name === 'iphone', 'iPhone Safari tab: needs Home Screen install');
  await page.goto('/#/settings'); await swReady(page);
  await page.locator('#s_nOn').click(); await expect(page.locator('#nMsg')).toContainText(/notifications/);
  const p = await plans(page); expect(p.prayer.length).toBeGreaterThanOrEqual(30); expect(p.prayer[0].url).toBe('./#/prayer');
  await page.locator('#s_nTest').click(); await expect(page.locator('#nMsg')).toContainText('Test notification sent');
  // a notification that became due while the app was "closed" is shown by the service worker on its next wake
  await page.evaluate(() => new Promise(res => { const r = indexedDB.open('qs-notify', 1); r.onsuccess = () => { const s = r.result.transaction('kv', 'readwrite').objectStore('kv'); const g = s.get('plans'); g.onsuccess = () => { const v = g.result; v.missed = [{ id: 'm-1', at: Date.now() - 60000, title: 'Asr time', body: 'Asr began' }]; s.put(v, 'plans').onsuccess = res } } }));
  await page.evaluate(() => navigator.serviceWorker.controller.postMessage({ type: 'qs-check' }));
  await expect.poll(async () => page.evaluate(async () => (await (await navigator.serviceWorker.ready).getNotifications()).map(n => n.tag).join(','))).toContain('m-1');
  // toggling a prayer off removes it from the saved plan
  await page.locator('[data-nal="fajr"]').uncheck(); await expect.poll(async () => (await plans(page)).prayer.some(x => x.id.startsWith('p-fajr'))).toBe(false);
});
test('Urdu: notification section is Urdu and RTL', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('settings', JSON.stringify({ ui: 'ur', dark: true })));
  await page.goto('/#/settings'); await expect(page.locator('#s_ntf legend')).toContainText('نماز کی اطلاعات');
  await expect(page.locator('#s_ntf')).not.toContainText(/Fajr|Status/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
