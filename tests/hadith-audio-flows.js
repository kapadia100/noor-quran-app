// Hadith Audio page (v3.7.1): English / Urdu translation only, by book, chapter or hadith number. Data and speech are mocked.
import{mockHadith,mockSpeech,MOCK_VOICES,LANGS,BOOKS,txt}from'./hadith-listen-flows.js';
export function hadithAudioFlows(test,expect){
 test.use({serviceWorkers:'block'});
 test.beforeEach(async({page})=>{
  await page.route('https://gc.zgo.at/count.js',r=>r.fulfill({contentType:'text/javascript',body:'window.goatcounter.count=function(o){}'}));
  await page.route('**/quransafar.goatcounter.com/**',r=>r.fulfill({status:204}));
  await page.addInitScript(()=>{localStorage.setItem('instBanner','1')});await mockHadith(page);
  // later routes win: nawawi has no Urdu edition, and Urdu Bukhari hadith 2 has an empty translation
  await page.route('https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/**',async r=>{
   const p=new URL(r.request().url()).pathname.replace(/^.*hadith-api@1\//,'');
   const J=o=>r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(o)});
   if(p==='editions.json')return J(Object.fromEntries(Object.entries(BOOKS).map(([k,name])=>[k,{name,collection:Object.entries(LANGS).filter(([l])=>!(l==='urd'&&k==='nawawi')).map(([l,language])=>({name:`${l}-${k}`,author:null,language,link:''}))}])));
   if(p==='editions/urd-bukhari/sections/1.min.json')return J({metadata:{name:BOOKS.bukhari,section:{1:'Revelation'}},hadiths:[1,2,3].map(n=>({hadithnumber:n,text:n===2?'':txt('urd',n),grades:[]}))});
   r.fallback()})});
 const spoken=page=>page.evaluate(()=>window.__spoken);
 const open=async(page,hash='./#/haudio/bukhari')=>{await page.goto(hash);await expect(page.locator('.ha-it').first()).toBeVisible()};
 const lang=(page,l)=>page.locator(`[data-lang="${l}"]`);

 test('Hadith screen has an Audio entry; the page offers only English and Urdu, English first',async({page})=>{
  await mockSpeech(page);await page.goto('./#/hadith');await expect(page.locator('#haEntry')).toContainText('Hadith Audio');await page.click('#haEntry');
  await expect(page).toHaveURL(/#\/haudio/);await expect(page.locator('.ha-it').first()).toBeVisible();
  const l=await page.locator('[data-lang]').evaluateAll(b=>b.map(x=>({v:x.dataset.lang,t:x.textContent.trim(),on:x.getAttribute('aria-checked')})));
  expect(l).toEqual([{v:'eng',t:'English',on:'true'},{v:'urd',t:'Urdu',on:'false'}]);
  await expect(page.locator('#haBook')).toBeVisible();await expect(page.locator('#haSec')).toBeVisible();await expect(page.locator('#haNum')).toBeVisible();
  for(const id of ['#haPlay','#haStop','#haPrev','#haNext'])await expect(page.locator(id)).toBeVisible();
  await expect(page.locator('#app')).not.toContainText('إنما')});

 test('Play reads only the English translation, never the Arabic, and continues through the chapter',async({page})=>{
  await mockSpeech(page);await page.addInitScript(()=>{window.__dur=60});await open(page);
  await page.click('#haPlay');
  await expect.poll(async()=>(await spoken(page)).map(s=>s.text).join(' ')).toContain('Number 3');
  await expect(page.locator('#haMsg')).toHaveText('End of the chapter.');
  const s=await spoken(page);const all=s.map(x=>x.text).join(' ');
  expect(all).toContain('Actions are judged by intentions');expect(all).toContain('Number 1');expect(all).toContain('Number 2');
  expect(all).not.toMatch(/[\u0600-\u06FF]/);for(const x of s){expect(x.voice).toBe('Samantha');expect(x.lang).toBe('en-US')}
  await expect(page.locator('#haPlay')).toHaveText('Play')});

 test('Urdu plays the Urdu translation with the Urdu voice; a hadith with no Urdu translation is marked and skipped, never dropped',async({page})=>{
  await mockSpeech(page);await page.addInitScript(()=>{window.__dur=60});await open(page);
  await lang(page,'urd').click();await expect(lang(page,'urd')).toHaveAttribute('aria-checked','true');
  await expect(page.locator('.ha-it')).toHaveCount(3);await expect(page.locator('.ha-it.ha-miss')).toHaveCount(1);
  await expect(page.locator('.ha-it.ha-miss')).toContainText('No Urdu translation for this hadith');
  await expect(page.locator('#haSkip')).toContainText('1 hadith in this chapter has no Urdu translation and is skipped');
  await page.click('#haPlay');
  await expect.poll(async()=>(await spoken(page)).map(s=>s.text).join(' ')).toContain('نمبر 3');
  const s=await spoken(page),all=s.map(x=>x.text).join(' ');
  expect(all).toContain('نمبر 1');expect(all).not.toContain('نمبر 2');for(const x of s){expect(x.voice).toBe('Imran');expect(x.lang).toBe('ur-PK')}
  expect(all).not.toContain('إنما')});

 test('jump by hadith number selects the right chapter and hadith, then Play reads that one',async({page})=>{
  await mockSpeech(page);await open(page);
  await page.fill('#haNum','5');await page.click('#haGo');
  await expect(page.locator('#haSec')).toHaveValue('2');await expect(page.locator('.ha-it.ha-on')).toContainText('Sahih al-Bukhari 5');
  await page.click('#haPlay');await expect.poll(async()=>(await spoken(page)).length).toBeGreaterThan(0);
  expect((await spoken(page))[0].text).toContain('Actions are judged');expect((await spoken(page)).map(x=>x.text).join(' ')).toContain('Number 5');
  await page.fill('#haNum','999');await page.click('#haGo');await expect(page.locator('#haMsg')).toContainText('Hadith 999 was not found.')});

 test('chapter picker, Pause, Resume, Next, Previous and Stop',async({page})=>{
  await mockSpeech(page);await page.addInitScript(()=>{window.__dur=900});await open(page);
  await page.selectOption('#haSec','2');await expect(page.locator('.ha-it')).toHaveCount(3);await expect(page.locator('.ha-it').first()).toContainText('Sahih al-Bukhari 4');
  await page.click('#haPlay');await expect(page.locator('#haPlay')).toHaveText('Pause');
  await page.click('#haPlay');await expect(page.locator('#haPlay')).toHaveText('Resume');
  await page.click('#haPlay');await expect(page.locator('#haPlay')).toHaveText('Pause');
  await page.click('#haNext');await expect(page.locator('.ha-it.ha-on')).toContainText('Sahih al-Bukhari 5');
  await expect.poll(async()=>(await spoken(page)).map(s=>s.text).join(' ')).toContain('Number 5');
  await page.click('#haPrev');await expect(page.locator('.ha-it.ha-on')).toContainText('Sahih al-Bukhari 4');
  await expect(page.locator('#haPrev')).toBeDisabled();
  await page.click('#haStop');await expect(page.locator('#haPlay')).toHaveText('Play');await expect(page.locator('#haStop')).toBeDisabled();
  expect(await page.evaluate(()=>speechSynthesis.speaking)).toBe(false)});

 test('a book with no Urdu edition is disabled for Urdu; switching language moves to a book that has it',async({page})=>{
  await mockSpeech(page);await open(page,'./#/haudio/nawawi');
  await expect(page.locator('#haBook')).toHaveValue('nawawi');await lang(page,'urd').click();
  await expect(page.locator('#haBook')).not.toHaveValue('nawawi');
  await expect(page.locator('#haBook option[value="nawawi"]')).toHaveAttribute('disabled','');await expect(page.locator('#haBook option[value="nawawi"]')).toContainText('Urdu not available')});

 test('no Urdu voice installed: clear message, Play disabled; English still plays',async({page})=>{
  await mockSpeech(page,{voices:MOCK_VOICES.filter(v=>v.lang!=='ur-PK')});await open(page);
  await lang(page,'urd').click();await expect(page.locator('#haMsg')).toContainText('No Urdu voice is installed on this device');
  await expect(page.locator('#haPlay')).toBeDisabled();expect((await spoken(page)).length).toBe(0);
  await lang(page,'eng').click();await expect(page.locator('#haMsg')).toBeHidden();await expect(page.locator('#haPlay')).toBeEnabled()});

 test('a device that never speaks shows the silent message instead of pretending',async({page})=>{
  await mockSpeech(page,{silent:true});await open(page);await page.click('#haPlay');await expect(page.locator('#haMsg')).toContainText('Nothing played')});

 test('leaving the page stops the speech; Urdu interface; other hadith reading is unaffected',async({page})=>{
  await mockSpeech(page);await page.addInitScript(()=>{window.__dur=3000});await open(page);await page.click('#haPlay');await expect(page.locator('#haPlay')).toHaveText('Pause');
  await page.goto('./#/hadith');await expect(page.locator('#hl')).toBeVisible();await expect.poll(()=>page.evaluate(()=>speechSynthesis.speaking)).toBe(false);
  await page.selectOption('#hl','tam');await page.goto('./#/haudio/bukhari');await expect(page.locator('.ha-it').first()).toBeVisible();await lang(page,'urd').click();
  await page.goto('./#/hadith');await expect(page.locator('#hl')).toHaveValue('tam');
  await page.goto('./#/hadith/bukhari/1');await expect(page.locator('article.hd').first()).toContainText('எண் 1');
  await page.evaluate(()=>localStorage.setItem('settings',JSON.stringify({ui:'ur'})));await page.goto('./#/haudio/bukhari');await page.reload();
  await expect(page.locator('.ha-it').first()).toBeVisible();await expect(page.locator('#haPlay')).toContainText('سنیں');await expect(page.locator('[data-lang="eng"]')).toHaveText('انگریزی');await expect(page.locator('[data-lang="urd"]')).toHaveText('اردو')})}
