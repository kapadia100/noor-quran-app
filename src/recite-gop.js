// Forced alignment of the EXPECTED text against the model's CTC posteriors (Viterbi over the CTC lattice) and a
// per-word "goodness of pronunciation" (GOP) score. This is acoustic evidence that does not depend on what the
// greedy decoder happened to print, so it (a) vetoes red flags the decoder caused by noise and (b) separates
// similar words (Rahman/Raheem) because the differing letter has to be present in the audio.
// Pure functions; shared by the app and the offline evaluation harness.
const ID=new Map();[...'ءابتثجحخدذرزسشصضطظعغفقكلمنهوي'].forEach((c,i)=>ID.set(c,i+1));
export const SPACE=30,NV=31;
/** lp: Float32Array [T*NV] log-probs. words: normalized expected words. Returns per-word scores or null. */
export function gopScores(lp,T,words,opt={}){
 const lab=[],owner=[];// label ids, owner word (-1 for separator)
 words.forEach((w,wi)=>{if(wi>0){lab.push(SPACE);owner.push(-1)}for(const ch of w){const id=ID.get(ch);if(id){lab.push(id);owner.push(wi)}}});
 const L=lab.length;if(!L||T<2)return null;const S=2*L+1;if(S>6000)return null;
 const sym=s=>s%2===0?0:lab[(s-1)>>1];
 const NEG=-1e30;const mx=new Float32Array(T),cum=new Float64Array(T+1);
 for(let t=0;t<T;t++){let m=-1e30;for(let v=0;v<NV;v++){const x=lp[t*NV+v];if(x>m)m=x}mx[t]=m;cum[t+1]=cum[t]+m}
 const D=new Float32Array(T*S).fill(NEG),B=new Uint8Array(T*S);
 D[0]=lp[0];if(S>1)D[1]=lp[sym(1)];
 for(let t=1;t<T;t++){const o=lp.subarray(t*NV,t*NV+NV);const pr=(t-1)*S,cu=t*S;
  for(let s=0;s<S;s++){let b=D[pr+s],bk=0;if(s>0&&D[pr+s-1]>b){b=D[pr+s-1];bk=1}
   if(s>1&&s%2===1&&sym(s)!==sym(s-2)&&D[pr+s-2]>b){b=D[pr+s-2];bk=2}
   if(b>NEG/2){D[cu+s]=b+o[sym(s)];B[cu+s]=bk}}}
 // end anywhere: score = path score up to te + free (best) score of the remaining frames
 let bt=-1,bs=-1,bv=NEG;for(let t=0;t<T;t++)for(const s of [S-1,S-2]){const v=D[t*S+s];if(v>NEG/2){const tot=v+(cum[T]-cum[t+1]);if(tot>bv){bv=tot;bt=t;bs=s}}}
 if(bt<0)return null;
 const path=new Int32Array(bt+1);let s=bs;for(let t=bt;t>=0;t--){path[t]=s;s-=B[t*S+s]}
 // per label (char): best (lp - max) over the frames it owns
 const g=new Float32Array(L).fill(NEG),fr=new Int32Array(L).fill(-1),fl=new Int32Array(L).fill(-1);
 for(let t=0;t<=bt;t++){const st=path[t];if(st%2===1){const li=(st-1)>>1;const v=lp[t*NV+lab[li]]-mx[t];if(v>g[li]){g[li]=v;fr[li]=t}if(fl[li]<0)fl[li]=t}}
 const out=words.map(()=>({n:0,sum:0,min:0,t0:-1,t1:-1,bad:0}));
 for(let li=0;li<L;li++){const wi=owner[li];if(wi<0)continue;const o=out[wi],v=g[li]>NEG/2?g[li]:-30;o.n++;o.sum+=v;if(v<o.min)o.min=v;if(v<-(opt.charBad??4))o.bad++;
  if(o.t0<0||fr[li]<o.t0)o.t0=fr[li];if(fr[li]>o.t1)o.t1=fr[li]}
 for(const o of out){o.mean=o.n?o.sum/o.n:0}
 return {words:out,endFrame:bt,total:bv}}
