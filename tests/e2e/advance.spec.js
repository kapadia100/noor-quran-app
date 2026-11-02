import {test,expect} from '@playwright/test';
// t232u: the reader must keep going ayah after ayah (incl. across the Bismillah) with the playing highlight + follow-scroll on.
let errors=[];
test.beforeEach(async({page})=>{errors=[];page.on('pageerror',e=>errors.push(String(e)))});
test.afterEach(()=>expect(errors).toEqual([]));
const end=page=>page.evaluate(()=>window.__audio.dispatchEvent(new Event('ended')));
for(const [s,from] of [[2,0],[1,0],[113,0]])test(`surah ${s}: plays 4 consecutive ayahs from ended alone, highlight follows`,async({page})=>{
 await page.goto(`./#/surah/${s}`);await page.waitForSelector('.ayah');await page.evaluate(()=>window.__audio.muted=true);
 await page.click(`[data-play="${from}"]`);await expect(page.locator('#pInfo')).toContainText(`${s}:1`);
 const parts=await page.evaluate(()=>window.__cur?.()?.urls?.[0]?.length??1);
 for(let k=1;k<parts;k++)await end(page); // Bismillah clip(s) before 2:1
 for(let a=2;a<=5;a++){
  // gapless: the next clip is set and play() called inside the same 'ended' task, before any await/highlight work
  expect(await page.evaluate(()=>{const A=window.__audio;let played=false;const o=A.play;A.play=function(){played=true;return o.call(this)};A.dispatchEvent(new Event('ended'));A.play=o;const c=window.__cur();return played&&A.src===c.urls[c.i][0].u})).toBe(true);await expect(page.locator('#pInfo')).toContainText(`${s}:${a}`);
  await expect(page.locator(`#a${a}.playing`)).toHaveCount(1);await expect(page.locator('.ayah.playing')).toHaveCount(1);
  await expect.poll(()=>page.evaluate(()=>window.__audio.paused)).toBe(false)}
});
test('real playback (fast) advances by itself across 3 ayahs',async({page})=>{test.setTimeout(90000);
 await page.goto('./#/surah/1');await page.waitForSelector('.ayah');await page.evaluate(()=>{const a=window.__audio;a.muted=true;a.addEventListener('loadedmetadata',()=>{try{a.currentTime=Math.max(0,a.duration-0.3)}catch{/* */}})});
 await page.click('[data-play="0"]');await expect(page.locator('#pInfo')).toContainText('1:4',{timeout:60000});
});
