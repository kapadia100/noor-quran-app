// v3.6.1 — sequence-level acoustic alignment for FAST recitation.
import {norm,sim} from "./recite-core.js";
// A hafiz at speed drops letters, blends words (no space token) and the greedy transcript turns into blobs that the word-level
// aligner cannot match. This module aligns the EXPECTED upcoming text straight against the CTC posteriors (not the printed
// transcript): a Viterbi over the CTC lattice in which any expected letter may be SKIPPED at a fixed price, word separators
// are free, the start is free (the window usually begins inside already-confirmed words) and the end is free (the window
// ends wherever the reciter currently is). Per word it reports how many letters are acoustically present and how strongly.
// Pure functions, shared by the app and the offline harness.
const ID=new Map();[...'ءابتثجحخدذرزسشصضطظعغفقكلمنهوي'].forEach((c,i)=>ID.set(c,i+1));
const NV=31,SP=30;
export const SEQ={skip:-4.5,junk:-6,lead:3,presDb:-3.2};
/**
 * lp: log-probs [T*NV]; words: normalized expected words; opt.lead: how many leading words the window may start inside.
 * Returns {words:[{n,pres,sum,min,t0,t1,mean,cov}],endFrame,total} where
 *   pres = letters acoustically present (not skipped and within presDb of the frame's best token), mean = mean (lp-max) of the present letters.
 */
export function seqAlign(lp,T,words,opt={}){
 const cfg={...SEQ,...opt};const lab=[],owner=[],wstart=[];
 words.forEach((w,wi)=>{wstart.push(lab.length);for(const ch of w){const id=ID.get(ch);if(id){lab.push(id);owner.push(wi)}}});
 const L=lab.length;if(!L||T<3)return null;const S=2*L+1;if(S>4000)return null;
 const NEG=-1e30,sym=s=>s%2===0?0:lab[(s-1)>>1];
 const bl=new Float32Array(T),mx=new Float32Array(T),cumB=new Float64Array(T+1);
 for(let t=0;t<T;t++){let m=-1e30;const o=t*NV;for(let v=0;v<NV;v++)if(lp[o+v]>m)m=lp[o+v];mx[t]=m;bl[t]=Math.max(lp[o],lp[o+SP],cfg.junk);cumB[t+1]=cumB[t]+bl[t]}
 const D=new Float32Array(T*S).fill(NEG),B=new Int8Array(T*S);// B: 0 stay, 1 from s-1, 2 from s-2, 3 skip-chain from s-2k (decoded via K array)
 const SK=new Int32Array(T*S);// predecessor state for skip transitions
 const nLead=Math.min(cfg.lead,words.length-1);const startL=[];for(let w=0;w<=nLead;w++)startL.push(wstart[w]);
 const A=new Float32Array(S),Ap=new Int32Array(S),Ab=new Int8Array(S);
 const em=(t,s)=>s%2===0?bl[t]:lp[t*NV+lab[(s-1)>>1]];
 // t=0
 for(const li of startL){D[2*li]=em(0,2*li);D[2*li+1]=em(0,2*li+1)}
 for(let t=1;t<T;t++){const pr=(t-1)*S,cu=t*S;
  for(let s=0;s<S;s++){let b=D[pr+s],bk=0,bp=s;
   if(s>0&&D[pr+s-1]>b){b=D[pr+s-1];bk=1;bp=s-1}
   if(s>1&&(s&1)&&sym(s)!==sym(s-2)&&D[pr+s-2]>b){b=D[pr+s-2];bk=2;bp=s-2}
   A[s]=b;Ab[s]=bk;Ap[s]=bp}
  // skipping letter(s): arrive at label state s (odd) without emitting label s-2 (and further back), price skip each
  for(let s=3;s<S;s+=2){// label being skipped = li (state 2li+1 = s-2)
   const c=A[s-2]+cfg.skip;// A[s-2] = best arrival into label state s-2 ... skipping it means we arrive into s instead
   if(c>A[s]&&A[s-2]>NEG/2){A[s]=c;Ab[s]=3;Ap[s]=s-2}}
  for(let s=0;s<S;s++){if(A[s]>NEG/2){D[cu+s]=A[s]+em(t,s);B[cu+s]=Ab[s];SK[cu+s]=Ap[s]}}}
 // free end
 let bt=-1,bs=-1,bv=NEG;for(let t=0;t<T;t++)for(let s=1;s<S;s++){const v=D[t*S+s];if(v>NEG/2){const tot=v+(cumB[T]-cumB[t+1]);if(tot>bv){bv=tot;bt=t;bs=s}}}
 if(bt<0)return null;
 const path=new Int32Array(bt+1);let s=bs;for(let t=bt;t>=0;t--){path[t]=s;s=B[t*S+s]===0?s:B[t*S+s]===1?s-1:B[t*S+s]===2?s-2:SK[t*S+s]}
 const g=new Float32Array(L).fill(NEG),fr=new Int32Array(L).fill(-1);
 for(let t=0;t<=bt;t++){const st=path[t];if(st&1){const li=(st-1)>>1;const v=lp[t*NV+lab[li]]-mx[t];if(v>g[li]){g[li]=v;fr[li]=t}}}
 const out=words.map(()=>({n:0,pres:0,sum:0,min:0,t0:-1,t1:-1}));
 for(let li=0;li<L;li++){const o=out[owner[li]];o.n++;if(g[li]>NEG/2){if(g[li]>=cfg.presDb){o.pres++;o.sum+=g[li];if(o.t0<0||fr[li]<o.t0)o.t0=fr[li];if(fr[li]>o.t1)o.t1=fr[li]}if(g[li]<o.min)o.min=g[li]}else o.min=Math.min(o.min,-30)}
 for(const o of out){o.mean=o.pres?o.sum/o.pres:-30;o.cov=o.n?o.pres/o.n:0}
 return {words:out,endFrame:bt,total:bv,path}}
/** Strong acoustic evidence for a word: (nearly) all its letters are present and confident. Short words never stand alone. */
export const STRONG={minLen:3,cov5:0.8,covShort:1,mean:-1.2,min:-6,run:2};
export const isStrong=(w,cfg=STRONG)=>w&&w.n>=cfg.minLen&&w.cov>=(w.n>=5?cfg.cov5:cfg.covShort)&&w.mean>=cfg.mean&&w.min>=cfg.min;
/**
 * Rebuild the heard-word list for the Tracker when the reciter is fast: expected words that the posteriors prove were said
 * (>=cfg.run consecutive STRONG words, found by seqAlign on the posteriors) are inserted as heard words with their aligned times,
 * and the printed blobs they replace are dropped. Everything else is left exactly as decoded, so wrong / skipped words are still judged
 * from what was really heard. Returns {H,syn} (syn = number of synthesized words) or null.
 * E: expected words from the tracker pointer; aux: {lp,T,off}. H: [{w,t0,t1}] absolute seconds.
 */
// A printed word of about the same length sitting on exactly this stretch of audio and clearly NOT the expected word is a real
// substitution (the reciter said something else): never paper over it with the expected text. Longer printed blobs are blended words.
function veto(H,w,t0,t1,cfg){if(globalThis.__VETO===0)return false;const vs=(cfg.vetoSim??+globalThis.__VSIM)||0.7,dl=cfg.vetoLen??1;
 for(const h of H){if(h.syn)continue;const c=(h.t0+h.t1)/2;if(c<t0-0.02||c>t1+0.02)continue;const x=norm(h.w);
  if(x.length>=3&&Math.abs(x.length-w.length)<=dl&&sim(x,w)<vs)return true}return false}
export function seqAugment(H,E,aux,cfg={}){
 if(!aux||!aux.lp||aux.off==null||!E.length)return null;const n=Math.min(E.length,cfg.look??26);
 const r=seqAlign(aux.lp,aux.T,E.slice(0,n),{lead:cfg.lead??1,...(cfg.align||{})});if(!r)return null;
 const sc={...STRONG,...(cfg.strong||{})};const W=r.words;const syn=[];let k=0;
 while(k<n){if(!isStrong(W[k],sc)){k++;continue}let e=k;while(e+1<n&&isStrong(W[e+1],sc))e++;
  if(e-k+1>=sc.run){for(let q=k;q<=e;q++){if(veto(H,E[q],aux.off+W[q].t0*0.04,aux.off+(W[q].t1+1)*0.04,cfg))continue;syn.push({k:q,w:E[q],t0:aux.off+W[q].t0*0.04,t1:aux.off+(W[q].t1+1)*0.04})}}k=e+1}
 if(globalThis.__SEQDBG)console.error("SQD",W.slice(0,8).map(w=>w?[w.n,(+w.cov).toFixed(2),(+w.mean).toFixed(2),(+w.min).toFixed(1)].join("/"):"-").join(" "),"syn",syn.map(s=>s.k).join(","));
 if(!syn.length)return null;
 // drop printed words that sit inside a synthesized stretch (by time centre)
 const spans=[];for(const s of syn){const l=spans[spans.length-1];if(l&&s.t0<=l[1]+0.25)l[1]=Math.max(l[1],s.t1);else spans.push([s.t0,s.t1])}
 const keep=H.filter(h=>{const c=(h.t0+h.t1)/2;return !spans.some(sp=>c>=sp[0]-0.02&&c<=sp[1]+0.02)});
 const out=keep.concat(syn.map(s=>({w:s.w,t0:s.t0,t1:s.t1,syn:true}))).sort((a,b)=>a.t0-b.t0);
 return {H:out,syn:syn.length,r}}
/**
 * Where is the reciter now? Wide, free-start alignment of the latest posteriors against the next `cfg.reach` expected words.
 * Returns the best contiguous run of STRONG words {k0,k1,letters,t0,mean} (k relative to E[0]) or null. Needs >=run strong words
 * (or >=3 with >=letters letters): a stretch of 3-4 specific Quranic words cannot be hit by chance.
 */
export const LOC={reach:80,run:4,run3Letters:15,cooldown:0.6};
export function seqLocate(E,aux,cfg={}){
 if(!aux||!aux.lp||aux.off==null||E.length<4)return null;const c={...LOC,...cfg};const n=Math.min(E.length,c.reach);
 const r=seqAlign(aux.lp,aux.T,E.slice(0,n),{lead:n});if(!r)return null;const sc={...STRONG,...(c.strong||{})};
 let best=null,k=0;
 while(k<n){if(!isStrong(r.words[k],sc)){k++;continue}let e=k,lt=0,sm=0;
  while(e<n&&isStrong(r.words[e],sc)){lt+=r.words[e].n;sm+=r.words[e].mean;e++}
  const len=e-k;if((len>=c.run)||(len>=3&&lt>=c.run3Letters)){if(!best||lt>best.letters)best={k0:k,k1:e-1,letters:lt,t0:aux.off+r.words[k].t0*0.04,t1:aux.off+(r.words[e-1].t1+1)*0.04,mean:sm/len}}
  k=e}
 return best}
