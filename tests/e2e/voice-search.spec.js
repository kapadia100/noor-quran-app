import { test, expect } from '@playwright/test';
// v96 (t257u): the top-bar mic is Voice Search. A fake SpeechRecognition replays queued phrases.
const fake=(say)=>{window.__say=say.slice();window.__ab=0;window.__langs=[];
 class R{start(){window.__langs.push(this.lang);const t=window.__say.shift()||'';setTimeout(()=>{this.onresult?.({results:[Object.assign([{transcript:t}],{isFinal:true})]});this.onend?.()},60)}stop(){this.onend?.()}abort(){window.__ab++}}
 window.webkitSpeechRecognition=window.SpeechRecognition=R;};
const set=(page,ui='en',dark=true)=>page.addInitScript(([u,d])=>localStorage.setItem('settings',JSON.stringify({ui:u,dark:d})),[ui,dark]);

test('mic → speak → ask by voice → Quran results with dictionary card, mic released',async({page})=>{
 await set(page);await page.addInitScript(fake,['رحمن','quran']);await page.goto('/#/');
 await expect(page.locator('#tutor')).toHaveAttribute('aria-label','Voice search');
 await page.click('#tutor');await expect(page.locator('#vsOv')).toBeVisible();
 await page.click('.vs-chip[data-l=ar]');await page.click('#vsMic');
 /* heard → panel asks Quran/Hadith and listens for the answer automatically */
 await expect(page).toHaveURL(/#\/vq\/ar\/%D8%B1%D8%AD%D9%85%D9%86$/);await expect(page.locator('#vsOv')).toHaveCount(0);
 await expect(page.locator('.vs-hit').first()).toBeVisible({timeout:20000});
 await expect(page.locator('.vs-dict')).toBeVisible();
 expect(await page.evaluate(()=>window.__langs)).toEqual(['ar-SA','ur-PK']);expect(await page.evaluate(()=>window.__ab)).toBe(2);
 await page.locator('.vs-hit').first().click();await expect(page).toHaveURL(/#\/surah\/\d+/);});

test('Urdu: typed word → Quran results from the Urdu translation',async({page})=>{
 await set(page,'ur');await page.goto('/#/');await page.click('#tutor');
 await expect(page.locator('#vsAsk p')).toHaveText('قرآن میں تلاش کریں یا حدیث میں؟');
 await page.fill('#vsQ','رحمت');await page.click('#vsQuran');
 await expect(page.locator('.vs-hit').first()).toBeVisible({timeout:20000});
 expect(await page.locator('.vs-hit .ar').first().getAttribute('lang')).toBe('ar');});

test('Hadith choice opens hadith search with the spoken word',async({page})=>{
 await set(page);await page.addInitScript(fake,['prayer']);await page.goto('/#/');await page.click('#tutor');
 await page.click('.vs-chip[data-l=en]');await page.click('#vsMic');await expect(page.locator('#vsQ')).toHaveValue('prayer');
 await page.click('#vsHadith');await expect(page).toHaveURL(/#\/hsearch\/bukhari\/prayer\/en$/);});

test('no SpeechRecognition: typing fallback, close releases',async({page})=>{
 await set(page,'en',false);await page.addInitScript(()=>{delete window.webkitSpeechRecognition;delete window.SpeechRecognition});
 await page.goto('/#/');await page.click('#tutor');await expect(page.locator('#vsSt')).toContainText('not available');
 await expect(page.locator('#vsSay')).toBeHidden();await page.click('#vsClose');await expect(page.locator('#vsOv')).toHaveCount(0);});

test('navigation aborts a live recognizer',async({page})=>{
 await set(page);await page.addInitScript(()=>{window.__ab=0;class R{start(){}stop(){}abort(){window.__ab++}}window.webkitSpeechRecognition=window.SpeechRecognition=R});
 await page.goto('/#/');await page.click('#tutor');await page.click('#vsMic');await page.evaluate(()=>{location.hash='#/more'});
 await expect(page.locator('#vsOv')).toHaveCount(0);expect(await page.evaluate(()=>window.__ab)).toBeGreaterThan(0);});
