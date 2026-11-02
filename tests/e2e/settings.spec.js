// Settings: every select has unique options after re-renders; saved prefs are migrated and persist; labels are right in EN and UR.
import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const ED=JSON.parse(fs.readFileSync(new URL('../fixtures/editions-2026-11.json',import.meta.url),'utf8')); // real API snapshot: it lists ar.husary AND ar.husary-2 etc.
let errors=[];
test.beforeEach(async({page})=>{errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.route('https://gc.zgo.at/count.js',r=>r.fulfill({contentType:'text/javascript',body:'window.goatcounter.count=function(o){}'}));
 await page.route('**/quransafar.goatcounter.com/**',r=>r.fulfill({status:204}));
 await page.route(/api\.alquran\.cloud\/v1\/edition\?/,r=>{const u=r.request().url(),k=/format=audio/.test(u)?'audio':/type=tafsir/.test(u)?'tafsir':'translation';return r.fulfill({contentType:'application/json',body:JSON.stringify({code:200,data:ED[k]})})});
 await page.addInitScript(()=>{if(!sessionStorage.getItem('qsS')){sessionStorage.setItem('qsS','1');localStorage.setItem('instBanner','1')}})});
test.afterEach(async({page})=>{expect(errors).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1)});
const seed=(page,s)=>page.addInitScript(s=>{if(!sessionStorage.getItem('qsSeed')){sessionStorage.setItem('qsSeed','1');localStorage.setItem('settings',JSON.stringify(s))}},s);
const selects=page=>page.evaluate(()=>[...document.querySelectorAll('select')].map(s=>{const o=[...s.options],v=o.map(x=>x.value),l=o.map(x=>x.textContent.trim());
 return {id:s.id,n:o.length,value:s.value,dupV:v.filter((x,i)=>v.indexOf(x)!==i),dupL:l.filter((x,i)=>l.indexOf(x)!==i),labels:l}}));
const ready=async page=>{try{await expect(page.locator('#s_reciter option').first()).toBeAttached()}catch(e){console.log('DUMP',page.url(),(await page.evaluate(()=>document.querySelector('#app')?.outerHTML||document.body.innerHTML)).slice(0,600));throw e}};
const allUnique=async page=>{const ss=await selects(page);for(const s of ss){expect(s.dupV,s.id+' values').toEqual([]);expect(s.dupL,s.id+' labels').toEqual([]);expect(s.n,s.id).toBeGreaterThan(0)}return ss};

test('every Settings select has unique options, also after language switches and navigation',async({page})=>{
 await page.goto('./#/settings');await ready(page);
 for(let i=0;i<3;i++){await page.selectOption('#s_ui','ur');await expect(page.locator('#s_ui')).toHaveValue('ur');await ready(page);await allUnique(page);
  await page.selectOption('#s_ui','en');await expect(page.locator('#s_ui')).toHaveValue('en');await ready(page);await allUnique(page)}
 await page.click('#lang');await expect(page.locator('#s_ui')).toHaveValue('ur');await ready(page);await allUnique(page);await page.click('#lang');await expect(page.locator('#s_ui')).toHaveValue('en');await ready(page);
 await page.goto('./#/');await expect(page.locator('#s_ui')).toHaveCount(0);await page.goto('./#/settings');await ready(page);
 await page.goto('./#/more');await expect(page.locator('#s_ui')).toHaveCount(0);await page.goBack();await expect(page).toHaveURL(/#\/settings$/);await ready(page);
 const ss=await allUnique(page),rc=ss.find(s=>s.id==='s_reciter');
 const want=[...new Set(ED.audio.filter(e=>e.language==='ar').map(e=>e.identifier.replace(/-\d+$/,'')))];
 expect(rc.n).toBe(want.length);const en=rc.labels.map(l=>l.split(' — ')[0]);expect(new Set(en).size).toBe(en.length);
 expect(await page.locator('#s_reciter option[value$="-2"]').count()).toBe(0)});

test('a saved duplicate reciter id migrates to its stable id and stays selected; reader picker is unique too',async({page})=>{
 await seed(page,{reciter:'ar.husary-2',ui:'en'});await page.goto('./#/settings');await ready(page);
 await expect(page.locator('#s_reciter')).toHaveValue('ar.husary');
 expect(await page.evaluate(()=>JSON.parse(localStorage.settings).reciter)).toBe('ar.husary');
 await page.goto('./#/surah/1');await expect(page.locator('#rc option').first()).toBeAttached({timeout:20000});
 const rc=(await selects(page)).find(s=>s.id==='rc');expect(rc.dupV).toEqual([]);expect(rc.dupL).toEqual([]);expect(rc.value).toBe('ar.husary')});

test('translations: audio-only editions are not offered; every language has a real name; tafsir has proper names',async({page})=>{
 await seed(page,{trans:'ar.minshawi',ui:'en'});await page.goto('./#/settings');await ready(page);
 const ss=await allUnique(page),get=id=>ss.find(s=>s.id===id);
 for(const v of ['ar.minshawi','ar.minshawi-2','ar.abdulbasitmurattal','tr.vakfi-audio','fa.hedayatfarfooladvand'])expect(await page.locator(`#s_trans option[value="${v}"]`).count()).toBe(0);
 expect(await page.evaluate(()=>JSON.parse(localStorage.settings).trans)).toBe('en.sahih');await expect(page.locator('#s_trans')).toHaveValue('en.sahih');
 expect(get('s_tlang').labels.filter(l=>/Other language/.test(l))).toEqual([]);
 expect(get('s_tafsir').labels).toContain('Tafsir al-Muyassar — تفسير الميسر');
 await page.selectOption('#s_ui','ur');await ready(page);const u=await selects(page);
 expect(u.find(s=>s.id==='s_tlang').labels.filter(l=>/دوسری زبان/.test(l))).toEqual([]);
 expect(u.find(s=>s.id==='s_tafsir').labels).toContain('تفسير الميسر — Tafsir al-Muyassar');
 expect(u.find(s=>s.id==='s_script').labels).toEqual(['عثمانی','انڈو پاک']);await expect(page.locator('.form')).not.toContainText('roadmap')});

test('every Settings control persists across a reload',async({page})=>{
 await page.goto('./#/settings');await ready(page);
 await page.selectOption('#s_tlang','ur');await ready(page);const tr=await page.locator('#s_trans').inputValue();expect(tr).toMatch(/^ur\./);
 const other=await page.locator('#s_trans option').nth(1).getAttribute('value');await page.selectOption('#s_trans',other);
 await page.selectOption('#s_reciter','ar.hudhaify');await page.selectOption('#s_tafsir','ar.jalalayn');await page.selectOption('#s_am','both');
 await page.locator('#s_size').fill('40');await page.locator('#s_dark').setChecked(false);await page.locator('#s_cont').setChecked(false);await page.locator('#s_next').setChecked(false);await page.locator('#s_sa').setChecked(true);
 await page.selectOption('#s_script','indopak');await page.selectOption('#s_wbwLang','ur');
 await page.reload();await ready(page);
 await expect(page.locator('#s_tlang')).toHaveValue('ur');await expect(page.locator('#s_trans')).toHaveValue(other);await expect(page.locator('#s_reciter')).toHaveValue('ar.hudhaify');
 await expect(page.locator('#s_reciter option:checked')).toHaveText('Hudhaify — علي بن عبدالرحمن الحذيفي');
 await expect(page.locator('#s_tafsir')).toHaveValue('ar.jalalayn');await expect(page.locator('#s_am')).toHaveValue('both');await expect(page.locator('#s_size')).toHaveValue('40');
 await expect(page.locator('#s_dark')).not.toBeChecked();await expect(page.locator('#s_cont')).not.toBeChecked();await expect(page.locator('#s_next')).not.toBeChecked();await expect(page.locator('#s_sa')).toBeChecked();
 await expect(page.locator('#s_script')).toHaveValue('indopak');await expect(page.locator('#s_wbwLang')).toHaveValue('ur');
 const s=await page.evaluate(()=>JSON.parse(localStorage.settings));expect(s).toMatchObject({reciter:'ar.hudhaify',reciterName:'Hudhaify',tafsir:'ar.jalalayn',amode:'both',size:40,dark:false,continuous:false,autoNext:false,surahAudio:true,script:'indopak',wbwLang:'ur',trans:other})});
