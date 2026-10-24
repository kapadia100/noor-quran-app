// Hifz Test auto-locate (v3.4.1, strict). Before the first verified phrase, test the latest heard words against the start of every other
// ayah in the range with a cached Tracker per start. A move needs MUCH stronger evidence than normal start verification:
//  - an ordered run of >=4 strong words (mean score >=0.9, >=14 letters) from the ayah start (at most 1 word in), no 2-word shortcuts;
//  - the SAME single location must win on 2 consecutive checks (consistent repeated location), with no competing distant hit (neighbouring ayat of one continuous reading are fine: take the earliest).
// It only moves the start pointer; every green is still earned by the main tracker's own phrase-start verification afterwards.
import {Tracker} from './recite-live.js';
export const LOC={n:4,s:0.9,lead:1,leadN:4,leadS:0.92,two:{s:9,letters:999},exact:{s:9,letters:999},gap:{win:5,ok:4,s:0.92,letters:14},minLetters:14,repeat:2};
export function locate(T,wordsN,starts,cache,H,t,aux,ayahOf,cfg=LOC){if(T.verified||!H||H.length<4)return -1;const hit=[];
 for(const i0 of starts){if(i0===T.p)continue;const tk=cache[i0]??=new Tracker(wordsN.slice(i0));tk.cfg=T.cfg;tk.scfg=cfg;try{tk.update(H,t,aux)}catch{continue}
  if(tk.verified){let l=0;for(let k=0;k<6;k++)if(tk.marks[k]==='ok'||tk.prov[k])l+=(wordsN[i0+k]||'').length;if(l>=cfg.minLetters)hit.push(i0)}}
 const r=cache.__r??={i:-1,n:0};
 if(!hit.length||ayahOf(hit[hit.length-1])-ayahOf(hit[0])>2){r.i=-1;r.n=0;for(const i of hit)delete cache[i];return -1}
 if(r.i===hit[0])r.n++;else{r.i=hit[0];r.n=1}
 return r.n>=cfg.repeat?hit[0]:-1}
