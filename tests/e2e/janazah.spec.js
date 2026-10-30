import {test,expect} from '@playwright/test';
test('v3.7.11 Namaz-e-Janazah: Home card opens the page with 4 takbeers and the adult/boy/girl duas (Arabic, Urdu, English)',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('instBanner','1'));await page.goto('./');
 await expect(page.locator('#homeBig a[href="#/mushaf"]')).toHaveCount(0);await page.click('#homeBig a[href="#/janazah"]');await expect(page).toHaveURL(/#\/janazah/);
 await expect(page.locator('.jz-step')).toHaveCount(4);await expect(page.locator('.jz-dua')).toHaveCount(3);
 await expect(page.locator('#jzD0 .jz-ar')).toContainText('اغْفِرْ لِحَيِّنَا وَمَيِّتِنَا');await expect(page.locator('#jzD1 .jz-ar')).toContainText('اجْعَلْهُ لَنَا فَرَطًا');await expect(page.locator('#jzD2 .jz-ar')).toContainText('شَافِعَةً وَّمُشَفَّعَةً');
 for(const i of [0,1,2]){await expect(page.locator(`#jzD${i} .jz-ur`)).not.toBeEmpty();await expect(page.locator(`#jzD${i} .jz-en`)).not.toBeEmpty()}});
test('v3.7.11 Mosque Finder name on the Home card and page heading; Mushaf still in More',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('instBanner','1'));await page.goto('./');await expect(page.locator('#homeBig a[href="#/mosques"] b')).toHaveText('Mosque Finder');await expect(page.locator('#homeBig a[href="#/qibla"] b')).toHaveText('Qibla Finder');await page.goto('./#/qibla');await expect(page.locator('#title')).toHaveText('Qibla Finder');await page.goto('./#/more');await expect(page.locator('a[href="#/qibla"]').filter({hasText:'Qibla Finder'}).first()).toBeVisible();await page.goto('./');
 await page.goto('./#/more');await page.reload();await expect(page.locator('a[href="#/mushaf"]').first()).toBeAttached({timeout:10000});
 await page.goto('./#/mosques');await expect(page.locator('#title')).toContainText('Mosque Finder')});
test('v3.7.11 header: big live countdown on the same line as the next prayer time, clear of the arch, on a 360px phone',async({page})=>{
 await page.setViewportSize({width:360,height:740});await page.addInitScript(()=>localStorage.setItem('instBanner','1'));await page.goto('./');
 const cd=page.locator('.pc-nx .cd');await expect(cd).toHaveText(/\d+:\d\d:\d\d/);const t0=await cd.textContent();
 const [b,at,c,arch]=await Promise.all(['.pc-nx b','.pc-at','.pc-nx .cd','.pc-arch'].map(s=>page.locator(s).boundingBox()));
 expect(c.height).toBeGreaterThan(at.height);expect(Math.abs((c.y+c.height)-(at.y+at.height))).toBeLessThan(12);expect(c.x).toBeGreaterThan(at.x+at.width);
 expect(c.x+c.width).toBeLessThanOrEqual(arch.x+2);expect(b.height).toBeLessThan(50);
 await page.waitForTimeout(1300);expect(await cd.textContent()).not.toBe(t0)});
