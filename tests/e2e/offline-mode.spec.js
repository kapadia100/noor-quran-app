import {test,expect} from '@playwright/test';
test('offline mode switches on by itself and search explains instead of spinning',async({page,context})=>{
 await page.route('https://gc.zgo.at/count.js',r=>r.fulfill({contentType:'text/javascript',body:'window.goatcounter={};window.goatcounter.count=function(){}'}));
 await page.route('**/quransafar.goatcounter.com/**',r=>r.fulfill({status:204}));
 await page.goto('./#/search');await expect(page.locator('#q')).toBeVisible();
 await expect(page.locator('#netPill')).toBeHidden();
 await context.setOffline(true);
 await page.evaluate(()=>dispatchEvent(new Event('offline')));
 await expect(page.locator('#netPill')).toBeVisible();
 await expect(page.locator('#netPill')).toHaveText('Offline');
 await page.fill('#q','patience');await page.press('#q','Enter');
 await expect(page.locator('#offNote')).toContainText('Search needs the internet');
 await expect(page.locator('#sr')).not.toContainText('Loading');
 await context.setOffline(false);
 await page.evaluate(()=>dispatchEvent(new Event('online')));
 await expect(page.locator('#netPill')).toBeHidden()});
