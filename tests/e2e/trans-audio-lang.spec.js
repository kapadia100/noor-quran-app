import {test,expect} from '@playwright/test';
// v83: translation audio follows the selected translation language (old bug: separate 'talang' stayed Urdu after switching to English).
async function mock(page,settings){
 await page.route('https://cdn.islamic.network/**',r=>r.fulfill({status:200,contentType:'audio/mpeg',body:''}));
 await page.route('https://everyayah.com/**',r=>r.fulfill({status:200,contentType:'audio/mpeg',body:''}));
 await page.addInitScript(st=>{localStorage.setItem('instBanner','1');if(!sessionStorage.getItem('seeded')){localStorage.setItem('settings',JSON.stringify(st));sessionStorage.setItem('seeded','1')}
  const P=HTMLMediaElement.prototype;P.play=function(){(window.__played=window.__played||[]).push(this.src);this.__p=false;this.dispatchEvent(new Event('play'));return Promise.resolve()};
  P.pause=function(){this.__p=true;this.dispatchEvent(new Event('pause'))};Object.defineProperty(P,'paused',{configurable:true,get(){return this.__p!==false}});
  Object.defineProperty(P,'src',{configurable:true,get(){return this.__src||''},set(v){this.__src=v}})},settings)}
test('switching translation language Urdu → English switches translation audio, mid-session and after restart',async({page})=>{
 await mock(page,{trans:'ur.jalandhry',talang:'ur',amode:'tr',ui:'en'});await page.goto('./#/surah/67');
 await page.locator('[data-play="0"]').click();await expect.poll(()=>page.evaluate(()=>(window.__played||[]).at(-1)||'')).toMatch(/ur\.|Urdu/i);
 const trL=page.locator('#trL');await trL.waitFor();const en=await trL.locator('option[value="en"],option[value^="en"]').first().getAttribute('value');
 await trL.selectOption(en);await expect(page.locator('#r_tal')).toHaveValue('en');
 await expect.poll(()=>page.evaluate(()=>(window.__played||[]).at(-1)||'')).toMatch(/en\.walk|English/);
 expect(JSON.parse(await page.evaluate(()=>localStorage.getItem('settings'))).talang).toBe('en');
 await page.reload();await page.locator('[data-play="0"]').waitFor();await expect(page.locator('#r_tal')).toHaveValue('en')});
test('stale saved Urdu translation audio with an English translation is fixed on load',async({page})=>{
 await mock(page,{trans:'en.sahih',talang:'ur',amode:'tr',ui:'en'});await page.goto('./#/surah/67');
 await expect(page.locator('#r_tal')).toHaveValue('en')});
