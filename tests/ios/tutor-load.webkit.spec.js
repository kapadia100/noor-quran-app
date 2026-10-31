import {test,expect} from '@playwright/test';
// WebKit (iPhone/iPad engine): the live tutor's model + runtime download and start (models served from the live site).
const LIVE='https://kapadia100.github.io/noor-quran-app/';
const dev='iPhone';test('tutor loads in WebKit',async({page})=>{test.setTimeout(240000);
 await page.route(/\/models\//,async r=>{const path=new URL(r.request().url()).pathname.replace(/^.*?\/models\//,'models/');try{const res=await r.fetch({url:LIVE+path});await r.fulfill({response:res})}catch{await r.abort()}});
 await page.goto('./');
 const out=await page.evaluate(()=>new Promise(res=>{const w=new Worker('recite-worker.js',{type:'module'});w.onerror=e=>res({type:'workererror',message:e.message});
  w.onmessage=e=>{if(e.data.type==='ready'||e.data.type==='error')res(e.data)};w.postMessage({type:'load',base:new URL('models/',location.href).href})}));
 console.log('tutor load ['+dev+']',JSON.stringify(out));expect(out.type,JSON.stringify(out)).toBe('ready')});
