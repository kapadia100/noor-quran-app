import{test,expect}from'@playwright/test';
test('Duas chooser: existing section intact + In the Light of Hadith section',async({page})=>{
 await page.goto('./#/duas');const b=page.locator('.dz-pick .dz-b');await expect(b).toHaveCount(2);
 await expect(b.nth(0)).toContainText('Duas & Azkar');await expect(b.nth(1)).toContainText('In the Light of Hadith');
 await expect(page.locator('.dz-b.on')).toContainText('Duas & Azkar');await expect(page.locator('.tabs, [role=tablist]').first()).toBeVisible();
 await b.nth(1).click();await expect(page).toHaveURL(/#\/duas\/hadith/);await expect(page.locator('#title')).toHaveText('In the Light of Hadith');
 await expect(page.locator('.az-i')).toHaveCount(25);
 const t=await page.locator('main').innerText();for(const x of['AhleSunnatPak','LS 69','@','نوجوانان','اکیڈمی'])expect(t).not.toContain(x);
 await page.locator('.dz-b').first().click();await expect(page).toHaveURL(/#\/duas$/);await expect(page.locator('.az-i')).toHaveCount(0)});
