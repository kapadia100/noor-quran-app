// v3.5.1 final pass: after a Hifz session, words that stayed "unclear" (amber) are re-checked against the RECORDED audio with
// forced alignment of the expected text (same CTC lattice as recite-gop), using the neighbouring CONFIRMED words as anchors.
// A word is confirmed late only when its letters are acoustically present between its confirmed neighbours.
// Never touches red (mistake) words; a word that was skipped/replaced has no letters in the audio, so it cannot pass.
import {gopScores} from './recite-gop.js';
export const FINAL={okMean:-0.6,okMin:-2.5,maxBad:0,anchorMean:-8,anchorMin:-14,minLen:2,pad:0.3,maxWin:24,perWord:1.2,minFrames:1.0};
/** Maximal runs [a,b] of indices whose mark is 'unc'. */
export function uncRuns(marks,n){const out=[];let a=-1;for(let i=0;i<=n;i++){const u=i<n&&marks[i]==='unc';if(u&&a<0)a=i;if(!u&&a>=0){out.push([a,i-1]);a=-1}}return out}
/** Time window (seconds) for a run, from the times of the confirmed neighbours. */
export function runWindow(a,b,marks,wt,tEnd,cfg=FINAL){const L=marks[a-1]==='ok'&&wt[a-1]?wt[a-1]:null,R=marks[b+1]==='ok'&&wt[b+1]?wt[b+1]:null,k=b-a+1;
 let t0=L?L[0]-cfg.pad:R?R[0]-k*cfg.perWord-2:0,t1=R?R[1]+cfg.pad:L?L[1]+k*cfg.perWord+2:tEnd;
 t0=Math.max(0,t0);t1=Math.min(tEnd,t1);if(t1-t0>cfg.maxWin){if(L)t1=t0+cfg.maxWin;else t0=t1-cfg.maxWin}
 return {t0,t1,L:!!L,R:!!R}}
/**
 * flat: normalized expected words; marks: {i:'ok'|'unc'|'bad'}; wt: {i:[t0,t1]} seconds of confirmed words; tEnd: recording length (s);
 * decode(audio)->Promise<{lp,T}|null>; slice(t0,t1)->Float32Array. Returns {confirmed:[i], tried:n, detail:{i:{mean,min,bad}}}.
 */
export async function finalPass({flat,marks,wt,tEnd,decode,slice,cfg=FINAL}){const confirmed=[],detail={};let tried=0;
 for(const [a,b] of uncRuns(marks,flat.length)){const w=runWindow(a,b,marks,wt,tEnd,cfg);if(w.t1-w.t0<0.4)continue;
  const lo=w.L?a-1:a,hi=w.R?b+1:b;const E=flat.slice(lo,hi+1);const audio=slice(w.t0,w.t1);if(audio.length<8000)continue;
  const d=await decode(audio);if(!d)continue;tried++;const g=gopScores(d.lp,d.T,E);if(!g)continue;
  // sanity: the aligner must find the confirmed anchors in this window, otherwise the window is wrong and nothing is trusted
  let sane=true;if(w.L){const x=g.words[0];if(!x||x.mean<cfg.anchorMean||x.min<cfg.anchorMin)sane=false}
  if(w.R){const x=g.words[E.length-1];if(!x||x.mean<cfg.anchorMean||x.min<cfg.anchorMin)sane=false}
  detail['r'+a]={t0:+w.t0.toFixed(2),t1:+w.t1.toFixed(2),L:w.L&&g.words[0]&&[+g.words[0].mean.toFixed(2),+g.words[0].min.toFixed(2)],R:w.R&&[+g.words[E.length-1].mean.toFixed(2),+g.words[E.length-1].min.toFixed(2)],end:g.endFrame,T:d.T};
  for(let i=a;i<=b;i++){const x=g.words[i-lo];if(!x)continue;detail[i]={ra:a,mean:+x.mean.toFixed(2),min:+x.min.toFixed(2),bad:x.bad,n:x.n,sane};
   if(sane&&x.n>=cfg.minLen&&x.mean>=cfg.okMean&&x.min>=cfg.okMin&&x.bad<=cfg.maxBad)confirmed.push(i)}}
 return {confirmed,tried,detail}}
