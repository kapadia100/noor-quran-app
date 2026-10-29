import {test,expect} from '@playwright/test';
import {ROUTES} from '../routes.js';
// WebKit (iPhone 14) — nav must never move: scroll top/bottom, overscroll (wheel past ends), toolbar-like viewport resize.
const rect=p=>p.evaluate(()=>{const r=document.querySelector('nav').getBoundingClientRect();return {gap:Math.round(innerHeight-r.bottom),h:Math.round(r.height),top:Math.round(r.top)}});
const scroller=p=>p.evaluate(()=>{const m=document.querySelector('#app');return getComputedStyle(m).overflowY==='auto'?'#app':'doc'});
async function scrollAll(p,to){await p.evaluate(t=>{const m=document.querySelector('#app');const el=getComputedStyle(m).overflowY==='auto'?m:document.scrollingElement;el.scrollTop=t==='bottom'?el.scrollHeight:0;window.scrollTo(0,t==='bottom'?99999:0)},to)}
test('webkit: nav rect constant on every route through scroll/overscroll',async({page})=>{test.setTimeout(240000);const log=[];let ref=null;
 for(const r of ROUTES){await page.goto('./#/'+r);await page.waitForTimeout(/surah|hadith|mosques/.test(r)?1500:500);const s=[await rect(page)];
  await scrollAll(page,'bottom');await page.waitForTimeout(150);s.push(await rect(page));await page.evaluate(()=>{window.scrollBy(0,5000);document.querySelector('#app').scrollBy(0,5000)});await page.waitForTimeout(150);s.push(await rect(page));
  await scrollAll(page,'top');await page.evaluate(()=>{window.scrollBy(0,-5000);document.querySelector('#app').scrollBy(0,-5000)});await page.waitForTimeout(150);s.push(await rect(page));
  ref??=s[0];const bad=s.filter(x=>x.gap!==ref.gap||x.h!==ref.h);log.push(`${r||'home'}: ${bad.length?'MOVED '+JSON.stringify(s):'ok gap='+s[0].gap}`);expect.soft(bad,`${r} nav moved`).toEqual([])}
 console.log('scroller:',await scroller(page));console.log(log.join('\n'))});
test('webkit: toolbar show/hide (viewport resize) keeps nav pinned to bottom',async({page})=>{await page.goto('./#/mushaf/2');await page.waitForTimeout(800);const out=[];
 for(const h of [664,745,664,600]){await page.setViewportSize({width:390,height:h});await page.waitForTimeout(200);out.push(await rect(page))}
 console.log(JSON.stringify(out));expect(new Set(out.map(x=>x.gap)).size).toBe(1)});
test('webkit: keyboard focus hides nav and does not shift layout; inputs >=16px (no zoom)',async({page})=>{await page.goto('./#/search');const inp=page.locator('#q');const fs=await inp.evaluate(e=>parseFloat(getComputedStyle(e).fontSize));expect(fs).toBeGreaterThanOrEqual(16);
 await inp.focus();await page.waitForTimeout(200);const hid=await page.evaluate(()=>getComputedStyle(document.querySelector('nav')).visibility==='hidden'||document.body.classList.contains('kb'));console.log('nav hidden while typing:',hid);expect(hid).toBe(true);
 await inp.blur();await page.waitForTimeout(200);expect(await page.evaluate(()=>getComputedStyle(document.querySelector('nav')).visibility)).toBe('visible')});
test('webkit: document never scrolls (single #app scroller) and version is shown',async({page})=>{await page.goto('./#/surah/2');await page.waitForSelector('.ayah');await page.evaluate(()=>{window.scrollTo(0,5000);document.querySelector('#app').scrollTop=4000});
 expect(await page.evaluate(()=>window.scrollY)).toBe(0);expect(await page.evaluate(()=>document.querySelector('#app').scrollTop)).toBeGreaterThan(1000);
 expect(await page.evaluate(()=>{let e=document.querySelector('nav');const bad=[];while((e=e.parentElement)){const s=getComputedStyle(e);if(s.transform!=='none'||s.filter!=='none'||(s.backdropFilter||s.webkitBackdropFilter||'none')!=='none')bad.push(e.tagName)}return bad})).toEqual([]);
 await page.goto('./#/more');await expect(page.locator('#ver')).toHaveText(/Quran Safar v3\.7\.5/);await page.goto('./#/settings');await expect(page.locator('#ver')).toContainText('v3.7.5')});
for(const r of ['quran','ibadat'])test(`webkit: ${r} with iPhone safe areas (59/34) — content starts below header, nav pinned, top & bottom`,async({page})=>{await page.setViewportSize({width:393,height:852});
 await page.addInitScript(()=>document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent=':root{--st:59px!important;--sb:34px!important}';document.head.append(s)}));
 await page.goto('./#/'+r);await page.waitForTimeout(1200);for(const pos of [0,1e6,0]){await page.evaluate(t=>document.querySelector('#app').scrollTop=t,pos);await page.waitForTimeout(200);
  const m=await page.evaluate(()=>{const n=document.querySelector('nav').getBoundingClientRect(),h=document.querySelector('header').getBoundingClientRect(),a=document.querySelector('#app').getBoundingClientRect();return {gap:Math.round(innerHeight-n.bottom),hb:Math.round(h.bottom),at:Math.round(a.top),ab:Math.round(a.bottom)}});
  expect(m.gap).toBe(0);expect(m.hb).toBe(115);expect(m.at).toBe(115);expect(m.ab).toBe(852)}});

test('webkit: standalone-like — innerHeight reported smaller than screen, nav still docked at viewport bottom with nothing below',async({page})=>{await page.setViewportSize({width:393,height:852});
 await page.addInitScript(()=>{Object.defineProperty(window,'innerHeight',{get:()=>742});Object.defineProperty(screen,'height',{get:()=>852});if(window.visualViewport)Object.defineProperty(visualViewport,'height',{get:()=>742});document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent=':root{--st:59px!important;--sb:34px!important}';document.head.append(s)})});
 for(const r of ['quran','ibadat','','mushaf/2']){await page.goto('./#/'+r);await page.waitForTimeout(800);for(const pos of [0,1e6]){await page.evaluate(t=>document.querySelector('#app').scrollTop=t,pos);await page.waitForTimeout(150);
  const m=await page.evaluate(()=>{const n=document.querySelector('nav').getBoundingClientRect(),b=document.body.getBoundingClientRect(),a=document.querySelector('#app').getBoundingClientRect();return {navBottom:Math.round(n.bottom),bodyBottom:Math.round(b.bottom),appBottom:Math.round(a.bottom),navH:Math.round(n.height),padB:parseFloat(getComputedStyle(document.querySelector('#app')).paddingBottom)}});
  expect(m.navBottom,r).toBe(852);expect(m.bodyBottom).toBe(852);expect(m.appBottom).toBe(852);expect(m.navH).toBeGreaterThanOrEqual(100);expect(m.padB).toBeGreaterThanOrEqual(m.navH)}}});
test('webkit: 5 taps on version opens debug overlay with viewport numbers; html/body dark',async({page})=>{await page.addInitScript(()=>localStorage.setItem('instBanner','1'));await page.goto('./#/more');const v=page.locator('#ver');for(let i=0;i<5;i++)await v.click();
 await expect(page.locator('#dbg')).toContainText('innerHeight');await expect(page.locator('#dbg')).toContainText('safe-area');await expect(page.locator('#dbg')).toContainText('display-mode');
 expect(await page.evaluate(()=>[getComputedStyle(document.documentElement).backgroundColor,getComputedStyle(document.body).backgroundColor])).toEqual(['rgb(27, 33, 24)','rgba(0, 0, 0, 0)'])});
test('install page: iOS Safari guide, in-app Open-in-Safari + copy, desktop QR, Urdu',async({page})=>{await page.goto('./install/');await expect(page.locator('#ios')).toBeVisible();await expect(page.locator('#arrow')).toBeVisible();await expect(page.locator('#steps li')).toHaveCount(3);
 await page.click('#lang');await expect(page.locator('html')).toHaveAttribute('dir','rtl');await expect(page.locator('#ios h2')).toContainText('آئی فون');await page.click('#lang');
 await page.goto('./install/?mode=inapp');await expect(page.locator('#inapp')).toBeVisible();await expect(page.locator('#url')).toContainText('/install/');await page.click('#copy');await expect(page.locator('#copy')).toContainText(/Copied|کاپی/);
 await page.goto('./install/?mode=desktop');await expect(page.locator('#desktop img.qr')).toBeVisible();await page.goto('./install/?mode=android');await expect(page.locator('#android')).toBeVisible()});
test('in-app install banner shows in iOS Safari, dismissable',async({page})=>{await page.goto('./#/');await expect(page.locator('#instBanner')).toBeVisible();await expect(page.locator('#instBanner a')).toHaveAttribute('href',/install\/$/);await page.click('#instBanner button');await page.reload();await expect(page.locator('#instBanner')).toHaveCount(0)});
