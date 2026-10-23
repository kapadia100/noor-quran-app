// Pace follower for Qaida read-along: turns the microphone into "one spoken burst = one item" - but only for SPEECH.
// v3.3: the old detector was energy-only (anything 9 dB above the room counted: a tap, a cough, a fan, TV, music, a car). Now every
// 32 ms frame first has to be classified as human speech by a neural voice-activity model (qaida-vad / silero.js, pure JS), and a burst
// only counts when it is speech-like end to end: enough confident speech frames, loud enough above the room, a plausible length for ONE
// spoken item (a letter / syllable / word), and no longer than a single item (continuous talking is not reading the next item).
// It still does NOT know WHAT was said (isolated letters cannot be recognised by the speech model: measured), so what it drives is
// labelled "follow-along". Pure, streaming, 16 kHz mono Float32 in; events out. Shared with the offline evaluation.
import {Silero} from './silero.js';
export const PACE={
 frame:512,            // 32 ms (one voice-model step)
 onP:0.5,offP:0.3,     // speech probability to start / keep a burst
 confirm:4,            // confident speech frames needed before an item is advanced (~130 ms: the highlight appears this fast)
 hang:5,               // 160 ms of non-speech closes a burst (the pause between items)
 minBurst:0.16,        // a burst shorter than this is a click/cough/word fragment and the advance is taken back
 maxBurst:1.6,         // longer than one item = continuous talking / noise: not reading the next item, the advance is taken back
 minSnr:8,             // dB the burst must stand above the room (far-away voices, TV in another room, whispers are ignored)
 floorWin:600,floorPct:0.2,
 warm:4,              // the first ~0.8 s only measure the room (the UI says "calibrating")
 avgP:0.65             // the burst's mean speech probability must reach this (music/noise that only flickers above the threshold does not)
};
/** Level normaliser for the VOICE MODEL input only (the SNR check still uses the raw level). The voice model is level-sensitive: a quiet phone mic
 * (speech at -45 dBFS) reads as "not speech". Fast attack, slow release, boost only (never attenuates), capped at +36 dB. */
export class VadGain{
 constructor(c={}){this.target=c.target??0.25;this.max=c.max??63;this.rel=c.rel??0.98;this.up=c.up??0.05;this.env=1e-4;this.g=1}
 process(fr){let pk=0;for(let i=0;i<fr.length;i++){const a=fr[i]<0?-fr[i]:fr[i];if(a>pk)pk=a}
  this.env=Math.max(pk,this.env*this.rel);let tg=this.target/(this.env+1e-6);tg=tg<1?1:tg>this.max?this.max:tg;
  if(tg<this.g)this.g=tg;else this.g+=(tg-this.g)*this.up;
  if(this.g<1.001)return fr;const o=new Float32Array(fr.length),g=this.g;for(let i=0;i<fr.length;i++){const v=fr[i]*g;o[i]=v>1?1:v<-1?-1:v}return o}}
let SHARED=null;
/** Give every detector the (already fetched) voice-model weights. */
export function setVadWeights(w){SHARED=w}
export const vadReady=()=>!!SHARED;
export const vadWeights=()=>SHARED;
export class Pace{
 constructor(cfg={}){this.c={...PACE,...cfg};const w=cfg.weights||SHARED;if(!w&&!cfg.probs)throw new Error('vad weights not loaded');this.vad=cfg.probs?null:new Silero(w);this.vg=new VadGain(cfg.gain||{});
  this.buf=new Float32Array(0);this.k=0;this.e=[];this.nf=-70;this.state=0;this.run=0;this.quiet=0;this.cnt=0;this.lastDb=-90;this.lastP=0;this.lock=false;this.sumP=0;this.nP=0;this.sumDb=0;this.frames=0}
 /** Push samples; returns events [{type:'on'|'revoke'|'end', t, i}] (t in stream seconds). */
 push(x){const c=this.c,ev=[];let a=x;if(this.buf.length){a=new Float32Array(this.buf.length+x.length);a.set(this.buf);a.set(x,this.buf.length)}
  let p=0;for(;p+c.frame<=a.length;p+=c.frame){const fr=a.subarray(p,p+c.frame);let s=0;for(let i=0;i<c.frame;i++)s+=fr[i]*fr[i];const db=c.dbs?(c.dbs[this.k]??-100):10*Math.log10(s/c.frame+1e-10);
   const pr=this.c.probs?(this.c.probs[this.k]??0):this.vad.step(this.c.noGain?fr:this.vg.process(fr));this.frame(pr,db,ev)}
  this.buf=a.slice(p);return ev}
 floor(){const h=this.e;if(h.length<10)return Math.min(...h,-60);const s=Float32Array.from(h).sort();return s[Math.floor(s.length*this.c.floorPct)]}
 frame(pr,db,ev){const c=this.c,dt=c.frame/16000,tt=this.k*dt;this.k++;this.lastDb=db;this.lastP=pr;
  // the noise floor only learns from frames that are NOT speech, so a long reading cannot raise it
  if(pr<c.offP){this.e.push(db);if(this.e.length>c.floorWin)this.e.shift();if(this.k%4===1||this.k<12)this.nf=this.floor()}
  if(this.k<=c.warm)return;
  if(this.state===0){
   if(this.lock){if(pr<c.offP){if(++this.quiet>=c.hang){this.lock=false;this.quiet=0}}else this.quiet=0;return}
   if(pr>=c.onP){if(this.run===0){this.s0=tt;this.sumP=0;this.sumDb=0}this.run++;this.sumP+=pr;this.sumDb+=db;
    if(this.run>=c.confirm){const snr=this.sumDb/this.run-this.nf;
     if(snr>=c.minSnr&&this.sumP/this.run>=c.avgP){this.state=1;this.quiet=0;this.last=tt;this.open=true;this.nP=this.run;this.sP=this.sumP;this.cnt++;ev.push({type:'on',t:this.s0,at:tt,i:this.cnt-1})}
     else{this.run=0;this.lock=true;this.quiet=0}}}
   else if(pr<c.offP)this.run=0}// a dip below the keep-threshold restarts the evidence (flicker is not speech)
  else{
   if(pr>=c.offP){this.quiet=0;this.last=tt;this.nP++;this.sP+=pr}else this.quiet++;
   if(tt-this.s0>c.maxBurst){this.state=0;this.run=0;this.cnt--;ev.push({type:'revoke',t:tt,i:this.cnt,why:'long'});this.lock=true;this.quiet=pr<c.offP?this.quiet:0;return}
   if(this.quiet>=c.hang){const end=this.last+dt;this.state=0;this.run=0;const dur=end-this.s0;
    if(dur<c.minBurst){this.cnt--;ev.push({type:'revoke',t:end,i:this.cnt,why:'short'})}else ev.push({type:'end',t:end,dur,i:this.cnt-1})}}}
 /** Level (dBFS) a burst must average to start an item right now. */
 get trigger(){return this.nf+this.c.minSnr}
 /** Number of items currently counted (revoked bursts excluded). */
 get items(){return this.cnt}
}
