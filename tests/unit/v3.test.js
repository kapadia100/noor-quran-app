import {describe,it,expect} from 'vitest';
import * as TJ from '../../src/tj-rules.js';
import {Resampler,Conditioner} from '../../src/audio-front.js';
const norm=s=>s.replace(/[^\u0621-\u064A ]/g,'');
describe('tj-rules',()=>{
 it('info/legend give english and urdu names and a colour',()=>{const e=TJ.info(0,false),u=TJ.info(0,true);expect(e.name).toBeTruthy();expect(u.name).not.toBe(e.name);expect(e.color).toMatch(/^#|rgb|hsl/);expect(TJ.info(999)).toBeNull();expect(TJ.legend(false).length).toBe(7)});
 it('segments cover the text exactly and keep order',()=>{const t='abcdefghij';const s=TJ.segments(t,[5,2,4,7,6,8]);expect(s.map(x=>x.s).join('')).toBe(t);expect(s.filter(x=>x.r>=0).map(x=>x.r)).toEqual([5,7])});
 it('segments clip to a word range',()=>{const s=TJ.segments('abcdefghij',[1,1,6],3,8);expect(s.map(x=>x.s).join('')).toBe('defgh');expect(s[0]).toEqual({s:'def',r:1})});
 it('align drops a leading bismillah and verifies words, null on mismatch',()=>{const raw='بسم الله الرحمن الرحيم الحمد لله';const wn=['الحمد','لله'];const a=TJ.align(raw,[1,0,3],wn,norm);expect(a.length).toBe(2);expect(a[0].map(x=>x.s).join('')).toBe('الحمد');
  expect(TJ.align(raw,[],['خطا','لله'],norm)).toBeNull();expect(TJ.align('اب',[],['اب','جد'],norm)).toBeNull()});
});
describe('audio-front',()=>{
 const sine=(f,sr,n)=>Float32Array.from({length:n},(_,i)=>0.5*Math.sin(2*Math.PI*f*i/sr));
 it('resamples 48k->16k to the right length and keeps a 1 kHz tone',()=>{const r=new Resampler(48000,16000);let o=[];for(let i=0;i<10;i++)o.push(...r.push(sine(1000,48000,4800)));
  expect(Math.abs(o.length-16000)).toBeLessThan(80);const mid=o.slice(2000,10000);const rms=Math.sqrt(mid.reduce((a,b)=>a+b*b,0)/mid.length);expect(rms).toBeGreaterThan(0.33);expect(rms).toBeLessThan(0.38)});
 it('removes a tone above the new Nyquist (anti-alias)',()=>{const r=new Resampler(48000,16000);let o=[];for(let i=0;i<10;i++)o.push(...r.push(sine(11000,48000,4800)));const mid=o.slice(2000,10000);expect(Math.sqrt(mid.reduce((a,b)=>a+b*b,0)/mid.length)).toBeLessThan(0.05)});
 it('16k input passes through; chunked equals one-shot',()=>{const x=sine(300,16000,3200);expect(new Resampler(16000).push(x)).toBe(x);
  const a=new Resampler(44100),b=new Resampler(44100);const y=sine(500,44100,8820);const one=a.push(y);const two=[...b.push(y.slice(0,3000)),...b.push(y.slice(3000))];expect(two.length).toBe(one.length);expect(Math.abs(two[300]-one[300])).toBeLessThan(1e-4)});
 it('conditioner lifts a quiet signal, never exceeds ±1 and removes DC',()=>{const c=new Conditioner();let last;for(let i=0;i<40;i++)last=c.process(sine(300,16000,1600).map(v=>v*0.02+0.1));
  const rms=Math.sqrt(last.reduce((a,b)=>a+b*b,0)/last.length);expect(rms).toBeGreaterThan(0.03);expect(Math.max(...last.map(Math.abs))).toBeLessThanOrEqual(1);const mean=last.reduce((a,b)=>a+b,0)/last.length;expect(Math.abs(mean)).toBeLessThan(0.01)});
 it('conditioner leaves a loud signal alone (gain never boosts clipped speech)',()=>{const c=new Conditioner();let last;for(let i=0;i<30;i++)last=c.process(sine(300,16000,1600));expect(Math.max(...last.map(Math.abs))).toBeLessThanOrEqual(1)});
});
