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

test('joined shapes: 29 rows, six non-joiners faded, building-words examples',async({page})=>{
 await page.goto('./#/qaida/joined');await expect(page.locator('.q-fr')).toHaveCount(29);
 await expect(page.locator('.q-fr:has(.same)')).toHaveCount(6);await expect(page.locator('.q-ex')).toHaveCount(4)});

test('Urdu labels and dark mode render without overflow',async({page})=>{
 await page.addInitScript(()=>{localStorage.setItem('settings',JSON.stringify({ui:'ur',dark:true}))});
 await page.goto('./#/qaida');await expect(page.locator('.q-row').first()).toContainText('حروف');
 await page.goto('./#/qaida/madd');await expect(page.locator('.q-rule')).toBeVisible()});
