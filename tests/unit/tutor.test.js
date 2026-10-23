import {describe,it,expect} from 'vitest';
import {words,norm} from '../../src/recite-core.js';
import {Tracker} from '../../src/recite-live.js';
import {numFrames,fbank,greedy,heardWords,TOKENS} from '../../public/ctc-core.js';
const F=words('ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ مَٰلِكِ يَوْمِ ٱلدِّينِ');
const H=t=>t.split(' ').map((w,i)=>({w:norm(w),t0:i*.5,t1:i*.5+.4}));
const W=(h,T)=>h.filter(x=>x.t0>=T.winStart);// the live loop only decodes audio from winStart on
const keys=o=>Object.keys(o).map(Number);
describe('live tracker',()=>{
 it('green appears optimistically on the first decode, locks on the second',()=>{const T=new Tracker(F);
  T.update(H('الحمد لله رب'),1.5);expect(keys(T.prov)).toEqual([0,1,2]);expect(T.p).toBe(0);
  T.update(W(H('الحمد لله رب العالمين'),T),2);expect(T.p).toBeGreaterThanOrEqual(3);expect(Object.values(T.marks).every(v=>v==='ok')).toBe(true)});
 it('a wrong word is never red after one decode; only after it persists',()=>{const T=new Tracker(F);const bad=H('الحمد لله رب العالمين الرحمن كتاب ملك يوم الدين');
  for(let n=0;n<3;n++){T.update(W(bad,T),5+n);if(n<2)expect(Object.values(T.marks).includes('bad')).toBe(false)}
  expect(T.marks[5]).toBe('bad')});
 it('a one-off wrong verdict that corrects itself never turns red',()=>{const T=new Tracker(F);
  T.update(H('الحمد لله رب العالمين الرحمن كتاب ملك يوم الدين'),5);
  for(let n=0;n<4;n++)T.update(W(H('الحمد لله رب العالمين الرحمن الرحيم ملك يوم الدين'),T),6+n);
  expect(Object.values(T.marks).includes('bad')).toBe(false);expect(Object.keys(T.marks).length).toBe(9)});
 it('silence / noise changes nothing',()=>{const T=new Tracker(F);T.update([],1);T.update(H('موسيقى'),2);expect(T.p).toBe(0);expect(Object.keys(T.marks).length).toBe(0)});
});
describe('ctc front-end',()=>{
 it('computes 80-dim fbank frames at a 10 ms hop',()=>{const w=new Float32Array(16000).map((_,i)=>Math.sin(i*.05)*.3);const {data,T}=fbank(w);expect(T).toBe(numFrames(16000));expect(data.length).toBe(T*80);expect(data.every(Number.isFinite)).toBe(true)});
 it('greedy CTC collapses repeats and blanks and times the words',()=>{const V=31,T=8,lp=new Float32Array(T*V).fill(-9);const seq=[2,2,0,2,30,3,3,0];seq.forEach((v,t)=>lp[t*V+v]=-0.01);
  const g=greedy(lp,T,V);expect(g.text).toBe('اا ب');const hw=heardWords(g.chars);expect(hw.map(x=>x.s)).toEqual(['اا','ب']);expect(hw[0].t0).toBeLessThan(hw[1].t0);expect(TOKENS.length).toBe(V)});
});
