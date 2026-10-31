// Shared by tests/e2e (iPhone/Android Chromium) and tests/ios (WebKit): Play lesson / Play all in the Qaida, with mocked audio (nothing is really played;
// the app records each clip it would play in window.__qplays and the speed in window.__qRates).
export function qaidaPlayFlows(test,expect){
 test.beforeEach(async({page})=>{
  await page.route('https://gc.zgo.at/count.js',r=>r.fulfill({contentType:'text/javascript',body:'window.goatcounter.count=function(o){}'}));
  await page.route('**/quransafar.goatcounter.com/**',r=>r.fulfill({status:204}));
  await page.addInitScript(()=>{localStorage.setItem('instBanner','1');window.__qGap=0.02;window.__qDelay=40})});
 const plays=page=>page.evaluate(()=>window.__qplays||[]);
 const clips=(page,sel='#qBody [data-u]')=>page.$$eval(sel,els=>els.flatMap(e=>e.dataset.u.split('|')));
 const settle=async(page)=>{let a=-1,b=(await plays(page)).length;while(a!==b){a=b;await page.waitForTimeout(250);b=(await plays(page)).length}return b};
 const open=async(page,path)=>{await page.goto('./#'+path);await expect(page.locator('#qPl,#qPlOff')).toBeVisible()};

 test('Play lesson plays every item in order, highlights the current one, and says how many played',async({page})=>{
  await open(page,'/qaida/m/m1');
  const want=await clips(page);expect(want).toHaveLength(29);
  await page.click('#qPlPlay');await expect(page.locator('#qPlStop')).toBeVisible();await expect(page.locator('.q-play')).toHaveCount(1);
  await expect(page.locator('#qPlMsg')).toContainText('Played all 29 items.',{timeout:20000});
  expect(await plays(page)).toEqual(want);
  await expect(page.locator('.q-play')).toHaveCount(0);await expect(page.locator('#qPlPlay')).toBeVisible();await expect(page.locator('#qPlStop')).toBeHidden();
  await expect(page.locator('#qPlSilent')).toHaveCount(0)});

 test('Noorani lessons play too, including the vowel rows (three clips per row) and word lessons',async({page})=>{
  await open(page,'/qaida/n/harakat');const want=await clips(page);expect(want.length).toBeGreaterThan(40);
  await page.click('#qPlPlay');await expect(page.locator('#qPlMsg')).toContainText(/Played all \d+ items\./,{timeout:30000});expect(await plays(page)).toEqual(want)});

 test('speed: 0.75x is used for every clip and is remembered; Repeat loops until Stop',async({page})=>{
  await open(page,'/qaida/m/m1');await page.click('[data-rate="0.75"]');await expect(page.locator('[data-rate="0.75"]')).toHaveAttribute('aria-pressed','true');
  await page.click('#qPlRep');await expect(page.locator('#qPlRep')).toHaveAttribute('aria-pressed','true');
  await page.click('#qPlPlay');await expect.poll(async()=>(await plays(page)).length,{timeout:30000}).toBeGreaterThan(40);
  await page.click('#qPlStop');const rates=await page.evaluate(()=>window.__qRates);expect(new Set(rates)).toEqual(new Set([0.75]));
  const n=await settle(page);await page.waitForTimeout(500);expect((await plays(page)).length).toBe(n);
  await page.reload();await expect(page.locator('[data-rate="0.75"]')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#qPlRep')).toHaveAttribute('aria-pressed','true')});

 test('Pause holds the lesson, Resume carries on, Stop ends it and clears the highlight',async({page})=>{
  await page.addInitScript(()=>{window.__qDelay=150});
  await open(page,'/qaida/m/m1');await page.click('#qPlPlay');await expect.poll(async()=>(await plays(page)).length).toBeGreaterThan(1);
  await page.click('#qPlPause');await expect(page.locator('#qPlPause')).toContainText(/Resume/);
  await page.waitForTimeout(400);const n=(await plays(page)).length;await page.waitForTimeout(700);expect((await plays(page)).length).toBe(n);
  await page.click('#qPlPause');await expect.poll(async()=>(await plays(page)).length).toBeGreaterThan(n);
  await page.click('#qPlStop');await expect(page.locator('.q-play')).toHaveCount(0);await expect(page.locator('#qPlMsg')).toContainText('Stopped');
  const m=await settle(page);await page.waitForTimeout(600);expect((await plays(page)).length).toBe(m)});

 test('items with no recording are skipped, marked silent, and never counted as played',async({page})=>{
  await open(page,'/qaida/m/m1');const want=await clips(page);
  await page.evaluate(u=>{window.__qSilent=[u]},want[2]);
  await page.click('#qPlPlay');await expect(page.locator('#qPlMsg')).toContainText('Played 28 of 29',{timeout:20000});
  expect(await plays(page)).toEqual(want.filter((_,i)=>i!==2));
  await expect(page.locator('.q-silent')).toHaveCount(1);await expect(page.locator('#qPlSilent')).toContainText('No recording');
  await expect(page.locator('#qPlMsg')).not.toContainText('Played all');
  await page.evaluate(()=>{window.__qplays=[]});
  await page.locator('.q-tile').nth(2).click();await expect(page.locator('#qTapMsg')).toContainText('No recording');expect(await plays(page)).toEqual([]);
  await page.locator('.q-tile').nth(3).click();await expect.poll(async()=>(await plays(page)).length).toBe(1);await expect(page.locator('#qTapMsg')).toHaveText('')});

 for(const [path,why] of [['/qaida/m/m2','joined'],['/qaida/m/m22','salah'],['/qaida/n/joined','joined']]){
  test(`${path}: no recording, so there is no Play lesson button, and it says so (${why})`,async({page})=>{
   await open(page,path);await expect(page.locator('#qPlOff')).toContainText('No recording');await expect(page.locator('#qPlPlay')).toHaveCount(0);expect(await plays(page)).toEqual([])})}

 test('Continue to next lesson: Madani 1 goes on to 3 (lesson 2 has no recording and is named as skipped), and Back ends it',async({page})=>{
  await page.goto('./#/qaida/m');await page.click('[data-l=m1]');await expect(page.locator('#qPl')).toBeVisible();
  await page.click('#qPlCont');await expect(page.locator('#qPlCont')).toHaveAttribute('aria-pressed','true');
  await page.click('#qPlPlay');await expect(page).toHaveURL(/#\/qaida\/m\/m3$/,{timeout:20000});
  await expect(page.locator('[data-lesson=m3]')).toBeVisible();await expect(page.locator('#qPlSkip')).toContainText('lesson 2');
  await expect(page.locator('#qPlStop')).toBeVisible();await expect(page.locator('.q-play')).toHaveCount(1);
  const all=await plays(page);expect(all.length).toBeGreaterThan(29);
  await page.goBack();await expect(page).toHaveURL(/#\/qaida\/m$/);await expect(page.locator('.q-row')).toHaveCount(22);
  const n=await settle(page);await page.waitForTimeout(500);expect((await plays(page)).length).toBe(n);
  await page.goBack();await expect(page.locator('#qChoose .q-choice')).toHaveCount(2)});

 test('Play all on the list starts at lesson 1, names the silent lessons, and offers Continue from the last lesson played',async({page})=>{
  await page.goto('./#/qaida/m');await expect(page.locator('#qPall')).toContainText('lesson 2, 22');await expect(page.locator('#qPlayNext')).toHaveCount(0);
  await page.click('#qPlayAll');await expect(page).toHaveURL(/#\/qaida\/m\/m1$/);await expect(page.locator('#qPlStop')).toBeVisible({timeout:5000});
  await expect.poll(async()=>(await plays(page)).length).toBeGreaterThan(3);
  await page.goBack();await expect(page).toHaveURL(/#\/qaida\/m$/);await expect(page.locator('#qPlayNext')).toContainText('lesson 3');
  const n=await settle(page);await page.waitForTimeout(500);expect((await plays(page)).length).toBe(n);
  await page.goto('./#/qaida/n');await expect(page.locator('#qPall')).toContainText('lesson 8')});

 test('Back out of a playing lesson stops the audio (header Back)',async({page})=>{
  await page.addInitScript(()=>{window.__qDelay=120});
  await page.goto('./#/qaida/m');await page.click('[data-l=m1]');await page.click('#qPlPlay');await expect.poll(async()=>(await plays(page)).length).toBeGreaterThan(1);
  await page.click('#back');await expect(page).toHaveURL(/#\/qaida\/m$/);
  const n=await settle(page);await page.waitForTimeout(600);expect((await plays(page)).length).toBe(n);expect(n).toBeLessThan(29)});

 test('tapping an item while the lesson plays takes over: one sound at a time, the lesson stops',async({page})=>{
  await page.addInitScript(()=>{window.__qDelay=120});
  await open(page,'/qaida/m/m1');await page.click('#qPlPlay');await expect.poll(async()=>(await plays(page)).length).toBeGreaterThan(1);
  const before=(await plays(page)).length;await page.locator('.q-tile').nth(20).click();
  const n=await settle(page);expect(n).toBeGreaterThan(before);expect((await plays(page)).at(-1)).toBe(await page.locator('.q-tile').nth(20).getAttribute('data-u'));await expect(page.locator('#qPlPlay')).toBeVisible();await expect(page.locator('.q-play')).toHaveCount(0)});

 test('another player in the app (Quran audio) starting stops the Qaida playback',async({page})=>{
  await page.addInitScript(()=>{window.__qDelay=120});
  await open(page,'/qaida/m/m1');await page.click('#qPlPlay');await expect.poll(async()=>(await plays(page)).length).toBeGreaterThan(1);
  await page.evaluate(()=>dispatchEvent(new CustomEvent('qs:audio',{detail:'app'})));
  const n=await settle(page);await page.waitForTimeout(500);expect((await plays(page)).length).toBe(n);await expect(page.locator('#qPlPlay')).toBeVisible()});

 test('live reading and playback never overlap: starting live stops playback; Play does nothing while the mic is live',async({page})=>{
  await page.addInitScript(()=>{window.__qFake=true;window.__qDelay=120});
  await open(page,'/qaida/m/m1');await page.click('#qPlPlay');await expect.poll(async()=>(await plays(page)).length).toBeGreaterThan(1);
  await page.locator('.q-lbtn').first().click();await expect(page.locator('#qLp')).toBeVisible();
  const n=await settle(page);await page.waitForTimeout(500);expect((await plays(page)).length).toBe(n);await expect(page.locator('#qPlPlay')).toBeVisible();
  await page.click('#qPlPlay');await expect(page.locator('#qPlMsg')).toContainText('Stop live reading first');await page.waitForTimeout(500);expect((await plays(page)).length).toBe(n);
  await page.locator('.q-tile').nth(25).click({force:true});await expect(page.locator('#qlStop')).toBeVisible();
  await page.click('#qlStop');await expect(page.locator('#qPlPlay')).toBeVisible()});

 test('Hear & repeat still works and the Play bar hides while practising',async({page})=>{
  await open(page,'/qaida/m/m1');await page.click('#qaPrac');await expect(page.locator('#qPl')).toBeHidden();await expect(page.locator('#qPrac')).toBeVisible();
  await expect.poll(async()=>(await plays(page)).length).toBeGreaterThan(0)});
}
