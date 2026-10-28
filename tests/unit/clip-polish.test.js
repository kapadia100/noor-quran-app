import {describe,it,expect} from 'vitest';
import {polish,wavBytes,TARGET_DB,CEIL_DB} from '../../src/clip-polish.js';
const SR=44100,tone=(sec,amp,f=300)=>Float32Array.from({length:Math.round(sec*SR)},(_,i)=>amp*Math.sin(2*Math.PI*f*i/SR)*(0.6+0.4*Math.sin(2*Math.PI*3*i/SR)));
const clip=(lead,body,tail,amp,noise=0.0005)=>{const n=a=>Float32Array.from({length:Math.round(a*SR)},()=>(Math.random()-0.5)*2*noise);const p=[n(lead),tone(body,amp),n(tail)];const o=new Float32Array(p.reduce((s,x)=>s+x.length,0));let k=0;for(const x of p){o.set(x,k);k+=x.length}return o};
const rmsDb=(y)=>{let s=0,c=0,m=0;for(const v of y)m=Math.max(m,Math.abs(v));for(const v of y)if(Math.abs(v)>0.1*m){s+=v*v;c++}return 10*Math.log10(s/Math.max(1,c))};
const peak=y=>{let m=0;for(const v of y)m=Math.max(m,Math.abs(v));return 20*Math.log10(m)};
describe('clip-polish',()=>{
 it('brings quiet and loud clips to about the same level',()=>{
  const q=polish(clip(0.3,0.6,0.3,0.15),SR),l=polish(clip(0.3,0.6,0.3,0.8),SR);
  expect(Math.abs(rmsDb(q)-rmsDb(l))).toBeLessThan(2.5);
 });
 it('keeps peaks under the ceiling even for a clipped input',()=>{
  const x=clip(0.1,0.5,0.1,3);for(let i=0;i<x.length;i++)x[i]=Math.max(-1,Math.min(1,x[i]));
  expect(peak(polish(x,SR))).toBeLessThanOrEqual(CEIL_DB+0.05);
 });
 it('trims long silence at both ends but leaves a short natural margin',()=>{
  const x=clip(0.5,0.4,0.9,0.4),y=polish(x,SR);
  expect(y.length/SR).toBeLessThan(0.4+0.04+0.12+0.05);expect(y.length/SR).toBeGreaterThan(0.4);
 });
 it('fades the edges so there is no click',()=>{const y=polish(clip(0.2,0.4,0.2,0.4),SR);expect(Math.abs(y[0])).toBeLessThan(1e-3);expect(Math.abs(y[y.length-1])).toBeLessThan(1e-3)});
 it('returns null for silence / too short input (the original clip plays instead)',()=>{expect(polish(new Float32Array(SR),SR)).toBeNull();expect(polish(new Float32Array(100),SR)).toBeNull()});
 it('handles a clip with no pauses at all',()=>{const y=polish(tone(1.5,0.3),SR);expect(y).not.toBeNull();expect(y.length/SR).toBeGreaterThan(1.3)});
 it('does not over-boost a very quiet clip (gain capped at +9 dB)',()=>{const x=clip(0.1,0.4,0.1,0.01,0.00002),y=polish(x,SR);expect(rmsDb(y)-rmsDb(x)).toBeLessThanOrEqual(9.2)});
 it('target level is the documented one',()=>{const y=polish(clip(0.1,0.5,0.1,0.2),SR);expect(Math.abs(rmsDb(y)-TARGET_DB)).toBeLessThan(3)});
 it('writes a valid 16-bit mono WAV',()=>{const y=Float32Array.from([0,0.5,-0.5,1]),w=wavBytes(y,SR),dv=new DataView(w.buffer);
  expect(String.fromCharCode(...w.slice(0,4))).toBe('RIFF');expect(String.fromCharCode(...w.slice(8,12))).toBe('WAVE');expect(dv.getUint16(22,true)).toBe(1);expect(dv.getUint32(24,true)).toBe(SR);expect(dv.getUint32(40,true)).toBe(8);expect(w.length).toBe(52);expect(dv.getInt16(46,true)).toBe(16384);expect(dv.getInt16(50,true)).toBe(32767)});
});
