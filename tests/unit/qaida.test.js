import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import * as D from '../../src/qaida-data.js';
import {itemsOf,countOf} from '../../src/qaida.js';
const AR=/^[\u0621-\u064A]$/;
describe('qaida data',()=>{
 it('has the 29 standard letters in the standard order, no duplicates',()=>{
  expect(D.LETTERS.map(l=>l.c).join('')).toBe('ابتثجحخدذرزسشصضطظعغفقكلمنوهءي');
  expect(new Set(D.LETTERS.map(l=>l.c)).size).toBe(29);
  for(const l of D.LETTERS){expect(l.c).toMatch(AR);expect(l.en&&l.ur&&l.tr).toBeTruthy()}});
 it('six letters (plus the hamza) never join forward',()=>{expect([...D.NOJOIN].sort().join('')).toBe([...'ادذرزوء'].sort().join(''));
  expect(D.forms('ب').nj).toBe(false);expect(D.forms('ر').nj).toBe(true)});
 it('clip mapping: hamza uses the alif clip, ya uses class 28; every file exists',()=>{
  expect(D.clipOf(0,'a')).toBe('qaida/1-a.mp3');expect(D.clipOf(27,'u')).toBe('qaida/1-u.mp3');expect(D.clipOf(26,'a')).toBe('qaida/27-a.mp3');expect(D.clipOf(28,'in')).toBe('qaida/28-in.mp3');
  D.LETTERS.forEach((_,i)=>['a','i','u','an','in','un'].forEach(k=>{const f='public/'+D.clipOf(i,k);expect(fs.existsSync(f),f).toBe(true);expect(fs.statSync(f).size).toBeGreaterThan(1000)}))});
 it('marks use the right Unicode harakat',()=>{expect(D.MARKS.a.m).toBe('\u064E');expect(D.MARKS.i.m).toBe('\u0650');expect(D.MARKS.u.m).toBe('\u064F');
  expect(D.MARKS.an.m).toBe('\u064B');expect(D.MARKS.in.m).toBe('\u064D');expect(D.MARKS.un.m).toBe('\u064C')});
 it('alif row shows hamza-carrying forms; hamza row is skipped in tables',()=>{expect(D.rowLetter(0,'a')).toBe('أ');expect(D.rowLetter(0,'i')).toBe('إ');expect(D.ROW_IDX).toHaveLength(28);expect(D.ROW_IDX).not.toContain(27)});
 it('every lesson has items; words have audio urls, Arabic, transliteration and meanings; rules exist',()=>{
  expect(D.LESSONS.map(l=>l.id)).toEqual(['huroof','harakat','tanween','sukoon','shadda','madd','leen','joined','practice']);
  for(const les of D.LESSONS){if(les.kind==='joined')continue;expect(countOf(les),les.id).toBeGreaterThan(4);for(const it of itemsOf(les)){expect(it.big&&it.tr&&it.urls.length).toBeTruthy()}}
  for(const g of Object.values(D.WORDS))for(const w of g){expect(w.au).toMatch(/^https:\/\/audio\.qurancdn\.com\/wbw\/\d{3}_\d{3}_\d{3}\.mp3$/);expect(w.t).toMatch(/[\u0621-\u064A]/);expect(w.tr&&w.e&&w.u).toBeTruthy()}
  for(const k of ['harakat','tanween','sukoon','shadda','madd','leen'])expect(D.RULES[k][0]).toHaveLength(2)});
 it('words carry the mark their lesson teaches',()=>{
  const has=(g,re)=>D.WORDS[g].every(w=>re.test(w.t));
  expect(has('tanween',/[\u064B\u064C\u064D]/)).toBe(true);expect(has('sukoon',/\u0652/)).toBe(true);expect(has('shadda',/\u0651/)).toBe(true)});
});

describe('qaida words vs the Quran text',()=>{
 const n=s=>s.replace(/\p{M}/gu,'').replace(/\u0640/g,'').replace(/[\u0671\u0623\u0625\u0622]/g,'\u0627').replace(/\u0649/g,'\u064A');
 it('every example word is the word at its surah:ayah:word position',()=>{
  for(const ws of Object.values(D.WORDS))for(const w of ws){const [s,a,i]=w.k.split(':').map(Number);
   const j=JSON.parse(fs.readFileSync(`public/offline/s/ar/${s}.json`,'utf8'));let words=j[a-1].trim().split(/\s+/);if(s!==1&&a===1)words=words.slice(4);
   expect(n(words[i-1]),w.k).toBe(n(w.t))}});
 it('leen words have waw/ya sukoon after fatha',()=>{for(const w of D.WORDS.leen)expect(w.t,w.k).toMatch(/\u064E[\u0648\u064A]\u0652/)});
 it('madd words have a long vowel (alif after fatha, ya after kasra, waw after damma)',()=>{for(const w of D.WORDS.madd)expect(w.t,w.k).toMatch(/\u064E\u0627|\u0650\u064A|\u064F\u0648|\u064E\u0627/)});
});
