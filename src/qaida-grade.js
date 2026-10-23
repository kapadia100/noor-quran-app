// Word-level check for Qaida word rows. Each spoken burst (cut by the pace follower) is scored against the words of its row.
// There is no "wrong" verdict: a word is either confirmed or "not confirmed" (isolated words are only recognised part of the time),
// so this can never show a false red.
import {norm} from './recite-core.js';
import {TOKENS} from '../public/ctc-core.js';
// ---- closed-set check: which of the words in this row did the burst sound like? ----
// The model returns, for every 40 ms frame, how likely each letter is (CTC). Instead of decoding freely (which often turns a single word into
// something unrelated), score every word of the row against those probabilities and see whether the expected word wins. Much more reliable
// for isolated words because the model only has to tell a handful of known words apart.
const V0=31;
const IDX=Object.fromEntries(TOKENS.map((c,i)=>[c,i]));
export const tokensOf=w=>[...norm(w)].map(c=>IDX[c]).filter(x=>x>0);
const LSE=(a,b)=>a>b?a+Math.log1p(Math.exp(b-a)):b>-1e29?b+Math.log1p(Math.exp(a-b)):a;
/** CTC forward log-likelihood of token sequence seq (blank = 0) given log-probs lp [T x V]. */
export function ctcLogLik(lp,T,seq,V=31){const n=seq.length;if(!n)return -1e9;const S=2*n+1,NEG=-1e30;let a=new Float64Array(S).fill(NEG),b=new Float64Array(S);
 a[0]=lp[0];if(S>1)a[1]=lp[seq[0]];
 for(let t=1;t<T;t++){b.fill(NEG);const o=t*V;for(let s=0;s<S;s++){const tok=s%2?seq[(s-1)>>1]:0;let v=a[s];if(s>0)v=LSE(v,a[s-1]);if(s>1&&s%2&&seq[(s-1)>>1]!==seq[(s-3)>>1])v=LSE(v,a[s-2]);b[s]=v<-1e29?NEG:v+lp[o+tok]}[a,b]=[b,a]}
 return S>1?LSE(a[S-1],a[S-2]):a[0]}
/** Best single path score (upper bound for any word): sum of the per-frame maxima. */
export function bestPath(lp,T,V=31){let s=0;for(let t=0;t<T;t++){let m=-1e30;for(let v=0;v<V;v++)if(lp[t*V+v]>m)m=lp[t*V+v];s+=m}return s}
// v3.3: + vb = how far the word must beat the all-blank ("nothing was said") path. Measured on 14,760 grades of non-reading audio (noise, room sounds, other speech,
// lesson audio, other reciters): without it 4.3% of grades were falsely confirmed, with vb 15 about 0.1% (and the burst must first pass the speech detector).
export const CLOSED={margin:2,gap:14,vb:15};
/** cands: expected words of the row; i: expected index. Returns {ok, ll, best, gap, win}. Words that spell the same (letters only) tie and count as the same word. */
export function gradeClosed(lp,T,cands,i,cfg=CLOSED){const toks=cands.map(tokensOf);const ll=toks.map(t=>t.length?ctcLogLik(lp,T,t):-1e9);const bp=bestPath(lp,T);
 const same=toks.map(t=>t.join(',')===toks[i].join(','));let other=-1e9;ll.forEach((v,k)=>{if(!same[k]&&v>other)other=v});
 let bl=0;for(let t=0;t<T;t++)bl+=lp[t*V0];const margin=ll[i]-other,gap=bp-ll[i],vb=ll[i]-bl;return{ok:margin>=cfg.margin&&gap<=cfg.gap&&vb>=(cfg.vb??0),margin,gap,vb,ll:ll[i]}}
