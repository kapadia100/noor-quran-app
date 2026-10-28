import {describe,it,expect} from 'vitest';
import {langName,codeOf,bcpOf,LANGS,edLang,orderLangs,langRank} from '../../src/hadith-lang.js';
import fx from '../fixtures/hadith-codes.json';
describe('hadith language names',()=>{
 it('maps every code in the data to a proper name (never the raw code)',()=>{
  for(const c of fx.codes){for(const ui of ['en','ur']){const n=langName(c,ui);expect(n,`${c}/${ui}`).toBeTruthy();expect(n.toLowerCase()).not.toBe(c);expect(n).not.toMatch(/^[a-z]{3}$/)}
   expect(LANGS[c],c).toBeTruthy();expect(bcpOf(c)).toMatch(/^[a-z]{2,3}$/)}});
 it('English UI: English name + native name',()=>{
  const e={ara:'Arabic (العربية)',ben:'Bengali (বাংলা)',eng:'English',fra:'French (Français)',ind:'Indonesian (Bahasa Indonesia)',rus:'Russian (Русский)',tur:'Turkish (Türkçe)',urd:'Urdu (اردو)',tam:'Tamil (தமிழ்)'};
  for(const [c,n] of Object.entries(e))expect(langName(c,'en')).toBe(n)});
 it('Urdu UI: Urdu name + native name, no duplicate when identical',()=>{expect(langName('eng','ur')).toBe('انگریزی (English)');expect(langName('urd','ur')).toBe('اردو');expect(langName('ara','ur')).toBe('عربی (العربية)')});
 it('short form is the name only',()=>{expect(langName('fra','en',true)).toBe('French');expect(langName('fra','ur',true)).toBe('فرانسیسی')});
 it('table is complete: every row has en, native, ur names and a unique bcp',()=>{const seen=new Set();for(const [c,r] of Object.entries(LANGS)){expect(c).toMatch(/^[a-z]{3}$/);expect(r.en&&r.nat&&r.ur,c).toBeTruthy();expect(seen.has(r.bcp),c).toBe(false);seen.add(r.bcp)}});
 it('unknown codes fall back to a readable name, never the raw code',()=>{
  const n=langName('xyz','en');expect(n.toLowerCase()).not.toBe('xyz');expect(langName('qqq','ur')).toBeTruthy();expect(langName('','en')).toBe('Other language');});
 it('uses Intl.DisplayNames for codes outside the table',()=>{expect(langName('cy','en')).toMatch(/Welsh/)});
 it('normalises codes',()=>{expect(codeOf('en-US')).toBe('eng');expect(codeOf('ur_PK')).toBe('urd');expect(codeOf('in_ID')).toBe('ind');expect(codeOf('ara-bukhari')).toBe('ara');expect(codeOf('xx')).toBe('');expect(edLang('urd-muslim')).toBe('urd')});
 it('list order: English, Urdu, Arabic first, then the rest alphabetical by English name',()=>{
  expect(orderLangs(fx.codes)).toEqual(['eng','urd','ara','ben','fra','ind','rus','tam','tur']);
  expect(orderLangs(['tur','ara','fra','urd','eng','ben'])).toEqual(['eng','urd','ara','ben','fra','tur']);
  expect(orderLangs(['de','zh','ar','fr','ur','en','az'])).toEqual(['en','ur','ar','az','zh','fr','de']);
  expect(langRank('en')).toBe(0);expect(langRank('urd')).toBe(1);expect(langRank('ar')).toBe(2);expect(langRank('fr')).toBe(3)});
 it('unknown codes are sorted by their readable name and never first',()=>{const o=orderLangs(['cy','en','ur','ar','af']);expect(o.slice(0,3)).toEqual(['en','ur','ar']);expect(o.slice(3)).toEqual(['af','cy'])});
 it('translations: same-language entries stay grouped; ties keep API order or sort by the tie key',()=>{
  const L=[['a','fr','Zed'],['b','en','Yusuf'],['c','ur','Fateh'],['d','en','Saheeh'],['e','ar','Muyassar'],['f','ur','Ahmed']];
  expect(orderLangs(L,x=>x[1],x=>x[2]).map(x=>x[0])).toEqual(['d','b','f','c','e','a']);
  expect(orderLangs(L,x=>x[1]).map(x=>x[0])).toEqual(['b','d','c','f','e','a'])});
});
