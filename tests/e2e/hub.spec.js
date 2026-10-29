import {test,expect} from '@playwright/test';
let errors=[];
test.beforeEach(async({page})=>{errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&!/net::|Failed to load resource|tile\.openstreetmap/.test(m.text()))errors.push(m.text())});
 await page.route('https://gc.zgo.at/count.js',r=>r.fulfill({contentType:'text/javascript',body:'window.goatcounter.count=function(o){(window.__gcStub=window.__gcStub||[]).push(o)}'}));
 await page.route('**/quransafar.goatcounter.com/**',r=>r.fulfill({status:204}));
 await page.addInitScript(()=>{window.__reciteFake=true;if(!sessionStorage.getItem('qsInit')){sessionStorage.setItem('qsInit','1');localStorage.setItem('instBanner','1')}})});
test.afterEach(async({page})=>{expect(errors).toEqual([]);const ov=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);expect(ov).toBeLessThanOrEqual(1)});
const weak=()=>({'1:2:1':{key:'1:2:1',sn:1,a:2,k:1,t:'ٱلْحَمْدُ',nw:'الحمد',tr:'al-hamdu',m:'praise',au:'https://x.test/a.mp3',ph:[],pi:0,cn:[5,3],ci:0,miss:2,box:0,due:Date.now()-1000,last:Date.now()}});

test('more: Recite & Learn hub lists every tutor feature at the top',async({page})=>{
 await page.goto('./#/more');await page.click('#moreRecite > summary');const hub=page.locator('#moreRecite');await expect(hub).toBeVisible();
 await expect(hub.locator('.mrc-h b').first()).toHaveText('Recite & Learn');
 await expect(page.locator('#mrcPick')).toHaveAttribute('href','#/recite');
 await expect(page.locator('#mrcReview')).toHaveAttribute('href','#/recite/review');
 await expect(page.locator('#mrcDrill')).toBeDisabled();
 await expect(page.locator('#mrcHow')).toBeVisible();await expect(page.locator('#mdlSt')).toHaveText(/Not downloaded/);
 const hubTop=(await hub.boundingBox()).y,gridTop=(await page.locator('.dsec .mlist, .dsec .fgrid, .dsec .cgrid').first().boundingBox()).y;expect(hubTop).toBeLessThan(gridTop);
 // header icon + Home card still exist
 await expect(page.locator('#tutor')).toBeVisible();
 await page.click('#mrcPick');await expect(page.locator('h1,.pagetitle,#ptitle').first()).toBeVisible();expect(page.url()).toContain('#/recite');
});
test('more: how-it-works explainer opens and links to the FAQ',async({page})=>{
 await page.goto('./#/more');await page.click('#moreRecite > summary');await page.click('#mrcHow summary');
 await expect(page.locator('#mrcHow')).toContainText('Stuck help');await expect(page.locator('#mrcHow')).toContainText('Pronunciation drill');
 await page.click('#mrcHow a[href="#/help"]');expect(page.url()).toContain('#/help')});
test('more: weak words count, review link, clear weak list needs a second tap',async({page})=>{
 await page.addInitScript(w=>{if(!localStorage.qsWeak)localStorage.setItem('qsWeak',JSON.stringify(w))},weak());
 await page.goto('./#/more');await page.click('#moreRecite > summary');
 await expect(page.locator('#mrcReview')).toContainText('1 saved');await expect(page.locator('#weakN')).toHaveText('1');await expect(page.locator('#mrcDrill')).toBeEnabled();
 await page.click('#weakClr');await expect(page.locator('#weakClr')).toContainText(/again/i);expect(await page.evaluate(()=>!!localStorage.qsWeak)).toBe(true);
 await page.click('#weakClr');await expect(page.locator('#weakN')).toHaveText('0');expect(await page.evaluate(()=>localStorage.qsWeak||null)).toBeNull();
 await expect(page.locator('#mrcDrill')).toBeDisabled()});
test('more: practice drill starts straight from the More tab',async({page})=>{
 await page.addInitScript(w=>{if(!localStorage.qsWeak)localStorage.setItem('qsWeak',JSON.stringify(w))},weak());
 await page.goto('./#/more');await page.click('#moreRecite > summary');await page.click('#mrcDrill');await expect(page.locator('#recite')).toBeVisible()});
test('more: model status shows downloaded and delete removes it after confirm',async({page})=>{
 await page.goto('./');await page.evaluate(async()=>{localStorage.setItem('qsCtc','1');const c=await caches.open('qs-asr-model');await c.put('/m.onnx',new Response('x'))});
 await page.goto('./#/more');await page.click('#moreRecite > summary');await expect(page.locator('#mdlSt')).toContainText('Downloaded');
 await page.click('#mdlDel');await expect(page.locator('#mdlDel')).toContainText(/again/i);expect(await page.evaluate(()=>caches.has('qs-asr-model'))).toBe(true);
 await page.click('#mdlDel');await expect(page.locator('#mdlSt')).toContainText('Not downloaded');
 expect(await page.evaluate(()=>caches.has('qs-asr-model'))).toBe(false);expect(await page.evaluate(()=>localStorage.qsCtc||null)).toBeNull()});
test('more: Bookmarks, Notes, Duas and FAQ are reachable from More',async({page})=>{
 await page.goto('./#/more');await page.click('#moreRecite > summary');
 for(const h of ['#/bookmarks','#/notes','#/duas','#/help'])await expect(page.locator(`:is(.fgrid,.cgrid,.mlist) a[href="${h}"]`).first()).toBeVisible();
 await page.click(':is(.fgrid,.cgrid,.mlist) a[href="#/bookmarks"]');expect(page.url()).toContain('#/bookmarks')});
test('more: Urdu + dark hub has no overflow and shows Urdu labels',async({page})=>{
 await page.addInitScript(()=>{if(!sessionStorage.getItem('qsS')){sessionStorage.setItem('qsS','1');localStorage.setItem('settings',JSON.stringify({ui:'ur',dark:true}))}});
 await page.goto('./#/more');await page.click('#moreRecite > summary');await expect(page.locator('#moreRecite')).toContainText('تلاوت اور سیکھیں');
 const r=await page.locator('#moreRecite').boundingBox();const vw=page.viewportSize().width;expect(r.x).toBeGreaterThanOrEqual(0);expect(r.x+r.width).toBeLessThanOrEqual(vw)});

test('home: quick-button row is gone; prayer card shows next prayer, countdown, 6 rows with one current',async({page})=>{
 await page.goto('./');await expect(page.locator('.pcard')).toBeVisible();
 await expect(page.locator('.quick')).toHaveCount(0);
 await expect(page.locator('.pcard .pc-nx b')).not.toBeEmpty();
 await expect(page.locator('.pcard .cd')).toHaveText(/^\d+:\d\d:\d\d$/);
 await expect(page.locator('.pcard .pc-i')).toHaveCount(6);await expect(page.locator('.pcard .pc-i.cur')).toHaveCount(1);await expect(page.locator('.pcard .pc-i.nx')).toHaveCount(1);
 await expect(page.locator('.pcard .pc-i svg')).toHaveCount(6);
 const r=await page.locator('.pcard').boundingBox();expect(r.x).toBeGreaterThanOrEqual(0);expect(r.x+r.width).toBeLessThanOrEqual(page.viewportSize().width);
 // no link row between the prayer card / stories and the search bar
 for(const h of ['#/notes','#/duas','#/help'])expect(await page.locator(`.hero a[href="${h}"]`).count()).toBe(0);
 expect(await page.locator('.hero a[href="#/bookmarks"]').count()).toBe(1); // only the heart button next to search
 await page.click('.pcard');expect(page.url()).toContain('#/prayer')});
test('home: prayer card in Urdu + dark stays inside the screen',async({page})=>{
 await page.addInitScript(()=>{if(!sessionStorage.getItem('qsS')){sessionStorage.setItem('qsS','1');localStorage.setItem('settings',JSON.stringify({ui:'ur',dark:true}))}});
 await page.goto('./');await expect(page.locator('.pcard')).toContainText('اگلی نماز');
 const cells=await page.locator('.pcard .pc-i').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return [r.left,r.right]}));
 const vw=page.viewportSize().width;for(const [l,r] of cells){expect(l).toBeGreaterThanOrEqual(0);expect(r).toBeLessThanOrEqual(vw)}
 expect(cells[0][0]).toBeGreaterThan(cells[5][0])});
