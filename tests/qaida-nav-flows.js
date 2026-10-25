// Shared by tests/e2e (iPhone/Android Chromium) and tests/ios (WebKit): history and the header back button across the Qaida screens.
export function qaidaNavFlows(test,expect){
 test.beforeEach(async({page})=>{
  await page.route('https://gc.zgo.at/count.js',r=>r.fulfill({contentType:'text/javascript',body:'window.goatcounter.count=function(o){}'}));
  await page.route('**/quransafar.goatcounter.com/**',r=>r.fulfill({status:204}));
  await page.addInitScript(()=>{localStorage.setItem('instBanner','1')})});
 const back=async(page,how)=>{if(how==='header')await page.click('#back');else await page.goBack();await page.waitForTimeout(250)};
 const url=(page,re)=>expect(page).toHaveURL(re);
 const chooser=page=>expect(page.locator('#qChoose .q-choice')).toHaveCount(2);
 for(const how of ['header','history']){
  test(`back (${how}): More > chooser > Madani list > lesson, and back out step by step`,async({page})=>{
   await page.goto('./#/more');await page.click('#qaidaEntry');await chooser(page);await page.click('#qcMadani');await url(page,/#\/qaida\/m$/);
   await page.click('[data-l=m3]');await url(page,/#\/qaida\/m\/m3$/);await expect(page.locator('[data-lesson=m3]')).toBeVisible();
   await back(page,how);await url(page,/#\/qaida\/m$/);await expect(page.locator('.q-row')).toHaveCount(22);
   await back(page,how);await url(page,/#\/qaida$/);await chooser(page);
   await back(page,how);await url(page,/#\/more$/)});
  test(`back (${how}): Noorani works the same`,async({page})=>{
   await page.goto('./#/more');await page.click('#qaidaEntry');await page.click('#qcNoorani');await url(page,/#\/qaida\/n$/);
   await page.click('[data-l=huroof]');await url(page,/#\/qaida\/n\/huroof$/);
   await back(page,how);await url(page,/#\/qaida\/n$/);await expect(page.locator('.q-row')).toHaveCount(9);
   await back(page,how);await chooser(page);await url(page,/#\/qaida$/);await back(page,how);await url(page,/#\/more$/)});
  test(`back (${how}): Home card with a remembered choice skips the chooser but Back still lands on it, then Home`,async({page})=>{
   await page.goto('./#/more');await page.click('#qaidaEntry');await page.click('#qcMadani');await expect(page.locator('.q-row')).toHaveCount(22);
   await page.goto('./');await expect(page.locator('#homeQaida')).toHaveAttribute('href','#/qaida/m');
   await page.click('#homeQaida');await url(page,/#\/qaida\/m$/);await expect(page.locator('.q-row')).toHaveCount(22);
   await back(page,how);await url(page,/#\/qaida$/);await chooser(page);
   await back(page,how);await expect(page.locator('#homeQaida')).toBeVisible();expect(new URL(page.url()).hash).toMatch(/^(#\/?)?$/)});
  test(`back (${how}): Home card the first time opens the chooser; Back returns Home`,async({page})=>{
   await page.goto('./');await page.click('#homeQaida');await chooser(page);await page.click('#qcNoorani');await url(page,/#\/qaida\/n$/);
   await back(page,how);await chooser(page);await back(page,how);await expect(page.locator('#homeQaida')).toBeVisible()});
  test(`back (${how}): a saved lesson link opens with the list and chooser underneath`,async({page})=>{
   await page.goto('./');await page.goto('./#/qaida/m/m8');await expect(page.locator('[data-lesson=m8]')).toBeVisible();
   await back(page,how);await url(page,/#\/qaida\/m$/);await expect(page.locator('.q-row')).toHaveCount(22);
   await back(page,how);await chooser(page);await back(page,how);await expect(page.locator('#homeQaida')).toBeVisible()});
  test(`back (${how}): old Noorani lesson link (#/qaida/huroof) also has list and chooser underneath`,async({page})=>{
   await page.goto('./');await page.goto('./#/qaida/huroof');await expect(page.locator('.q-tile')).toHaveCount(29);
   await back(page,how);await url(page,/#\/qaida\/n$/);await back(page,how);await chooser(page)});
  test(`back (${how}): after Switch Qaida the chooser is the page before the next list`,async({page})=>{
   await page.goto('./#/more');await page.click('#qaidaEntry');await page.click('#qcMadani');await page.click('[data-l=m1]');
   await page.click('#qSwitch');await url(page,/#\/qaida$/);await chooser(page);
   await page.click('#qcNoorani');await url(page,/#\/qaida\/n$/);
   await back(page,how);await chooser(page);await back(page,how);await url(page,/#\/more$/)});
 }
 test('Switch Qaida from a list or lesson does not stack extra chooser copies (one Back from the chooser reaches More)',async({page})=>{
  await page.goto('./#/more');await page.click('#qaidaEntry');await page.click('#qcMadani');await page.click('[data-l=m3]');
  await page.click('#qSwitch');await chooser(page);await page.click('#qcMadani');await page.click('#qSwitch');await chooser(page);
  await page.click('#back');await url(page,/#\/more$/)});
 test('"All lessons" returns to the list without stacking a second list',async({page})=>{
  await page.goto('./#/more');await page.click('#qaidaEntry');await page.click('#qcMadani');await page.click('[data-l=m3]');
  await page.click('.q-back');await url(page,/#\/qaida\/m$/);await page.click('#back');await chooser(page);await page.click('#back');await url(page,/#\/more$/)});
 test('reload on a lesson keeps the history chain',async({page})=>{
  await page.goto('./#/more');await page.click('#qaidaEntry');await page.click('#qcMadani');await page.click('[data-l=m3]');
  await page.reload();await expect(page.locator('[data-lesson=m3]')).toBeVisible();
  await page.click('#back');await url(page,/#\/qaida\/m$/);await page.click('#back');await chooser(page)});
}
