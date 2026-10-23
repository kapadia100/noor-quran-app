// v3.3.1: reading that is correct but blended (wasl / flowing) must not leave the tutor stuck, while unrelated speech must still never go green.
import {describe,it,expect} from 'vitest';
import {words,norm} from '../../src/recite-core.js';
import {Tracker} from '../../src/recite-live.js';
import {VoiceGate} from '../../src/voice-gate.js';
const FAT=words('ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ مَٰلِكِ يَوْمِ ٱلدِّينِ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ').map(norm);
const H=(t,t0=0)=>t.split(' ').filter(Boolean).map((w,i)=>({w:norm(w),t0:t0+i*.4,t1:t0+i*.4+.35}));
const keys=o=>Object.keys(o).map(Number).sort((a,b)=>a-b);
const greens=T=>keys(T.prov).length+Object.values(T.marks).filter(m=>m==='ok').length;
const reds=T=>Object.values(T.marks).filter(m=>m==='bad'||m==='wrong'||m==='skip').length;
describe('start verification (phrase / n-gram evidence)',()=>{
 it('a garbled or very short FIRST word no longer blocks a clean reading of the words after it',()=>{
  for(const bad of ['فاذا','انا','ام','ا']){const T=new Tracker(FAT);
   for(let t=1;t<=6;t++)T.update(H(`${bad} لله رب العالمين الرحمن الرحيم مالك`),t);
   expect(T.verified,`first=${bad}`).toBe(true);expect(greens(T)).toBeGreaterThanOrEqual(4);expect(reds(T)).toBe(0)}});
 it('a gapped phrase (one unclear word in the middle) still verifies the start',()=>{
  const T=new Tracker(FAT);for(let t=1;t<=6;t++)T.update(H('الحمد لله كتاب العالمين الرحمن الرحيم'),t);
  expect(T.verified).toBe(true);expect(reds(T)).toBe(0)});
 it('unrelated speech or look-alike words never verify the start',()=>{
  const junk=['the quick brown fox jumps over the lazy dog','الله الله الله الله','رب رب رب','قل هو الله احد الله الصمد','الرحمن الرحيم مالك يوم الدين','اهدنا الصراط المستقيم صراط الذين انعمت'];
  for(const j of junk){const T=new Tracker(FAT);for(let t=1;t<=8;t++)T.update(H(j),t);expect(greens(T),j).toBe(0);expect(reds(T),j).toBe(0)}});
 it('one or two single look-alike words are not enough evidence',()=>{
  const T=new Tracker(FAT);for(let t=1;t<=6;t++)T.update(H('الحمد'),t);expect(T.verified).toBe(false);expect(greens(T)).toBe(0)});
});
describe('stuck recovery (re-align within the next few words)',()=>{
 it('after verification, a word that never becomes clear does not freeze the reader: later words go green, the unclear one stays neutral',()=>{
  const T=new Tracker(FAT);
  for(let t=1;t<=4;t++)T.update(H('الحمد لله رب العالمين'),t);
  const g0=greens(T);expect(g0).toBeGreaterThanOrEqual(3);
  for(let t=5;t<=14;t++)T.update(H('الحمد لله رب العالمين الرحمن ززززز مالك يوم الدين اياك نعبد'),t);
  expect(greens(T)).toBeGreaterThan(g0);expect(reds(T)).toBe(0)});
 it('a forward re-align never runs before the start is verified and never creates a red word',()=>{
  const T=new Tracker(FAT);T.forceAlign=true;T.update(H('مالك يوم الدين اياك نعبد'),1);
  expect(T.verified).toBe(false);expect(greens(T)).toBe(0);
  const U=new Tracker(FAT);for(let t=1;t<=4;t++)U.update(H('الحمد لله رب العالمين'),t);
  U.forceAlign=true;for(let t=5;t<=9;t++)U.update(H('مالك يوم الدين اياك نعبد ونستعين'),t);
  expect(reds(U)).toBe(0)});
 it('re-align ignores unrelated words',()=>{
  const U=new Tracker(FAT);for(let t=1;t<=4;t++)U.update(H('الحمد لله رب العالمين'),t);const g=greens(U);
  U.forceAlign=true;for(let t=5;t<=12;t++)U.update(H('hello how are you today my friend'),t);
  expect(greens(U)).toBe(g);expect(reds(U)).toBe(0)});
});
describe('voice gate (hysteresis)',()=>{
 const feed=(g,ps,t0=0)=>ps.map((p,i)=>g.frame(t0+(i+1)*.032,p));
 it('opens on clear speech and stays open through soft or reverberant frames, then closes in silence',()=>{
  const g=new VoiceGate();feed(g,Array(20).fill(0.9));expect(g.active(0.64)).toBe(true);
  feed(g,Array(40).fill(0.2),0.64);expect(g.active(1.9)).toBe(true);// soft tail keeps the gate open
  const q=new VoiceGate();feed(q,Array(300).fill(0.2));expect(q.active(9)).toBe(false)});// soft noise alone never opens it
 it('isolated blips do not open the gate',()=>{const g=new VoiceGate();const ps=[];for(let i=0;i<100;i++)ps.push(i%10===0?0.95:0.02);feed(g,ps);expect(g.active(3.2)).toBe(false)});
 it('secs() counts only voiced frames',()=>{const g=new VoiceGate();feed(g,[...Array(30).fill(0.9),...Array(30).fill(0.01)]);const s=g.secs(0,2);expect(s).toBeGreaterThan(0.8);expect(s).toBeLessThan(1.2)});
});
