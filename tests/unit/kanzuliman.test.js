import {describe,it,expect} from 'vitest';
import {readFileSync,readdirSync} from 'node:fs';
import {translatorLabel,translators,transLangs} from '../../src/pickers.js';
import {AYAH_COUNTS} from '../../src/lib.js';

const D='public/offline/s/ur.kanzuliman/';
const S=n=>JSON.parse(readFileSync(`${D}${n}.json`,'utf8'));
describe('Kanz ul Iman (Urdu, Ahmed Raza Khan) bundled text',()=>{
 it('has all 114 surahs and all 6236 ayat, none empty',()=>{expect(readdirSync(D).length).toBe(114);let n=0;for(let s=1;s<=114;s++){const t=S(s);expect(t.length).toBe(AYAH_COUNTS[s-1]);t.forEach(x=>{expect(typeof x).toBe('string');expect(x.trim().length).toBeGreaterThan(1);n++})}expect(n).toBe(6236)});
 it('is Urdu in Arabic script only: no replacement characters, no Latin words, no stray controls',()=>{for(let s=1;s<=114;s++)for(const x of S(s)){expect(x).not.toMatch(/\ufffd|[A-Za-z]{2,}|[\u200e\u200f\ufeff]/);expect([...x].some(c=>c.charCodeAt(0)<32)).toBe(false);expect(x).toMatch(/[\u0600-\u06FF]/)}});
 it('matches the known Kanz ul Iman wording on sample ayat',()=>{
  expect(S(1)).toEqual(['اللہ کے نام سے شروع جو بہت مہربان رحمت والا','سب خوبیاں اللہ کو جو مالک سارے جہان والوں کا،','بہت مہربان رحمت والا،','روز جزا کا مالک،','ہم تجھی کو پوجیں اور تجھی سے مدد چاہیں،','ہم کو سیدھا راستہ چلا،','راستہ ان کا جن پر تو نے احسان کیا، نہ ان کا جن پر غضب ہوا اور نہ بہکے ہوؤں کا']);
  expect(S(112)).toEqual(['تم فرماؤ وہ اللہ ہے وہ ایک ہے','اللہ بے نیاز ہے','نہ اس کی کوئی اولاد اور نہ وہ کسی سے پیدا ہوا','اور نہ اس کے جوڑ کا کوئی']);
  expect(S(2)[254].startsWith('اللہ ہے جس کے سوا کوئی معبود نہیں وہ آپ زندہ اور اوروں کا قائم رکھنے والا')).toBe(true);expect(S(2)[254].endsWith('اور وہی ہے بلند بڑائی والا')).toBe(true)});
 it('is not the other Urdu translations (distinct wording from Jalandhry)',()=>{const j=JSON.parse(readFileSync('public/offline/s/ur.jalandhry/112.json','utf8'));expect(S(112)[0]).not.toBe(j[0])});
 it('is registered in the bundled edition list as right-to-left Urdu',()=>{const ed=JSON.parse(readFileSync('public/offline/ed.json','utf8'))['ur.kanzuliman'];expect(ed).toMatchObject({language:'ur',direction:'rtl',type:'translation'})});
 it('is offered for offline use by the service worker',()=>{expect(readFileSync('public/sw.js','utf8')).toMatch(/EDS=\[[^\]]*'ur\.kanzuliman'/)});
});
describe('picker label',()=>{
 const e={identifier:'ur.kanzuliman',language:'ur',englishName:'Ahmed Raza Khan',name:'احمد رضا خان'};
 it('is shown as Kanz ul Iman, in English and in Urdu',()=>{expect(translatorLabel(e)).toBe('Kanz ul Iman — Ahmed Raza Khan');expect(translatorLabel(e,'ur')).toBe('کنز الایمان — احمد رضا خان')});
 it('other translators keep their normal label',()=>{expect(translatorLabel({identifier:'en.sahih',language:'en',englishName:'Saheeh International',name:'Saheeh International'})).toBe('Saheeh International')});
 it('is listed under Urdu; the language order is unchanged',()=>{const l=[e,{identifier:'en.sahih',language:'en',englishName:'Saheeh International',name:'x'},{identifier:'ur.jalandhry',language:'ur',englishName:'Fateh Muhammad Jalandhry',name:'x'}];expect(translators(l,'ur').map(x=>x.identifier)).toEqual(['ur.jalandhry','ur.kanzuliman']);expect(transLangs(l)).toEqual(['en','ur'])});
});
