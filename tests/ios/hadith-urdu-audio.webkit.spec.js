import {test,expect} from '@playwright/test';
// Real network: recorded Urdu file from the audio host plays on iPhone WebKit even with no Urdu device voice.
test('Bukhari 59 Urdu: speaker enabled and recorded audio actually plays, speed applies',async({page})=>{
 test.setTimeout(90000);
 await page.addInitScript(()=>{localStorage.setItem('instBanner','1');try{Object.defineProperty(speechSynthesis,'getVoices',{value:()=>[]})}catch{/* */}});
 await page.goto('./#/hadith/bukhari/n/59');const c=page.locator('article.hd').first();await c.waitFor({timeout:45000});
 await c.locator('[data-sl=urd]').click();const b=c.locator('[data-hl]');await expect(b).toBeEnabled({timeout:15000});
 await page.selectOption('#hlRate','1.2');await b.click();
 await expect(b).toHaveAttribute('data-st','playing',{timeout:40000});
 const t0=await page.evaluate(()=>window.__qsHA?.currentTime??-1);await page.waitForTimeout(2500);const t1=await page.evaluate(()=>window.__qsHA?.currentTime??-1);
 expect(t1).toBeGreaterThan(t0);expect(await page.evaluate(()=>window.__qsHA.playbackRate)).toBe(1.2);
 expect(await page.evaluate(()=>window.__qsHA.src)).toMatch(/bukhari\/59\.m4a$/)});
