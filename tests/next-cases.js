// v3.6.2: after a surah finishes, offer the next one; the Live (Recite & Learn) entry exists on every surah page.
import {test,expect} from '@playwright/test';
let errors=[];
test.beforeEach(async({page})=>{errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&!/net::|Failed to load resource|tile\.openstreetmap/.test(m.text()))errors.push(m.text())});
 await page.route('https://gc.zgo.at/count.js',r=>r.fulfill({contentType:'text/javascript',body:'window.goatcounter.count=function(o){}'}));
 await page.route('**/quransafar.goatcounter.com/**',r=>r.fulfill({status:204}));
 await page.addInitScript(()=>{window.__reciteFake=true})});
test.afterEach(async()=>{expect(errors).toEqual([])});
const sayAll=page=>page.evaluate(()=>{const w=window.__recite.raw().flat.map(x=>x.t);for(let i=0;i<w.length;i+=25)window.__recite.feed(w.slice(i,i+25).join(' '))});
const live=async(page,n)=>{await page.goto(`./#/recite/${n}`);await expect(page.locator('#recite')).toBeVisible();await expect(page.locator('#recite .rc-ref')).not.toBeEmpty();await page.click('#rcMic');await expect.poll(()=>page.evaluate(()=>window.__recite.raw()?.listening)).toBe(true)};

test('live: finishing surah 1 offers the next surah; one tap opens live on surah 2',async({page})=>{
 await live(page,1);await sayAll(page);
 const sum=page.locator('#rcSum');await expect(sum).toContainText('Surah complete');
 await expect(page.locator('#sNext')).toContainText('Next surah: Al-Baqara');
 for(const id of ['#sRep','#sPick','#sX'])await expect(page.locator(id)).toBeVisible();
 await page.click('#sNext');await expect(page).toHaveURL(/#\/recite\/2$/);
 await expect(page.locator('#recite')).toBeVisible();await expect.poll(()=>page.evaluate(()=>window.__recite.raw()?.n)).toBe(2);
 await expect(page.locator('#recT')).toBeVisible();
 // closing leaves the live entry in place
 await page.click('.rc-x');await expect(page.locator('#recite')).toHaveCount(0);await expect(page.locator('#recT')).toBeVisible()});

test('live: Repeat restarts the same surah; Choose another goes to the surah list; Close keeps live available',async({page})=>{
 await live(page,1);await sayAll(page);await expect(page.locator('#sRep')).toBeVisible();
 await page.click('#sRep');await expect(page.locator('#rcSum')).toBeHidden();expect(await page.evaluate(()=>window.__recite.raw()?.n)).toBe(1);expect(await page.evaluate(()=>window.__recite.state().p)).toBe(0);
 await page.click('#rcMic');await sayAll(page);await page.click('#sPick');await expect(page).toHaveURL(/#\/recite$/);await expect(page.locator('#recite')).toHaveCount(0);await expect(page.locator('#sl a')).toHaveCount(114);
 await page.goto('./#/surah/3');await expect(page.locator('#recT')).toBeVisible()});

test('live: last surah (114) offers to start again from Al-Fatihah',async({page})=>{
 await live(page,114);await sayAll(page);
 await expect(page.locator('#sNext')).toContainText('Start again: Al-Faatiha');await page.click('#sNext');
 await expect(page).toHaveURL(/#\/recite\/1$/);await expect(page.locator('#recite')).toBeVisible();await expect.poll(()=>page.evaluate(()=>window.__recite.raw()?.n)).toBe(1)});

test('live: a long surah finished in parts offers to continue from the next ayah',async({page})=>{
 await live(page,2);await sayAll(page);
 await expect(page.locator('#rcSum')).toContainText('Range complete');await expect(page.locator('#sNext')).toContainText('Continue: ayah');
 const rb=await page.evaluate(()=>window.__recite.raw().rangeB);await page.click('#sNext');await expect(page.locator('#rcSum')).toBeHidden();
 const s=await page.evaluate(()=>window.__recite.raw());expect(s.n).toBe(2);expect(s.startA).toBe(rb+1)});

test('live entry exists on every surah page, before and after sessions and route changes',async({page})=>{
 await page.goto('./#/surah/1');
 for(const n of [1,2,3,36,67,112,114,1,18]){
  await page.evaluate(n=>{location.hash='#/surah/'+n},n);await expect(page.locator('#recT')).toBeVisible();
  await expect(page.locator('#a1 .badge')).toHaveText(n+':1');
 }
 // session on one surah, then others
 await live(page,1);await sayAll(page);await page.click('#sX');
 for(const n of [2,3,112]){await page.evaluate(n=>{location.hash='#/surah/'+n},n);await expect(page.locator('#recT')).toBeVisible();
  await page.click('#recT');await expect(page.locator('#recite')).toBeVisible();expect(await page.evaluate(()=>window.__recite.raw()?.n)).toBe(n);await page.click('.rc-x');await expect(page.locator('#recite')).toHaveCount(0)}
 // leaving the panel open while navigating closes it and the next surah still has the entry
 await page.evaluate(()=>{location.hash='#/surah/5'});await page.click('#recT');await expect(page.locator('#recite')).toBeVisible();
 await page.evaluate(()=>{location.hash='#/surah/6'});await expect(page.locator('#recite')).toHaveCount(0);await expect(page.locator('#recT')).toBeVisible();
 // resuming mid-surah scrolls the top bar away: a floating Live button takes over
 await page.goto('./#/surah/2/200');await expect(page.locator('#recFab')).toBeVisible();await page.click('#recFab');await expect(page.locator('#recite')).toBeVisible();
 await page.goto('./#/surah/2');await expect(page.locator('#recT')).toBeVisible()});

test('hifz test: finishing a surah offers the next one, repeat, choose another',async({page})=>{
 await page.goto('./#/hifztest');await page.click('.hz-s[data-s="1"]');await expect(page.locator('#recite .rc-t b')).toHaveText(/Hifz Test/);
 await expect.poll(()=>page.evaluate(()=>window.__recite.raw()?.listening)).toBe(true);await sayAll(page);
 await expect(page.locator('#sNx2')).toContainText('Next surah: Al-Baqara');for(const id of ['#sRe','#sPick','#sX'])await expect(page.locator(id)).toBeVisible();
 await page.click('#sNx2');await expect(page.locator('#recite .rc-t b')).toHaveText(/Hifz Test/);await expect.poll(()=>page.evaluate(()=>window.__recite.raw()?.n)).toBe(2);
 await page.click('.rc-x');await expect(page.locator('#recite')).toHaveCount(0);
 await page.goto('./#/hifztest');await page.click('.hz-s[data-s="114"]');await expect.poll(()=>page.evaluate(()=>window.__recite.raw()?.listening)).toBe(true);await sayAll(page);
 await expect(page.locator('#sNx2')).toContainText('Start again: Al-Faatiha');await page.click('#sPick');await expect(page).toHaveURL(/#\/hifztest$/);await expect(page.locator('#recite')).toHaveCount(0);
 await page.click('.hz-s[data-s="2"]');await expect(page.locator('#recite')).toBeVisible();await page.click('.rc-x');
 await page.goto('./#/surah/7');await expect(page.locator('#recT')).toBeVisible();await expect(page.locator('#toHzT')).toHaveCount(0)});

test('home live cards still work after a session on later surahs',async({page})=>{
 await live(page,3);await page.click('.rc-x');
 await page.goto('./#/');await expect(page.locator('#app a#homeHifz')).toBeVisible();await page.click('#tutor');await expect(page).toHaveURL(/#\/recite$/);await expect(page.locator('#sl a')).toHaveCount(114)});
