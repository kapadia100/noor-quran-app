import {test,expect} from '@playwright/test';
import fs from 'node:fs';
// Reciters with no timed surah file, and the Ruqyah list: the ayah clips are joined into one stream, so nothing stops
// between ayahs. The clip host is served from a small local MP3 (0.5 s per "ayah") so the test is fast and offline-safe.
const MP3=fs.readFileSync(new URL('../fixtures/mp3/b.mp3',import.meta.url));
const clips=page=>page.route('https://everyayah.com/**',r=>r.fulfill({status:200,contentType:'audio/mpeg',body:MP3,headers:{'access-control-allow-origin':'*'}}));
/** Wall-clock time the audio position stood still (not paused by the user) while watching. */
const watch=(page,ms,probe)=>page.evaluate(([ms,probe])=>new Promise(res=>{const a=probe==='rq'?window.__rq.au:window.__audio;const out={stalls:[],srcs:[],seen:[]};let last=null,stuck=0;const t0=performance.now();
 const id=setInterval(()=>{const now=performance.now(),k=probe==='rq'?window.__rq.state().i:window.__cur()?.i;if(out.seen.at(-1)!==k)out.seen.push(k);if(out.srcs.at(-1)!==a.src)out.srcs.push(a.src);
  if(last&&a.currentTime===last.t&&a.src===last.src||last&&a.src!==last.src&&a.currentTime<0.02)stuck+=now-last.now;else{if(stuck>25)out.stalls.push(Math.round(stuck));stuck=0}
  last={now,t:a.currentTime,src:a.src};if(now-t0>ms){clearInterval(id);res(out)}},10)}),[ms,probe]);
test('reader: a reciter without a timed surah file plays the joined clips with no stop between ayahs, across chunks and into the next surah',async({page})=>{
 await clips(page);
 await page.addInitScript(()=>{localStorage.setItem('instBanner','1');localStorage.setItem('settings',JSON.stringify({reciter:'ar.mahermuaiqly',amode:'ar',surahAudio:true,flowV:1,continuous:true,autoNext:true}))});
 await page.goto('./#/surah/1');await page.waitForSelector('#a1');await page.evaluate(()=>{window.__audio.muted=true});await page.click('#playAll');
 await expect.poll(()=>page.evaluate(()=>{const c=window.__cur(),a=window.__audio;return !!(c?.flow?.st&&a.src.startsWith('blob:')&&a.currentTime>0.02&&!a.paused)}),{timeout:20000}).toBe(true);
 const f=await page.evaluate(()=>{const st=window.__cur().flow.st;return {first:st.first,last:st.last,n:window.__cur().flow.verses.length}});
 expect(f).toEqual({first:0,last:3,n:4});
 const w=await watch(page,5200);
 console.log('joined clips: stalls',JSON.stringify(w.stalls),'ayahs',w.seen.join(','),'files',w.srcs.length);
 // ayahs 1-4 come from one file (no new clip between them), then the next chunk and the next surah follow
 expect(w.seen.slice(0,4)).toEqual([0,1,2,3]);expect(w.srcs.length).toBeLessThanOrEqual(3);
 expect(Math.max(0,...w.stalls)).toBeLessThan(200);
 expect(await page.evaluate(()=>window.__audio.paused)).toBe(false)});
test('reader: the ayah highlight and Next follow the joined stream',async({page})=>{
 await clips(page);
 await page.addInitScript(()=>{localStorage.setItem('instBanner','1');localStorage.setItem('settings',JSON.stringify({reciter:'ar.aymanswoaid',amode:'ar',surahAudio:true,flowV:1,continuous:true,autoNext:false}))});
 await page.addInitScript(()=>localStorage.setItem('qsRate','0.5'));
 await page.goto('./#/surah/112');await page.waitForSelector('#a1');await page.evaluate(()=>{window.__audio.muted=true});await page.click('#playAll');
 await expect.poll(()=>page.evaluate(()=>!!window.__cur()?.flow?.st&&window.__audio.currentTime>0.02),{timeout:20000}).toBe(true);
 await expect(page.locator('#a1.playing')).toHaveCount(1);
 await expect(page.locator('#a2.playing')).toHaveCount(1,{timeout:5000});
 const src=await page.evaluate(()=>window.__audio.src);expect(src).toMatch(/^blob:/);
 await page.click('#pNext');await expect(page.locator('#a3.playing')).toHaveCount(1,{timeout:5000});
 await expect(page.locator('#pInfo')).toContainText('112:3')});
test('Ruqyah: Play all runs the ayat as one joined stream, highlight moving with the recitation',async({page})=>{
 await clips(page);await page.addInitScript(()=>localStorage.setItem('instBanner','1'));
 await page.goto('./#/ruqyah');await page.waitForSelector('#rqPlay');await page.waitForFunction(()=>window.__rq);await page.evaluate(()=>{window.__rq.au.muted=true});await page.click('#rqPlay');
 await expect.poll(()=>page.evaluate(()=>window.__rq.au.src.startsWith('blob:')&&window.__rq.au.currentTime>0.02&&window.__rq.state().state==='playing'),{timeout:20000}).toBe(true);
 const w=await watch(page,5200,'rq');
 console.log('ruqyah joined: stalls',JSON.stringify(w.stalls),'ayahs',w.seen.join(','),'files',w.srcs.length);
 expect(w.seen.slice(0,6)).toEqual([0,1,2,3,4,5]);expect(w.srcs.length).toBeLessThanOrEqual(3);expect(Math.max(0,...w.stalls)).toBeLessThan(200);
 await expect(page.locator('.rq-on')).toHaveCount(1);
 // tap an ayah: playback restarts there, still joined
 await page.locator('#rq4 .rq-a').first().click();
 await expect.poll(()=>page.evaluate(()=>window.__rq.state().i)).toBe(await page.locator('#rq4 .rq-a').first().getAttribute('data-i').then(Number));
 await expect.poll(()=>page.evaluate(()=>window.__rq.au.src.startsWith('blob:'))).toBe(true);
 await page.evaluate(()=>document.querySelector('#rqMStop').click());await expect(page.locator('.rq-on')).toHaveCount(0)});
