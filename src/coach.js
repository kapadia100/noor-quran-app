// Recite & Learn coach: pure helpers (no DOM) — weak-word store with spaced repetition, retry verdicts,
// Arabic syllable split, highlight timing and ayah-audio slice estimates. Kept tiny: Home imports it too.
import {sim} from './recite-core.js';
export const DAY=864e5,INTERVALS=[1,2,4,8,16],MAX_WEAK=200,ESCALATE_AT=3;
export const weakKey=(n,a,k)=>`${n}:${a}:${k}`;
export function weakLoad(){try{const s=JSON.parse(localStorage.getItem('qsWeak'));return s&&typeof s==='object'?s:{}}catch{return {}}}
export function weakSave(s){try{const ks=Object.keys(s);if(ks.length>MAX_WEAK){ks.sort((a,b)=>(s[a].last||0)-(s[b].last||0));for(const k of ks.slice(0,ks.length-MAX_WEAK))delete s[k]}localStorage.setItem('qsWeak',JSON.stringify(s))}catch{/* storage full/blocked: never break the app */}}
/** target: {key,sn,a,k,t,nw,tr,m,au,ph,pi,cn} — stored fields only. */
const FIELDS=['sn','a','k','t','nw','tr','m','au','ph','pi','cn','ci'];
export function recMiss(s,t,now=Date.now(),skipped=false){const e=s[t.key]||{key:t.key,miss:0,box:0,first:now};for(const f of FIELDS)if(t[f]!==undefined)e[f]=t[f];
 e.miss++;e.box=0;e.last=now;e.due=now;if(skipped)e.skips=(e.skips||0)+1;s[t.key]=e;return e}
/** Corrected in the session (review=false) or in a spaced review (review=true). */
export function recFix(s,key,now=Date.now(),review=false){const e=s[key];if(!e)return null;e.last=now;
 if(review){e.box=(e.box||0)+1;if(e.box>=INTERVALS.length){delete s[key];return null}e.due=now+INTERVALS[e.box]*DAY}
 else e.due=now+INTERVALS[0]*DAY;
 return e}
export function recReviewFail(s,key,now=Date.now()){const e=s[key];if(!e)return null;e.miss=(e.miss||0)+1;e.box=0;e.last=now;e.due=now+DAY/4;return e}
export const weakAll=s=>Object.values(s).sort((a,b)=>(b.miss||0)-(a.miss||0)||(a.sn-b.sn)||(a.a-b.a)||(a.k-b.k));
export const dueItems=(s,now=Date.now())=>weakAll(s).filter(e=>(e.due||0)<=now);
/** Verdict for a repeat attempt: heard = normalized heard words. 'ok' >=0.6; 'close' 0.5–0.6 or short word; 'miss' only on clear evidence. */
export function attempt(target,heard){if(!heard.length)return {v:'none',s:0};let best=0;
 for(let i=0;i<heard.length;i++){best=Math.max(best,sim(target,heard[i]));if(i+1<heard.length)best=Math.max(best,sim(target,heard[i]+heard[i+1]));if(i+2<heard.length)best=Math.max(best,sim(target,heard[i]+heard[i+1]+heard[i+2]))}
 if(best>=0.6)return {v:'ok',s:best};if(best>=0.5||target.length<=3)return {v:'close',s:best};return {v:'miss',s:best}}
const MARK='\u064B-\u065F\u0670\u06D6-\u06ED\u0640';
/** Split an Arabic word (with harakat) into syllables: each vowelled letter starts one; sukun/madd letters close the previous. No harakat → one unit per letter. */
export function syllables(word){const units=String(word).match(new RegExp(`[\\u0621-\\u064A\\u0671][${MARK}]*`,'g'))||[];if(!units.length)return [String(word)];
 if(!units.some(u=>/[\u064B-\u0650]/.test(u)))return units;
 const out=[];for(const u of units){if(!out.length||/[\u064B-\u0650]/.test(u))out.push(u);else out[out.length-1]+=u}return out}
export const syllWeights=sy=>sy.map(s=>Math.max(1,(s.match(new RegExp(`[^${MARK}]`,'g'))||[]).length));
/** Which syllable is being spoken at fraction f (0..1) of the clip, weighted by syllable length. */
export function syllAt(weights,f){const tot=weights.reduce((a,b)=>a+b,0);let x=Math.min(0.9999,Math.max(0,f))*tot,c=0;for(let i=0;i<weights.length;i++){c+=weights[i];if(x<c)return i}return weights.length-1}
/** Estimate [from,to] seconds of words i0..i1 inside a whole-ayah recording of length dur (proportional to letter counts). */
export function estimateSlice(cn,i0,i1,dur,pad=0.2){const tot=cn.reduce((a,b)=>a+b,0)||1;let a=0;for(let i=0;i<i0;i++)a+=cn[i];let b=a;for(let i=i0;i<=i1&&i<cn.length;i++)b+=cn[i];
 return [Math.max(0,dur*a/tot-pad),Math.min(dur,dur*b/tot+pad)]}
export const ENCOURAGE=[['Almost — listen once more, then try again.','تقریباً — ایک بار پھر سنیں، پھر دوبارہ کوشش کریں۔'],['Good try. Take your time.','اچھی کوشش۔ آرام سے۔'],['You can do this — slowly.','آپ کر سکتے ہیں — آہستہ آہستہ۔'],['Nice effort. One more time.','شاباش۔ ایک بار اور۔']];
