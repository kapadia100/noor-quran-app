import { test, expect } from '@playwright/test';
// v95 (t254u): Quran Live / Qaida Live are feature cards (gold border, Arabic calligraphy tile, inline LIVE badge),
// exactly the size of the Mosque Finder / Qibla Finder cards. The round medallions are gone.
for (const lang of ['en','ur']) for (const theme of ['light','dark']) {
  test(`home live cards ${lang} ${theme}: same size as feature cards, labelled, RTL order, no overflow`, async ({ page }) => {
    await page.addInitScript(([l,t])=>{localStorage.setItem('settings',JSON.stringify({ui:l,dark:t==='dark'}));}, [lang,theme]);
    await page.goto('/#/');
    const t=page.locator('#homeTutor'), q=page.locator('#homeQaida');
    await expect(t.locator('.md-ar')).toHaveText('القرآن'); await expect(q.locator('.md-ar')).toHaveText('القاعدة');
    await expect(t.locator('.md-ar')).toHaveAttribute('lang','ar');
    await expect(page.locator('.hcards.med, .md')).toHaveCount(0);
    await expect(page.locator('.lvgrid .lv')).toHaveCount(2);
    for (const m of [t,q]) { await expect(m.locator('.hc-live')).toBeVisible(); const lb=await m.locator('.hc-live').boundingBox(), bb=await m.locator('b').boundingBox(); expect(lb.height).toBeLessThan(22); expect(lb.y).toBeGreaterThanOrEqual(bb.y-2); expect(lb.y+lb.height).toBeLessThanOrEqual(bb.y+bb.height+2);
      expect(await m.locator('.hc-live i').evaluate(e=>getComputedStyle(e).animationName)).toBe('lvp');
      expect((await m.getAttribute('aria-label')).length).toBeGreaterThan(8);
      expect(await m.evaluate(e=>getComputedStyle(e).borderTopColor)).toBe('rgb(201, 165, 74)'); }
    const [tb,qb,mb,kb]=await Promise.all([t,q,page.locator('#homeBig .feat-mosques'),page.locator('#homeBig .feat-qibla')].map(l=>l.boundingBox()));
    for (const b of [tb,qb]) { expect(Math.abs(b.width-mb.width)).toBeLessThan(1); expect(Math.abs(b.height-mb.height)).toBeLessThan(1); }
    expect(Math.abs(tb.y-qb.y)).toBeLessThan(1); expect(Math.abs(kb.width-qb.width)).toBeLessThan(1);
    const dir=await page.evaluate(()=>getComputedStyle(document.documentElement).direction);
    if (dir==='rtl') expect(tb.x).toBeGreaterThan(qb.x); else expect(tb.x).toBeLessThan(qb.x);
    expect(Math.abs(tb.x-mb.x)).toBeLessThan(1);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    for (const m of [t,q]) expect(await m.locator('.lv-t, small').evaluateAll(es=>es.every(e=>e.scrollWidth<=e.clientWidth+1))).toBe(true);
  });
}
test('live cards navigate: Quran Live → #/recite, Qaida Live → #/qaida*', async ({ page }) => {
  await page.goto('/#/'); await page.locator('#homeTutor').click(); await expect(page).toHaveURL(/#\/recite/);
  await page.goto('/#/'); await page.locator('#homeQaida').click(); await expect(page).toHaveURL(/#\/qaida/);
});
test('iPad viewport: live cards match feature cards, no overflow', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 }); await page.goto('/#/');
  const a=await page.locator('#homeTutor').boundingBox(), m=await page.locator('#homeBig .feat-mosques').boundingBox();
  expect(Math.abs(a.width-m.width)).toBeLessThan(1); expect(Math.abs(a.height-m.height)).toBeLessThan(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
