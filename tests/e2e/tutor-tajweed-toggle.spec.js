import {test,expect} from '@playwright/test';
// v83: tutor "Tajweed colours" and the reader's tile are one setting (qsTjR); turning it off in the tutor turns it off everywhere and persists.
test('tutor tajweed toggle turns colours off/on in the tutor line, legend and reader, persists, and syncs with the reader tile',async({page})=>{
 await page.addInitScript(()=>{localStorage.setItem('instBanner','1');if(!sessionStorage.qsSeed){localStorage.setItem('qsTjR','1');localStorage.setItem('qsTj','1');sessionStorage.qsSeed=1}});
 await page.goto('./#/surah/2');await expect(page.locator('#ays .tj').first()).toBeVisible({timeout:15000});await expect(page.locator('#tjT')).toHaveAttribute('aria-pressed','true');
 await page.click('#recT');await expect(page.locator('.rc-w .tj').first()).toBeVisible({timeout:20000});
 await page.click('#rcOptB');await page.click('#oTj');
 await expect(page.locator('#rcLine .tj')).toHaveCount(0);await expect(page.locator('#ays .tj')).toHaveCount(0);await expect(page.locator('#rcTjk')).toBeHidden();
 await expect(page.locator('#oTj')).not.toHaveClass(/\bon\b/);await expect(page.locator('#tjT')).toHaveAttribute('aria-pressed','false');
 expect(await page.evaluate(()=>[localStorage.qsTjR,localStorage.qsTj])).toEqual(['0',undefined]);
 await page.reload();await page.click('#recT');await page.waitForTimeout(2500);await expect(page.locator('#rcLine .tj')).toHaveCount(0);await expect(page.locator('#ays .tj')).toHaveCount(0);
 await page.click('#rcOptB');await page.click('#oTj');await expect(page.locator('#rcLine .tj').first()).toBeVisible({timeout:15000});await expect(page.locator('#tjT')).toHaveAttribute('aria-pressed','true')});
