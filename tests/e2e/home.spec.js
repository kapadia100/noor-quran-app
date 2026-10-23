import {test,expect} from '@playwright/test';
let errors=[];
test.beforeEach(async({page})=>{errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&!/net::|Failed to load resource|tile\.openstreetmap/.test(m.text()))errors.push(m.text())});
 await page.route('https://gc.zgo.at/count.js',r=>r.fulfill({contentType:'text/javascript',body:'window.goatcounter.count=function(o){(window.__gcStub=window.__gcStub||[]).push(o)}'}));
 await page.route('**/quransafar.goatcounter.com/**',r=>r.fulfill({status:204}))});
test.afterEach(async({page})=>{expect(errors).toEqual([]);const ov=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);expect(ov).toBeLessThanOrEqual(1)});
const init=(page,o={},lr)=>page.addInitScript(([o,lr])=>{if(!sessionStorage.getItem('qsS')){sessionStorage.setItem('qsS','1');localStorage.setItem('instBanner','1');localStorage.setItem('settings',JSON.stringify(o));if(lr)localStorage.setItem('lastRead',JSON.stringify(lr))}},[o,lr]);
const box=(page,s)=>page.locator(s).first().boundingBox();

test('home v2.9.3: search, then compact prayer card first, then Quran, Recite & Learn and Qaida Live side by side in one row, Daily stories lower',async({page})=>{
 await init(page,{dark:false},{s:2,a:1,name:'Al-Baqara'});await page.goto('./');await expect(page.locator('.pcard')).toBeVisible();
 const [sb,pc,q,t,dh,st]=await Promise.all(['.srow','.pcard','#homeQuran','#homeTutor','.dhead','#daily'].map(s=>box(page,s)));
 expect(sb.y).toBeLessThan(pc.y);expect(pc.y+pc.height).toBeLessThanOrEqual(q.y+1);expect(pc.height).toBeLessThan(170); // compact
 // equal columns, same top, same size
 expect(Math.abs(q.width-t.width)).toBeLessThanOrEqual(1);expect(Math.abs(q.height-t.height)).toBeLessThanOrEqual(1);expect(Math.abs(q.y-t.y)).toBeLessThanOrEqual(1);expect(q.x).toBeLessThan(t.x);
 expect(q.height).toBeGreaterThan(100); // compact but still a card, not the old strip
 // stories are out of the header/hero and live in the Daily section below the cards
 expect(await page.locator('.hero .stories, .hero .story').count()).toBe(0);expect(st.y).toBeGreaterThan(t.y+t.height);expect(dh.y).toBeLessThan(st.y);
 await expect(page.locator('#daily .story')).toHaveCount(5);
 // continue-reading bar is folded into the Quran card
 expect(await page.locator('.cont').count()).toBe(0);await expect(page.locator('#homeQuran')).toContainText('Continue 2:1');await expect(page.locator('#homeQuran')).toHaveAttribute('href','#/surah/2/1');
 // bottom navigation is still there
 await expect(page.locator('nav button')).toHaveCount(5);await expect(page.locator('nav')).toBeVisible();
 await page.click('#homeQuran');await expect(page).toHaveURL(/#\/surah\/2\/1/)});
test('home v2.9.3: Quran card without history opens the Quran list; tutor card opens the picker',async({page})=>{
 await init(page,{dark:false});await page.goto('./');await expect(page.locator('#homeQuran')).toContainText('114 surahs');await expect(page.locator('#homeQuran')).toHaveAttribute('href','#/quran');
 await page.click('#homeTutor');await expect(page).toHaveURL(/#\/recite$/)});
test('home v2.9.3: Urdu + dark keeps order, equal cards and no overflow',async({page})=>{
 await init(page,{ui:'ur',dark:true},{s:2,a:1,name:'البقرة'});await page.goto('./');await expect(page.locator('.pcard')).toBeVisible();
 const [pc,q,t]=await Promise.all(['.pcard','#homeQuran','#homeTutor'].map(s=>box(page,s)));const vw=page.viewportSize().width;
 expect(pc.height).toBeLessThan(170);expect(Math.abs(q.height-t.height)).toBeLessThanOrEqual(1);expect(Math.abs(q.width-t.width)).toBeLessThanOrEqual(1);
 expect(q.x).toBeGreaterThan(t.x); // RTL: Quran on the right
 expect(q.x+q.width).toBeLessThanOrEqual(vw+1);expect(t.x).toBeGreaterThanOrEqual(-1);await expect(page.locator('#daily .story')).toHaveCount(5)});
test('home v2.9.3: weak-word review card (when due) sits under the two cards',async({page})=>{
 await init(page);await page.goto('./');await expect(page.locator('#homeReview')).toHaveCount(0);
 await page.evaluate(()=>localStorage.setItem('qsWeak',JSON.stringify({'1:2:1':{key:'1:2:1',sn:1,a:2,k:1,t:'x',nw:'x',tr:'x',m:'x',au:'https://x.test/a.mp3',ph:[],pi:0,cn:[5,3],ci:0,miss:2,box:0,due:Date.now()-1000,last:Date.now()}})));
 await page.reload();await expect(page.locator('#homeReview')).toBeVisible();const [t,r]=await Promise.all(['#homeTutor','#homeReview'].map(s=>box(page,s)));expect(r.y).toBeGreaterThan(t.y+t.height-1)});

for(const [ui,dark] of [['en',false],['ur',true],['en',true]])
test('home v3.2: Quran first, then Recite & Learn, then Qaida Live in one row; Qaida opens the lesson list; no overflow '+ui+(dark?' dark':''),async({page})=>{
 {
  await init(page,{ui,dark},{s:2,a:1,name:'Al-Baqara'});await page.goto('./');await expect(page.locator('#homeQaida')).toBeVisible();
  const [q,t,a]=await Promise.all(['#homeQuran','#homeTutor','#homeQaida'].map(s=>box(page,s)));const vw=page.viewportSize().width;
  expect(Math.abs(q.y-t.y)).toBeLessThanOrEqual(1);expect(Math.abs(q.y-a.y)).toBeLessThanOrEqual(1);expect(Math.abs(q.width-a.width)).toBeLessThanOrEqual(1);expect(Math.abs(q.height-a.height)).toBeLessThanOrEqual(1);
  const xs=[q.x,t.x,a.x];if(ui==='ur'){expect(q.x).toBeGreaterThan(t.x);expect(t.x).toBeGreaterThan(a.x)}else{expect(q.x).toBeLessThan(t.x);expect(t.x).toBeLessThan(a.x)}
  for(const b of [q,t,a]){expect(b.x).toBeGreaterThanOrEqual(-1);expect(b.x+b.width).toBeLessThanOrEqual(vw+1)}expect(xs.length).toBe(3);
  await expect(page.locator('#homeQaida .hc-live')).toBeVisible();await expect(page.locator('#homeTutor .hc-live')).toBeVisible();
  await expect(page.locator('#homeQaida')).toHaveAttribute('href','#/qaida');
  const ov=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);expect(ov).toBeLessThanOrEqual(1)}
 await page.click('#homeQaida');await expect(page).toHaveURL(/#\/qaida$/);await expect(page.locator('.q-row')).toHaveCount(9)});
