import {test,expect} from '@playwright/test';
let errors=[];
test.beforeEach(async({page})=>{errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&!/net::|Failed to load resource|tile\.openstreetmap/.test(m.text()))errors.push(m.text())});
 await page.route('https://gc.zgo.at/count.js',r=>r.fulfill({contentType:'text/javascript',body:'window.goatcounter.count=function(){}'}));
 await page.route('**/quransafar.goatcounter.com/**',r=>r.fulfill({status:204}));
 await page.addInitScript(()=>{window.__reciteFake=true})});
test.afterEach(async({page})=>{expect(errors).toEqual([]);const ov=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);expect(ov).toBeLessThanOrEqual(1)});
const st=page=>page.evaluate(()=>{const s=window.__recite.raw();return {marks:s.T.marks,prov:s.T.prov,p:s.T.p,mode:s.mode,coach:s.coach&&{kind:s.coach.kind},hs:s.hs&&{list:s.hs.list.map(x=>x.kind)},hint:s.hint}});
const feed=(page,t)=>page.evaluate(t=>window.__recite.feed(t),t);
const start=async(page,{tr=false}={})=>{await page.goto('./#/hifztest/1');await expect(page.locator('.hz-s[data-s="1"]')).toBeVisible();if(tr){await page.click('.hz-gear summary');await page.check('#zTr')}await page.click('.hz-s[data-s="1"]');
 await expect(page.locator('#recite')).toBeVisible();await expect(page.locator('#recite .rc-t b')).toHaveText(/Hifz Test/);await expect.poll(()=>page.evaluate(()=>window.__recite.raw().listening)).toBe(true)};

test('Hifz Test has its own More tile and a Home card',async({page})=>{
 await page.goto('./#/more');await expect(page.locator('a[href="#/hifztest"]')).toBeVisible();
 await page.goto('./#/');await expect(page.locator('#app a#homeHifz[href="#/hifztest"]')).toHaveCount(1);
 await page.goto('./#/surah/1');await expect(page.locator('#toHzT')).toBeVisible()});

test('correct recitation reveals the words; nothing is shown before',async({page})=>{
 await start(page);
 await expect(page.locator('#rcLine .rc-w').first()).toHaveCSS('filter',/blur/);
 expect(await page.locator('#rcLine .rc-w.rc-hid').count()).toBe(29);expect(await page.locator('#rcLine .rc-an').count()).toBe(7);
 await feed(page,'بسم الله الرحمن الرحيم الحمد لله رب العالمين');
 const s=await st(page);for(let i=0;i<4;i++)expect(s.marks[i]).toBe('ok');
 await expect(page.locator('#rcFix')).toBeHidden();expect(s.hs.list).toEqual([])});

test('a wrong word shows the "Mistake here" card with the correct word, audio and retry; it is counted',async({page})=>{
 await start(page);
 await feed(page,'بسم الله الرحمن الرحيم الحمد لله رب العالمين الرحمن');await feed(page,'الرحمن كتاب مالك يوم الدين');
 await expect(page.locator('#rcFix')).toContainText('Mistake — listen');
 expect(await page.locator('#rcFix .rc-bigw').innerText()).toMatch(/ر.*ح.*ي.*م/s);
 await expect(page.locator('#cRetry')).toBeVisible();
 expect((await page.evaluate(()=>window.__rplays))[0].tag).toBe('word');
 expect((await st(page)).hs.list).toContain('wrong');
 await page.click('#cRetry');await expect(page.locator('#rcFix')).toBeHidden();expect((await st(page)).hs.list).toContain('wrong')});

test('silence and unrelated noise reveal nothing',async({page})=>{
 await start(page);
 await feed(page,'كتاب قلم شجر بيت سماء نهر');await feed(page,'اه ام');
 const s=await st(page);expect(Object.keys(s.marks)).toEqual([]);expect(Object.keys(s.prov)).toEqual([]);
 expect(await page.locator('#rcLine .rc-w.rc-hid').count()).toBe(29);expect(await page.locator('#rcLine .rc-an').count()).toBe(7);await expect(page.locator('#rcFix')).toBeHidden()});

test('hint reveals the first letter, then the whole word',async({page})=>{
 await start(page);await page.click('#rcHint');await expect(page.locator('#rcLine .rc-hn')).toHaveCount(1);
 await page.click('#rcHint');await expect(page.locator('#rcLine .rc-hn')).toHaveCount(0);
 expect(await page.locator('#rcLine .rc-w.rc-hid').count()).toBe(28);expect((await st(page)).hs.list).toEqual(['hint'])});

test('auto-locate: starting at another ayah of the range moves there without inventing greens',async({page})=>{
 await start(page);
 await feed(page,'إياك نعبد وإياك نستعين اهدنا الصراط المستقيم');await feed(page,'إياك نعبد وإياك نستعين اهدنا الصراط المستقيم');
 const s=await st(page);const ks=Object.keys(s.marks).map(Number);expect(ks.length).toBeGreaterThan(0);expect(Math.min(...ks)).toBeGreaterThanOrEqual(13);
 await expect(page.locator('.rc-ref')).toHaveText(/1:[567]/)});

test('finishing shows the summary and saves the test to history',async({page})=>{
 await start(page,{tr:true});await expect(page.locator('#rcTr')).not.toBeEmpty();
 await feed(page,'بسم الله الرحمن الرحيم الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين');
 await feed(page,'إياك نعبد وإياك نستعين اهدنا الصراط المستقيم صراط الذين أنعمت عليهم غير المغضوب عليهم ولا الضالين');
 await expect(page.locator('#rcSum')).toContainText('Hifz Test complete');await expect(page.locator('#rcSum .rc-stats')).toContainText('7');
 await page.click('#sX');await page.goto('./#/hifztest');await expect(page.locator('#zH li')).toHaveCount(1)});

test('auto-locate needs the same location repeated: one check alone moves nothing',async({page})=>{
 await start(page);
 await page.evaluate(()=>window.__recite.feed('إياك نعبد وإياك نستعين اهدنا الصراط المستقيم',1));
 const s=await st(page);expect(s.p).toBe(0);expect(Object.keys(s.marks).length).toBe(0);expect(Object.keys(s.prov).length).toBe(0)});

test('Urdu mode shows the Urdu translation under the ayah',async({page})=>{
 await page.addInitScript(()=>{if(!sessionStorage.qi){sessionStorage.qi=1;localStorage.setItem('settings',JSON.stringify({ui:'ur'}))}});
 await page.goto('./#/hifztest/1');await page.click('.hz-gear summary');await page.check('#zTr');await page.click('.hz-s[data-s="1"]');
 await expect(page.locator('#recite')).toBeVisible();await expect(page.locator('#rcTr')).toHaveAttribute('lang','ur');
 expect(await page.locator('#rcTr').innerText()).toMatch(/[\u0600-\u06FF]/)});

test('juz selection covers the whole juz, surah after surah',async({page})=>{
 await page.goto('./#/hifztest');await page.click('.hz-gear summary');await page.click('#zBJ');await page.selectOption('#zJu','30');await page.click('#zGo');
 await expect(page).toHaveURL(/#\/surah\/78/);await expect(page.locator('#recite')).toBeVisible();
 expect(await page.evaluate(()=>window.__recite.raw().ctx.next.length)).toBe(36);
 await page.evaluate(()=>{const s=window.__recite.raw();s.ctx.onNext(s.ctx.next[0],s.ctx.next.slice(1),s.hs)});
 await expect(page).toHaveURL(/#\/surah\/79/);await expect(page.locator('#recite')).toBeVisible();
 expect(await page.evaluate(()=>window.__recite.raw().ctx.next.length)).toBe(35)});

test('the whole surah is shown blurred; recited words become clear in place, the rest stay blurred',async({page})=>{
 await start(page);await feed(page,'بسم الله الرحمن الرحيم');
 const w=page.locator('#rcLine .rc-w');await expect(w.nth(0)).not.toHaveClass(/rc-hid/);await expect(w.nth(0)).toHaveCSS('filter','none');
 await expect(w.nth(10)).toHaveClass(/rc-hid/);await expect(w.nth(28)).toHaveCSS('filter',/blur/)});
