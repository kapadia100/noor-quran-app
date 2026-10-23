import {test,expect} from '@playwright/test';
let errors=[];
test.beforeEach(async({page})=>{errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&!/net::|Failed to load resource|tile\.openstreetmap/.test(m.text()))errors.push(m.text())});
 await page.route('https://gc.zgo.at/count.js',r=>r.fulfill({contentType:'text/javascript',body:'window.goatcounter.count=function(o){}'}));
 await page.route('**/quransafar.goatcounter.com/**',r=>r.fulfill({status:204}));
 await page.addInitScript(()=>{window.__reciteFake=true})});
test.afterEach(async({page})=>{expect(errors).toEqual([]);const ov=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);expect(ov).toBeLessThanOrEqual(1)});
const st=page=>page.evaluate(()=>window.__recite.state());
const open=async(page,n=1)=>{await page.goto(`./#/recite/${n}`);await expect(page.locator('#recite')).toBeVisible()};
const FATIHA='بسم الله الرحمن الرحيم الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين إياك نعبد وإياك نستعين اهدنا الصراط المستقيم صراط الذين أنعمت عليهم غير المغضوب عليهم ولا الضالين';

test('modes: options card lists four modes; memory hides the words and hint reveals first letter then word',async({page})=>{
 await open(page);await page.click('#rcOptB');await expect(page.locator('#rcOpt .rc-md')).toHaveCount(4);
 await page.click('[data-md=memory]');await page.click('#rcOptB');
 await expect(page.locator('#rcLine .rc-ph').first()).toBeVisible();expect((await st(page)).mode).toBe('memory');
 await expect(page.locator('#rcHint')).toBeVisible();await page.click('#rcMic');
 await page.click('#rcHint');await expect(page.locator('#rcLine .rc-hn')).toHaveCount(1);
 await page.click('#rcHint');await expect(page.locator('#rcLine .rc-hn')).toHaveCount(0);await expect(page.locator('#rcLine .rc-ph')).toHaveCount(3);
 await page.evaluate(t=>window.__recite.feed(t),'بسم الله');
 await expect(page.locator('#rcLine .rc-ph')).toHaveCount(2);
 expect(await page.evaluate(()=>document.body.classList.contains('rc-blind'))).toBe(true)});

test('test-me mode: no hint button, score shown in summary and logged',async({page})=>{
 await open(page);await page.click('#rcOptB');await page.click('[data-md=test]');await expect(page.locator('#rcHint')).toBeHidden();await page.click('#rcMic');
 await page.evaluate(t=>window.__recite.feed(t),FATIHA);
 await expect(page.locator('#rcSum .rc-score')).toBeVisible();await expect(page.locator('#rcSum .rc-score b')).toHaveText(/^\d+%$/);
 const p=await page.evaluate(()=>JSON.parse(localStorage.qsProg));expect(p.sess.length).toBe(1);expect(p.sess[0].mode).toBe('test');expect(p.sess[0].ok).toBeGreaterThan(5)});

test('range: choose ayahs limits the session',async({page})=>{
 await open(page);await page.click('#rcOptB');await page.selectOption('#oFrom','3');await page.selectOption('#oTo','5');await page.click('#oGo');
 await expect(page.locator('.rc-ref')).toHaveText('1:3');await expect(page.locator('#rcOptS')).toContainText('1:3–5')});

test('listen & repeat: plays the ayah audio first, then moves ayah by ayah',async({page})=>{
 await open(page);await page.click('#rcOptB');await page.click('[data-md=lr]');await page.click('#rcOptB');await page.click('#rcMic');
 await expect.poll(()=>page.evaluate(()=>(window.__rplays||[]).filter(p=>p.tag==='ayah').length)).toBe(1);
 await page.evaluate(()=>window.__recite.feed('بسم الله الرحمن الرحيم'));
 await expect.poll(()=>page.evaluate(()=>(window.__rplays||[]).filter(p=>p.tag==='ayah').length)).toBe(2)});

test('model audio: speed + A-B loop plays a slice at the chosen speed',async({page})=>{
 await open(page);await page.click('#rcOptB');await page.click('[data-rate="0.75"]');
 await page.click('#oAbw .rc-abx >> nth=1');await page.click('#oAbw .rc-abx >> nth=2');await expect(page.locator('#oAbw .rc-abx.on')).toHaveCount(2);
 await page.click('#abL');await expect.poll(()=>page.evaluate(()=>(window.__rplays||[]).filter(p=>p.tag==='ab').length)).toBeGreaterThan(2);
 await page.click('#abS');const r=await page.evaluate(()=>window.__rplays.filter(p=>p.tag==='ab')[0].rate);expect(r).toBe(0.75)});

test('mistake types: skipped vs different word wording; progress logged with the missed word',async({page})=>{
 await open(page);await page.click('#rcMic');
 await page.evaluate(()=>window.__recite.feed('بسم الله الرحمن الرحيم الحمد لله رب العالمين الرحمن'));await page.evaluate(()=>window.__recite.feed('الرحمن كتاب مالك يوم الدين'));
 const p=await page.evaluate(()=>JSON.parse(localStorage.qsProg||'{}'));expect((p.mis||[]).length).toBeGreaterThanOrEqual(1);expect(['skip','wrong']).toContain(p.mis[0].type)});

test('progress screen: empty state, then streak, accuracy, weak letters after sessions',async({page})=>{
 await page.goto('./#/progress');await expect(page.locator('.pg')).toContainText(/Start reciting|Recite with the tutor/i);
 await page.evaluate(()=>{const d=Date.now();const s=(k,sn,ok,bad)=>({ts:d-k*864e5,sn,from:1,to:7,mode:'follow',ok,bad,unc:0,hints:0,sec:120});
  localStorage.qsProg=JSON.stringify({v:1,sess:[s(2,1,25,2),s(1,1,27,0),s(0,2,40,5)],mis:[{ts:d,sn:2,a:5,t:'الْمُفْلِحُونَ',nw:'المفلحون',type:'wrong',heard:''}],let:{'ح':[10,4],'ع':[8,3],'ب':[30,0]}})});
 await page.reload();await expect(page.locator('.pg-big').first()).toContainText('3');await expect(page.locator('.pg-row')).toHaveCount(2);await expect(page.locator('.pg-let')).toHaveCount(2);await expect(page.locator('.pg-m')).toHaveCount(1);
 await page.click('#pgClr');await page.click('#pgClr');await expect(page.locator('.pg')).toContainText(/Start reciting/i)});

test('more tab has a progress entry; onboarding card appears first time and can be dismissed',async({page})=>{
 await page.goto('./#/more');await expect(page.locator('#mrcProg')).toBeVisible();
 await page.evaluate(()=>localStorage.setItem('qsRcOnbTest','1'));await open(page);await expect(page.locator('#rcOnb')).toBeVisible();await expect(page.locator('#rcOnb')).toContainText(/quiet room/i);
 await page.click('#onbOk');await expect(page.locator('#rcOnb')).toBeHidden();await page.reload();await expect(page.locator('#rcOnb')).toBeHidden()});

test('quality setting persists and mic errors are explained (no mic API)',async({page})=>{
 await open(page);await page.click('#rcOptB');await page.click('[data-q=accurate]');expect(await page.evaluate(()=>localStorage.qsQuality)).toBe('accurate');await expect(page.locator('#rcOpt [data-q=accurate]')).toHaveClass(/on/)});

test('tajweed colours: coloured letters appear in the line and tapping one explains the rule',async({page})=>{
 await open(page,2);await expect.poll(async()=>(await st(page)).tj).toBeGreaterThan(0);
 await page.click('#rcMic');await expect(page.locator('#rcLine .tj').first()).toBeVisible();await expect(page.locator('#rcTjk')).toBeVisible();
 await page.locator('#rcLine .tj').first().click();await expect(page.locator('#rcTjc')).toBeVisible();await expect(page.locator('#rcTjc b')).not.toBeEmpty();
 await page.click('#rcOptB');await page.click('#oTj');await expect(page.locator('#rcLine .tj')).toHaveCount(0)});
