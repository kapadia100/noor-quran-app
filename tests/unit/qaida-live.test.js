import {describe,it,expect} from 'vitest';
import {Pace} from '../../src/qaida-pace.js';
import {ctcLogLik,bestPath,gradeClosed,tokensOf} from '../../src/qaida-grade.js';
import {createLive} from '../../src/qaida-live.js';
import {TOKENS} from '../../public/ctc-core.js';
const SR=16000;
let seed=7;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296-.5};
/** items separated by gaps: tone bursts over a noise floor. */
function reading(n,{burst=0.35,gap=0.4,lead=1.0,noise=0.0015,amp=0.2,tail=0.8}={}){
 const len=Math.round((lead+n*(burst+gap)+tail)*SR),x=new Float32Array(len);for(let i=0;i<len;i++)x[i]=rnd()*noise;
 for(let k=0;k<n;k++){const s0=Math.round((lead+k*(burst+gap))*SR),b=Math.round(burst*SR);for(let i=0;i<b;i++){const env=Math.min(1,i/400,(b-i)/400);x[s0+i]+=amp*env*(Math.sin(2*Math.PI*220*i/SR)+0.5*Math.sin(2*Math.PI*660*i/SR))}}
 return x}
const run=(x,cfg)=>{const p=new Pace(cfg),ev=[];for(let i=0;i<x.length;i+=1600)ev.push(...p.push(x.subarray(i,i+1600)));return{p,ev}};
describe('Qaida pace follower',()=>{
 it('counts one item per spoken burst, never more',()=>{for(const n of [1,5,12,20]){const {p}=run(reading(n));expect(p.items).toBe(n)}});
 it('counts correctly for slow and fast reading',()=>{expect(run(reading(8,{burst:0.7,gap:0.9})).p.items).toBe(8);expect(run(reading(8,{burst:0.2,gap:0.25})).p.items).toBe(8)});
 it('stays at zero for silence and for room noise (no false advance)',()=>{expect(run(new Float32Array(SR*6)).p.items).toBe(0);const x=new Float32Array(SR*8);for(let i=0;i<x.length;i++)x[i]=rnd()*0.01;expect(run(x).p.items).toBe(0)});
 it('does not advance during the first 400 ms warm-up (room measurement)',()=>{const x=reading(1,{lead:0.1});expect(run(x).p.items).toBe(0)});
 it('takes back a click shorter than a syllable',()=>{const x=new Float32Array(SR*3);for(let i=0;i<x.length;i++)x[i]=rnd()*0.0015;const s0=SR*1.5;for(let i=0;i<0.05*SR;i++)x[s0+i]+=0.3*Math.sin(i*0.4);const {p,ev}=run(x);expect(p.items).toBe(0);expect(ev.some(e=>e.type==='on')).toBe(true)});
 it('is still under the item count if there is noise at 15 dB SNR',()=>{const x=reading(10,{noise:0.02,amp:0.2});expect(run(x).p.items).toBeLessThanOrEqual(10);expect(run(x).p.items).toBeGreaterThanOrEqual(9)});
});
describe('Qaida pace on a quiet phone microphone (adaptive floor)',()=>{
 it('follows speech 20 to 30 dB quieter than the lab clips (phone mic with noise suppression)',()=>{for(const amp of [0.02,0.008,0.004]){const {p}=run(reading(10,{amp,noise:0.0001,lead:1.2}));expect(p.items,'amp '+amp).toBe(10)}});
 it('follows speech over a steady room hum by calibrating the floor in the first second',()=>{for(const noise of [0.004,0.01,0.02]){const {p}=run(reading(8,{amp:0.12,noise,lead:1.2}));expect(p.items,'noise '+noise).toBe(8)}});
 it('the trigger line sits above the measured room level and exposes it for the on-screen meter',()=>{const {p}=run(reading(2,{noise:0.01,lead:1.5}));expect(p.trigger).toBeGreaterThan(p.nf+6);expect(Number.isFinite(p.lastDb)).toBe(true)});
 it('never counts anything on a very quiet room with a loud hum at -50 dB',()=>{const x=new Float32Array(SR*8);for(let i=0;i<x.length;i++)x[i]=0.0045*Math.sin(i*0.05)+rnd()*0.001;expect(run(x).p.items).toBe(0)});
 it('tells the user when the mic is too quiet or silent',()=>{
  const feedAll=(x,st)=>{const L=createLive({mode:'along',n:6,onStatus:k=>st.push(k)});for(let i=0;i<x.length;i+=1600)L.feed(x.subarray(i,i+1600))};
  const a=[];const x=new Float32Array(SR*9);for(let i=0;i<x.length;i++)x[i]=rnd()*0.004;feedAll(x,a);expect(a).toContain('quiet');
  const b=[];feedAll(new Float32Array(SR*9),b);expect(b).toContain('dead');
  const c=[];feedAll(reading(4),c);expect(c).not.toContain('quiet');expect(c).not.toContain('dead')});
 it('hold() mutes the feed so reference audio played by the app is never counted',()=>{const pos=[];const L=createLive({mode:'along',n:10,onPos:n=>pos.push(n)});const x=reading(5);L.hold(true);for(let i=0;i<x.length;i+=1600)L.feed(x.subarray(i,i+1600));expect(L.pos).toBe(0)});
});
// synthetic log-probs: frames strongly voting for the given letters, with blanks between
function lpFor(word,{conf=0.9,pad=3}={}){const toks=tokensOf(word),V=31,rows=[];const row=k=>{const r=new Float32Array(V).fill(Math.log((1-conf)/(V-1)));r[k]=Math.log(conf);return r};
 for(let i=0;i<pad;i++)rows.push(row(0));for(const t of toks){rows.push(row(t),row(t),row(0))}for(let i=0;i<pad;i++)rows.push(row(0));
 const lp=new Float32Array(rows.length*V);rows.forEach((r,i)=>lp.set(r,i*V));return{lp,T:rows.length}}
describe('Qaida closed-set word check',()=>{
 const cands=['بَاب','كَتَبَ','نَاس','مَلِك'];
 it('maps letters to model tokens and ignores marks',()=>{expect(tokensOf('بَاب').map(i=>TOKENS[i]).join('')).toBe('باب')});
 it('CTC likelihood prefers the spoken sequence',()=>{const {lp,T}=lpFor('كتب');const a=ctcLogLik(lp,T,tokensOf('كتب')),b=ctcLogLik(lp,T,tokensOf('ناس'));expect(a).toBeGreaterThan(b+5);expect(Math.abs(a-bestPath(lp,T))).toBeLessThan(3)});
 it('confirms the expected word and only that word',()=>{for(let j=0;j<cands.length;j++){const {lp,T}=lpFor(cands[j]);for(let i=0;i<cands.length;i++)expect(gradeClosed(lp,T,cands,i).ok).toBe(i===j)}});
 it('does not confirm noise (flat probabilities)',()=>{const V=31,T=30,lp=new Float32Array(T*V).fill(Math.log(1/V));for(let i=0;i<cands.length;i++)expect(gradeClosed(lp,T,cands,i).ok).toBe(false)});
 it('words that spell the same count as the same word (no false tie-miss)',()=>{const c=['مَدّ','مُدّ','نَاس'];const {lp,T}=lpFor('مد');expect(gradeClosed(lp,T,c,0).ok).toBe(true);expect(gradeClosed(lp,T,c,1).ok).toBe(true);expect(gradeClosed(lp,T,c,2).ok).toBe(false)});
});
describe('Qaida live controller (follow-along)',()=>{
 it('moves the position one per spoken item and never past the row; never reports a grade in along mode',()=>{
  const pos=[],gr=[];let done=0;const L=createLive({mode:'along',n:6,onPos:n=>pos.push(n),onGrade:(i,v)=>gr.push([i,v]),onDone:()=>done++});
  const x=reading(6);for(let i=0;i<x.length;i+=1600)L.feed(x.subarray(i,i+1600));
  expect(pos[pos.length-1]).toBe(6);expect(Math.max(...pos)).toBe(6);expect(pos).toEqual([...pos].sort((a,b)=>a-b));expect(gr).toEqual([]);expect(done).toBe(1)});
 it('seven items spoken on a six slot row stay at six',()=>{const pos=[];const L=createLive({mode:'along',n:6,onPos:n=>pos.push(n)});const x=reading(7);for(let i=0;i<x.length;i+=1600)L.feed(x.subarray(i,i+1600));expect(Math.max(...pos)).toBe(6)});
 it('tap-to-reposition: the next spoken item belongs to the tapped slot',()=>{const pos=[];const L=createLive({mode:'along',n:10,onPos:n=>pos.push(n)});const x=reading(2);for(let i=0;i<x.length;i+=1600)L.feed(x.subarray(i,i+1600));expect(L.pos).toBe(2);L.jump(5);expect(L.pos).toBe(5);const y=reading(1,{lead:0.2});for(let i=0;i<y.length;i+=1600)L.feed(y.subarray(i,i+1600));expect(L.pos).toBe(6)});
});
