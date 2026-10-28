// Kanz ul Iman (Urdu, Ahmed Raza Khan): selectable in the reader and Settings, exact text, right-to-left, offline.
export function kanzFlows(test,expect){
 test.describe('Kanz ul Iman',()=>{
  test.use({serviceWorkers:'block'});
  const KZ='ur.kanzuliman';
  test('listed under Urdu in the reader; choosing it shows the exact text right-to-left; choice is saved',async({page})=>{
   await page.goto('./#/surah/112');await expect(page.locator('#trL')).toBeVisible({timeout:20000});
   await page.selectOption('#trL','ur');await expect(page.locator('#tr option[value="ur.kanzuliman"]')).toHaveText('Kanz ul Iman — Ahmed Raza Khan');
   await page.selectOption('#tr',KZ);await expect(page.locator('#a1 .tr')).toHaveText('تم فرماؤ وہ اللہ ہے وہ ایک ہے',{timeout:15000});
   const want=['تم فرماؤ وہ اللہ ہے وہ ایک ہے','اللہ بے نیاز ہے','نہ اس کی کوئی اولاد اور نہ وہ کسی سے پیدا ہوا','اور نہ اس کے جوڑ کا کوئی'];
   for(let i=0;i<4;i++){const p=page.locator(`#a${i+1} .tr`);await expect(p).toHaveText(want[i]);await expect(p).toHaveAttribute('dir','rtl');await expect(p).toHaveAttribute('lang','ur')}
   expect(await page.locator('#a1 .tr').evaluate(e=>({d:getComputedStyle(e).direction,ff:getComputedStyle(e).fontFamily}))).toMatchObject({d:'rtl'});
   expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('settings')).trans)).toBe(KZ);
   await page.reload();await expect(page.locator('#tr')).toHaveValue(KZ,{timeout:20000});await expect(page.locator('#a1 .tr')).toHaveText(want[0]);
   await expect(page.locator('#app')).not.toContainText(/tanzil|alquran|islamic\.network/i)});
  test('Ayat al-Kursi and Al-Fatiha are exact and nothing shows an error or a fallback notice',async({page})=>{
   await page.addInitScript(()=>localStorage.setItem('settings',JSON.stringify({trans:'ur.kanzuliman'})));
   await page.goto('./#/surah/1');await expect(page.locator('#a5 .tr')).toHaveText('ہم تجھی کو پوجیں اور تجھی سے مدد چاہیں،',{timeout:20000});await expect(page.locator('#a1 .tr')).toHaveText('اللہ کے نام سے شروع جو بہت مہربان رحمت والا');
   await expect(page.locator('.card.muted')).toHaveCount(0);
   await page.goto('./#/surah/2/255');await expect(page.locator('#a255 .tr')).toContainText('اللہ ہے جس کے سوا کوئی معبود نہیں',{timeout:20000});await expect(page.locator('#a255 .tr')).toContainText('اور وہی ہے بلند بڑائی والا')});
  test('works with no network at all (bundled text)',async({page})=>{
   await page.addInitScript(()=>localStorage.setItem('settings',JSON.stringify({trans:'ur.kanzuliman'})));
   await page.route(/alquran\.cloud|islamic\.network/,r=>r.abort());
   await page.goto('./#/surah/112');await expect(page.locator('#a1 .tr')).toHaveText('تم فرماؤ وہ اللہ ہے وہ ایک ہے',{timeout:20000});await expect(page.locator('.card.muted')).toHaveCount(0)});
  test('Settings: language Urdu, translator Kanz ul Iman, and the Urdu app shows the Urdu name',async({page})=>{
   await page.addInitScript(()=>localStorage.setItem('settings',JSON.stringify({trans:'ur.kanzuliman'})));
   await page.goto('./#/settings');await expect(page.locator('#s_tlang')).toHaveValue('ur',{timeout:20000});await expect(page.locator('#s_trans')).toHaveValue(KZ);
   await expect(page.locator('#s_trans option:checked')).toHaveText('Kanz ul Iman — Ahmed Raza Khan');
   await page.selectOption('#s_ui','ur');await expect(page.locator('#s_trans option:checked')).toHaveText('کنز الایمان — احمد رضا خان',{timeout:15000})});
  test('FAQ credits name the translation and its text provider',async({page})=>{
   await page.goto('./#/help');await expect(page.locator('#app')).toContainText('Kanz ul Iman',{timeout:15000});await expect(page.locator('#app')).toContainText('Ahmed Raza Khan')});
 })}
