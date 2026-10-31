import {test,expect} from '@playwright/test';
test('hadith reader: floating pager never covers the end of the hadith',async({page})=>{await page.addInitScript(()=>localStorage.setItem('instBanner','1'));
 await page.goto('./#/hadith/bukhari/n/1');await page.locator('.hd-pager').waitFor({timeout:30000});
 await page.evaluate(()=>{document.getElementById('app').scrollTo(0,1e6);scrollTo(0,1e6)});await page.waitForTimeout(600);
 const r=await page.evaluate(()=>({p:document.querySelector('.hd-pager').getBoundingClientRect().top,c:[...document.querySelectorAll('article.hd')].at(-1).getBoundingClientRect().bottom}));
 expect(r.c).toBeLessThanOrEqual(r.p)});
test('home header hides a zero-day streak',async({page})=>{await page.goto('./');await expect(page.locator('#streak')).toBeHidden()});
