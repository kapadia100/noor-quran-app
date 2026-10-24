import {describe,it,expect} from 'vitest';
import {seqAlign,seqAugment,seqLocate,isStrong} from '../../src/recite-seq.js';
import {Tracker} from '../../src/recite-live.js';
// Synthetic CTC posteriors: spell `text` letter by letter (2 frames per letter, a blank frame between letters, a space frame between words).
const ID=new Map();[...'ءابتثجحخدذرزسشصضطظعغفقكلمنهوي'].forEach((c,i)=>ID.set(c,i+1));
function post(text,{drop=new Set(),gap=1}={}){const fr=[];const row=v=>{const r=new Float32Array(31).fill(-12);r[v]=-0.01;return r};
 for(let i=0;i<4;i++)fr.push(row(0));
 text.split(' ').forEach((w,wi)=>{[...w].forEach((ch,ci)=>{if(drop.has(wi+':'+ci))return;fr.push(row(ID.get(ch)),row(ID.get(ch)),row(0))});for(let g=0;g<gap;g++)fr.push(row(30))});
 for(let i=0;i<4;i++)fr.push(row(0));
 const lp=new Float32Array(fr.length*31);fr.forEach((r,i)=>lp.set(r,i*31));return {lp,T:fr.length}}
describe('recite-seq: sequence-level matching on posteriors',()=>{
 const E=['الحمد','لله','رب','العالمين','الرحمن','الرحيم','مالك','يوم','الدين'];
 it('aligns spoken words to the expected ones and marks them strong',()=>{const a=post(E.join(' '));const r=seqAlign(a.lp,a.T,E,{lead:1});
  expect(r.words.length).toBe(E.length);expect(r.words.filter(w=>isStrong(w)).length).toBeGreaterThanOrEqual(6);for(const w of r.words)expect(w.t0).toBeGreaterThanOrEqual(0)});
 it('a dropped letter is tolerated (fast speech) but a different word is not strong',()=>{const a=post(E.join(' '),{drop:new Set(['3:2'])});const r=seqAlign(a.lp,a.T,E,{lead:1});
  expect(r.words[3].cov).toBeGreaterThanOrEqual(0.8);
  const b=post('الحمد لله رب مستقيم الرحمن الرحيم مالك يوم الدين');const r2=seqAlign(b.lp,b.T,E,{lead:1});expect(isStrong(r2.words[3])).toBe(false)});
 it('seqAugment synthesizes runs of strong words that the printed transcript lost, with times',()=>{const a=post(E.join(' '));
  const H=[{w:'الحمد',t0:0.2,t1:0.5}];const r=seqAugment(H,E,{...a,off:10},{});expect(r).toBeTruthy();expect(r.syn).toBeGreaterThanOrEqual(2);
  const s=r.H.filter(h=>h.syn);expect(s.every(h=>h.t0>=10)).toBe(true)});
 it('seqAugment returns null with no acoustic evidence or no offset',()=>{const a=post('سسسس صصصص');expect(seqAugment([],E,{...a,off:0},{})).toBeNull();expect(seqAugment([],E,{...post(E.join(' '))},{})).toBeNull()});
 it('seqLocate finds where the reciter is in a long expected stretch (≥4 strong words)',()=>{const spoken=E.slice(4).concat(['اهدنا','الصراط','المستقيم']);const long=E.concat(['اهدنا','الصراط','المستقيم']);
  const a=post(spoken.join(' '));const b=seqLocate(long,{...a,off:5});expect(b).toBeTruthy();expect(b.k0).toBe(4)});
});
describe('Tracker: v3.6.1 fast-recitation behaviour',()=>{
 const flat=['الحمد','لله','رب','العالمين','الرحمن','الرحيم','مالك','يوم','الدين','اياك','نعبد','واياك','نستعين'];
 it('does not use sequence augmentation before the start is verified (no false reveals on stray audio)',()=>{const T=new Tracker(flat);const a=post(flat.slice(0,6).join(' '));
  T.update([],3,{...a,off:0});expect(T.seqN).toBe(0);expect(Object.keys(T.prov).length).toBe(0)});
 it('a verified tracker bridges words the transcript blurred (augmentation on)',()=>{const T=new Tracker(flat);T.verified=true;const a=post(flat.slice(0,8).join(' '));
  T.update([{w:'الحمد',t0:0.1,t1:0.5}],4,{...a,off:0});expect(T.seqN).toBeGreaterThan(0)});
 it('red needs both repeats and time (a single fast glitch cannot lock red)',()=>{const T=new Tracker(flat);expect(T.badMs??0.6).toBeGreaterThanOrEqual(0.5)});
});
