import {test,expect} from '@playwright/test';
const SEC=[[1,1,7],[2,1,5],[2,102,102],[2,163,164],[2,255,255],[2,285,286],[3,18,19],[7,54,56],[7,117,122],[10,81,82],[20,69,69],[23,115,118],[37,1,10],[46,29,32],[55,33,36],[59,21,24],[72,1,9],[112,1,4],[113,1,5],[114,1,6]];
const N=SEC.reduce((n,[,a,b])=>n+b-a+1,0);
async function mock(page){
 await page.route('https://api.alquran.cloud/v1/surah/**',r=>{const s=+r.request().url().split('/surah/')[1].split('/')[0];r.fulfill({json:{data:{ayahs:Array.from({length:300},(_,i)=>({audio:`https://audio.test/${s}/${i+1}.mp3`}))}}})});
 await page.route('https://audio.test/**',r=>r.fulfill({status:200,contentType:'audio/mpeg',body:''}));
 await page.addInitScript(()=>{localStorage.setItem('instBanner','1');
  // Each ayah "plays" for a short moment so the sequence can be observed.
  const P=HTMLMediaElement.prototype;P.play=function(){window.__played=(window.__played||[]);window.__played.push(this.src);clearTimeout(this.__t);this.__t=setTimeout(()=>this.dispatchEvent(new Event('ended')),window.__dur??80);return Promise.resolve()};
  P.pause=function(){clearTimeout(this.__t)};
  // keep the element from really loading the mocked (empty) files
  Object.defineProperty(P,'src',{configurable:true,get(){return this.__src||''},set(v){this.__src=v}});
})}
test('Ruqyah Shariah: big Home card opens the page with every ruqyah passage from the app text, incl. Al-Baqarah 285–286',async({page})=>{
 await mock(page);await page.goto('./');await page.click('#homeBig a[href="#/ruqyah"]');await expect(page).toHaveURL(/#\/ruqyah/);
 await expect(page.locator('.rq-sec:not(.rq-duas)')).toHaveCount(SEC.length);await expect(page.locator('.rq-a')).toHaveCount(N);
 const refs=await page.locator('.rq-sec .badge').allTextContents();expect(refs).toContain('2:285–286');expect(refs).toContain('2:255');expect(refs[0]).toBe('1');
 // exact text from the app's own Quran file
 const s2=await page.evaluate(()=>fetch('offline/s/ar/2.json').then(r=>r.json()));
 await expect(page.locator('#rq5 .rq-a').first()).toContainText(s2[284]);await expect(page.locator('#rq4 .rq-a')).toContainText(s2[254]);
 await expect(page.locator('.rq-d')).toHaveCount(6)});
test('Play all plays every ruqyah ayah in order with highlight, progress, pause/resume and stop',async({page})=>{
 await mock(page);await page.goto('./#/ruqyah');await page.click('#rqPlay');
 await expect(page.locator('.rq-on')).toHaveCount(1);await expect(page.locator('#rqPlay')).toContainText(/Pause/);
 await expect.poll(()=>page.evaluate(()=>(window.__played||[]).length),{timeout:20000}).toBeGreaterThan(10);
 await page.click('#rqPlay');await expect(page.locator('#rqPlay')).toContainText(/Resume/);const n=await page.evaluate(()=>window.__played.length);await page.waitForTimeout(400);expect(await page.evaluate(()=>window.__played.length)).toBe(n);
 await page.click('#rqPlay');await expect.poll(()=>page.evaluate(()=>window.__played.length),{timeout:30000}).toBeGreaterThanOrEqual(N);await expect.poll(()=>page.evaluate(()=>window.__played.some(u=>/\/2\/286\.mp3$|\/293\.mp3$/.test(u))),{timeout:15000}).toBe(true);
 const p=await page.evaluate(()=>window.__played);expect(p[0]).toBe('https://audio.test/1/1.mp3');await expect.poll(()=>page.evaluate(()=>window.__played.at(-1)),{timeout:15000}).toMatch(/114\/\d+\.mp3$|\/62[23]\d\.mp3$/);
 // tap an ayah to start there, then stop
 await page.locator('#rq5 .rq-a').first().click();await expect.poll(()=>page.evaluate(()=>window.__played.at(-1))).toMatch(/\/2\/285\.mp3$|\/292\.mp3$/);
 await page.click('#rqStop');await expect(page.locator('.rq-on')).toHaveCount(0)});
test('v3.7.10: Play card sits in normal flow above Al-Fatiha; mini player appears only when scrolled past while playing',async({page})=>{
 await mock(page);await page.addInitScript(()=>{window.__dur=1500});await page.goto('./#/ruqyah');
 const t=await page.locator('.rq-top').boundingBox(),f=await page.locator('#rq0').boundingBox();expect(t.y+t.height).toBeLessThanOrEqual(f.y+1);
 expect(await page.locator('.rq-top').evaluate(e=>getComputedStyle(e).position)).toBe('static');await expect(page.locator('#rqMini')).toBeHidden();
 await page.click('#rqPlay');await page.locator('#rq6').scrollIntoViewIfNeeded();await page.evaluate(()=>document.querySelector('#rq6').scrollIntoView());await expect(page.locator('#rqMini')).toBeVisible();
 await page.click('#rqMP');await expect(page.locator('#rqPlay')).toContainText(/Resume/);
 await page.evaluate(()=>document.querySelector('.rq-top').scrollIntoView());await expect(page.locator('#rqMini')).toBeHidden()});
