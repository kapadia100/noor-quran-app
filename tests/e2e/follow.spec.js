import {test,expect} from '@playwright/test';
// v83: auto-follow keeps the playing ayah fully visible between the sticky header and the mini player / tab bar.
async function mock(page,dur){
 await page.route('https://api.alquran.cloud/v1/surah/*/ar.*',r=>r.fulfill({json:{data:{ayahs:Array.from({length:30},(_,i)=>({audio:`https://cdn.islamic.network/quran/audio/128/ar.alafasy/${5242+i}.mp3`}))}}}));
 await page.route('https://cdn.islamic.network/**',r=>r.fulfill({status:200,contentType:'audio/mpeg',body:''}));
 await page.route('https://api.quran.com/**',r=>r.fulfill({json:{audio_files:[]}}));
 await page.addInitScript(d=>{localStorage.setItem('instBanner','1');const P=HTMLMediaElement.prototype;
  P.play=function(){this.__p=false;this.__t0=performance.now();clearTimeout(this.__t);this.__t=setTimeout(()=>{this.__p=true;this.dispatchEvent(new Event('ended'))},/\/1\.mp3$/.test(this.src)?100:d);this.dispatchEvent(new Event('play'));return Promise.resolve()};
  P.pause=function(){clearTimeout(this.__t);this.__p=true;this.dispatchEvent(new Event('pause'))};
  Object.defineProperty(P,'paused',{configurable:true,get(){return this.__p!==false}});
  Object.defineProperty(P,'currentTime',{configurable:true,get(){return this.__p===false?(performance.now()-this.__t0)/1000:0},set(){}});
  Object.defineProperty(P,'src',{configurable:true,get(){return this.__src||''},set(v){this.__src=v}})},dur)}
const inBand=page=>page.evaluate(()=>{const a=document.querySelector('.ayah.playing');if(!a)return 'none';const r=a.getBoundingClientRect();
 const h=document.querySelector('header').getBoundingClientRect().bottom;const p=document.getElementById('player').getBoundingClientRect().top;
 const n=document.querySelector('nav[aria-label="Main"]')?.getBoundingClientRect().top??innerHeight;const bot=Math.min(p,n);
 return r.height>bot-h?(Math.abs(r.top-h)<24?'ok':`tall top ${r.top} vs ${h}`):(r.top>=h-1&&r.bottom<=bot+1?'ok':`${r.top}-${r.bottom} not in ${h}-${bot}`)});
test('active ayah is scrolled fully into view between header and mini player',async({page})=>{
 await mock(page,900);await page.goto('./#/surah/67');await page.locator('[data-play="0"]').click();
 for(const n of [3,5,7]){await expect(page.locator(`#a${n}.playing`)).toBeVisible({timeout:8000});await expect.poll(()=>inBand(page),{timeout:3000}).toBe('ok')}});
test('manual scroll pauses auto-follow briefly',async({page})=>{
 await mock(page,700);await page.goto('./#/surah/67');await page.locator('[data-play="0"]').click();await expect(page.locator('#a2.playing')).toBeVisible({timeout:8000});
 await page.mouse.move(200,300);await page.mouse.wheel(0,-2000);await page.waitForTimeout(300);
 const y=await page.evaluate(()=>(document.getElementById('app').scrollTop||0)+scrollY);
 await expect(page.locator('#a3.playing')).toBeVisible({timeout:8000});await page.waitForTimeout(500);
 expect(Math.abs(await page.evaluate(()=>(document.getElementById('app').scrollTop||0)+scrollY)-y)).toBeLessThan(5)});
