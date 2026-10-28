// Shared by tests/e2e (iPhone/Android Chromium) and tests/ios (WebKit): proper language names + Play (listen) on hadith cards.
// The hadith data and the phone's speech engine are both mocked: nothing is fetched from the network and nothing is really spoken.
const LANGS={ara:'Arabic',ben:'Bengali',eng:'English',fra:'French',ind:'Indonesian',rus:'Russian',tur:'Turkish',urd:'Urdu',tam:'Tamil'};
const BOOKS={bukhari:'Sahih al-Bukhari',muslim:'Sahih Muslim',nawawi:'40 Hadith Nawawi'};
const TEXT={ara:n=>`إنما الأعمال بالنيات. وإنما لكل امرئ ما نوى. رقم ${n}`,eng:n=>`Actions are judged by intentions. Every person gets what they intended. Number ${n}`,urd:n=>`اعمال کا دارومدار نیتوں پر ہے۔ نمبر ${n}`,tam:n=>`செயல்கள் எண்ணங்களைப் பொறுத்தது. எண் ${n}`,ben:n=>`কাজ নিয়তের উপর নির্ভরশীল। নম্বর ${n}`};
const txt=(l,n)=>(TEXT[l]||(x=>`[${l}] hadith text number ${x}.`))(n);
export const MOCK_VOICES=[{name:'Samantha',lang:'en-US',localService:true,default:true},{name:'Imran',lang:'ur-PK',localService:true,default:false},{name:'Majed',lang:'ar-SA',localService:true,default:false},{name:'Amelie',lang:'fr-CA',localService:true,default:false}];
export async function mockHadith(page){
 await page.route('https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/**',r=>{
  const u=new URL(r.request().url()),p=u.pathname.replace(/^.*hadith-api@1\//,'');
  const J=o=>r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(o)});
  if(p==='editions.json')return J(Object.fromEntries(Object.entries(BOOKS).map(([k,name])=>[k,{name,collection:Object.entries(LANGS).map(([l,language])=>({name:`${l}-${k}`,author:null,language,link:''}))}])));
  if(p==='info.json')return J(Object.fromEntries(Object.entries(BOOKS).map(([k,name])=>[k,{metadata:{name,sections:{0:'','1':'Revelation','2':'Belief'},section_details:{'1':{hadithnumber_first:1,hadithnumber_last:3},'2':{hadithnumber_first:4,hadithnumber_last:6}}}}])));
  let m=p.match(/^editions\/(\w+)-(\w+)\/sections\/(\d+)\.min\.json$/);
  if(m){const[,l,k,s]=m,a=(+s-1)*3+1;return J({metadata:{name:BOOKS[k],section:{[s]:'Revelation'}},hadiths:[0,1,2].map(i=>({hadithnumber:a+i,text:txt(l,a+i),grades:[]}))})}
  m=p.match(/^editions\/(\w+)-(\w+)\/(\d+)\.min\.json$/);
  if(m){const[,l,k,n]=m;return J({metadata:{name:BOOKS[k],section:{'1':'Revelation'}},hadiths:[{hadithnumber:+n,text:txt(l,n),grades:[]}]})}
  m=p.match(/^editions\/(\w+)-(\w+)\.min\.json$/);
  if(m){const[,l]=m;return J({metadata:{name:'x'},hadiths:[1,2,3,4].map(n=>({hadithnumber:n,text:txt(l,n)+' patience',grades:[]}))})}
  r.fulfill({status:404,body:'{}'})})}
/** Installs the fake speech engine. opts: voices (array), lateMs (voices appear after this delay), silent (never starts), none (no speechSynthesis at all). */
export async function mockSpeech(page,opts={}){
 await page.addInitScript(o=>{
  window.__spoken=[];window.__cancels=0;window.__silent=!!o.silent;
  if(o.none){try{Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true})}catch{/* ignore */}return}
  class U{constructor(t){this.text=t}}
  window.SpeechSynthesisUtterance=U;
  let voices=o.lateMs?[]:o.voices,cur=null;const hs={};
  const ss={getVoices:()=>voices,addEventListener:(t,f)=>{(hs[t]??=[]).push(f)},removeEventListener:()=>{},
   cancel(){window.__cancels++;const u=cur;cur=null;if(u)setTimeout(()=>u.onerror&&u.onerror({error:'canceled'}),0)},
   speak(u){window.__spoken.push({text:u.text,lang:u.lang,voice:u.voice&&u.voice.name,rate:u.rate});if(window.__silent)return;cur=u;
    setTimeout(()=>{if(cur!==u)return;u.onstart&&u.onstart();setTimeout(()=>{if(cur!==u)return;cur=null;u.onend&&u.onend()},window.__dur??250)},30)},
   get speaking(){return !!cur}};
  Object.defineProperty(window,'speechSynthesis',{value:ss,configurable:true});
  if(o.lateMs)setTimeout(()=>{voices=o.voices;(hs.voiceschanged||[]).forEach(f=>f())},o.lateMs);
  window.__hdWd=1200;
  // Quran audio is mocked too: play/pause only flip state and fire the events the app listens to.
  HTMLMediaElement.prototype.play=function(){Object.defineProperty(this,'paused',{value:false,configurable:true});this.dispatchEvent(new Event('play'));return Promise.resolve()};
  HTMLMediaElement.prototype.pause=function(){if(this.paused)return;Object.defineProperty(this,'paused',{value:true,configurable:true});this.dispatchEvent(new Event('pause'))};
 },{voices:MOCK_VOICES,...opts});
}
export function hadithListenFlows(test,expect){
 test.use({serviceWorkers:'block'});
 test.beforeEach(async({page})=>{
  await page.route('https://gc.zgo.at/count.js',r=>r.fulfill({contentType:'text/javascript',body:'window.goatcounter.count=function(o){}'}));
  await page.route('**/quransafar.goatcounter.com/**',r=>r.fulfill({status:204}));
  await page.addInitScript(()=>{localStorage.setItem('instBanner','1')});await mockHadith(page)});
 const spoken=page=>page.evaluate(()=>window.__spoken);
 const btn=(page,i=0,k='tr')=>page.locator('article.hd').nth(i).locator(`[data-hl="${k}"]`);
 const setLang=async(page,l)=>{await page.goto('./#/hadith');await expect(page.locator('#hl')).toBeVisible();await page.selectOption('#hl',l)};

 test('language dropdown and collection cards show proper names, never raw codes',async({page})=>{
  await mockSpeech(page);await page.goto('./#/hadith');await expect(page.locator('#hl')).toBeVisible();
  const opts=await page.locator('#hl option').evaluateAll(o=>o.map(x=>({v:x.value,t:x.textContent})));
  expect(opts.map(o=>o.v).sort()).toEqual(Object.keys(LANGS).sort());
  const want={ara:'Arabic (العربية)',ben:'Bengali (বাংলা)',eng:'English',fra:'French (Français)',ind:'Indonesian (Bahasa Indonesia)',rus:'Russian (Русский)',tur:'Turkish (Türkçe)',urd:'Urdu (اردو)',tam:'Tamil (தமிழ்)'};
  for(const o of opts){expect(o.t).toBe(want[o.v]);expect(o.t).not.toMatch(/^[a-z]{3}$/)}
  const card=await page.locator('.list li small').first().innerText();
  for(const n of Object.values(LANGS))expect(card).toContain(n);expect(card).not.toMatch(/\b(ara|ben|eng|fra|ind|rus|tur|urd|tam)\b/);
  await page.selectOption('#hl','tam');await expect(page.locator('#hl')).toHaveValue('tam');await expect(page.locator('#app')).not.toContainText(/\(tam n\/a\)/)});
 test('Urdu interface shows Urdu language names',async({page})=>{
  await mockSpeech(page);await page.goto('./');await page.evaluate(()=>localStorage.setItem('settings',JSON.stringify({ui:'ur'})));await page.goto('./#/hadith');await page.reload();
  await expect(page.locator('#hl')).toBeVisible();const t=await page.locator('#hl option').evaluateAll(o=>o.map(x=>x.textContent));
  expect(t).toContain('انگریزی (English)');expect(t).toContain('اردو');expect(t).toContain('فرانسیسی (Français)');expect(t.join(' ')).not.toMatch(/\b(ara|ben|eng|fra|ind|rus|tur|urd|tam)\b/)});

 test('language order: English, Urdu, Arabic first, then the rest A–Z (Hadith dropdown and collection cards)',async({page})=>{
  await mockSpeech(page);await page.goto('./#/hadith');await expect(page.locator('#hl')).toBeVisible();
  const o=await page.locator('#hl option').evaluateAll(a=>a.map(x=>x.value));expect(o).toEqual(['eng','urd','ara','ben','fra','ind','rus','tam','tur']);
  await expect(page.locator('#hl option').first()).toHaveText('English');await expect(page.locator('#hl option').nth(1)).toHaveText('Urdu (اردو)');await expect(page.locator('#hl option').nth(2)).toHaveText('Arabic (العربية)');
  await expect(page.locator('.list li small').first()).toContainText('English, Urdu, Arabic, Bengali, French, Indonesian, Russian, Tamil, Turkish');
  await page.selectOption('#hl','urd');await expect(page.locator('#hl')).toHaveValue('urd');expect(await page.locator('#hl option').first().getAttribute('value')).toBe('eng')});
 test('Quran translation lists: English first, then Urdu, then Arabic, then others A–Z; the chosen one stays selected',async({page})=>{
  const E=(identifier,language,englishName)=>({identifier,language,name:englishName,englishName,format:'text',type:'translation',direction:'ltr'});
  const list=[E('az.m','az','Mammadaliyev'),E('ur.jalandhry','ur','Fateh Muhammad Jalandhry'),E('fr.hamidullah','fr','Hamidullah'),E('en.yusufali','en','Yusuf Ali'),E('ar.x','ar','Arabic Simple'),E('en.sahih','en','Saheeh International'),E('ur.ahmedali','ur','Ahmed Ali'),E('de.bubenheim','de','Bubenheim'),E('bn.bengali','bn','Muhiuddin Khan')];
  await page.route('**/edition?type=translation*',r=>r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({code:200,status:'OK',data:list})}));
  await page.addInitScript(()=>{if(!localStorage.getItem('settings'))localStorage.setItem('settings',JSON.stringify({trans:'ur.ahmedali'}))});
  await mockSpeech(page);await page.goto('./#/settings');const sel=page.locator('#s_trans');await expect(sel).toBeVisible({timeout:15000});
  const v=await sel.locator('option').evaluateAll(a=>a.map(x=>x.value));
  expect(v).toEqual(['ur.jalandhry','ur.ahmedali']);
  const lv=await page.locator('#s_tlang option').evaluateAll(a=>a.map(x=>x.value));expect(lv).toEqual(['en','ur','ar','az','bn','fr','de']);
  await expect(page.locator('#s_tlang')).toHaveValue('ur');
  await expect(sel).toHaveValue('ur.ahmedali');
  await page.goto('./#/search');await expect(page.locator('#se')).toBeVisible({timeout:15000});const sv=await page.locator('#se option').evaluateAll(a=>a.map(x=>x.value));expect(sv.slice(0,5)).toEqual(['en.sahih','en.yusufali','ur.ahmedali','ur.jalandhry','quran-simple-clean'])});

 test('Quran pickers: language and translator are separate controls; reciter is its own list; the stored choice survives',async({page})=>{
  const E=(identifier,language,englishName,name=englishName)=>({identifier,language,name,englishName,format:'text',type:'translation',direction:'ltr'});
  const list=[E('fr.hamidullah','fr','Hamidullah'),E('ur.jalandhry','ur','Fateh Muhammad Jalandhry'),E('en.yusufali','en','Yusuf Ali'),E('en.sahih','en','Saheeh International'),E('ur.ahmedali','ur','Ahmed Ali')];
  const A=(identifier,language,englishName,name)=>({identifier,language,name,englishName,format:'audio',type:'versebyverse'});
  const aud=[A('ar.husary','ar','Mahmoud Khalil Al-Husary','محمود خليل الحصري'),A('ar.alafasy','ar','Mishary Alafasy','مشاري العفاسي'),A('ar.abdulbasitmurattal','ar','Abdul Basit Abdul Samad','عبد الباسط عبد الصمد'),A('ur.khan','ur','Shamshad Ali Khan','Shamshad Ali Khan')];
  const ok=body=>r=>r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({code:200,status:'OK',data:body})});
  await page.route('**/edition?type=translation*',ok(list));await page.route('**/edition?format=audio*',ok(aud));
  await page.addInitScript(()=>{localStorage.setItem('settings',JSON.stringify({trans:'ur.jalandhry',reciter:'ar.husary'}))});
  await page.goto('./#/surah/1');const L=page.locator('#trL'),T=page.locator('#tr'),R=page.locator('#rc');await expect(L).toBeVisible({timeout:15000});
  // the stored choice is kept: Urdu language, its translator and the reciter are all still selected
  await expect(L).toHaveValue('ur');await expect(T).toHaveValue('ur.jalandhry');await expect(R).toHaveValue('ar.husary');
  const vals=l=>l.locator('option').evaluateAll(a=>a.map(x=>x.value));
  expect(await vals(L)).toEqual(['en','ur','fr']);expect(await vals(T)).toEqual(['ur.jalandhry','ur.ahmedali']);
  const txt=l=>l.locator('option').evaluateAll(a=>a.map(x=>x.textContent));expect((await txt(L)).slice(0,3)).toEqual(['English','Urdu (اردو)','French (Français)']);
  // reciters are their own list: Arabic reciters only (no translation audio), default first then A–Z, full English + Arabic names
  expect(await vals(R)).toEqual(['ar.alafasy','ar.abdulbasitmurattal','ar.husary']);expect((await txt(R))[0]).toBe('Mishary Alafasy — مشاري العفاسي');
  for(const x of [...await txt(L),...await txt(T),...await txt(R)])expect(x).not.toMatch(/^[a-z]{2,3}$/);
  // switching language moves to that language's default translator; reciter untouched
  await L.selectOption('en');await expect(T).toHaveValue('en.sahih',{timeout:15000});await expect(L).toHaveValue('en');expect(await vals(T)).toEqual(['en.sahih','en.yusufali']);await expect(R).toHaveValue('ar.husary');
  await T.selectOption('en.yusufali');await expect(T).toHaveValue('en.yusufali',{timeout:15000});
  const st=await page.evaluate(()=>JSON.parse(localStorage.getItem('settings')));expect(st.trans).toBe('en.yusufali');expect(st.reciter).toBe('ar.husary');
  await R.selectOption('ar.alafasy');await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('settings')).reciter)).toBe('ar.alafasy');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('settings')).trans)).toBe('en.yusufali');
  // the same controls in Settings, same order
  await page.goto('./#/settings');await expect(page.locator('#s_tlang')).toHaveValue('en',{timeout:15000});await expect(page.locator('#s_trans')).toHaveValue('en.yusufali');await expect(page.locator('#s_reciter')).toHaveValue('ar.alafasy');
  await page.selectOption('#s_tlang','ur');await expect(page.locator('#s_trans')).toHaveValue('ur.jalandhry',{timeout:15000});await expect(page.locator('#s_reciter')).toHaveValue('ar.alafasy');
  await expect(page.locator('#app')).not.toContainText(/everyayah|alquran|islamic\.network|cdn\./i)});

 test('Play, Pause, Resume, Stop on the selected translation, with the best device voice',async({page})=>{
  await mockSpeech(page);await setLang(page,'eng');await page.goto('./#/hadith/bukhari/n/1');const b=btn(page,0);await expect(b).toBeVisible({timeout:15000});await expect(b).toHaveText('Play');
  const tr=await page.locator('.hd .tr').first().innerText();await b.click();await expect(b).toHaveText('Pause');
  await expect.poll(()=>spoken(page)).toHaveLength(1);const s=(await spoken(page))[0];expect(s.text).toBe(tr);expect(s.voice).toBe('Samantha');expect(s.lang).toBe('en-US');expect(s.rate).toBe(1);
  await expect(page.locator('article.hd.hd-on')).toHaveCount(1);
  await b.click();await expect(b).toHaveText('Resume');const n=(await spoken(page)).length;await b.click();await expect(b).toHaveText('Pause');await expect.poll(async()=>(await spoken(page)).length).toBe(n+1);
  await page.locator('.hl-x').first().click();await expect(b).toHaveText('Play');await expect(page.locator('.hd-on')).toHaveCount(0);await expect(page.locator('.hl-x').first()).toBeHidden();
  await page.waitForTimeout(500);expect((await spoken(page)).length).toBe(n+1)});
 test('plays to the end and goes back to Play',async({page})=>{await mockSpeech(page);await setLang(page,'urd');await page.goto('./#/hadith/bukhari/n/2');const b=btn(page,0);await b.click();await expect(b).toHaveText('Pause');await expect(b).toHaveText('Play',{timeout:8000});
  expect((await spoken(page))[0].voice).toBe('Imran')});
 test('speed control is passed to the voice',async({page})=>{await mockSpeech(page);await setLang(page,'eng');await page.goto('./#/hadith/bukhari/n/1');await expect(btn(page,0)).toBeVisible({timeout:15000});await page.selectOption('#hlRate','0.8');await btn(page,0).click();await expect.poll(()=>spoken(page)).toHaveLength(1);expect((await spoken(page))[0].rate).toBe(0.8);
  await page.reload();await expect(page.locator('#hlRate')).toHaveValue('0.8')});
 test('a language with no voice on the device hides Play and says so plainly',async({page})=>{
  await mockSpeech(page);await setLang(page,'tam');await page.goto('./#/hadith/bukhari/n/1');await expect(page.locator('#hlNote')).toHaveText('No voice for this language on your device',{timeout:15000});await expect(page.locator('[data-hl]')).toHaveCount(0)});
 test('no voice at all: the strip shows only the note',async({page})=>{
  await mockSpeech(page,{voices:[{name:'Samantha',lang:'en-US',localService:true,default:true}]});await setLang(page,'tam');await page.goto('./#/hadith/bukhari/n/1');await expect(page.locator('#hlNote')).toHaveText('No voice for this language on your device',{timeout:15000});await expect(page.locator('[data-hl]')).toHaveCount(0);await expect(page.locator('#hlRate')).toBeHidden()});
 test('voices that load late (voiceschanged) still give Play',async({page})=>{await mockSpeech(page,{lateMs:700});await setLang(page,'eng');await page.goto('./#/hadith/bukhari/n/1');await expect(btn(page,0)).toBeVisible({timeout:15000});await expect(page.locator('#hlNote')).toBeEmpty()});
 test('no speech engine at all: no Play, clear note, nothing breaks',async({page})=>{await mockSpeech(page,{none:true});await setLang(page,'eng');await page.goto('./#/hadith/bukhari/n/1');await expect(page.locator('#hlNote')).toHaveText('No voice for this language on your device',{timeout:15000});await expect(page.locator('[data-hl]')).toHaveCount(0);await expect(page.locator('.hd .tr').first()).toBeVisible()});
 test('a silent device never shows "playing" and tells the user',async({page})=>{await mockSpeech(page,{silent:true});await setLang(page,'eng');await page.goto('./#/hadith/bukhari/n/1');const b=btn(page,0);await expect(b).toBeVisible({timeout:15000});await b.click();
  await expect(page.locator('#hlNote')).toContainText('Nothing played',{timeout:8000});await expect(b).toHaveText('Play');await expect(page.locator('.hd-on')).toHaveCount(0)});

 test('the Arabic hadith text is never read aloud: no Play Arabic, even when the device has a good Arabic voice',async({page})=>{
  await mockSpeech(page);await setLang(page,'eng');await page.goto('./#/hadith/bukhari/n/1');await expect(btn(page,0)).toBeVisible({timeout:15000});
  await expect(page.locator('[data-hl="ar"]')).toHaveCount(0);await expect(page.locator('article.hd .hl-b[data-hl]')).toHaveCount(1);await expect(page.locator('#app')).not.toContainText(/Play Arabic|device voice|عربی سنیں/);
  await btn(page,0).click();await expect.poll(()=>spoken(page)).toHaveLength(1);const s=(await spoken(page))[0];expect(s.voice).toBe('Samantha');expect(s.text).toBe((await page.locator('.hd .tr').first().innerText()).replace(/\s+/g,' ').trim());expect(s.text).not.toMatch(/[\u0600-\u06FF]/)});
 test('Arabic as the hadith language: nothing to play, no Play buttons, a short note, nothing spoken',async({page})=>{await mockSpeech(page);await setLang(page,'ara');await page.goto('./#/hadith/bukhari/n/1');
  await expect(page.locator('#hlNote')).toHaveText('Listening is for translations. Choose another language to play.',{timeout:15000});await expect(page.locator('[data-hl]')).toHaveCount(0);await expect(page.locator('#hlRate')).toBeHidden();await expect(page.locator('.hd').first()).toBeVisible();await page.waitForTimeout(400);expect((await spoken(page)).length).toBe(0);
  await page.goto('./#/hadith/bukhari/1');await expect(page.locator('article.hd').first()).toBeVisible({timeout:15000});await expect(page.locator('[data-hl]')).toHaveCount(0);
  await setLang(page,'eng');await page.goto('./#/hadith/bukhari/n/1');await expect(btn(page,0)).toBeVisible({timeout:15000});await expect(page.locator('#hlNote')).toBeEmpty()});
 test('the Quran text never gets a Play button',async({page})=>{await mockSpeech(page);await page.goto('./#/surah/1');await expect(page.locator('.ayah').first()).toBeVisible({timeout:30000});await expect(page.locator('[data-hl]')).toHaveCount(0)});

 test('works on a section page and on search results',async({page})=>{
  await mockSpeech(page);await setLang(page,'eng');await page.goto('./#/hadith/bukhari/1');await expect(page.locator('article.hd')).toHaveCount(3,{timeout:15000});await expect(page.locator('[data-hl="tr"]')).toHaveCount(3);
  await page.goto('./#/hsearch/bukhari/patience');await expect(page.locator('article.hd').first()).toBeVisible({timeout:15000});await expect(page.locator('[data-hl="tr"]').first()).toBeVisible()});
 test('play next automatically: next card, then the next hadith',async({page})=>{
  await mockSpeech(page);await setLang(page,'eng');await page.goto('./#/hadith/bukhari/1');await expect(btn(page,0)).toBeVisible({timeout:15000});await page.check('#hlCont');
  await btn(page,0).click();await expect.poll(async()=>(await spoken(page)).length,{timeout:8000}).toBe(3);expect((await spoken(page)).map(s=>s.text.match(/number (\d)/i)[1])).toEqual(['1','2','3']);
  await expect(page).toHaveURL(/#\/hadith\/bukhari\/2$/,{timeout:8000});await expect.poll(async()=>(await spoken(page)).some(s=>/number 4/i.test(s.text)),{timeout:8000}).toBe(true);
  await page.goto('./#/hadith/bukhari/n/5');await expect(btn(page,0)).toBeVisible({timeout:15000});await page.evaluate(()=>{window.__spoken.length=0});await btn(page,0).click();
  await expect(page).toHaveURL(/#\/hadith\/bukhari\/n\/6/,{timeout:8000});await expect.poll(async()=>(await spoken(page)).length,{timeout:8000}).toBeGreaterThanOrEqual(1);
  await expect.poll(async()=>(await spoken(page)).some(s=>/number 6/i.test(s.text)),{timeout:8000}).toBe(true)});
 test('without the toggle it plays only the one card',async({page})=>{await mockSpeech(page);await setLang(page,'eng');await page.goto('./#/hadith/bukhari/1');await btn(page,0).click();await page.waitForTimeout(900);expect((await spoken(page)).length).toBe(1)});

 test('leaving the screen or opening another hadith stops the voice',async({page})=>{
  await mockSpeech(page);await page.addInitScript(()=>{window.__dur=4000});await setLang(page,'eng');await page.goto('./#/hadith/bukhari/n/1');await btn(page,0).click();await expect(btn(page,0)).toHaveText('Pause');
  const c=await page.evaluate(()=>window.__cancels);await page.goto('./#/hadith/bukhari/n/2');await expect.poll(()=>page.evaluate(()=>window.__cancels)).toBeGreaterThan(c);
  await expect(btn(page,0)).toHaveText('Play',{timeout:15000});await page.waitForTimeout(300);expect((await spoken(page)).length).toBe(1)});
 test('does not overlap other app audio: Quran audio stops the hadith voice and the hadith voice pauses Quran audio',async({page})=>{
  await mockSpeech(page);await page.addInitScript(()=>{window.__dur=6000});await setLang(page,'eng');await page.goto('./#/hadith/bukhari/n/1');await btn(page,0).click();await expect(btn(page,0)).toHaveText('Pause');
  await page.evaluate(()=>window.__audio.play());await expect(btn(page,0)).toHaveText('Play');expect(await page.evaluate(()=>window.__audio.paused)).toBe(false);
  await btn(page,0).click();await expect(btn(page,0)).toHaveText('Pause');expect(await page.evaluate(()=>window.__audio.paused)).toBe(true)});
 test('the Qaida audio and the hadith voice do not overlap',async({page})=>{
  await mockSpeech(page);await page.addInitScript(()=>{window.__dur=6000});await setLang(page,'eng');await page.goto('./#/hadith/bukhari/n/1');await btn(page,0).click();await expect(btn(page,0)).toHaveText('Pause');
  await page.evaluate(()=>dispatchEvent(new CustomEvent('qs:audio',{detail:'qaida'})));await expect(btn(page,0)).toHaveText('Play')});
 test('hadith cards keep share and layout: no horizontal overflow with the Play buttons',async({page})=>{
  await mockSpeech(page);await setLang(page,'eng');await page.goto('./#/hadith/bukhari/n/1');await expect(btn(page,0)).toBeVisible({timeout:15000});await expect(page.locator('.hd [data-shr]').first()).toBeVisible();
  const o=await page.evaluate(()=>{const a=document.querySelector('#app');return a.scrollWidth-a.clientWidth});expect(o).toBeLessThanOrEqual(1)});
}
