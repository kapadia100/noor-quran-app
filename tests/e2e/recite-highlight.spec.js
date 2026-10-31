import {test,expect} from '@playwright/test';
// v79: Bismillah before ayah 1 + ayah glow + word-by-word follow during Quran playback.
async function mock(page,dur=80){
 await page.route('https://api.alquran.cloud/v1/surah/*/ar.*',r=>{const s=+r.request().url().split('/surah/')[1].split('/')[0];let g=0;const C=[7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];for(let k=0;k<s-1;k++)g+=C[k];
  r.fulfill({json:{data:{ayahs:Array.from({length:C[s-1]},(_,i)=>({audio:`https://cdn.islamic.network/quran/audio/128/ar.alafasy/${g+i+1}.mp3`}))}}})});
 await page.route('https://cdn.islamic.network/**',r=>r.fulfill({status:200,contentType:'audio/mpeg',body:''}));
 await page.route('https://api.quran.com/api/v4/recitations/7/by_chapter/**',r=>{const s=+r.request().url().split('/by_chapter/')[1].split('?')[0];
  r.fulfill({json:{audio_files:[{verse_key:`${s}:1`,segments:Array.from({length:9},(_,k)=>[k,k+1,k*400,k*400+390])},{verse_key:`${s}:2`,segments:Array.from({length:11},(_,k)=>[k,k+1,k*400,k*400+390])}]}})});
 await page.addInitScript(d=>{localStorage.setItem('instBanner','1');window.__dur=d;
  const P=HTMLMediaElement.prototype;P.play=function(){(window.__played=window.__played||[]).push(this.src);this.__p=false;this.__t0=performance.now();clearTimeout(this.__t);this.__t=setTimeout(()=>{this.__p=true;this.dispatchEvent(new Event('ended'))},/\/1\.mp3$/.test(this.src)?200:window.__dur);this.dispatchEvent(new Event('play'));return Promise.resolve()};
  P.pause=function(){clearTimeout(this.__t);this.__p=true;this.__pt=this.currentTime;this.dispatchEvent(new Event('pause'))};
  Object.defineProperty(P,'paused',{configurable:true,get(){return this.__p!==false}});
  Object.defineProperty(P,'currentTime',{configurable:true,get(){return this.__p===false?(performance.now()-this.__t0)/1000:(this.__pt||0)},set(){}});
  Object.defineProperty(P,'src',{configurable:true,get(){return this.__src||''},set(v){this.__src=v}})},dur)}
const startAt=async(page,s,i=0)=>{await page.goto(`./#/surah/${s}`);await page.locator(`[data-play="${i}"]`).waitFor();await page.evaluate(()=>{window.__audio?.pause();window.__played=[]});await page.locator(`[data-play="${i}"]`).click()};
test('Al-Mulk from ayah 1: reciter Bismillah (1:1) first, then 67:1; Fatiha not doubled; At-Tawbah none',async({page})=>{
 await mock(page);await startAt(page,67);
 await expect.poll(()=>page.evaluate(()=>(window.__played||[]).length)).toBeGreaterThan(2);
 const p=await page.evaluate(()=>window.__played);expect(p[0]).toMatch(/ar\.alafasy\/1\.mp3$/);expect(p[1]).toMatch(/\/5242\.mp3$/);expect(p.filter(u=>/\/1\.mp3$/.test(u)).length).toBe(1);
 await startAt(page,1);await expect.poll(()=>page.evaluate(()=>window.__played.length)).toBeGreaterThan(1);
 expect((await page.evaluate(()=>window.__played)).slice(0,2).map(u=>u.split('/').pop())).toEqual(['1.mp3','2.mp3']);
 await startAt(page,9);await expect.poll(()=>page.evaluate(()=>window.__played.length)).toBeGreaterThan(0);
 expect((await page.evaluate(()=>window.__played))[0]).toMatch(/\/1236\.mp3$/)});
test('playing ayah glows gold and each word is highlighted in sync (light + dark), text unchanged',async({page})=>{
 await mock(page,3600);await page.goto('./#/surah/67');const before=await page.locator('#a1 p.ar').textContent();
 await page.locator('[data-play="0"]').click();
 await expect(page.locator('#a1.ayah.playing')).toBeVisible();
 await expect(page.locator('#a1 .wplay')).toHaveCount(1,{timeout:5000});const w1=await page.locator('#a1 .wplay').textContent();
 await expect.poll(()=>page.locator('#a1 .wplay').textContent(),{timeout:3000}).not.toBe(w1);
 expect(await page.locator('#a1 p.ar').textContent()).toBe(before);
 const bg=await page.locator('#a1').evaluate(e=>getComputedStyle(e).animationName);expect(bg).toBe('qsGlow');
 if(process.env.SHOTS){await page.waitForTimeout(600);await page.screenshot({path:'/workspace/shots-reader/reader-playing-dark.png'});
  await page.evaluate(()=>document.documentElement.setAttribute('data-theme','light'));await page.waitForTimeout(300);await page.screenshot({path:'/workspace/shots-reader/reader-playing-light.png'})}
 await page.locator('#a2').waitFor();await expect(page.locator('#a2.playing')).toBeVisible({timeout:8000})});
