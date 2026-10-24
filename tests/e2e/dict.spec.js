import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const rd=p=>JSON.parse(fs.readFileSync(new URL('../../public/offline/'+p,import.meta.url),'utf8'));
const D=rd('x/dict.json'),IDX=rd('x/dict-idx.json');
let errors=[];
test.beforeEach(async({page})=>{errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&!/net::|Failed to load resource|tile\.openstreetmap/.test(m.text()))errors.push(m.text())});
 await page.route('https://gc.zgo.at/count.js',r=>r.fulfill({contentType:'text/javascript',body:'window.goatcounter.count=function(o){}'}));
 await page.route('**/quransafar.goatcounter.com/**',r=>r.fulfill({status:204}));
 await page.addInitScript(()=>{if(!sessionStorage.getItem('qsD')){sessionStorage.setItem('qsD','1');localStorage.setItem('instBanner','1')}})});
test.afterEach(async({page})=>{expect(errors).toEqual([]);const ov=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);expect(ov).toBeLessThanOrEqual(1)});
const plays=page=>page.evaluate(()=>window.__qplays||[]);
const store=page=>page.evaluate(()=>JSON.parse(localStorage.qsDict||'{"w":{}}'));

test('More tab has the Quran Dictionary tile; Home does not',async({page})=>{
 await page.goto('./#/more');await expect(page.locator('a[href="#/dict"]')).toHaveCount(1);
 await page.locator('a[href="#/dict"]').click();await expect(page).toHaveURL(/#\/dict$/);await expect(page.locator('nav button.on')).toHaveAttribute('data-r','#/more');
 await page.goto('./#/');await expect(page.locator('a[href="#/dict"]')).toHaveCount(0)});

test('list: 500 words, rank order, honest coverage line, no source names in the UI',async({page})=>{
 await page.goto('./#/dict');await expect(page.locator('.dc-row')).toHaveCount(500);
 await expect(page.locator('#dcCnt')).toHaveText('500 words');
 await expect(page.locator('.dc-row').first()).toContainText('1');await expect(page.locator('.dc-row').first()).toContainText(D.words[0].t);
 await expect(page.locator('#dcProg')).toContainText('81.48%');await expect(page.locator('#dcPct')).toHaveText('0%');
 const txt=await page.locator('#app').innerText();expect(/quran\.com|corpus|tanzil|http/i.test(txt)).toBe(false);
 await expect(page.locator('#dcLv .dc-chip')).toHaveCount(8)});

test('search: Arabic with and without harakat, English, Urdu, transliteration; empty state',async({page})=>{
 await page.goto('./#/dict');const q=page.locator('#dcQ');
 await q.fill('الله');await expect(page.locator('.dc-row').first()).toHaveAttribute('data-r','2');
 await q.fill('ٱللَّهُ');await expect(page.locator('.dc-row').first()).toHaveAttribute('data-r','2');
 await q.fill('messenger');await expect(page.locator('.dc-row').first()).toHaveAttribute('data-r','36');
 await q.fill('rasul');await expect(page.locator('.dc-row').first()).toHaveAttribute('data-r','36');
 await q.fill('زمین');await expect(page.locator('.dc-row[data-r="23"]')).toHaveCount(1);
 await q.fill('zzzzqx');await expect(page.locator('#dcEmpty')).toBeVisible();await expect(page.locator('#dcCnt')).toHaveText('0 words')});

test('levels, sort and filters',async({page})=>{
 await page.goto('./#/dict');
 await page.locator('#dcLv [data-lv="2"]').click();
 const rs=await page.locator('.dc-row').evaluateAll(e=>e.map(x=>+x.dataset.r));expect(rs[0]).toBeGreaterThan(1);expect(rs).toEqual([...rs].sort((x,y)=>x-y));expect(rs.length).toBeLessThan(500);
 await page.locator('#dcLv [data-lv="0"]').click();await page.selectOption('#dcSort','l');await expect(page.locator('.dc-row').first()).toHaveAttribute('data-r','500');
 await page.selectOption('#dcSort','f');await page.locator('#dcFl [data-f="known"]').click();await expect(page.locator('.dc-row')).toHaveCount(0);
 await page.locator('#dcFl [data-f="star"]').click();await expect(page.locator('#dcEmpty')).toContainText('Add to practice list')});

test('entry: all fields, hear plays the word clip, know + practice-list persist and update progress',async({page})=>{
 await page.goto('./#/dict/36');const w=D.words[35];
 await expect(page.locator('.dc-word')).toHaveText(w.h);await expect(page.locator('.dc-tr')).toHaveText(w.t);await expect(page.locator('.dc-mn')).toHaveText(w.e);await expect(page.locator('.dc-mn2')).toHaveText(w.u);
 await expect(page.locator('.dc-facts')).toContainText(w.n.toLocaleString());await expect(page.locator('.dc-ex')).toHaveCount(2);
 await page.click('#dcHear');await expect.poll(()=>plays(page)).toEqual(['https://audio.qurancdn.com/'+w.s[0][6]]);
 await page.locator('.dc-hw').nth(1).click();await expect.poll(async()=>(await plays(page)).length).toBe(2);
 await page.click('#dcKnow');await expect(page.locator('#dcKnow')).toHaveAttribute('aria-pressed','true');await page.click('#dcStar');
 let s=await store(page);expect(s.w[36].k).toBe(true);expect(s.w[36].s).toBe(true);
 await page.reload();await expect(page.locator('#dcKnow')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#dcStar')).toHaveAttribute('aria-pressed','true');
 await page.goto('./#/dict');await expect(page.locator('#dcPct')).toHaveText(new RegExp('^'+String(Math.round(100*w.n/77429*10)/10)+'%'));
 await expect(page.locator('.dc-row[data-r="36"] .dc-k')).toHaveText('✓');
 await page.locator('#dcFl [data-f="star"]').click();await expect(page.locator('.dc-row')).toHaveCount(1);
 await page.goto('./#/dict/36');await page.click('#dcKnow');await page.click('#dcStar');s=await store(page);expect(s.w[36]).toBeUndefined();
 await page.locator('a[aria-label="Next word"]').click();await expect(page).toHaveURL(/#\/dict\/37$/)});

test('flashcards: flip, rate, 10 cards, summary with understood %; spaced repetition saved',async({page})=>{
 await page.goto('./#/dict/quiz');await expect(page.locator('#dcCards')).toBeVisible();await page.click('#dcCards');
 for(let i=0;i<10;i++){await expect(page.locator('#dcPg')).toHaveText(`${i+1} / 10`);await page.click('#dcFlip');await expect(page.locator('.dc-mn')).toBeVisible();await page.click(i%3===0?'#dcNo':'#dcYes')}
 await expect(page.locator('#dcSum')).toContainText('6 / 10');await expect(page.locator('#dcSum')).toContainText('of the Quran’s words');await expect(page.locator('.dc-pill')).toHaveCount(4);
 const s=await store(page);expect(Object.keys(s.w)).toHaveLength(10);expect(s.w[1].b).toBe(0);expect(s.w[2].b).toBe(1);
 await page.click('#dcAgain');await expect(page.locator('#dcPg')).toHaveText('1 / 10');
 // the wrong answers are only due in minutes, so the next session moves on to new words
 await expect(page.locator('.dc-word')).not.toHaveText(D.words[0].h);await expect(page).toHaveURL(/#\/dict\/quiz\/cards$/)});

test('quiz: multiple choice with feedback; right and wrong answers are graded and counted',async({page})=>{
 await page.goto('./#/dict/quiz/mc');let right=0;
 for(let i=0;i<10;i++){await expect(page.locator('#dcPg')).toHaveText(`${i+1} / 10`);await expect(page.locator('#dcOpts .dc-opt')).toHaveCount(4);
  const ranks=await page.locator('.dc-opt').evaluateAll(e=>e.map(x=>+x.dataset.r));expect(new Set(ranks).size).toBe(4);
  await page.locator('#dcOpts .dc-opt').nth(i%2?0:1).click();await expect(page.locator('.dc-fb')).toBeVisible();
  const ok=(await page.locator('.dc-opt.ok').count())===1&&(await page.locator('.dc-opt.bad').count())===0;if(ok)right++;
  await expect(page.locator('.dc-opt.ok')).toHaveCount(1);await expect(page.locator('.dc-opt:not([disabled])')).toHaveCount(0);
  await page.click('#dcNext')}
 await expect(page.locator('#dcSum')).toContainText(`${right} / 10`);const s=await store(page);expect(Object.keys(s.w)).toHaveLength(10);
 const wrong=Object.values(s.w).filter(e=>e.w).length;expect(wrong).toBe(10-right)});

test('Practice-list only session and empty session message',async({page})=>{
 await page.goto('./#/dict/36');await page.click('#dcStar');await page.goto('./#/dict/quiz');await expect(page.locator('a[href="#/dict/quiz/cards-star"]')).toBeVisible();
 await page.click('a[href="#/dict/quiz/cards-star"]');await expect(page.locator('#dcPg')).toHaveText('1 / 1');await expect(page.locator('.dc-word')).toHaveText(D.words[35].h)});

test('reader: with word-by-word on, a tapped word links to its dictionary entry',async({page})=>{
 const word=(t,i)=>({char_type_name:'word',text_uthmani:t,translation:{text:'x'+i},transliteration:{text:'t'+i},audio_url:null});
 await page.route('https://api.quran.com/api/v4/verses/by_chapter/1*',r=>r.fulfill({json:{verses:[1,2,3,4,5,6,7].map(n=>({verse_number:n,words:n===2?[word('ٱلْحَمْدُ',1),word('لِلَّهِ',2),word('رَبِّ',3),word('ٱلْعَٰلَمِينَ',4)]:[word('x',1),word('y',2)]})),pagination:{total_pages:1}}}));
 const rank=k=>{const m=new RegExp('(?:^|;)2:([^;]*)').exec(IDX[1]);return m[1].split(',').map(p=>p.split('.').map(Number)).find(p=>p[0]===k)?.[1]||0};
 const r3=rank(3);expect(r3).toBeGreaterThan(0);
 await page.goto('./#/surah/1');await page.waitForSelector('.ayah');await page.click('#wbwT');await expect(page.locator('#a2 .w').first()).toBeVisible({timeout:20000});
 await page.locator('#a2 .w').nth(2).click();const link=page.locator('#wtip a.dlink');await expect(link).toHaveAttribute('href','#/dict/'+r3);
 await link.click();await expect(page).toHaveURL(new RegExp('#/dict/'+r3+'$'));await expect(page.locator('.dc-word')).toHaveText(D.words[r3-1].h)});

for(const dark of [false,true])for(const ui of ['en','ur'])test(`layout at 390px: list, entry, flashcard, quiz, summary (${dark?'dark':'light'}, ${ui})`,async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.addInitScript(([d,u])=>{if(!sessionStorage.getItem('qsL')){sessionStorage.setItem('qsL','1');localStorage.setItem('settings',JSON.stringify({dark:d,ui:u}))}},[dark,ui]);
 const over=()=>page.evaluate(()=>[...document.querySelectorAll('#app *')].filter(e=>{const r=e.getBoundingClientRect();if(!r.width)return false;let p=e.parentElement;while(p&&p!==document.body){const o=getComputedStyle(p).overflowX;if(o==='auto'||o==='scroll'||o==='hidden')return false;p=p.parentElement}return r.right>391||r.left<-1}).map(e=>e.tagName+'.'+e.className).slice(0,5));
 for(const r of ['dict','dict/2','dict/357','dict/quiz','dict/quiz/cards','dict/quiz/mc']){await page.goto('./#/'+r);await page.waitForSelector('#app section');await page.waitForTimeout(250);expect(await over(),r).toEqual([])}
 await page.goto('./#/dict/quiz/cards');await page.click('#dcFlip');expect(await over()).toEqual([]);
 for(let i=0;i<10;i++){if(i)await page.click('#dcFlip');await page.click('#dcNo')}await expect(page.locator('#dcSum')).toBeVisible();expect(await over()).toEqual([])});

test('service worker: v31 precaches the dictionary data',async({request,baseURL})=>{
 const sw=await (await request.get(new URL('sw.js',baseURL).href)).text();expect(sw).toMatch(/qsafar-v31/);expect(sw).toContain('offline/x/dict.json');expect(sw).toContain('offline/x/dict-idx.json');
 for(const f of ['offline/x/dict.json','offline/x/dict-idx.json']){const r=await request.get(new URL(f,baseURL).href);expect(r.ok()).toBe(true)}});
