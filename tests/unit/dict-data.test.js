// Data audit for the dictionary word sheets (built by tools/dict/build.py from the morphology corpus + the app's own texts).
import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
const rd=p=>JSON.parse(fs.readFileSync(new URL('../../public/offline/'+p,import.meta.url),'utf8'));
const D=rd('x/dict.json'),C={};
const sura=(l,s)=>(C[l+s]??=rd(`s/${l}/${s}.json`));
const META=rd('s/ar/1.json')&&Array.from({length:114},(_,i)=>sura('ar',i+1).length);
// the app prefixes the Bismillah to ayah 1 (not part of the ayah): examples show the ayah itself
const ayah=(s,a)=>{const t=sura('ar',s)[a-1];return a===1&&s!==1&&s!==9?t.split(' ').slice(4).join(' '):t};
const MARK=/^[\u06D6-\u06ED]+$/;
describe('dictionary word sheets',()=>{
 it('has 500 ranked words, each with an ayah count and two examples',()=>{
  expect(D.words).toHaveLength(500);
  D.words.forEach((w,i)=>{expect(w.r).toBe(i+1);expect(Number.isInteger(w.na)).toBe(true);expect(w.na).toBeGreaterThanOrEqual(1);expect(w.na).toBeLessThanOrEqual(6236);expect(w.na).toBeLessThanOrEqual(w.nt);expect(w.nt).toBeGreaterThanOrEqual(w.n);expect(w.x).toHaveLength(2);expect(w.u.trim()).not.toBe('');expect(w.e.trim()).not.toBe('')})});
 it('examples are valid references whose text is the exact ayah text, translation and highlighted word',()=>{
  for(const w of D.words)w.x.forEach(([s,a,ti,au],i)=>{
   expect(s>=1&&s<=114).toBe(true);expect(a>=1&&a<=META[s-1]).toBe(true);
   const sm=w.s[i];expect([sm[0],sm[1]]).toEqual([s,a]);
   expect(sm[3]).toBe(ayah(s,a));expect(sm[4]).toBe(sura('en.sahih',s)[a-1]);expect(sm[5]).toBe(sura('ur.jalandhry',s)[a-1]);
   const tok=sm[3].split(' ');expect(ti>=0&&ti<tok.length).toBe(true);expect(MARK.test(tok[ti])).toBe(false);
   expect(au).toBe(sm[6]);expect(au).toMatch(new RegExp(`^wbw/${String(s).padStart(3,'0')}_${String(a).padStart(3,'0')}_\\d{3}\\.mp3$`))})});
 it('the two examples are different ayahs',()=>{for(const w of D.words)expect(`${w.x[0][0]}:${w.x[0][1]}`).not.toBe(`${w.x[1][0]}:${w.x[1][1]}`)});
 it('plural / feminine headwords are not glossed as singular or masculine (spot checks)',()=>{
  const g=r=>D.words[r-1];expect(g(343).e).toBe('losers');expect(g(160).u).toBe('چہرے');expect(g(262).e).toMatch(/^it \(f\.\)/);expect(g(248).e).toMatch(/^she/)});
});
