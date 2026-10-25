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
 await expect(page.locator('#rcSum')).toContainText('Hifz Test complete');await expect(page.locator('#rcSum .rc-ay')).toContainText('7 ayat');
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

test('v3.5.1 truthful summary: unconfirmed (amber) words are never "well recited"; finished state is clean',async({page})=>{
 await start(page);
 await feed(page,'بسم الله الرحمن الرحيم الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين');
 await feed(page,'إياك نعبد وإياك نستعين اهدنا الصراط المستقيم صراط الذين أنعمت عليهم غير المغضوب عليهم ولا الضالين');
 // finish happened with every word green: the clean finished state
 await expect(page.locator('#rcSum')).toContainText('every word confirmed');await expect(page.locator('#rcSum')).toContainText('well recited');
 await expect(page.locator('#rcChip')).toBeHidden();await expect(page.locator('.rc-ctl')).toBeHidden();await expect(page.locator('#rcMic')).toBeHidden();await expect(page.locator('#rcHint')).toBeHidden();
 await expect(page.locator('#rcSum .rc-legend')).toHaveCount(0);
 // now the user's bug: three words stay orange
 await page.evaluate(()=>{const s=window.__recite.raw();for(const i of [4,9,20])s.T.marks[i]='unc';s.fpDone=1;window.__recite.summary(true)});
 const sum=page.locator('#rcSum');
 await expect(sum).not.toContainText('well recited');await expect(sum).not.toContainText('every word confirmed');
 await expect(sum).toContainText('3 words not confirmed');await expect(sum.locator('.rc-verdict')).toContainText('could not confirm 3 words');
 await expect(sum.locator('.rc-legend')).toContainText('could not confirm this word');
 await expect(sum.locator('.rc-st5 .u b')).toHaveText('3');await expect(sum.locator('.rc-hzr.unc')).toHaveCount(3);
 await expect(sum.locator('.rc-hzs')).toHaveCount(3);await expect(sum.locator('#sUnc')).toContainText('Re-read the 3 unconfirmed words');
 await sum.locator('.rc-hzr.unc .rc-wi').first().click();expect((await page.evaluate(()=>window.__rplays)).length).toBeGreaterThan(0);
 await sum.locator('.rc-hzs').first().click();await expect(page.locator('#rcLine .rc-hl')).toHaveCount(1);
 // saved for spaced review
 expect(await page.evaluate(()=>Object.keys(window.__recite.raw().weak).length)).toBeGreaterThanOrEqual(3);
 // re-read only the unconfirmed words
 await page.click('#sUnc');await expect(sum).toBeHidden();expect(await page.evaluate(()=>window.__recite.raw().drill.items.length)).toBe(3)});

test('v3.5.1 summary counts mistakes, skips and unconfirmed words separately',async({page})=>{
 await start(page);
 await feed(page,'بسم الله الرحمن الرحيم الحمد لله رب العالمين الرحمن');await feed(page,'الرحمن كتاب مالك يوم الدين');
 await page.evaluate(()=>{const s=window.__recite.raw();s.T.marks[6]='unc';s.fpDone=1;window.__recite.summary(false)});
 const sum=page.locator('#rcSum');await expect(sum).not.toContainText('well recited');await expect(sum.locator('.rc-st5 .r b').first()).toHaveText('1');
 await expect(sum.locator('.rc-st5 .u b')).toHaveText('1');await expect(sum.locator('.rc-verdict')).toContainText('mistake')});

const wrFeed=(page,text,t0,t1)=>page.evaluate(([w,t0,t1])=>{const a=w.split(' ').filter(Boolean);const H=a.map((x,i)=>({w:x,t0:t0+i*0.5,t1:t0+i*0.5+0.4}));window.__recite.wr(H,t1)},[text,t0,t1]);
const wrStart=async page=>{await start(page);await expect.poll(()=>page.evaluate(()=>!!window.__recite.raw().WW)).toBe(true);await feed(page,'بسم الله');await wrFeed(page,'',0,2)};
test('v3.5.1 wrong-reading: another ayah of the surah -> card, tone, expected word then phrase, continue from there',async({page})=>{
 await wrStart(page);
 await wrFeed(page,'اهدنا الصراط المستقيم صراط الذين',3,7);
 const card=page.locator('#rcFix');await expect(card).toBeVisible();await expect(card).toContainText('You’re reading something different');await expect(card).toContainText('ayah 6');
 await expect.poll(async()=>(await page.evaluate(()=>window.__rplays||[])).map(x=>x.tag).join(',')).toMatch(/word.*phrase|word/);
 expect((await page.evaluate(()=>window.__wrLog))[0].kind).toBe('other');
 expect(await page.evaluate(()=>window.__recite.raw().hold)).toBe(true);
 await page.click('#wThere');await expect(card).toBeHidden();
 const s=await st(page);expect(s.p).toBe(17);});
test('v3.5.1 wrong-reading: "go back" resumes at the expected word and nothing is marked',async({page})=>{
 await wrStart(page);await wrFeed(page,'اهدنا الصراط المستقيم صراط الذين',3,7);
 await expect(page.locator('#rcFix')).toBeVisible();const p0=(await st(page)).p;await page.click('#wBack');await expect(page.locator('#rcFix')).toBeHidden();
 const s=await st(page);expect(s.p).toBe(p0);expect(await page.evaluate(()=>window.__recite.raw().hold)).toBe(false);expect(s.hs.list).toEqual([])});
test('v3.5.1 wrong-reading: a different surah offers to continue there',async({page})=>{
 await wrStart(page);await wrFeed(page,'قل هو الله احد الله الصمد',3,8);
 await expect(page.locator('#rcFix')).toContainText('surah');await expect(page.locator('#wThere')).toBeVisible();
 await page.click('#wThere');await expect(page).toHaveURL(/#\/surah\/112/)});
test('v3.5.1 wrong-reading: non-Quran speech only gets a soft "Keep reading", never an accusation',async({page})=>{
 await wrStart(page);await wrFeed(page,'زقزق مهملا فلانن طرطر',3,9);
 await expect(page.locator('#rcFix')).toBeHidden();await expect(page.locator('#rcChip')).toContainText('Keep reading');
 expect((await page.evaluate(()=>window.__wrLog))[0].kind).toBe('soft')});
test('v3.5.1 wrong-reading: reading the expected words (even slowly) never triggers',async({page})=>{
 await wrStart(page);await wrFeed(page,'الرحمن الرحيم مالك يوم',3,9);await wrFeed(page,'الرحمن الرحيم مالك يوم الدين',10,16);
 await expect(page.locator('#rcFix')).toBeHidden();expect(await page.evaluate(()=>window.__wrLog||[])).toEqual([])});

// v3.6.4: Hifz stays inside Hifz. Session URL never changes by itself, the mistake card appears in place, and Back / X / summary return to the selection (then to where the user came from).
const inSession=async page=>{await expect(page).toHaveURL(/#\/surah\/1\/1$/);await expect(page.locator('#recite')).toBeVisible()};
const onSelection=async page=>{await expect(page).toHaveURL(/#\/hifztest(\/\d+)?$/);await expect(page.locator('#recite')).toHaveCount(0);await expect(page.locator('.hz-s[data-s="1"]')).toBeVisible()};
const begin=async page=>{await page.goto('./');await page.goto('./#/more');await page.click('a[href="#/hifztest"]');await expect(page.locator('.hz-s[data-s="1"]')).toBeVisible();await page.click('.hz-s[data-s="1"]');
 await expect(page.locator('#recite .rc-t b')).toHaveText(/Hifz Test/);await expect.poll(()=>page.evaluate(()=>window.__recite.raw().listening)).toBe(true)};
for(const how of ['header','history']){
 test(`v3.6.4 Hifz nav (${how==='header'?'X button':'phone back'}): correct + wrong recitation stay on Hifz, feedback in place; Back -> selection -> More`,async({page})=>{
  await begin(page);await inSession(page);
  await feed(page,'بسم الله الرحمن الرحيم الحمد لله رب العالمين الرحمن');await inSession(page);
  await feed(page,'الرحمن كتاب مالك يوم الدين');
  await expect(page.locator('#recite #rcFix')).toContainText('Mistake — listen');await inSession(page);
  await page.waitForTimeout(700);await inSession(page);
  if(how==='header')await page.click('.rc-x');else await page.goBack();   // the full-screen overlay covers the header, so its own X is the in-app back
  await onSelection(page);
  if(how==='header')await page.click('#back');else await page.goBack();
  await expect(page).toHaveURL(/#\/more$/)});
}
test('v3.6.4 Hifz nav: the X button returns to the selection, not the Quran reader',async({page})=>{
 await begin(page);await feed(page,'بسم الله الرحمن الرحيم');await page.click('.rc-x');await onSelection(page);
 await expect(page.locator('#ays')).toHaveCount(0);await page.goBack();await expect(page).toHaveURL(/#\/more$/)});
test('v3.6.4 Hifz nav: finishing keeps the summary on Hifz; Done and Back both return to the selection',async({page})=>{
 await begin(page);
 await feed(page,'بسم الله الرحمن الرحيم الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين');
 await feed(page,'إياك نعبد وإياك نستعين اهدنا الصراط المستقيم صراط الذين أنعمت عليهم غير المغضوب عليهم ولا الضالين');
 await expect(page.locator('#rcSum')).toContainText('Hifz Test complete');await page.waitForTimeout(800);await inSession(page);await expect(page.locator('#rcSum')).toBeVisible();
 await page.click('#sX');await onSelection(page);
 await page.goForward();await expect(page).toHaveURL(/#\/surah\/1\/1$/);await page.goBack();await onSelection(page)});
test('v3.6.4 Hifz nav: starting a session while background audio is playing is not hijacked by it',async({page})=>{
 await page.goto('./#/surah/1');await page.click('#playAll');await page.waitForTimeout(300);
 await page.goto('./#/hifztest');await page.click('.hz-s[data-s="1"]');await expect(page.locator('#recite')).toBeVisible();
 await page.waitForTimeout(1500);await inSession(page)});
