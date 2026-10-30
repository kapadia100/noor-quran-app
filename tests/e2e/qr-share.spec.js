import {test,expect} from '@playwright/test';import fs from 'fs';import jsQR from 'jsqr';import {PNG} from 'pngjs';
const URL_='https://kapadia100.github.io/noor-quran-app/install/';
const dec=d=>{const p=PNG.sync.read(Buffer.from(d.split(',')[1],'base64'));return jsQR(new Uint8ClampedArray(p.data),p.width,p.height)?.data};
const save=(n,d)=>{if(process.env.SHOTS){fs.mkdirSync(`${process.env.CI?'/tmp':'/workspace'}/shots394`,{recursive:true});fs.writeFileSync(`${process.env.CI?'/tmp':'/workspace'}/shots394/${n}.png`,Buffer.from(d.split(',')[1],'base64'))}};
for(const ui of ['en','ur'])test(`share images carry a scannable install QR (${ui})`,async({page})=>{
 if(ui==='ur')await page.addInitScript(()=>localStorage.setItem('ui','ur'));
 await page.goto('./#/names');await page.waitForFunction(()=>window.__cards);if(ui==='ur')await page.evaluate(()=>{document.documentElement.lang='ur'});
 const imgs=await page.evaluate(async()=>{const N=await (await fetch('offline/x/names.json')).json();const C=window.__cards;const o={};
  o.nameSq=(await C.nameCard(N[0],1080,1080)).toDataURL();o.nameSt=(await C.nameCard(N[84],1080,1920)).toDataURL();
  o.ayah=(await C.ayahCard(1,1)).toDataURL();o.hadith=(await C.textCard({ar:'إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ',tr:'Actions are judged by intentions.',ref:'Hadith 1'})).toDataURL();return o});
 for(const [k,d] of Object.entries(imgs)){expect(dec(d),k).toBe(URL_);save(`${k}-${ui}`,d)}
 const ins=await page.request.get('./install/');expect(ins.ok()).toBeTruthy()});

const FLOWS=[['ayah-surah','./#/surah/1','[data-share]',null],['hadith','./#/hadith/bukhari/1','.ayah [data-shr]','x'],['dua','./#/duas/morning-dhikr','[data-shr]','x'],['azkar','./#/duas/hadith','.az-i .tv-shr','.tv-c'],['kalima','./#/kalimas','.tv-shr','.tv-c'],['janazah','./#/janazah','.jz-dua .tv-shr','.tv-c'],['name','./#/names/1','#nmv .nm-slide.on [data-shr]','x']];
for(const [k,url,btn,box] of FLOWS)test(`share flow ${k}: link in text, image has decodable QR, Arabic exact`,async({page})=>{
 await page.goto(url);const b=page.locator(btn).first();await b.waitFor({timeout:30000});
 const ar=box&&box!=='x'?await b.evaluate((e,bx)=>e.closest(bx).querySelector('.tv-ar')?.textContent.trim(),box):null;
 await page.evaluate(()=>{window.__shareFile=null;navigator.canShare=()=>false});await b.click();
 let d;if(box){await expect(page.locator('#shTxt')).toContainText(URL_);if(ar)expect(await page.locator('#shTxt').textContent()).toContain(ar);await page.click('#shImg');await page.locator('#cardImg').waitFor()}
 else await page.locator('#cardImg').waitFor({timeout:30000});
 d=await page.locator('#cardImg').evaluate(async i=>{const r=await fetch(i.src);const bl=await r.blob();return await new Promise(o=>{const f=new FileReader();f.onload=()=>o(f.result);f.readAsDataURL(bl)})});
 expect(dec(d)).toBe(URL_);save(`flow-${k}`,d)});
