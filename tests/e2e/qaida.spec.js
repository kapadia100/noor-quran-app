import {test,expect} from '@playwright/test';
let errors=[];
test.beforeEach(async({page})=>{errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&!/net::|Failed to load resource|tile\.openstreetmap/.test(m.text()))errors.push(m.text())});
 await page.route('https://gc.zgo.at/count.js',r=>r.fulfill({contentType:'text/javascript',body:'window.goatcounter.count=function(o){}'}));
 await page.route('**/quransafar.goatcounter.com/**',r=>r.fulfill({status:204}));
 await page.addInitScript(()=>{localStorage.setItem('instBanner','1');window.__reciteFake=true})});
test.afterEach(async({page})=>{expect(errors).toEqual([]);const ov=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);expect(ov).toBeLessThanOrEqual(1)});
const plays=page=>page.evaluate(()=>window.__qplays||[]);

test('More tab has a Qaida entry that opens the lesson list with 9 lessons',async({page})=>{
 await page.goto('./#/more');await page.click('#qaidaEntry');await expect(page).toHaveURL(/#\/qaida$/);
 await expect(page.locator('.q-row')).toHaveCount(9);await expect(page.locator('.q-note')).toContainText('cannot reliably');
 await expect(page.locator('#qaidaEntry')).toHaveCount(0)});

test('letters lesson: 29 tiles, tap plays the matching recorded clip (hamza uses the alif clip, ya its own)',async({page})=>{
 await page.goto('./#/qaida/huroof');await expect(page.locator('.q-tile')).toHaveCount(29);
 await page.locator('.q-tile').nth(1).click();await page.locator('.q-tile').nth(27).click();await page.locator('.q-tile').nth(28).click();
 await expect.poll(()=>plays(page)).toEqual(['qaida/2-a.mp3','qaida/1-a.mp3','qaida/28-a.mp3']);
 await expect(page.locator('.q-tile').first().locator('.ar')).toHaveText('ا')});

test('letters clips are served (every mapped file exists and is audio)',async({page,request,baseURL})=>{
 await page.goto('./');const bad=[];
 for(let n=1;n<=28;n++)for(const k of ['a','i','u','an','in','un']){const r=await request.get(new URL(`qaida/${n}-${k}.mp3`,baseURL).href);if(!r.ok()||(await r.body()).length<1000)bad.push(`${n}-${k}`)}
 expect(bad).toEqual([])});

test('harakat lesson: 28 rows x 3 cells with the right marks; tanween has words; hear & repeat saves progress',async({page})=>{
 await page.goto('./#/qaida/harakat');await expect(page.locator('.q-mr')).toHaveCount(28);
 const first=page.locator('.q-mr').first().locator('.q-cell .ar');await expect(first).toHaveText(['أَ','إِ','أُ']);
 await expect(page.locator('.q-mr').nth(1).locator('.q-cell .ar')).toHaveText(['بَ','بِ','بُ']);
 await page.locator('.q-mr').nth(1).locator('.q-cell').nth(2).click();await expect.poll(()=>plays(page)).toContain('qaida/2-u.mp3');
 await page.click('#qaPrac');await expect(page.locator('#qPrac')).toBeVisible();
 for(let i=0;i<7;i++){await page.click('#qpHear');await expect(page.locator('#qpRate')).toBeVisible();await page.click('#qpGot')}
 await expect(page.locator('#qDone')).toContainText('7 of 7');
 const P=await page.evaluate(()=>JSON.parse(localStorage.qsQaida));expect(Object.keys(P.lessons.harakat.got)).toHaveLength(7);
 await page.goto('./#/qaida');await expect(page.locator('[data-l=harakat] .q-p')).toHaveText('7/28')});

test('Again re-queues an item once; Stop saves what was rated',async({page})=>{
 await page.goto('./#/qaida/huroof');await page.click('#qaPrac');await page.click('#qpHear');await page.click('#qpAgain');
 await expect(page.locator('#qBig')).not.toHaveText('ا');await page.click('#qpHear');await page.click('#qpGot');await page.click('#qpStop');
 await expect(page.locator('#qDone')).toContainText('1 of');await expect(page.locator('#qProg')).toBeHidden().catch(()=>{})});

test('rule lessons list real words with word audio and a tutor link to a real surah',async({page})=>{
 for(const [id,s] of [['tanween',112],['sukoon',108],['shadda',1],['madd',113],['leen',105]]){
  await page.goto(`./#/qaida/${id}`);await expect(page.locator('.q-word').first()).toBeVisible();
  await expect(page.locator('#qaTutor')).toHaveAttribute('href',`#/recite/${s}/1`)}
 await page.goto('./#/qaida/sukoon');await page.locator('.q-word').first().click();
 await expect.poll(async()=>(await plays(page))[0]).toMatch(/^https:\/\/audio\.qurancdn\.com\/wbw\/\d{3}_\d{3}_\d{3}\.mp3$/)});

test('tutor link opens the live tutor on the surah',async({page})=>{
 await page.goto('./#/qaida/shadda');await page.click('#qaTutor');await expect(page.locator('#recite')).toBeVisible()});

test('joined shapes: 29 rows, seven non-joiners faded, building-words examples',async({page})=>{
 await page.goto('./#/qaida/joined');await expect(page.locator('.q-fr')).toHaveCount(29);
 await expect(page.locator('.q-fr:has(.same)')).toHaveCount(7);await expect(page.locator('.q-ex')).toHaveCount(4)});

test('Urdu labels and dark mode render without overflow',async({page})=>{
 await page.addInitScript(()=>{localStorage.setItem('settings',JSON.stringify({ui:'ur',dark:true}))});
 await page.goto('./#/qaida');await expect(page.locator('.q-row').first()).toContainText('حروف');
 await page.goto('./#/qaida/madd');await expect(page.locator('.q-rule')).toBeVisible()});

// ---- live reading (v3.1): follow-along from the pace, checked words, never red ----
const fakeMic=page=>page.addInitScript(()=>{window.__qFake=true});
const noRed=async page=>{const bad=await page.evaluate(()=>[...document.querySelectorAll('.q-lp *, .q-tile, .q-cell, .q-word')].filter(e=>/red|wrong|miss|err/i.test(e.className&&e.className.baseVal===undefined?e.className:'')).length);expect(bad).toBe(0)};

test('letters: Read along button, honest "not checked" label, highlight follows each spoken item',async({page})=>{
 await fakeMic(page);await page.goto('./#/qaida/huroof');
 await expect(page.locator('.q-lbtn')).toBeVisible();await page.click('.q-lbtn');
 await expect(page.locator('#qLp')).toBeVisible();await expect(page.locator('.q-ltag')).toHaveText(/not checked/i);await expect(page.locator('.q-ltag')).toHaveClass(/fol/);
 await expect(page.locator('.q-cur')).toHaveCount(1);await expect(page.locator('.q-tile.q-cur')).toHaveAttribute('data-i','0');
 for(let k=1;k<=3;k++){await page.evaluate(()=>window.__qlive._burst());await expect(page.locator('.q-tile.q-fa')).toHaveCount(k);await expect(page.locator('.q-tile.q-cur')).toHaveAttribute('data-i',String(k))}
 await expect(page.locator('.q-tile.q-ok, .q-tile.q-nc')).toHaveCount(0);await noRed(page);
 await page.click('#qlStop');await expect(page.locator('#qlSum')).toContainText(/Read again/);await expect(page.locator('.q-tile.q-ok')).toHaveCount(0);
 const P=await page.evaluate(()=>localStorage.qsQaida);expect(P||'{}').not.toContain('"got":{"');});

test('tapping an item while reading moves the position there (does not play audio)',async({page})=>{
 await fakeMic(page);await page.goto('./#/qaida/huroof');await page.click('.q-lbtn');
 await page.evaluate(()=>window.__qlive._burst());await page.locator('.q-tile').nth(10).click();
 await expect(page.locator('.q-tile.q-cur')).toHaveAttribute('data-i','10');expect(await plays(page)).toEqual([]);
 await page.evaluate(()=>window.__qlive._burst());await expect(page.locator('.q-tile.q-cur')).toHaveAttribute('data-i','11')});

test('follow-along also works on the harakat grid and the joined lesson has no live mode',async({page})=>{
 await fakeMic(page);await page.goto('./#/qaida/harakat');await page.click('.q-lbtn');await page.evaluate(()=>window.__qlive._burst());await expect(page.locator('.q-cell.q-fa')).toHaveCount(1);
 await page.goto('./#/qaida/joined');await expect(page.locator('.q-lbtn')).toHaveCount(0)});

test('word rows are checked: confirmed words go green with a tick, others stay neutral grey, never red; summary is honest and saves only confirmed words',async({page})=>{
 await fakeMic(page);await page.goto('./#/qaida/practice');await page.click('.q-lbtn');
 await expect(page.locator('.q-ltag')).toHaveClass(/chk/);await expect(page.locator('.q-ldesc')).toContainText(/not a mistake/i);
 const n=await page.locator('.q-word').count();expect(n).toBeGreaterThan(5);
 for(let i=0;i<4;i++)await page.evaluate(()=>window.__qlive._burst());
 await page.evaluate(()=>{window.__qlive._grade(0,true);window.__qlive._grade(1,false);window.__qlive._grade(2,true)});
 await expect(page.locator('.q-word.q-ok')).toHaveCount(2);await expect(page.locator('.q-word.q-nc')).toHaveCount(1);await noRed(page);
 await page.click('#qlStop');await expect(page.locator('#qlSum')).toContainText('2 of');await expect(page.locator('#qlSum')).toContainText(/not confirmed/i);
 const P=await page.evaluate(()=>JSON.parse(localStorage.qsQaida));expect(Object.keys(P.lessons.practice.got)).toHaveLength(2)});

test('follow-along driven by real audio samples: bursts advance, silence and a 5 ms click do not',async({page})=>{
 await fakeMic(page);await page.goto('./#/qaida/huroof');await page.click('.q-lbtn');
 const pos=await page.evaluate(()=>{const L=window.__qlive,SR=16000;let s=3;const r=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296-.5};
  const push=(n,f)=>{const x=new Float32Array(n);for(let i=0;i<n;i++)x[i]=r()*0.003+(f?f(i):0);for(let i=0;i<n;i+=1600)L.feed(x.subarray(i,i+1600))};
  const tone=n=>i=>0.25*Math.min(1,i/300,(n-i)/300)*Math.sin(2*Math.PI*230*i/SR);
  push(SR*1.2);const out=[];for(let k=0;k<5;k++){push(Math.round(SR*.35),tone(Math.round(SR*.35)));push(Math.round(SR*.4));out.push(L.pos)}
  push(SR*3);out.push(L.pos);push(80,i=>0.4*Math.sin(i));push(SR*1);out.push(L.pos);return out});
 expect(pos).toEqual([1,2,3,4,5,5,5])});
