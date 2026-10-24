import {describe,it,expect} from 'vitest';
import {finalPass,uncRuns,runWindow} from '../../src/recite-final.js';
const ID=new Map();[...'ءابتثجحخدذرزسشصضطظعغفقكلمنهوي'].forEach((c,i)=>ID.set(c,i+1));
const NV=31,SP=30,FR=0.04;// 40 ms frames
/** Synthetic posteriors for a phrase: each letter gets 3 confident frames, blank between; SP between words. */
function post(words){const rows=[];const row=k=>{const r=new Float32Array(NV).fill(-12);r[k]=-0.02;return r};
 words.forEach((w,wi)=>{if(wi)rows.push(row(SP));for(const ch of w){const id=ID.get(ch);if(!id)continue;rows.push(row(id),row(id),row(0))}rows.push(row(0),row(0))});
 const T=rows.length,lp=new Float32Array(T*NV);rows.forEach((r,i)=>lp.set(r,i*NV));return {lp,T,secs:T*FR}}
const flat=['الحمد','لله','رب','العالمين','الرحمن','الرحيم'];
describe('final pass (late confirmation)',()=>{
 it('finds runs and windows',()=>{expect(uncRuns({1:'unc',2:'unc',4:'unc'},6)).toEqual([[1,2],[4,4]]);
  const w=runWindow(1,2,{0:'ok',3:'ok'},{0:[0,1],3:[4,5]},9);expect(w.L&&w.R).toBe(true);expect(w.t0).toBeLessThan(1);expect(w.t1).toBeGreaterThan(5)});
 it('confirms unclear words whose letters are present in the recording',async()=>{
  const P=post(flat);const marks={0:'ok',1:'unc',2:'unc',3:'ok',4:'ok',5:'ok'};const wt={0:[0,0.5],3:[1,1.5],4:[1.6,2],5:[2,2.5]};
  const r=await finalPass({flat,marks,wt,tEnd:P.secs,decode:async()=>({lp:P.lp,T:P.T}),slice:()=>new Float32Array(16000)});
  expect(r.tried).toBe(1);expect(r.confirmed.sort()).toEqual([1,2])});
 it('never confirms a skipped or replaced word (its letters are absent)',async()=>{
  const spoken=['الحمد','رب','العالمين'];const P=post(spoken);// "لله" was skipped
  const marks={0:'ok',1:'unc',2:'ok',3:'ok'};const wt={0:[0,0.5],2:[1,1.5],3:[1.6,2]};
  const r=await finalPass({flat:flat.slice(0,4),marks,wt,tEnd:P.secs,decode:async()=>({lp:P.lp,T:P.T}),slice:()=>new Float32Array(16000)});
  expect(r.confirmed).toEqual([]);
  const rep=post(['الحمد','كتاب','رب','العالمين']);// replaced by another word
  const r2=await finalPass({flat:flat.slice(0,4),marks,wt,tEnd:rep.secs,decode:async()=>({lp:rep.lp,T:rep.T}),slice:()=>new Float32Array(16000)});
  expect(r2.confirmed).toEqual([])});
 it('does nothing without a decoder result (e.g. no model) or without unclear words',async()=>{
  const r=await finalPass({flat,marks:{0:'ok',1:'ok'},wt:{},tEnd:5,decode:async()=>null,slice:()=>new Float32Array(16000)});expect(r.confirmed).toEqual([]);
  const r2=await finalPass({flat,marks:{1:'unc'},wt:{0:[0,1]},tEnd:5,decode:async()=>null,slice:()=>new Float32Array(16000)});expect(r2.confirmed).toEqual([])});
});
