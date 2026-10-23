// Regression: "I said the FIRST word and the tracker took the NEXT word" (off-by-one / sequence skip).
// The live tracker must never paint a word green while an earlier, not-yet-decided word is not green.
import {describe,it,expect} from 'vitest';
import {words,norm} from '../../src/recite-core.js';
import {Tracker,recoverRun,RECOVER} from '../../src/recite-live.js';
const BISM=words('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ');
const FAT=words('ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ مَٰلِكِ يَوْمِ ٱلدِّينِ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ');
const H=t=>t.split(' ').filter(Boolean).map((w,i)=>({w:norm(w),t0:i*.5,t1:i*.5+.4}));
const W=(h,T)=>h.filter(x=>x.t0>=T.winStart);// the live loop only decodes audio from winStart on
const keys=o=>Object.keys(o).map(Number).sort((a,b)=>a-b);
const noGap=T=>{const k=keys(T.prov);for(let q=T.p;q<(k.length?k[k.length-1]:T.p);q++)if(!T.prov[q])return false;return true};
describe('sequence order of the live tracker',()=>{
 it('a garbled first word + a clean second word never lights word 2 while word 1 is undecided',()=>{
  for(const bad of ['ام','الله','ا','لله','م','سن','قال']){const T=new Tracker(BISM);
   for(let t=1;t<=4;t++){T.update(H(`${bad} الله`),t);expect(T.prov[1],`bad=${bad}`).toBeUndefined();expect(T.p).toBeLessThanOrEqual(0)}}});
 it('a lone spurious "الله" while the first word is not yet heard is not green',()=>{
  const T=new Tracker(BISM);T.update(H('الله'),1);expect(keys(T.prov)).not.toContain(1);expect(T.cursor).toBe(0)});
 it('the first word is marked first, then the second, in order, as the reciter speaks',()=>{
  const T=new Tracker(BISM);const seen=[];
  const seq=['بسم','بسم الله','بسم الله الرحمن','بسم الله الرحمن الرحيم'];
  seq.forEach((s,n)=>{T.update(H(s),n+1);seen.push(keys(T.prov).concat(keys(T.marks)).reduce((a,b)=>Math.max(a,b),-1))});
  // v3.3.0 start verification: nothing is painted until three strong consecutive words confirm the start (unrelated speech
  // can hit one or two lookalike words); then the prefix appears at once, never beyond what was heard.
  expect(seen[0]).toBe(-1);expect(seen[1]).toBe(-1);expect(seen[2]).toBeLessThanOrEqual(2);expect(seen[2]).toBe(2);expect(seen[3]).toBeLessThanOrEqual(3)});
 it('unrelated speech that lands on one or two lookalike first words is never green',()=>{
  for(const heard of ['اسم والش','اسم والش سج','اسم','اسم الله','واصل الله']){const T=new Tracker(BISM);for(let t=1;t<=6;t++)T.update(H(heard),t);expect(keys(T.prov).length+keys(T.marks).length,heard).toBe(0)}});
 it('never paints beyond the number of words actually heard (prefix spoken, any ayah)',()=>{
  for(let n=0;n<=FAT.length-1;n++){const T=new Tracker(FAT);const hyp=FAT.slice(0,n+1).join(' ');for(let r=0;r<3;r++)T.update(W(H(hyp),T),r+1);
   const top=Math.max(-1,...keys(T.prov),...keys(T.marks));expect(top).toBeLessThanOrEqual(n);expect(noGap(T)).toBe(true)}});
 it('a one-word decode of a LATER word (reciter has not said earlier words) is never green',()=>{
  for(const k of [1,2,3,5]){const T=new Tracker(FAT);T.update(H(FAT[k]),1);T.update(H(FAT[k]),2);expect(keys(T.prov)).not.toContain(k)}});
 it('similar neighbour (Rahman said, Raheem decoded as noise) is not taken',()=>{
  const T=new Tracker(BISM);for(let t=1;t<=4;t++)T.update(H('بسم الله الرحمن الر'),t);expect(T.prov[3]).toBeUndefined()});
 it('recovery: one word really skipped and TWO strong words follow -> the skipped word stays neutral, the strong words are painted',()=>{
  const T=new Tracker(FAT);const hyp=[0,1,2,3,4,6,7,8].map(i=>FAT[i]).join(' ');T.update(H(hyp),1);
  expect(T.prov[6]).toBe(1);expect(T.prov[7]).toBe(1);expect(T.prov[5]).toBeUndefined()});
 it('recovery needs strong evidence: ONE word after a skipped word is not enough',()=>{
  const T=new Tracker(FAT);T.update(H([0,1,2,3,4,6].map(i=>FAT[i]).join(' ')),1);expect(T.prov[6]).toBeUndefined();expect(T.prov[4]).toBe(1)});
 it('recoverRun: never when the gap word is present (ok) or the follow words are weak/short',()=>{
  const flat=['ابتث','جحخد','ذرزس','شصضط'];
  const st={0:{st:'skip'},1:{st:'ok',s:0.9},2:{st:'ok',s:0.65}};expect(recoverRun(st,flat,0)).toBeNull();
  const st2={0:{st:'unclear',gop:-0.2},1:{st:'ok',s:0.9},2:{st:'ok',s:0.9}};expect(recoverRun(st2,flat,0)).toBeNull();
  const st3={0:{st:'skip'},1:{st:'ok',s:0.9},2:{st:'ok',s:0.9}};expect(recoverRun(st3,flat,0)).toEqual({from:1,to:3});
  expect(RECOVER.gapMax).toBeLessThanOrEqual(2)});
 it('locks stay strictly sequential (p only advances over decided words)',()=>{
  const T=new Tracker(FAT);for(let t=1;t<=6;t++)T.update(H([FAT[2],FAT[3],FAT[4]].join(' ')),t);expect(T.prov[2]).toBeUndefined();
  expect(T.p===0||T.marks[T.p-1]!==undefined).toBe(true)});
 it('real phone-in-a-room decodes of Bismillah (captured from the audio harness): word 2 is never lit before word 1',()=>{
  // greedy hypotheses at successive updates of Abdul Basit 1:1 through a noisy phone; the first word is mangled and a spurious "لله" appears
  const steps=['ل يوم الم الين','لل س ال ورا','وال ن ا لله را','و لله الا'];
  const T=new Tracker(BISM);steps.forEach((h,n)=>{T.update(H(h),n+1);expect(T.prov[1],h).toBeUndefined();expect(T.p).toBe(0)})});
});
