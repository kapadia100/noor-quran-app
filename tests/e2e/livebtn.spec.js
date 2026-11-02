import { test, expect } from '@playwright/test';
// v91 (t243u): Option C medallions for Quran Live / Qaida Live
for (const lang of ['en','ur']) for (const theme of ['light','dark']) {
  test(`home medallions ${lang} ${theme}: equal round, >=44px, labelled, RTL order, no overflow`, async ({ page }) => {
    await page.addInitScript(([l,t])=>{localStorage.setItem('settings',JSON.stringify({ui:l,dark:t==='dark'}));}, [lang,theme]);
    await page.goto('/#/');
    const t=page.locator('#homeTutor'), q=page.locator('#homeQaida');
    await expect(t.locator('.md-ar')).toHaveText('القرآن'); await expect(q.locator('.md-ar')).toHaveText('القاعدة');
    await expect(t.locator('.md-ar')).toHaveAttribute('lang','ar');
    for (const m of [t,q]) { const lb=await m.locator('.hc-live').boundingBox(), mb=await m.locator('.md').boundingBox(); expect(lb.height).toBeLessThan(22); expect(lb.width).toBeLessThan(mb.width*0.7); expect(lb.y).toBeGreaterThan(mb.y+mb.height*0.75); }
    await expect(t.locator('.hc-live')).toBeVisible(); await expect(q.locator('.hc-live')).toBeVisible();
    expect((await t.getAttribute('aria-label')).length).toBeGreaterThan(8);
    expect((await q.getAttribute('aria-label')).length).toBeGreaterThan(8);
    const tm=await t.locator('.md').boundingBox(), qm=await q.locator('.md').boundingBox(), tb=await t.boundingBox(), qb=await q.boundingBox();
    expect(Math.abs(tm.width-tm.height)).toBeLessThan(1.5); expect(Math.abs(tm.width-qm.width)).toBeLessThan(1); expect(Math.abs(tm.y-qm.y)).toBeLessThan(1);
    for (const b of [tb,qb]) { expect(b.width).toBeGreaterThanOrEqual(44); expect(b.height).toBeGreaterThanOrEqual(44); }
    const dir=await page.evaluate(()=>getComputedStyle(document.documentElement).direction);
    if (dir==='rtl') expect(tb.x).toBeGreaterThan(qb.x); else expect(tb.x).toBeLessThan(qb.x);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    const r=await t.locator('.md').evaluate(e=>getComputedStyle(e).borderRadius); expect(r).toContain('50%');
  });
}
test('medallions navigate: Quran Live → #/recite, Qaida Live → #/qaida*', async ({ page }) => {
  await page.goto('/#/'); await page.locator('#homeTutor').click(); await expect(page).toHaveURL(/#\/recite/);
  await page.goto('/#/'); await page.locator('#homeQaida').click(); await expect(page).toHaveURL(/#\/qaida/);
});
test('iPad viewport: medallions centred, no overflow', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 }); await page.goto('/#/');
  const a=await page.locator('#homeTutor .md').boundingBox(), b=await page.locator('#homeQaida .md').boundingBox();
  expect(a.width).toBeGreaterThanOrEqual(120); expect(Math.abs((a.x+b.x+b.width)/2-410)).toBeLessThan(30);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
