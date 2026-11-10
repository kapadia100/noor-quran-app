// Draft store screenshots of the current UI. Not a substitute for real-device shots.
// Usage: npx vite build && npx vite preview --port 4173
//        node scripts/store-shots.mjs
// Writes store/screenshots/<device>/*.png at the store pixel sizes.
import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';

const BASE=process.env.SHOT_URL||'http://127.0.0.1:4173/';
const OUT=path.resolve('store/screenshots');
const DEVICES=[
 {id:'iphone-6.9',width:430,height:932,scale:3}, // 1290×2796
 {id:'iphone-6.5',width:414,height:896,scale:3}, // 1242×2688
 {id:'ipad-13',width:1032,height:1376,scale:2}, // 2064×2752
 {id:'android-phone',width:360,height:640,scale:3}, // 1080×1920
];
const PAGES=[
 ['home','#/', '#homeTutor'],
 ['quran','#/surah/1','#a1 .ar'],
 ['prayer','#/prayer','.ptimes li'],
 ['qibla','#/qibla','.deg'],
 ['hadith','#/hadith','.list li, article.hd, .card'],
 ['dictionary','#/dict','#dcList, #dcQ'],
 ['live','#/recite','#sl a, #recite'],
 ['settings','#/settings','#s_ui'],
];

const browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--hide-scrollbars']});
for(const d of DEVICES){
 const dir=path.join(OUT,d.id);
 await mkdir(dir,{recursive:true});
 const context=await browser.newContext({
  viewport:{width:d.width,height:d.height},deviceScaleFactor:d.scale,
  geolocation:{latitude:24.8607,longitude:67.0011},permissions:['geolocation','notifications'],
  timezoneId:'Asia/Karachi',locale:'en-US',isMobile:d.id!=='ipad-13',hasTouch:true,
 });
 await context.addInitScript(()=>{
  localStorage.setItem('instBanner','1');
  localStorage.setItem('settings',JSON.stringify({ui:'en',dark:true,trans:'en.sahih',reciter:'ar.alafasy',tafsir:'ar.muyassar'}));
  localStorage.setItem('prayer',JSON.stringify({city:'Karachi',lat:24.8607,lng:67.0011,tz:'Asia/Karachi',src:'city',method:'Karachi',madhab:'Hanafi',methodUser:true,madhabUser:true,autoV2:1,alerts:{fajr:true,dhuhr:true,asr:true,maghrib:true,isha:true,sunrise:false}}));
 });
 await context.route('https://gc.zgo.at/**',r=>r.fulfill({status:204,body:''}));
 await context.route('**/quransafar.goatcounter.com/**',r=>r.fulfill({status:204,body:''}));
 await context.route(/nominatim/,r=>r.fulfill({json:{address:{city:'Karachi',country:'Pakistan'}}}));
 const page=await context.newPage();
 for(const [name,hash,sel] of PAGES){
  await page.goto(BASE+hash,{waitUntil:'domcontentloaded',timeout:60000});
  await page.locator(sel).first().waitFor({state:'visible',timeout:45000});
  await page.waitForTimeout(400);
  const file=path.join(dir,name+'.png');
  await page.screenshot({path:file,fullPage:false});
  const box=await page.evaluate(()=>({w:innerWidth,h:innerHeight,d:devicePixelRatio}));
  console.log(d.id,name,`${box.w*box.d}x${box.h*box.d}`);
 }
 await context.close();
}
await browser.close();
console.log('wrote',OUT);
