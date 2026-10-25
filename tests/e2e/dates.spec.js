import {test,expect} from '@playwright/test';
// v3.6.2: the date shown must be today's exact device date (Android WebView showed "14-14, 48 BC").
const T0=new Date('2026-10-24T10:00:00+05:00');
const BADINTL=()=>{const R=Intl.DateTimeFormat;const fake=function(l,o){const real=new R(l,o);const isH=/islamic/.test(String(l));return {resolvedOptions:()=>isH?{calendar:'islamic-umalqura'}:real.resolvedOptions(),
 formatToParts:d=>isH?[{type:'month',value:'14'},{type:'literal',value:'-'},{type:'day',value:'14'},{type:'literal',value:', '},{type:'year',value:'48'},{type:'literal',value:' '},{type:'era',value:'BC'}]:real.formatToParts(d),
 format:d=>isH?'14-14, 48 BC':real.format(d)}};fake.supportedLocalesOf=R.supportedLocalesOf;Intl.DateTimeFormat=fake};
const hij=p=>p.locator('[data-hij]').first();const greg=p=>p.locator('[data-greg]').first();
const bodyText=p=>p.evaluate(()=>document.body.innerText);
test('home shows exact local Gregorian + valid Hijri, no BC',async({page})=>{
 await page.clock.install({time:T0});await page.goto('./');
 await expect(greg(page)).toHaveText('Sat, 24 Oct 2026');
 await expect(hij(page)).toHaveText('13 Jumada al-Ula 1448 AH');
 expect(await bodyText(page)).not.toMatch(/\bBC\b|\bAD\b|NaN|Invalid/);
});
test('broken Android Intl (BC era) falls back to a valid Hijri date',async({page})=>{
 await page.addInitScript(BADINTL);await page.clock.install({time:T0});await page.goto('./');
 await expect(greg(page)).toHaveText('Sat, 24 Oct 2026');
 await expect(hij(page)).toHaveText(/^1[34] Jumada al-Ula 1448 AH$/);
 expect(await bodyText(page)).not.toMatch(/\bBC\b|14-14|NaN|Invalid/);
 for(const h of ['#/calendar','#/ramadan','#/prayer','#/more']){await page.goto('./'+h);await page.waitForTimeout(400);expect(await bodyText(page),h).not.toMatch(/\bBC\b|14-14|NaN|Invalid Date/)}
});
test('updates at local midnight without reload',async({page})=>{
 await page.clock.install({time:new Date('2026-10-24T23:59:50+05:00')});await page.goto('./');
 await expect(greg(page)).toHaveText('Sat, 24 Oct 2026');
 const before=await hij(page).textContent();
 await page.clock.runFor(15000);
 await expect(greg(page)).toHaveText('Sun, 25 Oct 2026');
 await expect(hij(page)).toHaveText(/^1[345] Jumada al-Ula 1448 AH$/);
 expect(await hij(page).textContent()).not.toBe(before);
});
test('updates on app resume after a day passes',async({page})=>{
 await page.clock.install({time:T0});await page.goto('./');
 await expect(greg(page)).toHaveText('Sat, 24 Oct 2026');
 await page.clock.setFixedTime(new Date('2026-10-27T08:00:00+05:00'));
 await page.evaluate(()=>{dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'))});
 await expect(greg(page)).toHaveText('Tue, 27 Oct 2026');
});
test('calendar + prayer pages show the same exact date',async({page})=>{
 await page.clock.install({time:T0});await page.goto('./#/calendar');
 await expect(page.locator('.cd2.today,.cd2.on').first()).toContainText('24');
 await expect(page.locator('body')).toContainText('October 2026');
 await page.goto('./#/prayer');await expect(greg(page)).toHaveText('Saturday, 24 October 2026');
});
