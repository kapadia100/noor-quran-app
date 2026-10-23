import {describe,it,expect,beforeAll} from 'vitest';
import {Pace,VadGain} from '../../src/qaida-pace.js';
import {ctcLogLik,bestPath,gradeClosed,tokensOf} from '../../src/qaida-grade.js';
import {createLive} from '../../src/qaida-live.js';
import {TOKENS} from '../../public/ctc-core.js';
import {SR,TALK,loadVad,reading,noiseBed,rnd} from './audio-fixtures.js';
beforeAll(()=>loadVad());
const run=(x,cfg)=>{const p=new Pace(cfg),ev=[];for(let i=0;i<x.length;i+=1600)ev.push(...p.push(x.subarray(i,i+1600)));return{p,ev}};
const near=(got,n)=>{expect(got).toBeLessThanOrEqual(n);expect(got).toBeGreaterThanOrEqual(n-1)};
describe('Qaida pace follower (voice-model gated)',()=>{
 it('counts spoken items (real recorded letters), never more than were said',()=>{for(const n of [1,4,8,12]){const {p}=run(reading(n));near(p.items,n)}});
 it('counts slow and quick reading',()=>{near(run(reading(8,{gap:1.2})).p.items,8);near(run(reading(8,{gap:0.35})).p.items,8)});
 it('stays at zero for digital silence, dither, white/pink/brown noise and a fan-like hum',()=>{
  expect(run(new Float32Array(SR*8)).p.items).toBe(0);
  for(const a of [0.0005,0.003,0.01,0.05])expect(run(noiseBed(SR*10,a)).p.items,'noise '+a).toBe(0);
  const hum=new Float32Array(SR*10);for(let i=0;i<hum.length;i++)hum[i]=0.02*Math.sin(i*0.05)+0.01*Math.sin(i*0.11)+rnd()*0.004;expect(run(hum).p.items).toBe(0)});
 it('does not count pure tones, sirens or beeps (energy without speech structure)',()=>{
  for(const f of [220,440,1000]){const x=new Float32Array(SR*8);for(let k=0;k<6;k++){const s0=SR*(1+k*1.2);for(let i=0;i<0.4*SR;i++)x[s0+i]=0.2*Math.sin(2*Math.PI*f*i/SR)}expect(run(x).p.items,'tone '+f).toBe(0)}});
 it('does not count taps, clicks, knocks and handling thumps',()=>{
  const x=noiseBed(SR*10,0.0015);for(let k=0;k<12;k++){const s0=Math.round(SR*(0.8+k*0.75));for(let i=0;i<0.03*SR;i++)x[s0+i]+=0.5*Math.exp(-i/200)*Math.sin(i*0.7+k)}
  expect(run(x).p.items).toBe(0)});
 it('takes no part of the first 130 ms warm-up as an item',()=>{expect(run(reading(1,{lead:0.05})).p.items).toBeLessThanOrEqual(1)});
 it('unrelated speech (English / Urdu sentences) does not run away: a sentence is one long burst, not many items',()=>{
  const tot=TALK.reduce((s,k)=>s+run(reading(1,{clips:[k],gain:0.3})).p.items,0);expect(tot).toBeLessThanOrEqual(TALK.length*2)});
});
describe('Qaida pace on a quiet phone microphone and in a noisy room',()=>{
 it('follows speech 20 and 30 dB quieter than the lab clips (voice-model level normaliser)',()=>{for(const gain of [0.1,0.03]){const {p}=run(reading(8,{gain,noise:0.0001,lead:1.2}));near(p.items,8)}});
 it('follows speech over a steady room hum',()=>{for(const noise of [0.004,0.01]){const {p}=run(reading(8,{gain:0.3,noise,lead:1.2}));expect(p.items,'noise '+noise).toBeGreaterThanOrEqual(6);expect(p.items).toBeLessThanOrEqual(8)}});
 it('level normaliser only ever boosts, is capped and does not clip',()=>{const g=new VadGain();let m=0;for(let k=0;k<200;k++){const f=new Float32Array(512).fill(0.5);const o=g.process(f);m=Math.max(m,...o)}expect(m).toBeLessThanOrEqual(1);const q=new VadGain();for(let k=0;k<400;k++)q.process(new Float32Array(512).fill(0.001));expect(q.g).toBeLessThanOrEqual(63)});
 it('tells the user when the mic is too quiet or silent',()=>{
  const feedAll=(x,st)=>{const L=createLive({mode:'along',n:6,onStatus:k=>st.push(k)});for(let i=0;i<x.length;i+=1600)L.feed(x.subarray(i,i+1600))};
  const a=[];const x=new Float32Array(SR*9);for(let i=0;i<x.length;i++)x[i]=rnd()*0.004;feedAll(x,a);expect(a).toContain('quiet');
  const b=[];feedAll(new Float32Array(SR*9),b);expect(b).toContain('dead');
  const c=[];feedAll(reading(4),c);expect(c).not.toContain('quiet');expect(c).not.toContain('dead')});
 it('hold() mutes the feed so reference audio played by the app is never counted',()=>{const pos=[];const L=createLive({mode:'along',n:10,onPos:n=>pos.push(n)});const x=reading(5);L.hold(true);for(let i=0;i<x.length;i+=1600)L.feed(x.subarray(i,i+1600));expect(pos.length).toBe(0);expect(L.pos).toBe(0)});
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
 const drive=(L,x)=>{for(let i=0;i<x.length;i+=1600)L.feed(x.subarray(i,i+1600))};
 it('moves the position one per spoken item and never past the row; never reports a grade in along mode',()=>{
  const pos=[],gr=[];let done=0;const L=createLive({mode:'along',n:6,onPos:n=>pos.push(n),onGrade:(i,v)=>gr.push([i,v]),onDone:()=>done++});
  drive(L,reading(8));expect(Math.max(...pos)).toBe(6);expect(pos).toEqual([...pos].sort((a,b)=>a-b));expect(gr).toEqual([]);expect(done).toBe(1)});
 it('silence, noise and taps for a long time move nothing (regression: v3.2 advanced on any sound)',()=>{
  const pos=[];const L=createLive({mode:'along',n:10,onPos:n=>pos.push(n)});drive(L,noiseBed(SR*30,0.01));drive(L,new Float32Array(SR*10));expect(pos.length).toBe(0);expect(L.pos).toBe(0)});
 it('tap-to-reposition: the next spoken item belongs to the tapped slot',()=>{const pos=[];const L=createLive({mode:'along',n:10,onPos:n=>pos.push(n)});drive(L,reading(2));const p0=L.pos;expect(p0).toBeGreaterThanOrEqual(1);L.jump(5);expect(L.pos).toBe(5);drive(L,reading(1,{lead:0.5}));expect(L.pos).toBe(6)});
});
