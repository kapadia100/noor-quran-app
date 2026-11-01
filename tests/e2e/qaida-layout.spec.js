import {test,expect} from '@playwright/test';
// v85: in every Qaida lesson the Arabic glyph's ink (descenders like ج ح خ, kasra, kasratan) never reaches the name/sound line under it.
test('Qaida: no letter name or sound overlaps its Arabic letter, in any lesson',async({page})=>{await page.addInitScript(()=>localStorage.setItem('instBanner','1'));
 const ls=[];for(const c of ['n','m']){await page.goto('./#/qaida/'+c);await page.waitForTimeout(800);ls.push(...await page.$$eval('a.q-row',a=>a.map(x=>x.getAttribute('href'))))}expect(ls.length).toBeGreaterThan(25);
 const out=[];
 for(const h of [...new Set(ls)]){await page.goto('./'+h);await page.waitForTimeout(300);await page.evaluate(()=>document.fonts.ready);
  const r=await page.evaluate(()=>{const c=document.createElement('canvas').getContext('2d');let bad=[];
   for(const s of document.querySelectorAll('#qBody .q-tile .ar,#qBody .q-cell .ar')){const cs=getComputedStyle(s);c.font=`${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;const m=c.measureText(s.textContent);
    const r=s.getBoundingClientRect(),lh=parseFloat(cs.lineHeight)||parseFloat(cs.fontSize)*1.2,hl=(lh-(m.fontBoundingBoxAscent+m.fontBoundingBoxDescent))/2,base=r.top+hl+m.fontBoundingBoxAscent,ink=base+m.actualBoundingBoxDescent;
    const nx=s.nextElementSibling;if(nx&&ink>nx.getBoundingClientRect().top+1)bad.push(s.textContent+':'+(ink-nx.getBoundingClientRect().top).toFixed(1))}return bad});
  if(r.length)out.push(h+' '+r.length+' '+r.slice(0,4).join(','))}
 expect(out).toEqual([])});
