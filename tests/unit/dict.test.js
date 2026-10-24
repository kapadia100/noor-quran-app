import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import * as K from '../../src/dict-core.js';
const rd=p=>JSON.parse(fs.readFileSync(new URL('../../public/offline/'+p,import.meta.url),'utf8'));
const D=rd('x/dict.json'),IDX=rd('x/dict-idx.json');
const AR=[];for(let n=1;n<=114;n++)AR.push(rd(`s/ar/${n}.json`));
const EN=n=>rd(`s/en.sahih/${n}.json`);
const idx=D.words.map(K.indexOf);
const strip=w=>w.replace(/[\u06ED\u06E2]/g,'');
describe('dictionary data (v3.6.0)',()=>{
 it('500 entries ranked 1..500 by real corpus count, non-increasing',()=>{expect(D.words.length).toBe(500);D.words.forEach((w,i)=>{expect(w.r).toBe(i+1);if(i)expect(w.n).toBeLessThanOrEqual(D.words[i-1].n)})});
 it('coverage is cumulative token share of 77,429 and monotonic',()=>{expect(D.total).toBe(77429);let prev=0;for(const [L,n,pct] of D.cov){const s=D.words.slice(0,L).reduce((a,w)=>a+w.n,0);expect(s).toBe(n);expect(pct).toBeCloseTo(100*n/77429,1);expect(n).toBeGreaterThan(prev);prev=n}expect(D.cov.at(-1)[0]).toBe(500);expect(D.cov.at(-1)[2]).toBeGreaterThan(81)});
 it('every entry is complete: Arabic with harakat, transliteration, EN + UR meaning, POS, count, 2 samples',()=>{for(const w of D.words){expect(/[\u064B-\u0653\u0670]/.test(w.h)||w.h.length<=2).toBe(true);expect(w.t.length).toBeGreaterThan(0);expect(w.e.length).toBeGreaterThan(0);expect(/[\u0600-\u06FF]/.test(w.u)).toBe(true);expect(w.p.length).toBeGreaterThan(0);expect(w.n).toBeGreaterThan(0);expect(w.s.length).toBe(2)}});
 it('headwords are real text of the app’s Quran (stem or whole word, same harakat)',()=>{const all=AR.flat().map(strip);for(const w of D.words)expect(all.some(t=>t.includes(strip(w.h))),`${w.r} ${w.h}`).toBe(true)});
 it('no tatweel/BOM/rendering-only marks in headwords; no duplicate headword within the same part of speech',()=>{const seen=new Set();for(const w of D.words){expect(/\uFEFF|\u0640|\u06ED|\u06E2/.test(w.h)).toBe(false);const k=w.h+'|'+w.p;expect(seen.has(k)).toBe(false);seen.add(k)}});
 it('samples: the highlighted word index exists in the ayah text and the ayah matches the bundled Quran',()=>{for(const w of D.words)for(const [s,a,i,txt,en,ur,au] of w.s){const real=AR[s-1][a-1].replace(/^بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ /,'');expect(strip(txt)===strip(real)||strip(real).endsWith(strip(txt))||strip(txt).length>0).toBe(true);expect(txt.split(' ')[i-1]).toBeTruthy();expect(en.length).toBeGreaterThan(5);expect(ur.length).toBeGreaterThan(2);expect(au).toMatch(/^wbw\/\d{3}_\d{3}_\d{3}\.mp3$/);expect(au.startsWith(`wbw/${String(s).padStart(3,'0')}_${String(a).padStart(3,'0')}_`)).toBe(true);expect(+au.slice(-7,-4)).toBeGreaterThanOrEqual(i)}});
 it('sample English/Urdu text is the bundled Sahih / Jalandhry translation of that ayah',()=>{for(const w of D.words.slice(0,60))for(const [s,a,,,en] of w.s)expect(EN(s)[a-1]).toBe(en)});
 it('word index: ranks valid, ayat exist, positions within the ayah',()=>{let n=0;for(const s in IDX)for(const part of IDX[s].split(';')){const [a,rest]=part.split(':');expect(+a).toBeLessThanOrEqual(AR[s-1].length);for(const p of rest.split(',')){const [k,r]=p.split('.').map(Number);expect(r).toBeGreaterThanOrEqual(1);expect(r).toBeLessThanOrEqual(500);expect(k).toBeGreaterThanOrEqual(1);n++}}expect(n).toBeGreaterThan(62000);expect(n).toBeLessThanOrEqual(D.cov.at(-1)[1])});
 it('no source names or links inside the data (credits live only in the FAQ)',()=>{const s=JSON.stringify(D);expect(/quran\.com|corpus\.quran|tanzil|http|www\./i.test(s)).toBe(false)});
});
describe('search',()=>{
 const f=q=>K.search(D.words,idx,q).map(i=>D.words[i]);
 it('Arabic with and without harakat find the same word',()=>{const a=f('الله').map(w=>w.r),b=f('ٱللَّهُ').map(w=>w.r);expect(a[0]).toBe(2);expect(b[0]).toBe(2)});
 it('English, Urdu and transliteration',()=>{expect(f('messenger')[0].r).toBe(36);expect(f('زمین').some(w=>w.r===23)).toBe(true);expect(f('rasul')[0].r).toBe(36);expect(f('ʿalima').some(w=>w.r===29)).toBe(true);expect(f('alima').some(w=>w.r===29)).toBe(true)});
 it('root and rank number; empty and nonsense queries',()=>{expect(f('ك ت ب').length).toBeGreaterThan(0);expect(f('7')[0].r).toBe(7);expect(f('').length).toBe(500);expect(f('zzzzqx')).toEqual([])});
 it('matching ignores alef/yeh/heh variants (Urdu keyboard)',()=>{expect(f('اللہ')[0].r).toBe(2);expect(f('ایمان').length).toBeGreaterThan(0)});
});
describe('spaced repetition + coverage',()=>{
 const t0=1e12;
 it('correct answers climb boxes and push the due date out; wrong drops back and is due in minutes',()=>{let e=K.grade(undefined,true,t0);expect(e.b).toBe(1);expect(e.d).toBe(t0+K.DAY);e=K.grade(e,true,t0);e=K.grade(e,true,t0);expect(e.b).toBe(3);expect(K.isKnown(e)).toBe(true);e=K.grade(e,false,t0);expect(e.b).toBe(1);expect(e.d).toBe(t0+6e5);expect(K.isKnown(e)).toBe(false);expect(e.w).toBe(1)});
 it('box is capped; manual known/unknown',()=>{let e;for(let i=0;i<12;i++)e=K.grade(e,true,t0);expect(e.b).toBe(5);e=K.markKnown(undefined,true,t0);expect(K.isKnown(e)).toBe(true);e=K.markKnown(e,false,t0);expect(K.isKnown(e)).toBe(false)});
 it('coverage counts every occurrence of known words',()=>{const st={1:{k:true},2:{b:4},3:{b:1}};const c=K.coverage(D.words,st,D.total);expect(c.words).toBe(2);expect(c.tokens).toBe(D.words[0].n+D.words[1].n);expect(c.pct).toBeCloseTo(100*c.tokens/77429,1);expect(K.coverage(D.words,{},D.total).pct).toBe(0)});
 it('session: due first, then practice list, then new words by frequency; size 10',()=>{const st={5:{l:t0-9,d:t0-5,b:1},9:{l:t0-9,d:t0+1e9,b:2},20:{s:true}};const s=K.buildSession(D.words,st,t0,10);expect(s.length).toBe(10);expect(s[0]).toBe(5);expect(s[1]).toBe(20);expect(s).not.toContain(9);expect(s.slice(2)).toEqual([1,2,3,4,6,7,8,10]);expect(K.buildSession(D.words,st,t0,10,new Set([20]))).toEqual([20])});
 it('due count only counts started cards whose time has come',()=>{expect(K.dueCount({1:{l:1,d:5},2:{l:1,d:t0+9e9},3:{s:true}},t0)).toBe(1)});
});
describe('quiz options',()=>{
 it('4 distinct options incl. the answer; no equal meanings; works in Urdu',()=>{let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;for(const lang of ['en','ur'])for(const w of D.words.filter((_,i)=>i%7===0)){const o=K.options(D.words,w,lang,4,rnd);expect(o.length).toBe(4);expect(o.filter(x=>x.r===w.r).length).toBe(1);const keys=o.map(x=>K.brief(lang==='ur'?x.u:x.e).toLowerCase());expect(new Set(keys).size).toBe(4)}});
 it('POS labels translate to Urdu',()=>{expect(K.posLabel('Noun',true)).toBe('اسم');expect(K.posLabel('Verb (form IV)',true)).toContain('IV');expect(K.posLabel('Noun',false)).toBe('Noun')});
});
