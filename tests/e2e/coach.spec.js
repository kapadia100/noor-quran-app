import {test,expect} from '@playwright/test';
let errors=[];
test.beforeEach(async({page})=>{errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&!/net::|Failed to load resource|tile\.openstreetmap/.test(m.text()))errors.push(m.text())});
 await page.route('https://gc.zgo.at/count.js',r=>r.fulfill({contentType:'text/javascript',body:'window.goatcounter.count=function(o){(window.__gcStub=window.__gcStub||[]).push(o)}'}));
 await page.route('**/quransafar.goatcounter.com/**',r=>r.fulfill({status:204}));
 await page.addInitScript(()=>{window.__reciteFake=true;if(!sessionStorage.getItem('qsInit')){sessionStorage.setItem('qsInit','1');localStorage.setItem('gcDebug','1')}})});
test.afterEach(async({page})=>{expect(errors).toEqual([]);const ov=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);expect(ov).toBeLessThanOrEqual(1)});
const st=page=>page.evaluate(()=>window.__recite.state());
const open=async page=>{await page.goto('./#/recite/1');await expect(page.locator('#recite')).toBeVisible();await page.click('#rcMic')};
// 1:3 word 2 (الرحيم, flat index 9) replaced by an unrelated word, said three times -> strong red
const wrong=async page=>{await page.evaluate(()=>window.__recite.feed('بسم الله الرحمن الرحيم الحمد لله رب العالمين الرحمن'));await page.evaluate(()=>window.__recite.feed('الرحمن كتاب مالك يوم الدين'))};

test('coach: a strong red autoplays the correct word, shows it large and waits for a repeat',async({page})=>{
 await open(page);await wrong(page);
 await expect(page.locator('#rcFix .rc-bigw')).toBeVisible();expect(await page.locator('#rcFix .rc-bigw').innerText()).toMatch(/ر.*ح.*ي.*م/s);
 await expect(page.locator('#rcFix .rc-ft')).not.toBeEmpty();
 const p=await page.evaluate(()=>window.__rplays);expect(p[0].tag).toBe('word');expect(p[0].url).toMatch(/^https?:/);
 const s=await st(page);expect(s.coach.kind).toBe('bad');expect(s.hold).toBe(false);
 await expect(page.locator('#rcSay')).toContainText(/repeat/i);
 const g=await page.evaluate(()=>(window.__gcStub||[]).map(o=>o.path));expect(g).toContain('feature-recite-coach');
 const w=await page.evaluate(()=>JSON.parse(localStorage.qsWeak));expect(Object.keys(w)).toEqual(['1:3:1']);expect(w['1:3:1'].miss).toBe(1);
 await page.evaluate(()=>window.__recite.say('الرحيم'));
 await expect(page.locator('#rcFix')).toBeHidden();
 const s2=await st(page);expect(s2.coach).toBeNull();expect(s2.marks[9]).toBe('ok');
 const w2=await page.evaluate(()=>JSON.parse(localStorage.qsWeak));expect(w2['1:3:1'].due).toBeGreaterThan(Date.now()+20*3600e3)});

test('coach: not clear / close / silence never count as a miss; a clear wrong word does',async({page})=>{
 await open(page);await wrong(page);
 await page.evaluate(()=>window.__recite.say(''));await expect(page.locator('#rcSay')).toContainText(/did not catch/i);
 await page.evaluate(()=>window.__recite.say('كتاب',false));
 expect((await st(page)).miss['1:3:1']).toBe(1);
 await page.evaluate(()=>window.__recite.say('كتاب'));expect((await st(page)).miss['1:3:1']).toBe(2);
 await expect(page.locator('#rcSay')).toContainText(/./);
 const n=await page.evaluate(()=>window.__rplays.length);expect(n).toBe(2)});

test('coach: third miss escalates to slow syllables, then the phrase, with encouragement and skip',async({page})=>{
 await open(page);await wrong(page);
 await page.evaluate(()=>window.__recite.say('كتاب'));await page.evaluate(()=>window.__recite.say('كتاب'));
 const s=await st(page);expect(s.miss['1:3:1']).toBe(3);expect(s.coach.esc).toBe(true);
 const tags=await page.evaluate(()=>window.__rplays.slice(-8).map(p=>p.tag+'@'+p.rate));
 expect(tags.some(t=>t==='word@0.6')).toBe(true);expect(tags.some(t=>t==='phrase@1')).toBe(true);
 await expect(page.locator('#rcSyl')).toBeVisible();await expect(page.locator('#rcSyl span')).not.toHaveCount(0);await expect(page.locator('#rcPhr')).toBeVisible();
 await expect(page.locator('#cSkip')).toBeVisible();
 // he cannot move on until he reads it correctly (or skips)
 expect((await st(page)).coach.done).toBe(false);await expect(page.locator('#rcFix')).toBeVisible();
 await page.evaluate(()=>window.__recite.say('الرحيم'));await expect(page.locator('#rcFix')).toBeHidden()});

test('coach: skip for now keeps the word red and saved, and live recitation resumes',async({page})=>{
 await open(page);await wrong(page);await page.click('#cSkip');
 await expect(page.locator('#rcFix')).toBeHidden();const s=await st(page);expect(s.marks[9]).toBe('bad');expect(s.coach).toBeNull();
 const w=await page.evaluate(()=>JSON.parse(localStorage.qsWeak));expect(w['1:3:1'].skips).toBe(1);
 await page.evaluate(()=>window.__recite.feed('الدين اياك نعبد'));expect((await st(page)).marks[13]).toBe('ok')});

test('coach: word audio missing falls back to an ayah audio slice',async({page})=>{
 await page.addInitScript(()=>{window.__rnoword=true});await open(page);await wrong(page);
 await expect.poll(()=>page.evaluate(()=>window.__rplays.map(p=>p.tag)),{timeout:15000}).toEqual(['word','slice'])});

test('coach: amber is only a gentle optional repeat (no card, no audio, no weak entry)',async({page})=>{
 await open(page);
 await page.evaluate(()=>window.__recite.feed('بسم الله الرحمن الرحيم الحمد لله رب'));await page.evaluate(()=>window.__recite.feed('رب عليم الرحمن الرحيم مالك'));
 const s=await st(page);expect(Object.values(s.marks)).toContain('unc');expect(Object.values(s.marks)).not.toContain('bad');
 await expect(page.locator('#rcNudge')).toBeVisible();expect(await page.locator('#rcFix').isVisible()).toBe(false);expect(await page.evaluate(()=>window.__rplays?.length||0)).toBe(0);
 expect(await page.evaluate(()=>localStorage.qsWeak||null)).toBeNull();
 await page.click('#nRep');await expect(page.locator('#rcFix.soft')).toBeVisible();expect((await st(page)).coach.kind).toBe('unc');
 await page.evaluate(()=>window.__recite.say('كتاب'));expect((await st(page)).miss).toEqual({});
 await page.evaluate(()=>window.__recite.say('ربي'));await page.click('#cSkip');expect(await page.evaluate(()=>localStorage.qsWeak||null)).toBeNull()});

test('summary: words to practice, saved to weak list, practice again drill',async({page})=>{
 await open(page);await wrong(page);await page.click('#cSkip');await page.click('#rcMic');
 await expect(page.locator('#rcSum')).toBeVisible();await expect(page.locator('#rcSum .rc-wi')).toHaveCount(1);await expect(page.locator('#rcSum .rc-wl-h')).toContainText(/practice/i);
 await page.click('#sAgain');await expect(page.locator('#rcFix .rc-bigw')).toBeVisible();expect((await st(page)).drill.n).toBe(1);
 await page.evaluate(()=>window.__recite.say('الرحيم'));await expect(page.locator('#rcSum')).toBeVisible();await expect(page.locator('#rcSum')).toContainText(/Practice finished/);
 await expect(page.locator('#rcSum .rc-wi.fx')).toHaveCount(1)});

test('review: Home card appears for due weak words and the review drill fixes + graduates them',async({page})=>{
 await page.goto('./');await expect(page.locator('#homeReview')).toHaveCount(0);
 await page.evaluate(()=>localStorage.setItem('qsWeak',JSON.stringify({'1:2:1':{key:'1:2:1',sn:1,a:2,k:1,t:'ٱلْحَمْدُ',nw:'الحمد',tr:'al-hamdu',m:'praise',au:'https://x.test/a.mp3',ph:[],pi:0,cn:[5,3],ci:0,miss:2,box:0,due:Date.now()-1000,last:Date.now()}})));
 await page.reload();await expect(page.locator('#homeReview')).toBeVisible();await expect(page.locator('#homeReview')).toContainText('1 word');
 await page.click('#homeReview');await expect(page.locator('#wl li')).toHaveCount(1);await page.click('#wRev');await expect(page.locator('#recite')).toBeVisible();
 await page.click('#rcMic');await expect(page.locator('#rcFix .rc-bigw')).toContainText('ٱلْحَمْدُ');
 await page.evaluate(()=>window.__recite.say('الحمد'));await expect(page.locator('#rcSum')).toContainText(/Practice finished/);
 const w=await page.evaluate(()=>JSON.parse(localStorage.qsWeak));expect(w['1:2:1'].box).toBe(1);expect(w['1:2:1'].due).toBeGreaterThan(Date.now()+1.5*864e5);
 const g=await page.evaluate(()=>(window.__gcStub||[]).map(o=>o.path));expect(g).toContain('feature-recite-review')});

test('coach layout: card + summary fit a 390px-wide phone without overflow, Urdu too',async({page})=>{
 await open(page);await wrong(page);await page.evaluate(()=>window.__recite.say('كتاب'));await page.evaluate(()=>window.__recite.say('كتاب'));
 const b=await page.locator('#rcFix').boundingBox();expect(b.x).toBeGreaterThanOrEqual(-1);expect(b.x+b.width).toBeLessThanOrEqual(await page.evaluate(()=>innerWidth)+1);
 const mic=await page.locator('#rcMic').boundingBox();expect(mic).not.toBeNull();
 await page.click('#cSkip');await page.click('#lang').catch(()=>{});});
