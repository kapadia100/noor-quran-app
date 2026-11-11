import {test,expect} from '@playwright/test';
// v86: recitation keeps playing when the app goes to the background / the phone locks; lock-screen controls work.
const hide=page=>page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>'hidden'});document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('blur'))});
const spy=page=>page.addInitScript(()=>{window.__ms={};if('mediaSession' in navigator){const o=navigator.mediaSession.setActionHandler.bind(navigator.mediaSession);navigator.mediaSession.setActionHandler=(a,f)=>{window.__ms[a]=f;try{o(a,f)}catch{/* unsupported */}}}});
test('reader: going to the background does not pause; lock-screen handlers incl. stop; playback audio session',async({page})=>{
 await spy(page);await page.goto('./#/surah/1');await page.waitForSelector('.ayah');await page.evaluate(()=>window.__audio.muted=true);
 await page.click('[data-play="0"]');await expect.poll(()=>page.evaluate(()=>window.__audio.paused)).toBe(false);
 await hide(page);await page.waitForTimeout(800);expect(await page.evaluate(()=>window.__audio.paused)).toBe(false);
 const hs=await page.evaluate(()=>Object.keys(window.__ms).filter(k=>window.__ms[k]));for(const a of['play','pause','previoustrack','nexttrack','stop'])expect(hs).toContain(a);
 expect(await page.evaluate(()=>navigator.mediaSession.metadata?.artwork?.length)).toBeGreaterThan(0);
 await page.evaluate(()=>window.__ms.nexttrack());await expect(page.locator('#pInfo')).toContainText('1:2');
 await page.evaluate(()=>window.__ms.pause());await expect.poll(()=>page.evaluate(()=>window.__audio.paused)).toBe(true);
 await page.evaluate(()=>window.__ms.play());await expect.poll(()=>page.evaluate(()=>window.__audio.paused)).toBe(false);
});
test('ruqyah: sequence advances on ended while hidden, next ayah preloaded, lock-screen controls',async({page})=>{
 await spy(page);
 await page.route('https://api.alquran.cloud/v1/surah/**',r=>{const s=+r.request().url().split('/surah/')[1].split('/')[0];r.fulfill({json:{data:{ayahs:Array.from({length:300},(_,i)=>({audio:`https://audio.test/${s}/${i+1}.mp3`}))}}})});
 await page.route('https://audio.test/**',r=>r.fulfill({status:200,contentType:'audio/mpeg',body:''}));await page.context().route('https://everyayah.com/**',r=>r.fulfill({status:404,body:''}));// clip-by-clip path (joined clips: gapless.spec.js)
 await page.addInitScript(()=>{localStorage.setItem('instBanner','1');const P=HTMLMediaElement.prototype;
  P.play=function(){(window.__played=window.__played||[]).push(this.src);clearTimeout(this.__t);this.__t=setTimeout(()=>this.dispatchEvent(new Event('ended')),150);return Promise.resolve()};P.pause=function(){clearTimeout(this.__t)};
  Object.defineProperty(P,'src',{configurable:true,get(){return this.__src||''},set(v){this.__src=v;(window.__srcs=window.__srcs||[]).push(v)}})});
 await page.goto('./#/ruqyah');await page.click('#rqPlay');await expect.poll(()=>page.evaluate(()=>(window.__played||[]).length)).toBeGreaterThan(0);
 await hide(page);const n=await page.evaluate(()=>window.__played.length);
 await expect.poll(()=>page.evaluate(()=>window.__played.length),{timeout:10000}).toBeGreaterThan(n+2);
 expect(await page.evaluate(()=>window.__srcs.includes('https://audio.test/1/3.mp3'))).toBe(true);
 expect(await page.evaluate(()=>navigator.mediaSession.metadata?.title)).toMatch(/Ruqyah/);
 for(const a of['play','pause','previoustrack','nexttrack','stop'])expect(await page.evaluate(a=>typeof window.__ms[a],a)).toBe('function');
 await page.evaluate(()=>window.__ms.stop());await expect(page.locator('.rq-on')).toHaveCount(0);
});
