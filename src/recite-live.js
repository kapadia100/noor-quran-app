// Live word tracker: consumes a stream of (re-decoded) heard-word lists and turns them into stable highlights.
// Green is optimistic (as soon as a word is matched); words are LOCKED only after the same verdict repeats on
// consecutive decodes. Red needs a persistent, enclosed wrong/skip verdict (zero-false-alarm priority).
import {judge} from './recite-core.js';
import {gopScores} from './recite-gop.js';
export const WIN=45,LOCK_OK=2,LOCK_BAD=3,LOCK_UNC=3;
/** Acoustic (forced-alignment) checks layered on the transcript judge. Tunable per quality level; see docs/RECITE_ENGINE.md. */
export const GOP_CFG={on:true,red:-2.5,noisyRed:-5,sim:-4,rescue:-0.4,noisyAt:-0.8};
/**
 * Refine the transcript verdicts with acoustic evidence. aux={lp,T}: the model's log-probs for the decoded window.
 *  - red (wrong/skip) is VETOED (shown as unclear) when the expected word is still acoustically present (mean GOP above -2.5)  -> fewer false reds
 *  - a transcript-"ok" word that was only a near match (Rahman/Raheem) is soft-flagged as "unclear" (never red) when its letters are not in the audio (clean audio only)
 *  - an "unclear" word whose letters are clearly present in the audio is accepted as ok (noise rescue)
 */
export function refine(E,H,j,aux,cfg=GOP_CFG){if(!cfg.on||!aux||!aux.lp||!j.marks.length)return {marks:j.marks,noisy:false};
 const need=j.done;const g=gopScores(aux.lp,aux.T,E.slice(0,need));if(!g)return {marks:j.marks,noisy:false};
 const ex=[];for(const m of j.marks)if(m.st==='ok'&&m.s>=0.999&&E[m.k].length>=3)ex.push(g.words[m.k].mean);
 ex.sort((a,b)=>a-b);const med=ex.length>=3?ex[ex.length>>1]:0;const noisy=med<cfg.noisyAt;
 const redThr=noisy?cfg.noisyRed:cfg.red;
 const marks=j.marks.map(m=>{const w=g.words[m.k];if(!w||!w.n)return m;
  if(m.st==='wrong'||m.st==='skip'){return w.mean<redThr&&w.min<redThr?{...m,gop:w.mean}:{...m,st:'unclear',vetoed:true,gop:w.mean}}
  if(m.st==='ok'){if(!noisy&&m.s<0.999&&E[m.k].length>=4&&w.mean<cfg.sim)return {...m,st:'unclear',sim:true,gop:w.mean,heard:H[m.j]};return {...m,gop:w.mean}}
  if(m.st==='unclear'&&E[m.k].length>=3&&w.mean>cfg.rescue&&w.min>-2.5&&w.bad===0)return {...m,st:'ok',s:Math.max(m.s||0,0.6),rescued:true,gop:w.mean};
  return {...m,gop:w.mean}});
 return {marks,noisy}}
/** Recovery lookahead: words cur..from-1 (1-2 words) are clearly absent (aligner skip, or unclear with no acoustic trace) and the
 *  next >=2 consecutive words are STRONG matches (sim>=0.75, >=3 letters each). Returns {from,to} or null. Never optimistic: a single
 *  matched word beyond a gap is not enough. */
export const RECOVER={gapMax:2,minRun:2,strong:0.75,minLen:3,absentGop:-2.0};
export function recoverRun(st,flat,cur,cfg=RECOVER){
 let from=cur;while(from<cur+cfg.gapMax&&st[from]&&(st[from].st==='skip'||(st[from].st==='unclear'&&(st[from].gop??-9)<cfg.absentGop)))from++;
 if(from===cur)return null;
 let to=from;while(st[to]&&st[to].st==='ok'&&(st[to].s??0)>=cfg.strong&&flat[to].length>=cfg.minLen)to++;
 return to-from>=cfg.minRun?{from,to}:null}
export class Tracker{
 constructor(flat){this.flat=flat;this.p=0;this.marks={};this.prov={};this.lockedEnd=-1;this.lockedStart=-1;this.sOk={};this.sBad={};this.sUnc={};this.cursor=0;this.events=[]}
 // decode from just before the last locked word so it is heard in full and serves as a strong left context
 get winStart(){return this.p>0?Math.max(0,this.lockedStart-(+globalThis.__WPAD||0.2)):0}
 /** H: [{w: normalized word, t0, t1}] (absolute seconds). Returns list of events [{type:'lock'|'prov', i, st}] */
 update(H,t,aux){const ev=[];const ci=this.p>0?this.p-1:0;const E=this.flat.slice(ci,ci+WIN);
  const Hn=H.map(x=>x.w);const j0=judge(E,Hn);const rf=refine(E,Hn,j0,aux,this.cfg||GOP_CFG);const j={...j0,marks:rf.marks};this.noisy=rf.noisy;const st={};
  for(const m of j.marks){const i=ci+m.k;if(i<this.p)continue;st[i]=m}
  // provisional greens: a CONTIGUOUS prefix starting at the first not-yet-locked word. A matched word further ahead is
  // never painted while an earlier word is still undecided (that was the "said word 1, word 2 lit up" off-by-one: the
  // aligner may delete a badly decoded word and match the next one). Lookahead is only a RECOVERY after a clearly
  // skipped word, and only with strong evidence (see recoverRun).
  const prov={};let cur=this.p;
  for(;;){const m=st[cur];
   if(m&&m.st==='ok'){prov[cur]=1;cur++;continue}
   const r=recoverRun(st,this.flat,cur);if(r){for(let q=r.from;q<r.to;q++)prov[q]=1;cur=r.to;continue}
   break}
  this.prov=prov;this.cursor=cur;
  // streaks
  const upd=(S,pred)=>{for(const k of Object.keys(S))if(!pred(+k))delete S[k]};
  upd(this.sOk,i=>st[i]?.st==='ok');upd(this.sBad,i=>st[i]&&(st[i].st==='wrong'||st[i].st==='skip'));upd(this.sUnc,i=>st[i]?.st==='unclear');
  for(const i of Object.keys(st).map(Number)){const m=st[i];
   if(m.st==='ok')this.sOk[i]=(this.sOk[i]||0)+1;
   else if(m.st==='wrong'||m.st==='skip'){const o=this.sBad[i];this.sBad[i]=o&&o.st===m.st?{st:m.st,n:o.n+1}:{st:m.st,n:1}}
   else this.sUnc[i]=(this.sUnc[i]||0)+1}
  // fix sBad stored mixed shapes
  for(const k of Object.keys(this.sBad)){if(typeof this.sBad[k]==='number')this.sBad[k]={st:st[k].st,n:this.sBad[k]}}
  // sequential locking
  for(;;){const i=this.p,m=st[i];if(!m)break;let lock=null;
   if(m.st==='ok'&&this.sOk[i]>=LOCK_OK)lock='ok';
   else if((m.st==='wrong'||m.st==='skip')&&this.sBad[i]?.n>=LOCK_BAD)lock='bad';
   else if(m.st==='unclear'&&this.sUnc[i]>=LOCK_UNC){// only once the reciter has clearly moved on (>=2 later words matched ok)
     let later=0;for(let q=i+1;q<i+4;q++)if(st[q]?.st==='ok')later++;if(later>=2)lock='unc'}
   if(!lock)break;
   this.marks[i]=lock;ev.push({type:'lock',i,st:lock,kind:m.st,heard:m.j>=0&&H[m.j]?H[m.j].w:''});
   if(m.j>=0&&H[m.j]){this.lockedEnd=Math.max(this.lockedEnd,H[m.j].t1);this.lockedStart=Math.max(this.lockedStart,H[m.j].t0)}
   delete this.sOk[i];delete this.sBad[i];delete this.sUnc[i];this.p=i+1}
  return ev}
}
