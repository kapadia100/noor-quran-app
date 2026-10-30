import {test,expect} from '@playwright/test';
test('6 Kalimas card on Home opens all six with Arabic, Urdu, English; no Play; tracker still in More',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('instBanner','1'));await page.goto('./');
 await expect(page.locator('#homeBig a[href="#/tracker"]')).toHaveCount(0);await page.click('#homeBig a[href="#/kalimas"]');
 await expect(page.locator('.kl-k')).toHaveCount(6);await expect(page.locator('#kl0 .kl-ar')).toContainText('مُحَمَّدٌ رَّسُوْلُ اللّٰهِ');await expect(page.locator('#kl5 .kl-ar')).toContainText('وَالْبُهْتَانِ');
 for(let i=0;i<6;i++){await expect(page.locator(`#kl${i} .kl-ur`)).not.toBeEmpty();await expect(page.locator(`#kl${i} .kl-en`)).not.toBeEmpty()}
 await expect(page.locator('.kl button')).toHaveCount(0);await page.goto('./#/more');await expect(page.locator('a[href="#/tracker"]').first()).toBeAttached()});
test('Tasbeeh: tap anywhere counts, buttons do not, focus mode counts and exits',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('instBanner','1'));await page.goto('./#/tasbeeh');await page.click('[data-tg="33"]');await page.click('#tReset');
 await page.click('#tap');await page.click('.tb-hint');await page.click('#tbz h2');await expect(page.locator('#cnt')).toHaveText('3');
 await page.click('#tSnd');await page.click('#tSnd');await expect(page.locator('#cnt')).toHaveText('3');
 await page.click('#tFocus');await expect(page.locator('#tbF')).toBeVisible();for(let i=0;i<4;i++)await page.mouse.click(200,400);
 await expect(page.locator('#cntF')).toHaveText('7');await page.click('#tbX');await expect(page.locator('#tbF')).toBeHidden();await expect(page.locator('#cnt')).toHaveText('7');
 const sel=await page.locator('.tb').evaluate(e=>getComputedStyle(e).userSelect||getComputedStyle(e).webkitUserSelect);expect(sel).toBe('none')});
