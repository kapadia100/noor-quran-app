import {test,expect} from '@playwright/test';
test('v3.7.12 Qibla: Kaaba marker on screen = qibla - heading, letters/numerals rotate together, turn text matches',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('instBanner','1'));
 await page.goto('./#/prayer');await page.selectOption('#city','Karachi');await page.goto('./#/qibla');
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
test('Qibla auto-starts with no Start/Change-location buttons where no permission is needed',async({page})=>{
 await page.goto('./#/prayer');await page.selectOption('#city','Karachi');await page.goto('./#/qibla');
 await expect(page.locator('#qf')).toHaveClass(/live/);await expect(page.locator('#cmp')).toHaveCount(0);await expect(page.getByText('Change location')).toHaveCount(0)});
test('iOS: one Allow-compass prompt, tap anywhere grants, remembered and auto-starts next visit',async({page})=>{
 await page.addInitScript(()=>{window.__asks=0;addEventListener('click',()=>{window.__g=1},true);DeviceOrientationEvent.requestPermission=async()=>{if(!window.__g)throw new Error('NotAllowedError');window.__g=0;window.__asks++;return 'granted'}});
 await page.goto('./#/prayer');await page.selectOption('#city','Karachi');await page.evaluate(()=>{window.__g=0});await page.goto('./#/qibla');
 await expect(page.locator('#cmp')).toBeVisible();await expect(page.locator('#cmp')).toHaveText(/Allow compass/);
 await page.evaluate(()=>{window.__g=0});await page.locator('#hd').click({force:true,timeout:5000});await expect(page.locator('#cmp')).toHaveCount(0);await expect(page.locator('#qf')).toHaveClass(/live/);
 expect(await page.evaluate(()=>localStorage.getItem('qiblaMotion'))).toBe('1');
 await page.reload();await page.evaluate(()=>setInterval(()=>dispatchEvent(Object.assign(new Event('deviceorientation'),{webkitCompassHeading:10,webkitCompassAccuracy:5})),100));
 await expect(page.locator('#qf')).toHaveClass(/live/);await page.waitForTimeout(1700);await expect(page.locator('#cmp')).toHaveCount(0);
 expect(await page.evaluate(()=>window.__asks)).toBe(0)});
