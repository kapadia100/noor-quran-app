import {test,expect} from '@playwright/test';
test('Kalmas card on Home opens all six with Arabic, Urdu, English; no Play; tracker still in More',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('instBanner','1'));await page.goto('./');
 await expect(page.locator('#homeBig a[href="#/tracker"]')).toHaveCount(0);await expect(page.locator('#homeBig a[href="#/kalimas"] b')).toHaveText('Kalmas');await page.click('#homeBig a[href="#/kalimas"]');await expect(page.locator('#title')).toHaveText('Kalmas');
 await expect(page.locator('.kl-k')).toHaveCount(6);await expect(page.locator('#kl0 .tv-ar')).toContainText('مُحَمَّدٌ رَّسُوْلُ اللّٰهِ');await expect(page.locator('#kl5 .tv-ar')).toContainText('وَالْبُهْتَانِ');
 for(let i=0;i<6;i++){await expect(page.locator(`#kl${i} .tv-ur`)).not.toBeEmpty();await expect(page.locator(`#kl${i} .tv-en`)).not.toBeEmpty()}
 await expect(page.locator('.kl .kl-k button')).toHaveCount(0);await page.goto('./#/more');await expect(page.locator('a[href="#/tracker"]').first()).toBeAttached()});
test('Tasbeeh: tap anywhere counts, buttons do not, focus mode counts and exits',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('instBanner','1'));await page.goto('./#/tasbeeh');await page.click('[data-tg="33"]');await page.click('#tReset');
 await page.click('#tap');await page.click('.tb-hint');await page.click('#tbz h2');await expect(page.locator('#cnt')).toHaveText('3');
 await page.click('#tSnd');await page.click('#tSnd');await expect(page.locator('#cnt')).toHaveText('3');
 await page.click('#tFocus');await expect(page.locator('#tbF')).toBeVisible();for(let i=0;i<4;i++)await page.mouse.click(200,400);
 await expect(page.locator('#cntF')).toHaveText('7');await page.click('#tbX');await expect(page.locator('#tbF')).toBeHidden();await expect(page.locator('#cnt')).toHaveText('7');
 const sel=await page.locator('.tb').evaluate(e=>getComputedStyle(e).userSelect||getComputedStyle(e).webkitUserSelect);expect(sel).toBe('none')});
test('Kalmas text controls: Roman shown, toggles hide Urdu/English, A+ enlarges Arabic and persists',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('instBanner','1'));await page.goto('./#/kalimas');
 await expect(page.locator('#title')).toHaveText('Kalmas');await expect(page.locator('#kl0 .tv-tr')).toContainText('Lā ilāha illallāhu');await expect(page.locator('#kl0 .tv-n')).toHaveText('1');
 const s0=await page.locator('#kl0 .tv-ar').evaluate(e=>parseFloat(getComputedStyle(e).fontSize));await page.click('.tv-sz[data-sz="1"]');
 const s1=await page.locator('#kl0 .tv-ar').evaluate(e=>parseFloat(getComputedStyle(e).fontSize));expect(s1).toBeGreaterThan(s0);
 await page.click('[data-tv="ur"]');await expect(page.locator('#kl0 .tv-ur')).toBeHidden();await page.click('[data-tv="en"]');await expect(page.locator('#kl0 .tv-en')).toBeHidden();
 await page.reload();await expect(page.locator('#kl0 .tv-ur')).toBeHidden();await expect(page.locator('#kl0 .tv-tr')).toBeVisible();
 await page.goto('./#/janazah');await expect(page.locator('#jzD0 .tv-tr')).toContainText('Allāhummaghfir');await expect(page.locator('#jzD0 .tv-en')).toBeHidden()});
