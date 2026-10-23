import {describe,it,expect} from 'vitest';
import fs from 'fs';
import {judge,norm} from '../../src/recite-core.js';
const C=JSON.parse(fs.readFileSync(new URL('../fixtures/connected-cases.json',import.meta.url),'utf8'));
const prep=c=>({E:c.E.split(' ').map(norm),H:c.H.map(norm)});
const allOk=(E,r)=>r.done===E.length&&r.marks.every(m=>m.st==='ok');
const red=r=>r.marks.some(m=>m.st==='wrong'||m.st==='skip');
describe('connected recitation (wasl, idgham, ikhfa, iqlab, lam shamsiyya, hamzat al-wasl, madd, waqf)',()=>{
 it('has a meaningful number of cases',()=>{expect(C.length).toBeGreaterThanOrEqual(30)});
 for(const c of C)it(`correct connected reading is fully OK and never red: ${c.name}`,()=>{const {E,H}=prep(c);const r=judge(E,H);expect(red(r)).toBe(false);expect(allOk(E,r)).toBe(true)});
 it('the connected-aware matcher accepts more than isolated-word matching and never flags more red',()=>{
  let a=0,b=0,ra=0,rb=0;for(const c of C){const {E,H}=prep(c);const r0=judge(E,H,{connected:false}),r1=judge(E,H);a+=allOk(E,r0);b+=allOk(E,r1);ra+=red(r0);rb+=red(r1)}
  expect(b).toBeGreaterThan(a);expect(rb).toBeLessThanOrEqual(ra);expect(rb).toBe(0)});
 // the variants must not make wrong reading pass
 it('a clearly wrong word in the middle is not accepted as OK',()=>{let n=0,bad=0;
  for(const c of C){const {E,H}=prep(c);if(H.length<3)continue;const h=[...H];const k=Math.floor(h.length/2);h[k]='كتاب';const r=judge(E,h);n++;if(allOk(E,r))bad++}
  expect(n).toBeGreaterThan(20);expect(bad).toBe(0)});
 it('a skipped word is not accepted as fully OK',()=>{let n=0,bad=0;
  for(const c of C){const {E,H}=prep(c);if(H.length<3)continue;const h=H.filter((_,i)=>i!==1);const r=judge(E,h);n++;if(allOk(E,r))bad++}
  expect(n).toBeGreaterThan(20);expect(bad).toBe(0)});
 it('a different word that only resembles a moon-letter al- word is never accepted (alif-lam is not dropped wholesale)',()=>{
  const E='الحمد لله رب العالمين الرحمن الرحيم'.split(' ').map(norm);
  const r=judge(E,'الحمد لله رب عليم الرحمن الرحيم'.split(' ').map(norm));
  expect(r.marks[3].st).not.toBe('ok');expect(r.marks.some(m=>m.st==='wrong'||m.st==='skip')).toBe(false)});
});
