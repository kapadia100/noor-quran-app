import {test,expect} from '@playwright/test';
test('v3.7.12 Qibla: Kaaba marker on screen = qibla - heading, letters/numerals rotate together, turn text matches',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('instBanner','1'));
 await page.goto('./#/prayer');await page.selectOption('#city','Karachi');await page.goto('./#/qibla');await page.click('#cmp');
 const q=+(await page.locator('#qk').getAttribute('data-q'));
 for(const mag of [0,45,120,200,266,300]){
  await page.evaluate(m=>{clearInterval(window.__q);window.__q=setInterval(()=>{for(const t of ['deviceorientationabsolute','deviceorientation']){const e=new Event(t);Object.defineProperty(e,'webkitCompassHeading',{value:m});Object.defineProperty(e,'webkitCompassAccuracy',{value:5});dispatchEvent(e)}},30)},mag);
  await expect.poll(async()=>{const h=+(await page.locator('#dial').getAttribute('data-h'));return Math.abs(((h-mag+540)%360)-180)},{timeout:5000}).toBeLessThan(3);
  await page.waitForTimeout(400);
  const r=await page.evaluate(()=>{const c=document.querySelector('#dial').getBoundingClientRect(),cx=c.x+c.width/2,cy=c.y+c.height/2;
   const ang=el=>{const b=el.getBoundingClientRect();return (Math.atan2(b.x+b.width/2-cx,cy-(b.y+b.height/2))*180/Math.PI+360)%360};
   const tx=[...document.querySelectorAll('#dial text')];const N=tx.find(t=>t.textContent==='N'),E=tx.find(t=>t.textContent==='E'),n30=tx.find(t=>t.textContent==='30');
   return {k:ang(document.querySelector('.qkb')),N:ang(N),E:ang(E),n30:ang(n30),h:+document.querySelector('#dial').dataset.h,txt:document.querySelector('#hd').textContent}});
  const near=(a,b,tol)=>expect(Math.abs(((a-b)%360+540)%360-180)).toBeLessThan(tol);
  near(r.k,q-r.h,4);near(r.N,-r.h,4);near(r.E,90-r.h,4);near(r.n30,30-r.h,4);
  const d=((q-r.h)%360+540)%360-180;
  if(Math.abs(d)>3)expect(r.txt).toContain(`${d>0?'right':'left'} ${Math.abs(d).toFixed(0)}°`);else expect(r.txt).toContain('Facing')}
 await page.evaluate(()=>clearInterval(window.__q))});
