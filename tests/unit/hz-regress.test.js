// Regression (v3.4.1): decoded words of a 45 s far-mic synthetic ENGLISH speech clip (non-reading) against surah 36. v3.4.0 auto-locate
// jumped 4 times on it and painted 4 false greens. Replayed through the real Tracker + locate it must paint nothing and never move.
import {test,expect} from 'vitest';import fs from 'node:fs';
import {Tracker,GOP_CFG} from '../../src/recite-live.js';import {words,norm} from '../../src/recite-core.js';import {locate} from '../../src/hz-locate.js';
test('far-mic synthetic English speech: no move, no green',()=>{const {D}=JSON.parse(fs.readFileSync('tests/fixtures/hz-farspeech-36.json'));
 const arr=JSON.parse(fs.readFileSync('public/offline/s/ar/36.json'));const f=[],A=[];arr.forEach((t,q)=>{const ws=words(t).map(norm).filter(Boolean);f.push(...ws);ws.forEach(()=>A.push(q+1))});const fl=f.slice(0,400);
 const T=new Tracker(fl);T.cfg={...GOP_CFG};const starts=[];for(let i=0;i<fl.length;i++)if(i===0||A[i]!==A[i-1])starts.push(i);let c={},g=0,mv=0;
 for(const d of D){const H=d.H.map(([w,t0,t1])=>({w,t0,t1}));T.update(H,d.t,null);if(!T.verified&&!Object.keys(T.marks).length){const i0=locate(T,fl,starts,c,H,d.t,null,i=>A[i]);if(i0>=0){T.p=T.cursor=i0;c={};mv++}}
  g=Math.max(g,Object.keys(T.prov).length+Object.values(T.marks).filter(m=>m==='ok').length)}
 expect(mv).toBe(0);expect(g).toBe(0)},180000);
