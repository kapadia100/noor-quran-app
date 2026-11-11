import {test,expect} from '@playwright/test';
// Continuous recitation is the default: one chapter file, no new clip between ayahs.
// The only pause is the one already inside the recording.
const CASES=[[1,'ar.alafasy'],[2,'ar.husary'],[103,'ar.abdurrahmaansudais'],[108,'ar.shaatree'],[112,'ar.saoodshuraym']];
for(const [surah,reciter] of CASES)test(`continuous ${reciter} surah ${surah}: one file plays across the ayah`,async({page})=>{
 await page.addInitScript(rec=>{const s=JSON.parse(localStorage.getItem('settings')||'{}');Object.assign(s,{reciter:rec,amode:'ar',surahAudio:true,flowV:1,continuous:true,autoNext:true});localStorage.setItem('settings',JSON.stringify(s))},reciter);
 await page.goto(`./#/surah/${surah}`);await page.waitForSelector('#a1');await page.evaluate(()=>{window.__audio.muted=true});
 await page.click('#playAll');
 try{await expect.poll(()=>page.evaluate(()=>{const c=window.__cur(),a=window.__audio;return !!(c?.flow&&a.readyState>=2&&a.currentTime>0.05&&!a.paused)}),{timeout:40000}).toBe(true)}
 catch(e){const d=await page.evaluate(()=>{const a=window.__audio,c=window.__cur();return {src:a.src,err:a.error&&a.error.code,rs:a.readyState,t:a.currentTime,paused:a.paused,flow:!!c?.flow}});throw new Error(e.message+' '+JSON.stringify(d),{cause:e})}
 const crossed=await page.evaluate(()=>new Promise((res,rej)=>{const a=window.__audio,f=window.__cur().flow,cut=f.verses[0].to/1000,src=a.src;
  const begin=()=>{let started=false,last=performance.now(),lastC=a.currentTime,worst=0;const t0=last;
   const id=setInterval(()=>{const now=performance.now(),dw=now-last,dc=a.currentTime-lastC;
    if(started&&dw>45&&dc<0.02&&!a.paused)worst+=dw;
    if(!started&&a.currentTime>=cut-0.12&&a.currentTime<cut+0.03)started=true;
    last=now;lastC=a.currentTime;
    if(a.paused){clearInterval(id);rej(new Error('paused at '+a.currentTime));return}
    if(a.src!==src){clearInterval(id);rej(new Error('src changed'));return}
    if(a.currentTime>cut+0.08){clearInterval(id);res({worst,src,ayah:window.__cur().i+1})}
    if(now-t0>12000){clearInterval(id);rej(new Error('did not cross '+cut+' at '+a.currentTime))}},20)};
  let begun=false;const go=()=>{if(begun)return;begun=true;a.removeEventListener('seeked',go);begin()};
  a.addEventListener('seeked',go);
  try{a.currentTime=Math.max(0,cut-0.2)}catch(err){rej(err);return}
  if(Math.abs(a.currentTime-(cut-0.2))<0.08)go();else setTimeout(go,4000)}));
 console.log(`ayah-boundary stall ${reciter} surah ${surah}: ${Math.round(crossed.worst)}ms`);
 expect(crossed.worst).toBeLessThan(200);expect(crossed.ayah).toBeGreaterThanOrEqual(2);expect(crossed.src).toMatch(/quranicaudio\.com/);
 await expect(page.locator('#pInfo')).toContainText(`${surah}:2`);await expect(page.locator('#a2.playing')).toHaveCount(1);
 expect(await page.evaluate(()=>window.__audio.paused)).toBe(false);expect(await page.evaluate(()=>window.__audio.src)).toBe(crossed.src)});
