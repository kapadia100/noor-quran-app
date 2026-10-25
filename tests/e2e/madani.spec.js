import {test,expect} from '@playwright/test';
import fs from 'node:fs';
let errors=[];
const SHOTS=process.env.SHOTS||'';
test.beforeEach(async({page})=>{errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&!/net::|Failed to load resource|tile\.openstreetmap/.test(m.text()))errors.push(m.text())});
 await page.route('https://gc.zgo.at/count.js',r=>r.fulfill({contentType:'text/javascript',body:'window.goatcounter.count=function(o){}'}));
 await page.route('**/quransafar.goatcounter.com/**',r=>r.fulfill({status:204}));
 await page.addInitScript(()=>{localStorage.setItem('instBanner','1');window.__reciteFake=true})});
test.afterEach(async({page})=>{expect(errors).toEqual([]);const ov=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);expect(ov).toBeLessThanOrEqual(1)});
const shot=async(page,n)=>{if(SHOTS){await page.waitForTimeout(600);fs.mkdirSync(SHOTS,{recursive:true});await page.screenshot({path:`${SHOTS}/${n}.png`,fullPage:false})}};
const plays=page=>page.evaluate(()=>window.__qplays||[]);

test('Home Qaida card opens the chooser first, then the last-used Qaida; More always opens the chooser',async({page})=>{
 await page.goto('./');await expect(page.locator('#homeQaida')).toHaveAttribute('href','#/qaida');
 await page.click('#homeQaida');await expect(page.locator('#qChoose .q-choice')).toHaveCount(2);await page.waitForTimeout(700);
 await expect(page.locator('#qcMadani')).toContainText('Madani Qaida');await expect(page.locator('#qcNoorani')).toContainText('Noorani Qaida');await shot(page,'01-chooser');
 await page.click('#qcMadani');await expect(page).toHaveURL(/#\/qaida\/m$/);
 await page.goto('./');await expect(page.locator('#homeQaida')).toHaveAttribute('href','#/qaida/m');
 await page.goto('./#/more');await page.click('#qaidaEntry');await expect(page).toHaveURL(/#\/qaida$/);await expect(page.locator('#qcMadani')).toHaveClass(/q-last/)});

test('Madani list: 22 lessons, Switch Qaida chip returns to the chooser and the choice is remembered',async({page})=>{
 await page.goto('./#/qaida/m');await expect(page.locator('.q-row')).toHaveCount(22);await expect(page.locator('.q-row').first()).toContainText('Individual letters');await shot(page,'02-madani-list');
 expect(await page.evaluate(()=>localStorage.qsQaidaPick)).toBe('m');
 await page.click('#qSwitch');await expect(page).toHaveURL(/#\/qaida$/);await page.click('#qcNoorani');await expect(page.locator('.q-row')).toHaveCount(9);
 expect(await page.evaluate(()=>localStorage.qsQaidaPick)).toBe('n');
 await page.click('[data-l=huroof]');await expect(page.locator('#qSwitch')).toBeVisible();await page.click('#qSwitch');await expect(page).toHaveURL(/#\/qaida$/)});

test('old Noorani lesson links still open (legacy #/qaida/<lesson>)',async({page})=>{
 await page.goto('./#/qaida/huroof');await expect(page.locator('.q-tile')).toHaveCount(29);await expect(page.locator('.q-back')).toHaveAttribute('href','#/qaida/n')});

test('Madani lesson 1 reuses the 29 letter tiles; lesson 3 vowels play the recordings',async({page})=>{
 await page.goto('./#/qaida/m/m1');await expect(page.locator('.q-tile')).toHaveCount(29);await shot(page,'03-madani-letters');
 await page.goto('./#/qaida/m/m3');await expect(page.locator('.q-mr')).toHaveCount(28);
 await page.locator('.q-mr').nth(1).locator('.q-cell').nth(1).click();await expect.poll(()=>plays(page)).toContain('qaida/2-i.mp3')});

test('Madani lesson 4 drill: 34 rows read right to left, tap plays the clip',async({page})=>{
 await page.goto('./#/qaida/m/m4');await expect(page.locator('.q-dr')).toHaveCount(34);
 const c=page.locator('.q-dr').first().locator('.q-cell').first();await c.click();await expect.poll(async()=>(await plays(page)).length).toBeGreaterThan(0);await shot(page,'04-madani-drill')});

test('Madani word lesson: dagger alif words with tag chips, audio url played, rule text shown',async({page})=>{
 await page.goto('./#/qaida/m/m8');await expect(page.locator('.q-rule')).toBeVisible();const n=await page.locator('.q-word').count();expect(n).toBeGreaterThan(5);
 await expect(page.locator('.q-word .q-tag').first()).toBeVisible();await expect(page.locator('#qaTutor')).toBeVisible();await shot(page,'05-madani-words');
 await page.locator('.q-word').first().click();await expect.poll(async()=>(await plays(page)).length).toBeGreaterThan(0);
 expect((await plays(page))[0]).toMatch(/audio\.qurancdn\.com\/wbw\//)});

test('Madani waqf lesson shows stopping forms and the sign table',async({page})=>{
 await page.goto('./#/qaida/m/m21');await expect(page.locator('.q-word .q-stop .ar').first()).toBeVisible();await expect(page.locator('.q-sg')).toHaveCount(6);await shot(page,'06-madani-waqf')});

test('Madani phrase item plays its words one after the other',async({page})=>{
 await page.goto('./#/qaida/m/m12');const w=page.locator('.q-word[data-u*="|"]').first();await w.scrollIntoViewIfNeeded();await w.click();
 await expect.poll(async()=>(await plays(page)).length).toBeGreaterThan(1)});

test('Madani prayer page: typed phrases with a disclosure and links to real surahs in the tutor',async({page})=>{
 await page.goto('./#/qaida/m/m22');await expect(page.locator('.q-ph').first()).toContainText('ٱللَّهُ أَكْبَرُ');await expect(page.locator('.q-salnote')).toContainText('no recording');
 await expect(page.locator('.q-tutor[data-surah="1"]')).toHaveAttribute('href','#/recite/1/1');await shot(page,'07-madani-salah')});

test('Madani lesson: Hear & repeat saves progress under its own key, separate from Noorani',async({page})=>{
 await page.goto('./#/qaida/m/m3');await page.click('#qaPrac');
 for(let i=0;i<7;i++){await page.click('#qpHear');await expect(page.locator('#qpRate')).toBeVisible();await page.click('#qpGot')}
 await expect(page.locator('#qDone')).toContainText('7 of 7');
 const P=await page.evaluate(()=>({m:JSON.parse(localStorage.qsQaidaM),n:localStorage.qsQaida}));expect(Object.keys(P.m.lessons.m3.got)).toHaveLength(7);expect(P.n==null).toBe(true);
 await page.goto('./#/qaida/m');await expect(page.locator('[data-l=m3] .q-p')).toHaveText('7/28')});

test('Madani live: letters/vowels/drill/muqatta\u02bfat follow along (not graded); real-word lessons are checked',async({page})=>{
 await page.addInitScript(()=>{window.__qFake=true});
 for(const [id,kind] of [['m1','along'],['m3','along'],['m4','along'],['m18','along'],['m9','check'],['m14','check'],['m21','check']]){
  await page.goto('./#/qaida/m/'+id);await expect(page.locator('.q-lbtn').first()).toHaveAttribute('data-live',kind)}
 await page.goto('./#/qaida/m/m2');await expect(page.locator('.q-lbtn')).toHaveCount(0);
 await page.goto('./#/qaida/m/m1');await page.click('.q-lbtn');await expect(page.locator('#qLp')).toBeVisible();
 for(let k=1;k<=2;k++){await page.evaluate(()=>window.__qlive._burst());await expect(page.locator('.q-tile.q-fa')).toHaveCount(k)}
 await page.click('#qlStop');await expect(page.locator('.q-tile.q-ok')).toHaveCount(0)});
