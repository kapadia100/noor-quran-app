import {test,expect} from '@playwright/test';
import {ROUTES} from '../routes.js';
// Layout guard for every route: fixed nav at identical bottom offset, header never covers content, no horizontal overflow.
export async function audit(page){return page.evaluate(()=>{const W=innerWidth,H=innerHeight,nav=document.querySelector('nav .pill').getBoundingClientRect(),hd=document.querySelector('header').getBoundingClientRect();
 const home=document.body.classList.contains('is-home');const first=document.querySelector('#app>div>*');const ft=first?first.getBoundingClientRect().top+scrollY:999;
 const over=[...document.querySelectorAll('#app *,header *,nav *')].filter(e=>{const r=e.getBoundingClientRect();if(!r.width)return false;let p=e.parentElement;while(p&&p!==document.body){const o=getComputedStyle(p).overflowX;if(o==='auto'||o==='scroll'||o==='hidden')return false;p=p.parentElement}return r.right>W+1||r.left<-1}).slice(0,5).map(e=>e.tagName+'.'+e.className);
 return {navGap:Math.round(H-nav.bottom),navH:Math.round(nav.height),hdH:Math.round(hd.height),headerCovers:!home&&ft<hd.bottom-1,hScroll:document.documentElement.scrollWidth>W+1,over}})}
for(const dark of [true,false])for(const ui of ['en','ur'])test(`layout: every route (${dark?'dark':'light'}, ${ui})`,async({page})=>{test.setTimeout(180000);
 await page.addInitScript(([d,u])=>localStorage.setItem('settings',JSON.stringify({dark:d,ui:u})),[dark,ui]);let ref=null;
 for(const r of ROUTES){await page.goto('./#/'+r);await page.waitForTimeout(r.startsWith('surah')||r==='hadith'||r==='mosques'?1500:500);const a=await audit(page);
  ref??=a;expect.soft(a.navGap,`${r} nav offset`).toBe(ref.navGap);expect.soft(a.navH,`${r} nav height`).toBe(ref.navH);expect.soft(a.headerCovers,`${r} header covers content`).toBe(false);expect.soft(a.hScroll,`${r} horizontal scroll`).toBe(false);expect.soft(a.over,`${r} elements outside viewport`).toEqual([])}});
test('layout: nav offset identical in standalone-like tall viewport',async({page})=>{await page.setViewportSize({width:393,height:852});const g=[];for(const r of ['','mushaf/2','surah/1','prayer','more']){await page.goto('./#/'+r);await page.waitForTimeout(500);g.push((await audit(page)).navGap)}expect(new Set(g).size).toBe(1)});
