import {test,expect} from '@playwright/test';
test('hadith: book → hadith → back steps back one level each',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('instBanner','1'));
 await page.goto('./#/hadith');await page.goto('./#/hadith/bukhari');await page.locator('article.hd, a[href*="#/hadith/bukhari/"]').first().waitFor({timeout:30000});
 await page.goto('./#/hadith/bukhari/1');await page.locator('article.hd').first().waitFor({timeout:30000});
 await page.goBack();await expect(page).toHaveURL(/#\/hadith\/bukhari$/);
 await page.goBack();await expect(page).toHaveURL(/#\/hadith$/);
 const back=page.locator('#back, .back, [aria-label=Back]').first();
 await page.goto('./#/hadith/bukhari/1');await page.locator('article.hd').first().waitFor({timeout:30000});
 if(await back.isVisible()){await back.click();await expect(page).not.toHaveURL(/bukhari\/1$/)}});
