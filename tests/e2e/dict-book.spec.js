// Dictionary Book view: the word sheets as pages with a 3D page turn (swipe / edge tap), RTL in Urdu, spread on iPad landscape.
import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const D=JSON.parse(fs.readFileSync(new URL('../../public/offline/x/dict.json',import.meta.url),'utf8'));
let errors=[];
test.beforeEach(async({page})=>{errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&!/net::|Failed to load resource|tile\.openstreetmap/.test(m.text()))errors.push(m.text())});
 await page.route('https://gc.zgo.at/count.js',r=>r.fulfill({contentType:'text/javascript',body:'window.goatcounter.count=function(o){}'}));
 await page.route('**/quransafar.goatcounter.com/**',r=>r.fulfill({status:204}));
 await page.addInitScript(()=>{if(!sessionStorage.getItem('qsB')){sessionStorage.setItem('qsB','1');localStorage.setItem('instBanner','1')}})});
test.afterEach(async({page})=>{expect(errors).toEqual([]);const ov=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);expect(ov).toBeLessThanOrEqual(1)});
const urdu=page=>page.addInitScript(()=>{if(!sessionStorage.getItem('qsBu')){sessionStorage.setItem('qsBu','1');localStorage.setItem('settings',JSON.stringify({ui:'ur'}))}});
const shown=page=>page.locator('#bkStage > .bk-slot .bk-page[data-r]').evaluateAll(a=>a.map(e=>+e.dataset.r));
const atRest=async(page,rs)=>{await expect(page.locator('.bk-leaf')).toHaveCount(0);await expect.poll(()=>shown(page)).toEqual(rs)};
// drag horizontally across the stage with the mouse (pointer events), from fraction f0 to f1 of its width
const drag=async(page,f0,f1,steps=12,ms=0)=>{const b=await page.locator('#bkStage').boundingBox(),y=b.y+b.height*.35;
 await page.mouse.move(b.x+b.width*f0,y);await page.mouse.down();for(let i=1;i<=steps;i++){await page.mouse.move(b.x+b.width*(f0+(f1-f0)*i/steps),y);if(ms)await page.waitForTimeout(ms)}await page.mouse.up()};

test('List/Book switch: list keeps working, Book opens at page 1 and List comes back',async({page})=>{
 await page.goto('./#/dict');await expect(page.locator('.dc-row')).toHaveCount(500);
 await expect(page.locator('#dcViewList')).toHaveClass(/on/);await page.click('#dcViewBook');
 await expect(page).toHaveURL(/#\/dict\/book\/1$/);await atRest(page,[1]);
 await expect(page.locator('.bk-page .dc-word')).toHaveText(D.words[0].h);await expect(page.locator('#bkInd')).toContainText('1 / 500');
 await expect(page.locator('#bkR')).toBeEnabled();await expect(page.locator('#bkL')).toBeDisabled(); // nothing before page 1
 await page.click('#dcViewList');await expect(page).toHaveURL(/#\/dict$/);await expect(page.locator('.dc-row')).toHaveCount(500)});

test('edge buttons and edge taps turn the page with a 3D leaf; only neighbouring pages exist; last page is remembered',async({page})=>{
 await page.goto('./#/dict/book/1');await atRest(page,[1]);
 await page.evaluate(()=>{window.__leaf=0;window.__maxPages=0;new MutationObserver(()=>{const s=document.querySelector('#bkStage');if(!s)return;if(s.querySelector('.bk-leaf'))window.__leaf++;window.__maxPages=Math.max(window.__maxPages,s.querySelectorAll('.bk-page').length)}).observe(document.body,{subtree:true,childList:true})});
 await page.click('#bkR');await atRest(page,[2]);await expect(page).toHaveURL(/#\/dict\/book\/2$/);
 expect(await page.evaluate(()=>window.__leaf)).toBeGreaterThan(0);expect(await page.evaluate(()=>window.__maxPages)).toBeLessThanOrEqual(3);
 const b=await page.locator('#bkStage').boundingBox();await page.mouse.click(b.x+b.width*.95,b.y+b.height*.03);await atRest(page,[3]); // right edge tap = next (LTR)
 await page.mouse.click(b.x+b.width*.05,b.y+b.height*.03);await atRest(page,[2]); // left edge tap = previous
 await page.locator('#bkStage .bk-page .dc-sheet').first().click({position:{x:150,y:40}});await page.waitForTimeout(800);await atRest(page,[2]); // middle tap: no turn
 expect(await page.evaluate(()=>localStorage.qsDictBook)).toBe('2');
 await page.goto('./#/dict');await page.click('#dcViewBook');await expect(page).toHaveURL(/#\/dict\/book\/2$/);await atRest(page,[2])});

test('swipe in English: drag left = next, drag right = previous, a short drag springs back',async({page})=>{
 await page.goto('./#/dict/book/5');await atRest(page,[5]);
 await drag(page,.85,.25);await atRest(page,[6]);
 await drag(page,.2,.8);await atRest(page,[5]);
 await drag(page,.85,.75,4,120);await atRest(page,[5]); // slow and short: springs back
 await drag(page,.85,.75,2);await atRest(page,[6]); // short but a quick flick: turns
 await page.goto('./#/dict/book/500');await atRest(page,[500]);await drag(page,.85,.2);await atRest(page,[500]); // no page after the last
 await expect(page.locator('#bkR')).toBeDisabled()});

test('Urdu book turns right-to-left: drag right and the left edge go forward',async({page})=>{
 await urdu(page);await page.goto('./#/dict/book/9');await atRest(page,[9]);
 await expect(page.locator('#bkBook')).toHaveClass(/rtl/);await expect(page.locator('.bk-page .dc-no')).toContainText('نمبر');
 await drag(page,.15,.8);await atRest(page,[10]);
 await page.click('#bkL');await atRest(page,[11]);await page.click('#bkR');await atRest(page,[10]);
 await drag(page,.85,.2);await atRest(page,[9]);
 const tr=await page.locator('.bk-page .dc-ex2 .tr').first().textContent();expect(tr).toBe(D.words[8].s[0][5])});

test('a page during the turn: the leaf rotates in 3D and casts a shade',async({page})=>{
 await page.goto('./#/dict/book/20');await atRest(page,[20]);
 const b=await page.locator('#bkStage').boundingBox(),y=b.y+b.height*.4;await page.mouse.move(b.x+b.width*.9,y);await page.mouse.down();
 for(let i=1;i<=6;i++)await page.mouse.move(b.x+b.width*(.9-.05*i),y);
 const t=await page.locator('.bk-leaf').evaluate(e=>e.style.transform);const a=+/rotateY\((-?[\d.]+)deg\)/.exec(t)[1];expect(a).toBeLessThan(-10);expect(a).toBeGreaterThan(-180);
 expect(+await page.locator('.bk-cast').evaluate(e=>e.style.opacity)).toBeGreaterThan(0);
 expect(await page.locator('#bkStage .bk-page[data-r]').evaluateAll(a=>a.map(e=>+e.dataset.r).sort((x,y)=>x-y))).toEqual([20,21]);
 await page.mouse.move(b.x+b.width*.1,y);await page.mouse.up();await atRest(page,[21])});

test('reduced motion: pages change with a fade, never a 3D leaf',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('./#/dict/book/30');await atRest(page,[30]);
 await page.evaluate(()=>{window.__leaf=0;new MutationObserver(()=>{if(document.querySelector('.bk-leaf'))window.__leaf++}).observe(document.body,{subtree:true,childList:true})});
 await page.click('#bkR');await atRest(page,[31]);await drag(page,.85,.2);await atRest(page,[32]);
 expect(await page.evaluate(()=>window.__leaf)).toBe(0)});

test('jump to a word by number or search',async({page})=>{
 await page.goto('./#/dict/book/1');await atRest(page,[1]);
 await page.fill('#bkQ','343');await page.click('#bkGo');await atRest(page,[343]);await expect(page).toHaveURL(/#\/dict\/book\/343$/);
 const i=D.words.findIndex(w=>/Pharaoh/.test(w.e));await page.fill('#bkQ','Pharaoh');await page.press('#bkQ','Enter');await atRest(page,[D.words[i].r]);
 await page.fill('#bkQ','999');await page.click('#bkGo');await atRest(page,[D.words[i].r])});

test('word audio plays on tap, and an example opens the reader; Back returns to the same page',async({page})=>{
 await page.goto('./#/dict/book/36');await atRest(page,[36]);
 await page.locator('.bk-page .dc-hear').click();await expect.poll(()=>page.evaluate(()=>(window.__qplays||[]).length)).toBe(1);
 expect(await page.evaluate(()=>window.__qplays[0])).toBe('https://audio.qurancdn.com/'+D.words[35].s[0][6]);await atRest(page,[36]);
 const [s,a]=D.words[35].x[1];await page.locator('.bk-page .dc-ex2').nth(1).click();
 await expect(page).toHaveURL(new RegExp(`#/surah/${s}/${a}$`));await expect(page.locator('#a'+a)).toBeInViewport();
 await page.goBack();await expect(page).toHaveURL(/#\/dict\/book\/36$/);await atRest(page,[36])});

test('word sheet links to the book at the same word',async({page})=>{
 await page.goto('./#/dict/77');await page.click('#dcToBook');await expect(page).toHaveURL(/#\/dict\/book\/77$/);await atRest(page,[77])});

test('iPad landscape: two-page spread, two pages per turn, RTL order in Urdu',async({page})=>{
 await page.setViewportSize({width:1180,height:820});await page.goto('./#/dict/book/8');await atRest(page,[7,8]);
 await expect(page.locator('#bkInd')).toContainText('7–8 / 500');
 await page.click('#bkR');await atRest(page,[9,10]);await drag(page,.8,.3);await atRest(page,[11,12]);await drag(page,.2,.7);await atRest(page,[9,10]);
 await page.fill('#bkQ','500');await page.click('#bkGo');await atRest(page,[499,500]);await expect(page.locator('#bkR')).toBeDisabled();
 await page.setViewportSize({width:390,height:844});await atRest(page,[499]);
 await urdu(page);await page.setViewportSize({width:1180,height:820});await atRest(page,[499,500]);await page.goto('./#/dict/book/3');await page.reload();await atRest(page,[4,3]); // left page is the later one
 await page.click('#bkL');await atRest(page,[6,5])});
