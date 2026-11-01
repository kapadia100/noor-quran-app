import {test,expect} from '@playwright/test';
let errors=[];
test.beforeEach(async({page})=>{errors=[];page.on('pageerror',e=>errors.push(String(e)))});
test.afterEach(()=>expect(errors).toEqual([]));
const vis=page=>expect(page.locator('#player')).toBeVisible();
test('player survives navigation: other surah, back/forward, tabs; buttons render on return',async({page})=>{
 await page.goto('./#/surah/1');await page.waitForSelector('.ayah');await page.evaluate(()=>window.__audio.muted=true);
 await page.click('[data-play="2"]');await expect(page.locator('#pInfo')).toContainText('1:3');await vis(page);
 await page.evaluate(()=>location.hash='#/surah/2');await page.waitForSelector('#a5');await vis(page);
 await page.goBack();await page.waitForSelector('#a7');await vis(page);await expect(page.locator('#pInfo')).toContainText('1:');
 await page.goForward();await page.waitForSelector('#a5');await vis(page);
 for(const h of ['#/','#/hadith','#/prayer','#/more','#/recite','#/qaida','#/ruqyah','#/janazah','#/haudio','#/surah/1']){await page.evaluate(x=>location.hash=x,h);await page.waitForTimeout(400);await vis(page)}
 await page.waitForSelector('#a7');await expect(page.locator('#playAll')).toBeVisible();await expect(page.locator('[data-play="0"]')).toBeVisible();
 // paused: still there after navigation
 await page.click('#pPlay');await expect.poll(()=>page.evaluate(()=>window.__audio.paused)).toBe(true);
 await page.evaluate(()=>location.hash='#/surah/3');await page.waitForSelector('.ayah');await vis(page);await page.goBack();await page.waitForSelector('#a7');await vis(page);
 await page.click('#pPlay');await expect.poll(()=>page.evaluate(()=>window.__audio.paused)).toBe(false);
});
// Root cause repro: on iOS WebKit no focusout fires when a focused field (translation picker, search box) is removed by navigation,
// so body.kb (keyboard open) stayed on and hid the player and the tabs on every page. Simulate the missing focusout.
test('keyboard-open state never survives navigation (player and tabs stay visible)',async({page})=>{
 await page.goto('./#/surah/2');await page.waitForSelector('.ayah');await page.evaluate(()=>window.__audio.muted=true);
 await page.click('#playAll');await expect(page.locator('#player')).toBeVisible();
 await page.focus('#trL');await page.evaluate(()=>{document.body.classList.add('kb');document.addEventListener('focusout',e=>e.stopImmediatePropagation(),true)});
 await expect(page.locator('#player')).toBeHidden();// keyboard really open: hidden is correct
 await page.evaluate(()=>location.hash='#/surah/3');await page.waitForSelector('.ayah');
 await expect(page.locator('#player')).toBeVisible();await expect(page.locator('nav')).toBeVisible();
 await page.goBack();await page.waitForSelector('#a5');await expect(page.locator('#player')).toBeVisible();await expect(page.locator('#playAll')).toBeVisible();
 expect(await page.evaluate(()=>window.__audio.paused)).toBe(false);
});
test('mic release on navigation never touches Quran playback',async({page})=>{
 await page.goto('./#/surah/1');await page.waitForSelector('.ayah');await page.evaluate(()=>window.__audio.muted=true);
 await page.click('[data-play="0"]');await expect(page.locator('#player')).toBeVisible();
 await page.evaluate(()=>{window.__mic?.releaseAll('nav');document.dispatchEvent(new Event('visibilitychange'))});
 await expect(page.locator('#player')).toBeVisible();expect(await page.evaluate(()=>window.__audio.paused)).toBe(false);
});
