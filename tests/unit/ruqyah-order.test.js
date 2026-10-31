import {describe,it,expect} from 'vitest';
globalThis.Audio??=class{addEventListener(){}};
import fs from 'node:fs';
const {RQ,ayahTxt}=await import('../../src/ruqyah.js');
const ar=s=>JSON.parse(fs.readFileSync(`public/offline/s/ar/${s}.json`,'utf8'));
describe('Ruqyah order and text',()=>{
 it('passages are in mushaf order (numeric surah, then ayah), no overlaps',()=>{for(let i=1;i<RQ.length;i++){const [s0,,t0]=RQ[i-1],[s,f,t]=RQ[i];expect(f<=t).toBe(true);expect(s>s0||(s===s0&&f>t0)).toBe(true)}});
 it('Al-Baqarah is exactly 1-5, 102, 163-164, 255, 285-286 ascending',()=>{const b=RQ.filter(x=>x[0]===2).flatMap(([,f,t])=>Array.from({length:t-f+1},(_,k)=>f+k));expect(b).toEqual([1,2,3,4,5,102,163,164,255,285,286])});
 it('ayah 1 never repeats the Bismillah shown above it (all surahs in the set) and the rest is exact',()=>{for(const [s,f] of RQ){if(f!==1)continue;const raw=ar(s)[0],t=ayahTxt(s,1,raw);
  if(s===1){expect(t).toBe(raw);continue}expect(t.replace(/[\u064B-\u065F\u0670]/g,'')).not.toMatch(/^بسم/);expect(raw.endsWith(t)).toBe(true)}});
});
