// v3.5.1 Hifz wrong-reading watcher. The tracker is built to wait patiently; this notices the opposite case: the voice keeps going for several
// seconds, the decoded words are Quran words, and they are NOT the next expected words.
//  - 'other': the words match another place in the Quran (a different ayah of this surah, another surah, mutashabihat) -> says where.
//  - 'wrong': Quran-like words, but not the expected ones and not found as a clean run anywhere.
//  - 'soft' : speech that does not look like Quran recitation (TV, talking, noise) -> only "Keep reading", never an accusation.
// Pure (no DOM); shared by the app and the evaluation harness.
import {norm,words} from './recite-core.js';
export const sk=w=>norm(w).replace(/[اويء]/g,'');
export const WR={secs:2.4,minWords:3,minWordsWrong:4,minVotes:2,cov:0.5,vocab:0.85,vocabHit:0.75,vocabN:4,longN:3,cool:2.5,softSecs:5,expWin:14,maxFreq:40};
/** texts: array (index = surah-1) of arrays of ayah strings (already basmala-stripped as the app shows them). */
export class QIndex{constructor(texts){this.pos=[];this.W=[];this.bi=new Map();this.vocab=new Set();
 texts.forEach((ay,si)=>{(ay||[]).forEach((t,ai)=>{for(const w of words(t)){const k=sk(w);if(!k)continue;this.pos.push([si+1,ai+1]);this.W.push(k);if(w.length>=2)this.vocab.add(w)}})});
 for(let i=0;i+1<this.W.length;i++){const k=this.W[i]+'|'+this.W[i+1];let a=this.bi.get(k);if(!a)this.bi.set(k,a=[]);a.push(i)}}
 /** D: decoded normalized words. Best consistent in-order run elsewhere: {sn,a,votes,gi,len} or null. */
 find(D,cfg=WR){const S=D.map(sk).filter(Boolean);const diag=new Map();
  for(let i=0;i+1<S.length;i++){const a=this.bi.get(S[i]+'|'+S[i+1]);if(!a||a.length>cfg.maxFreq)continue;for(const g of a){const d=g-i;let e=diag.get(d);if(!e)diag.set(d,e={v:0,g:g,i});e.v++}}
  let best=null;for(const [d,e] of diag){if(!best||e.v>best.v)best=e;}
  // merge neighbouring diagonals (decoder dropped/added a word): sum votes on d, d±1
  let top=null;for(const [d,e] of diag){const v=e.v+(diag.get(d+1)?.v||0)+(diag.get(d-1)?.v||0);if(!top||v>top.v)top={v,d,g:e.g,i:e.i}}
  if(!top||top.v<cfg.minVotes)return null;const [sn,a]=this.pos[Math.max(0,Math.min(this.pos.length-1,top.g))];return {sn,a,votes:top.v,gi:top.g}}
 /** share of decoded words (skeleton length>=2) that are Quran words */
 vocabShare(D,cfg=WR){const S=D.filter(k=>k.length>=2);if(S.length<cfg.vocabN)return {n:S.length,share:0,long:0};let c=0,l=0;for(const k of S)if(this.vocab.has(k)){c++;if(k.length>=4)l++}return {n:S.length,share:c/S.length,long:l}}}
/** How many consecutive decoded bigrams also appear in the expected next words (so the tracker is just slow, not wrong). */
export function inExpected(D,flatN,p,cfg=WR){const E=flatN.slice(Math.max(0,p-2),p+cfg.expWin).map(sk),S=D.map(sk).filter(Boolean);let hit=0;
 for(let i=0;i+1<S.length;i++){for(let j=0;j+1<E.length;j++)if(S[i]===E[j]&&S[i+1]===E[j+1]){hit++;break}}return hit}
export class WrongWatch{constructor(qi,cfg=WR){this.qi=qi;this.cfg=cfg;this.reset()}
 reset(){this.lastProg=0;this.prog='';this.fired=-99;this.soft=-99;this.sig=''}
 /**
  * t: stream seconds; H: [{w,t0,t1}] decoded words (absolute); flatN: expected words normalized; p: tracker cursor index; progKey: string that changes on any tracker progress;
  * speech(t0,t1): seconds of voiced speech. Returns null | {kind:'other'|'wrong'|'soft', ...}.
  */
 feed({t,H,flatN,p,progKey,speech}){const c=this.cfg;if(progKey!==this.prog){this.prog=progKey;this.lastProg=t;return null}
  if(t-this.fired<c.cool)return null;const sp=speech(this.lastProg,t);if(sp<c.secs)return null;
  const D=H.filter(h=>h.t0>=this.lastProg-0.2).map(h=>h.w);if(D.length<c.minWords)return null;
  if(inExpected(D,flatN,p,c)>=2)return null;
  const vs=this.qi.vocabShare(D,c);
  const hit=this.qi.find(D,c);
  if(hit&&vs.share>=c.vocabHit&&(hit.votes+1)/D.length>=c.cov){this.fired=t;return {kind:'other',sn:hit.sn,a:hit.a,votes:hit.votes,words:D.length,secs:sp,share:vs.share}}
  if(D.length>=c.minWordsWrong&&vs.n>=c.vocabN&&vs.share>=c.vocab&&vs.long>=c.longN){this.fired=t;return {kind:'wrong',words:D.length,secs:sp,share:vs.share}}
  if(sp>=c.softSecs&&t-this.soft>=c.softSecs){this.soft=t;return {kind:'soft',words:D.length,secs:sp,share:vs.share}}
  return null}}
