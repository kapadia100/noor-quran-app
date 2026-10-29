import {test,expect} from '@playwright/test';
// v3.7.5: the bottom nav is docked flush to the screen bottom (not a floating pill), opaque, full width, and fills the safe area
for(const theme of ['light','dark'])test(`nav is docked full width at the bottom and opaque (${theme}); content ends above it`,async({page})=>{
 await page.addInitScript(t=>{localStorage.setItem('settings',JSON.stringify({dark:t==='dark'}));document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent=':root{--sb:34px!important}';document.head.append(s)})},theme);
 for(const r of ['','quran','hadith','ibadat','more']){await page.goto('./#/'+r);await page.waitForTimeout(400);
  const m=await page.evaluate(()=>{const n=document.querySelector('nav'),b=n.getBoundingClientRect(),cs=getComputedStyle(n);const a=document.getElementById('app');a.scrollTop=a.scrollHeight;
   const last=Math.max(...[...a.children].map(e=>e.getBoundingClientRect().bottom));return {gap:innerHeight-b.bottom,left:b.left,w:b.width,vw:innerWidth,bg:cs.backgroundColor,pb:cs.paddingBottom,last,top:b.top}});
  expect(Math.abs(m.gap)).toBeLessThan(1);expect(m.left).toBe(0);expect(m.w).toBe(m.vw);expect(m.bg).toMatch(/^rgb\(/);expect(m.pb).toBe('34px');expect(m.last).toBeLessThanOrEqual(m.top+1)}});
