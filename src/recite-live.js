// Live word tracker: consumes a stream of (re-decoded) heard-word lists and turns them into stable highlights.
// Green is optimistic (as soon as a word is matched); words are LOCKED only after the same verdict repeats on
// consecutive decodes. Red needs a persistent, enclosed wrong/skip verdict (zero-false-alarm priority).
import {seqAugment,seqLocate,LOC} from './recite-seq.js';
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
  if(m.st==='ok'){if(!noisy&&m.s<0.999&&E[m.k].length>=(cfg.minLen??4)&&w.mean<cfg.sim)return {...m,st:'unclear',sim:true,gop:w.mean,heard:H[m.j]};return {...m,gop:w.mean}}
  if(m.st==='unclear'&&E[m.k].length>=3&&w.mean>cfg.rescue&&w.min>-2.5&&w.bad===0)return {...m,st:'ok',s:Math.max(m.s||0,0.6),rescued:true,gop:w.mean};
  return {...m,gop:w.mean}});
 return {marks,noisy}}
/** Recovery lookahead: words cur..from-1 (1-2 words) are clearly absent (aligner skip, or unclear with no acoustic trace) and the
 *  next >=2 consecutive words are STRONG matches (sim>=0.75, >=3 letters each). Returns {from,to} or null. Never optimistic: a single
 *  matched word beyond a gap is not enough. */
export const RECOVER={gapMax:2,minRun:2,strong:0.75,minLen:3,absentGop:-2.0};
/** v3.3.1: a word that stays 'unclear' decode after decode (blended into its neighbour, soft, garbled by the room) while the next >=2 words are
 *  STRONG matches no longer freezes everything behind it: `unc` (the tracker's per-word unclear streak) >=1 earlier decode is enough. */
export function recoverRun(st,flat,cur,cfg=RECOVER,unc=null){
 let from=cur;while(from<cur+cfg.gapMax&&st[from]&&(st[from].st==='skip'||(st[from].st==='unclear'&&((st[from].gop??-9)<cfg.absentGop||(unc&&(unc[from]||0)>=1)))))from++;
 if(from===cur)return null;
 let to=from;while(st[to]&&st[to].st==='ok'&&(st[to].s??0)>=cfg.strong&&flat[to].length>=cfg.minLen)to++;
 return to-from>=cfg.minRun?{from,to}:null}
/** Start verification config (v3.3.1). The first words of a session are only painted once the recitation is confirmed against the expected
 *  ayah by an ORDERED phrase match, not word by word: a run of strong words that may begin up to `lead` words into the ayah (the first word is
 *  often soft / blended with the breath / garbled), may contain one blurred word (gapped n-gram), and is judged by total letters matched
 *  (a long word counts for more than a short one) instead of a fixed word count. Unrelated speech still cannot satisfy it (audited).*/
export const START={n:3,s:0.8,lead:2,leadN:3,leadS:0.85,two:{s:0.9,letters:9},exact:{s:0.99,letters:7},gap:{win:5,ok:3,s:0.85,letters:10}};
export function startEvidence(st,flat,p,cfg=START){
 const okAt=q=>st[q]&&st[q].st==='ok';
 for(let q=p;q<=p+cfg.lead;q++){
  let run=0,sum=0,let_=0;for(let k=q;okAt(k);k++){run++;sum+=st[k].s??1;let_+=(flat[k]||'').length}
  if(!run)continue;const mean=sum/run;
  if(q===p){
   if(run>=cfg.n&&mean>=cfg.s)return true;
   if(run>=2&&mean>=cfg.two.s&&let_>=cfg.two.letters)return true;
   if(run>=2&&mean>=cfg.exact.s&&let_>=cfg.exact.letters)return true;
  }else{
   if(run>=cfg.leadN&&mean>=cfg.leadS)return true;
   if(run>=2&&mean>=0.95&&let_>=cfg.gap.letters)return true;
  }
  // gapped n-gram: >=3 ok words inside a 5-word window (one blurred word between them)
  let c=0,sm=0,lt=0;for(let k=q;k<q+cfg.gap.win;k++)if(okAt(k)){c++;sm+=st[k].s??1;lt+=(flat[k]||'').length}
  if(c>=cfg.gap.ok&&sm/c>=cfg.gap.s&&lt>=cfg.gap.letters&&okAt(q))return true}
 return false}
/** Stuck re-alignment (v3.3.1): the reciter is clearly reading (verified start) but no new word has turned green for `stall` seconds of
 *  decoding. Look a few words ahead (then, much stricter, further ahead): if the heard words match a LATER stretch of the text as a strong
 *  ordered phrase, resume there. Skipped words become neutral 'unc' marks, never red. Never runs before the start is verified. */
export const ALIGN={stall:2.5,reach:12,far:40,farStall:6,cool:1.2,run:3,mean:0.85,two:{mean:0.95,letters:11},farRun:4,farLetters:14};
export class Tracker{
 constructor(flat){this.flat=flat;this.p=0;this.marks={};this.prov={};this.lockedEnd=-1;this.lockedStart=-1;this.sOk={};this.sBad={};this.sUnc={};this.sNon={};this.sNon={};this.cursor=0;this.wt={};this.events=[];this.verified=false;this.progT=null;this.bestCur=-1;this.lastUpT=null;this.alT=-99;this.forceAlign=false}
 // decode from just before the last locked word so it is heard in full and serves as a strong left context
 get winStart(){return this.p>0?Math.max(0,this.lockedStart-(+globalThis.__WPAD||0.2)):0}
 /** H: [{w: normalized word, t0, t1}] (absolute seconds). Returns list of events [{type:'lock'|'prov', i, st}] */
 update(H,t,aux){const ev=[];const ci=this.p>0?this.p-1:0;const E=this.flat.slice(ci,ci+WIN);
  this.seqN=0;if(this.sq!==false&&globalThis.__SEQ!==0&&globalThis.__SEQAUG!==0){const a=seqAugment(H,E,aux,this.sqcfg);if(a){H=a.H;this.seqN=a.syn}}
  const Hn=H.map(x=>x.w);const j0=judge(E,Hn,this.jopt);const rf=refine(E,Hn,j0,aux,this.cfg||GOP_CFG);const j={...j0,marks:rf.marks};this.noisy=rf.noisy;const st={};
  for(const m of j.marks){const i=ci+m.k;if(i<this.p)continue;st[i]=m}
  // provisional greens: a CONTIGUOUS prefix starting at the first not-yet-locked word. A matched word further ahead is
  // never painted while an earlier word is still undecided (that was the "said word 1, word 2 lit up" off-by-one: the
  // aligner may delete a badly decoded word and match the next one). Lookahead is only a RECOVERY after a clearly
  // skipped word, and only with strong evidence (see recoverRun).
  const prov={};let cur=this.p;
  for(;;){const m=st[cur];
   if(m&&m.st==='ok'){prov[cur]=1;cur++;continue}
   const r=recoverRun(st,this.flat,cur,this.rcfg||RECOVER,this.sUnc);if(r){for(let q=r.from;q<r.to;q++)prov[q]=1;cur=r.to;continue}
   break}
  this.prov=prov;this.cursor=cur;this.st=st;
  // streaks
  const upd=(S,pred)=>{for(const k of Object.keys(S))if(!pred(+k))delete S[k]};
  upd(this.sOk,i=>st[i]?.st==='ok');upd(this.sBad,i=>st[i]&&(st[i].st==='wrong'||st[i].st==='skip'));upd(this.sUnc,i=>st[i]?.st==='unclear');
  for(const i of Object.keys(st).map(Number)){const m=st[i];
   if(m.st==='ok')this.sOk[i]=(this.sOk[i]||0)+1;
   else if(m.st==='wrong'||m.st==='skip'){const o=this.sBad[i];this.sBad[i]=o&&o.st===m.st?{st:m.st,n:o.n+1,t0:o.t0}:{st:m.st,n:1,t0:t}}
   else this.sUnc[i]=(this.sUnc[i]||0)+1
   if(m.st!=='ok')this.sNon[i]=(this.sNon[i]||0)+1}
  // fix sBad stored mixed shapes
  for(const k of Object.keys(this.sBad)){if(typeof this.sBad[k]==='number')this.sBad[k]={st:st[k].st,n:this.sBad[k]}}
  // START VERIFICATION: nothing is painted or locked until the first words of a session are confirmed by a short
  // CONTIGUOUS run of strong matches. A single or two lookalike words (English "ism wallah" ~ "bismi llah") can be hit by
  // chance by unrelated speech; three strong consecutive words cannot (measured: see docs). A reciter who really reads gets
  // the same greens a moment later, all at once.
  if(!this.verified){if(startEvidence(st,this.flat,this.p,this.scfg||(globalThis.__startN?{...START,n:globalThis.__startN}:START))){this.verified=true;this.verT=t}else{this.prov={};this.cursor=this.p;return ev}}
  // progress clock (audio seconds); gaps between decodes (silence) restart it so a pause is never counted as a stall
  if(this.progT==null||(this.lastUpT!=null&&t-this.lastUpT>1.5)){this.progT=t}this.lastUpT=t;
  if(this.cursor>this.bestCur){this.bestCur=this.cursor;this.progT=t}
  else if(H.length&&(this.forceAlign?t-this.alT>=ALIGN.cool:t-this.progT>=ALIGN.stall&&t-this.alT>=ALIGN.cool)){this.alT=t;const far=t-this.progT>=ALIGN.farStall;const r=this.realign(H,t,far);this.forceAlign=false;if(r){ev.push(...r);this.progT=t;this.bestCur=this.cursor;return ev}}
  // v3.6.1: SEQ RELOCATE. A fast reciter can outrun the word aligner (blurred words, dropped letters) and then read on past its
  // reach. Wide char-level alignment of the posteriors finds where he is; two consecutive decodes must agree before we jump.
  if(this.sq!==false&&globalThis.__SEQ!==0&&H.length&&aux&&t-this.progT>=(this.locStall??(+globalThis.__LOCSTALL||1.5))&&t-(this.locT||-9)>=LOC.cooldown){
   this.locT=t;const base=this.cursor;const b=seqLocate(this.flat.slice(base,base+LOC.reach),aux,this.loccfg);
   if(b&&b.k0>=1){const abs=base+b.k0;const c=this.locCand;
    if(c&&Math.abs(c.abs-abs)<=1&&t-c.t<2.5){const to=Math.min(c.abs,abs);for(let i=this.p;i<to;i++){const kind=i<this.cursor?'ok':'unc';this.marks[i]=kind;ev.push({type:'lock',i,st:kind,kind:'seqloc',heard:''})}
     this.lockedStart=Math.max(this.lockedStart,Math.min(c.t0,b.t0));this.p=to;this.prov={};this.cursor=to;this.sOk={};this.sBad={};this.sUnc={};this.sNon={};this.locCand=null;this.relocs=(this.relocs||0)+1;this.progT=t;this.bestCur=to;return ev}
    this.locCand={abs,t,t0:b.t0}}
   else if(this.locCand&&t-this.locCand.t>=2.5)this.locCand=null}
  // sequential locking
  for(;;){const i=this.p,m=st[i];if(!m)break;let lock=null;
   if(m.st==='ok'&&this.sOk[i]>=LOCK_OK)lock='ok';
   else if((m.st==='wrong'||m.st==='skip')&&this.sBad[i]?.n>=LOCK_BAD&&t-this.sBad[i].t0>=(this.badMs??0.6))lock='bad';
   else if(m.st==='unclear'&&this.sUnc[i]>=LOCK_UNC){// only once the reciter has clearly moved on (>=2 later words matched ok)
     let later=0;for(let q=i+1;q<i+4;q++)if(st[q]?.st==='ok')later++;if(later>=2)lock='unc'}
   // v3.6.1: a word whose verdict keeps flipping (unclear / skip / ok) while the reciter is clearly >=3 matched words ahead is moved past as neutral
   if(!lock&&m.st!=='ok'&&(this.sNon[i]||0)>=(this.nonN??4)){let later=0;for(let q=i+1;q<i+6;q++)if(st[q]?.st==='ok')later++;if(later>=3)lock='unc'}
   if(!lock)break;
   this.marks[i]=lock;ev.push({type:'lock',i,st:lock,kind:m.st,heard:m.j>=0&&H[m.j]?H[m.j].w:''});
   if(m.j>=0&&H[m.j]){this.lockedEnd=Math.max(this.lockedEnd,H[m.j].t1);this.lockedStart=Math.max(this.lockedStart,H[m.j].t0);this.wt[i]=[H[m.j].t0,H[m.j].t1]}
   delete this.sOk[i];delete this.sBad[i];delete this.sUnc[i];delete this.sNon[i];this.p=i+1}
  return ev}
 /** Try to resume at a later stretch of the text. Returns lock events when it jumped, else null. */
 realign(H,t,far=false){const cur=this.cursor,Hn=H.map(x=>x.w),reach=far?ALIGN.far:ALIGN.reach;let best=null;
  for(let d=1;d<=reach;d++){const E=this.flat.slice(cur+d,cur+d+8);if(E.length<2)break;const j=judge(E,Hn,this.jopt);
   let run=0,sum=0,lt=0,j0=-1;for(const m of j.marks){if(m.k!==run||m.st!=='ok'||(m.s??0)<0.75)break;if(run===0)j0=m.j;run++;sum+=m.s??1;lt+=E[m.k].length}
   if(!run)continue;const mean=sum/run;
   const ok=far?(run>=ALIGN.farRun&&mean>=ALIGN.mean)||(run>=3&&lt>=ALIGN.farLetters&&mean>=ALIGN.mean):(run>=ALIGN.run&&mean>=ALIGN.mean)||(run>=2&&mean>=ALIGN.two.mean&&lt>=ALIGN.two.letters);
   if(ok&&(!best||lt>best.lt))best={d,run,lt,j0}}
  if(!best)return null;const ev=[];const to=cur+best.d;
  for(let i=this.p;i<to;i++){const kind=i<cur?'ok':'unc';this.marks[i]=kind;ev.push({type:'lock',i,st:kind,kind:'realign',heard:''})}
  const h=H[best.j0];if(h){this.lockedStart=Math.max(this.lockedStart,h.t0);}
  this.p=to;this.prov={};this.cursor=to;this.sOk={};this.sBad={};this.sUnc={};this.sNon={};this.realigned=(this.realigned||0)+1;return ev}
}
