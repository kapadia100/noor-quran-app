// Privacy: the microphone must be live ONLY while a mic feature is running. Every acquired track must be stopped
// (and its AudioContext closed) on Stop, on leaving the feature, on navigation and when the app goes to the background.
import {test,expect} from '@playwright/test';
let errors=[];
test.beforeEach(async({page})=>{errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.route('https://gc.zgo.at/count.js',r=>r.fulfill({contentType:'text/javascript',body:'window.goatcounter.count=function(o){}'}));
 await page.route('**/quransafar.goatcounter.com/**',r=>r.fulfill({status:204}));
 await page.addInitScript(()=>{if(location.protocol==='about:')return;localStorage.setItem('instBanner','1');window.__reciteFake=true;window.__gum=[];window.__ctx=[];window.__gumDelay=0;
  const AC=window.AudioContext;window.AudioContext=class extends AC{constructor(...a){super(...a);window.__ctx.push(this)}};
  const md=navigator.mediaDevices||{};Object.defineProperty(navigator,'mediaDevices',{value:md,configurable:true});
  md.getUserMedia=async()=>{if(window.__gumDelay)await new Promise(r=>setTimeout(r,window.__gumDelay));const ac=new AC(),o=ac.createOscillator(),d=ac.createMediaStreamDestination();o.connect(d);o.start();
   const s=d.stream;window.__gum.push(s);return s}})});
test.afterEach(()=>expect(errors).toEqual([]));
const live=page=>page.evaluate(()=>window.__gum.flatMap(s=>s.getTracks()).filter(t=>t.readyState==='live').length);
const hide=page=>page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true});document.dispatchEvent(new Event('visibilitychange'))});
const openRc=async page=>{await page.goto('./#/recite/1');await expect(page.locator('#recite')).toBeVisible();await page.evaluate(()=>{window.__reciteFake=false})};
const recite=async page=>{await openRc(page);await page.click('#rcMic');await expect.poll(()=>live(page)).toBe(1);await expect(page.locator('#rcMic')).toHaveAttribute('aria-pressed','true')};

test('tutor: Stop releases the mic; Start re-acquires it',async({page})=>{
 await recite(page);await page.click('#rcMic');await expect.poll(()=>live(page)).toBe(0);
 await page.click('#rcMic');await expect.poll(()=>live(page)).toBe(1);expect(await page.evaluate(()=>window.__gum.length)).toBe(2)});
test('tutor: leaving the page releases the mic and closes its audio context',async({page})=>{
 await recite(page);await page.evaluate(()=>{location.hash='#/'});await expect.poll(()=>live(page)).toBe(0);
 expect(await page.evaluate(()=>[window.__mic.liveTracks(),window.__mic.owners().length])).toEqual([0,0])});
test('tutor: going to the background releases the mic',async({page})=>{
 await recite(page);await hide(page);await expect.poll(()=>live(page)).toBe(0);await expect(page.locator('#rcMic')).toHaveAttribute('aria-pressed','false')});
test('tutor: leaving while the permission prompt is open never leaves a live stream',async({page})=>{
 await openRc(page);await page.evaluate(()=>{window.__gumDelay=600});
 await page.click('#rcMic');await page.evaluate(()=>{location.hash='#/'});await page.waitForTimeout(1200);expect(await page.evaluate(()=>window.__gum.length)).toBe(1);expect(await live(page)).toBe(0)});
test('qaida practice: Stop, navigation and background all release the mic',async({page})=>{
 await page.goto('about:blank');await page.goto('./#/qaida/huroof');await page.click('.q-lbtn');await expect.poll(()=>live(page),{timeout:15000}).toBe(1);
 await page.click('#qlStop');await expect.poll(()=>live(page)).toBe(0);
 await page.goto('about:blank');await page.goto('./#/qaida/huroof');await page.click('.q-lbtn');await expect.poll(()=>live(page),{timeout:15000}).toBe(1);await page.evaluate(()=>{location.hash='#/'});await expect.poll(()=>live(page)).toBe(0);
 await page.goto('about:blank');await page.goto('./#/qaida/huroof');await page.click('.q-lbtn');await expect.poll(()=>live(page),{timeout:15000}).toBe(1);await hide(page);await expect.poll(()=>live(page)).toBe(0)});
