import {describe,it,expect,beforeEach} from 'vitest';
import {syllables,syllWeights,syllAt,estimateSlice,attempt,recMiss,recFix,recReviewFail,dueItems,weakAll,weakKey,weakLoad,weakSave,DAY,ESCALATE_AT,MAX_WEAK} from '../../src/coach.js';
const T=(o={})=>({key:weakKey(1,3,0),sn:1,a:3,k:0,t:'ٱلرَّحْمَٰنِ',nw:'الرحمن',...o});
describe('syllables',()=>{
 it('splits vowelled Arabic into syllables',()=>{
  expect(syllables('ٱلرَّحْمَٰنِ')).toEqual(['ٱل','رَّحْ','مَٰ','نِ']);
  expect(syllables('ٱللَّهِ')).toEqual(['ٱل','لَّ','هِ']);
  expect(syllables('ٱلْحَمْدُ')).toEqual(['ٱلْ','حَمْ','دُ']);
 });
 it('falls back to letters when there are no harakat',()=>{expect(syllables('الله')).toEqual(['ا','ل','ل','ه'])});
 it('maps clip position to a syllable',()=>{const w=syllWeights(['ٱل','رَّحْ','مَٰ','نِ']);expect(syllAt(w,0)).toBe(0);expect(syllAt(w,1)).toBe(w.length-1);expect(syllAt(w,0.5)).toBeGreaterThan(0);expect(syllAt(w,-1)).toBe(0)});
});
describe('estimateSlice',()=>{
 it('is proportional to letter counts and clamped',()=>{const [a,b]=estimateSlice([2,4,4],1,1,10,0);expect(a).toBeCloseTo(2);expect(b).toBeCloseTo(6);const [c,d]=estimateSlice([2,4,4],0,2,10,0.5);expect(c).toBe(0);expect(d).toBe(10)});
});
describe('attempt verdicts (no false alarms)',()=>{
 it('ok / close / miss / none',()=>{
  expect(attempt('الرحمن',['الرحمن']).v).toBe('ok');
  expect(attempt('الرحمن',['ال','رحمن']).v).toBe('ok');
  expect(attempt('الرحمن',[]).v).toBe('none');
  expect(attempt('الرحمن',['كتاب']).v).toBe('miss');
  expect(attempt('رب',['كتاب']).v).toBe('close'); // short words never count as a miss
 });
});
describe('weak store + spaced repetition',()=>{
 let s;beforeEach(()=>{s={}});
 it('records misses and is due immediately',()=>{recMiss(s,T(),1000);recMiss(s,T(),2000);expect(s['1:3:0'].miss).toBe(2);expect(dueItems(s,2000)).toHaveLength(1)});
 it('fix in session defers a day; reviews step through 2,4,8,16 days then graduate',()=>{recMiss(s,T(),0);recFix(s,'1:3:0',0);expect(s['1:3:0'].due).toBe(DAY);expect(dueItems(s,DAY-1)).toHaveLength(0);
  const days=[];for(let i=0;i<4;i++){recFix(s,'1:3:0',0,true);days.push(s['1:3:0'].due/DAY)}expect(days).toEqual([2,4,8,16]);recFix(s,'1:3:0',0,true);expect(s['1:3:0']).toBeUndefined()});
 it('failed review resets the box and comes back in hours',()=>{recMiss(s,T(),0);recFix(s,'1:3:0',0);recFix(s,'1:3:0',0,true);recReviewFail(s,'1:3:0',0);expect(s['1:3:0'].box).toBe(0);expect(s['1:3:0'].due).toBe(DAY/4)});
 it('orders worst first and escalates at 3',()=>{recMiss(s,T({key:'a',a:1}),0);for(let i=0;i<3;i++)recMiss(s,T({key:'b',a:2}),0);expect(weakAll(s)[0].key).toBe('b');expect(ESCALATE_AT).toBe(3)});
 it('persists to localStorage and caps size',()=>{const m={};globalThis.localStorage={getItem:k=>m[k]??null,setItem:(k,v)=>{m[k]=v}};
  for(let i=0;i<MAX_WEAK+20;i++)recMiss(s,T({key:'k'+i,a:i}),i);weakSave(s);expect(Object.keys(weakLoad())).toHaveLength(MAX_WEAK);delete globalThis.localStorage});
});
