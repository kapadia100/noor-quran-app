// Hifz Test auto-locate. Before the first verified phrase, test the latest heard words against the start of every other
// ayah in the range with a fresh, cached Tracker per start (same phrase-start verification as normal tracking).
// Returns the flat index to move to, or -1. It only moves the start pointer: every green is still earned by the tracker.
import {Tracker} from './recite-live.js';
export function locate(T,wordsN,starts,cache,H,t,aux,ayahOf){if(T.verified||!H||H.length<4)return -1;const hit=[];
 for(const i0 of starts){if(i0===T.p)continue;const tk=cache[i0]??=new Tracker(wordsN.slice(i0));tk.cfg=T.cfg;try{tk.update(H,t,aux)}catch{continue}if(tk.verified)hit.push(i0)}
 // several hits are accepted only when they are neighbouring ayat of one continuous reading (take the earliest)
 if(!hit.length||ayahOf(hit[hit.length-1])-ayahOf(hit[0])>3)return -1;return hit[0]}
