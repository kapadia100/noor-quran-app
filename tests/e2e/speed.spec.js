import {test,expect} from '@playwright/test';
// t241u: one playback speed under the big gold Pause, shared by the reader, Ruqyah and Hadith audio.
let errors=[];test.beforeEach(async({page})=>{errors=[];page.on('pageerror',e=>errors.push(String(e)))});test.afterEach(()=>expect(errors).toEqual([]));
async function mock(page,o={}){
 await page.context().route('https://api.quran.com/api/v4/chapter_recitations/**',r=>r.fulfill({json:{audio_file:null}}));
 await page.route('https://api.alquran.cloud/v1/surah/**',r=>{const s=+r.request().url().split('/surah/')[1].split('/')[0];r.fulfill({json:{data:{ayahs:Array.from({length:300},(_,i)=>({audio:`https://audio.test/${s}/${i+1}.mp3`}))}}})});
 await page.route('https://audio.test/**',r=>r.fulfill({status:200,contentType:'audio/mpeg',body:''}));
 await page.addInitScript(o=>{localStorage.setItem('instBanner','1');if(!sessionStorage.qsS){sessionStorage.qsS=1;localStorage.setItem('settings',JSON.stringify(o))}
  const P=HTMLMediaElement.prototype;window.__rates=[];P.play=function(){window.__rates.push([this.__src,this.playbackRate,this.preservesPitch]);clearTimeout(this.__t);this.__p=false;this.__t=setTimeout(()=>this.dispatchEvent(new Event('ended')),window.__dur??60000);this.dispatchEvent(new Event('play'));return Promise.resolve()};
  P.pause=function(){clearTimeout(this.__t);this.__p=true;this.dispatchEvent(new Event('pause'))};Object.defineProperty(P,'paused',{configurable:true,get(){return this.__p!==false}});
  Object.defineProperty(P,'src',{configurable:true,get(){return this.__src||''},set(v){this.__src=v;this.dispatchEvent(new Event('loadstart'))}})},o)}
const pick=async(page,sel,r)=>{await page.click(sel);await expect(page.locator('.sp-pop .sp-c')).toHaveCount(6);await page.click(`.sp-pop .sp-c[data-r="${r}"]`);await expect(page.locator('.sp-pop')).toHaveCount(0)};
const under=async(page,play,pill)=>{const [a,b]=await Promise.all([play,pill].map(s=>page.locator(s).boundingBox()));expect(Math.abs((a.x+a.width/2)-(b.x+b.width/2))).toBeLessThanOrEqual(1.5);expect(b.y).toBeGreaterThan(a.y+a.height/2);return b};
for(const [ui,dark] of [['en',false],['ur',true]])
test('reader: speed pill sits under the gold Pause; 6 chips; rate applies to the current, next and preloaded clip, keeps pitch, and persists '+ui,async({page})=>{
 await mock(page,{ui,dark});await page.goto('./#/surah/1');await page.waitForSelector('.ayah');await page.click('#playAll');await expect(page.locator('#player')).toBeVisible();
 await expect(page.locator('#player [data-sp]')).toHaveText('1×');const b=await under(page,'#pPlay','#player [data-sp]');expect(b.height).toBeGreaterThanOrEqual(18);
 await page.click('#player [data-sp]');await expect(page.locator('.sp-pop .sp-c')).toHaveText(['.5×','.75×','1×','1.25×','1.5×','2×']);await expect(page.locator('.sp-pop .sp-c.on')).toHaveText('1×');
 const p=await page.locator('.sp-pop').boundingBox();const vw=page.viewportSize().width;expect(p.x).toBeGreaterThanOrEqual(0);expect(p.x+p.width).toBeLessThanOrEqual(vw);
 await page.click('.sp-pop .sp-c[data-r="1.5"]');await expect(page.locator('#player [data-sp]')).toHaveText('1.5×');
 expect(await page.evaluate(()=>[window.__audio.playbackRate,window.__audio.preservesPitch])).toEqual([1.5,true]);
 await page.click('#pNext');await expect.poll(()=>page.evaluate(()=>window.__rates.at(-1)[1])).toBe(1.5);expect(await page.evaluate(()=>window.__rates.at(-1)[2])).toBe(true);
 await page.evaluate(()=>window.__audio.dispatchEvent(new Event('ended')));await expect.poll(()=>page.evaluate(()=>window.__rates.length)).toBeGreaterThan(2);
 expect(await page.evaluate(()=>window.__rates.slice(1).every(r=>r[1]===1.5))).toBe(true);
 await page.reload();await page.waitForSelector('.ayah');await page.click('#playAll');await expect(page.locator('#player [data-sp]')).toHaveText('1.5×');expect(await page.evaluate(()=>window.__audio.playbackRate)).toBe(1.5);
 await pick(page,'#player [data-sp]',1);expect(await page.evaluate(()=>window.__audio.playbackRate)).toBe(1)});
test('ruqyah: same pill under its Pause; rate sticks across every ayah',async({page})=>{
 await mock(page,{});await page.goto('./#/ruqyah');await page.click('#rqPlay');await expect(page.locator('.rq-on')).toHaveCount(1);await page.waitForTimeout(400);await page.evaluate(()=>document.querySelector('#rq6').scrollIntoView());await expect(page.locator('#rqMini')).toBeVisible();
 await under(page,'#rqMini .pl-p','#rqMini [data-sp]');await pick(page,'#rqMini [data-sp]',0.75);
 const n=await page.evaluate(()=>window.__rates.length);await page.evaluate(()=>window.__dur=50);await page.click('#rqMini .pl-s >> nth=1');
 await expect.poll(()=>page.evaluate(()=>window.__rates.length)).toBeGreaterThan(n+2);expect(await page.evaluate(n=>window.__rates.slice(n).every(r=>r[1]===0.75&&r[2]),n)).toBe(true)});
test('no speed pill on the Qaida mini player (it keeps its own speed); popover closes on outside tap and Escape',async({page})=>{
 await mock(page,{});await page.goto('./#/surah/1');await page.waitForSelector('.ayah');await page.click('#playAll');
 await page.click('#player [data-sp]');await expect(page.locator('.sp-pop')).toHaveCount(1);await page.mouse.click(5,200);await expect(page.locator('.sp-pop')).toHaveCount(0);
 await page.click('#player [data-sp]');await page.keyboard.press('Escape');await expect(page.locator('.sp-pop')).toHaveCount(0);
 await page.goto('./#/qaida/n/1');await expect(page.locator('#qMini [data-sp]')).toHaveCount(0)});
