// Shared test audio: real recorded speech clips (lesson letters + English/Urdu sentences), int16 in tests/fixtures/clips.bin.
import fs from 'node:fs';
import {parseWeights} from '../../src/silero.js';
import {setVadWeights} from '../../src/qaida-pace.js';
export const SR=16000;
const dir=new URL('../fixtures/',import.meta.url);
const bin=fs.readFileSync(new URL('clips.bin',dir)),idx=JSON.parse(fs.readFileSync(new URL('clips.json',dir),'utf8'));
const all=new Int16Array(bin.buffer.slice(bin.byteOffset,bin.byteOffset+bin.length));
export const clip=n=>{const [o,l]=idx[n];const a=new Float32Array(l);for(let i=0;i<l;i++)a[i]=all[o+i]/32768;return a};
export const LESSON=Object.keys(idx).filter(k=>k.startsWith('L:')),TALK=Object.keys(idx).filter(k=>!k.startsWith('L:'));
export function loadVad(){const b=fs.readFileSync(new URL('../../public/vad/silero16k.bin',import.meta.url));setVadWeights(parseWeights(b.buffer.slice(b.byteOffset,b.byteOffset+b.length)))}
let seed=7;export const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296-.5};
export const noiseBed=(n,a)=>{const x=new Float32Array(n);for(let i=0;i<n;i++)x[i]=rnd()*2*a;return x};
/** n lesson clips, `gap` s apart, over a noise bed. gain scales the speech (phone quiet / far mic). */
export function reading(n,{gap=0.6,lead=1.0,noise=0.0015,gain=0.3,tail=1.0,clips=LESSON}={}){
 const cl=[];for(let k=0;k<n;k++)cl.push(clip(clips[k%clips.length]));
 const len=Math.round((lead+tail)*SR)+cl.reduce((s,c)=>s+c.length+Math.round(gap*SR),0);const x=noiseBed(len,noise);let p=Math.round(lead*SR);
 for(const c of cl){for(let i=0;i<c.length;i++)x[p+i]+=c[i]*gain;p+=c.length+Math.round(gap*SR)}return x}
export const feed=(det,x,step=1600)=>{const ev=[];for(let i=0;i<x.length;i+=step)ev.push(...det.push(x.subarray(i,Math.min(x.length,i+step))));return ev};
