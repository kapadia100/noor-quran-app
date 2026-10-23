// Voice gate for the Quran live tutor. Decides (a) whether the speech recogniser is allowed to run and (b) whether a decoded
// window contains enough speech to be trusted. Built on the neural voice detector (one probability per 32 ms frame).
//
// v3.3.1: the v3.3.0 gate used one hard threshold (p>=0.5, 3 of 5 frames). Real phone-mic recitation in a room (reverb, soft
// voice, long held vowels) often sits at p=0.2-0.5 for whole words; the gate then closed in the middle of a verse and the
// tutor froze. Now: a frame must still be a CLEAR speech frame (p>=on) to OPEN the gate, but once speech is running the gate
// is kept open through weaker frames (p>=weak) for a while (hysteresis), so flowing / blended / soft speech is not cut off.
// Noise and non-speech sounds still have to produce clear speech frames before anything is decoded or shown.
export const VG={on:0.3,weak:0.12,sustain:2.5,need:2,of:5,hold:4,minSpeech:0.15};
export class VoiceGate{
 constructor(cfg){this.c={...VG,...(globalThis.__vg||{}),...cfg};this.q=[];this.f=[];this.last=-9;this.first=-1}
 /** feed one 32 ms frame (time ft in seconds at the frame end, probability p). Returns true if it counts as voice. */
 frame(ft,p){const c=this.c;const open=ft-this.last<=c.sustain;const on=(p>=c.on||(open&&p>=c.weak))?1:0;
  this.f.push([ft,on]);this.q.push(on);if(this.q.length>c.of)this.q.shift();
  if(on&&this.q.reduce((a,b)=>a+b,0)>=c.need){this.last=ft;if(this.first<0)this.first=ft;return true}return false}
 /** seconds of detected speech in (t0,t1] */
 secs(t0,t1){let n=0;for(const [ft,on] of this.f)if(on&&ft>t0&&ft<=t1)n++;return n*512/16000}
 /** true while a decode is worthwhile: speech heard within the last `hold` seconds */
 active(t){return t-this.last<=this.c.hold}
 trim(t,keep=40){while(this.f.length&&this.f[0][0]<t-keep)this.f.shift()}}
