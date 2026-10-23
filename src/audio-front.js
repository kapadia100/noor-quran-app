// Microphone front end: streaming band-limited resampler (any rate -> 16 kHz), DC/rumble high-pass, and a gentle
// automatic gain so a quiet phone (or a far-away mic) still reaches the model at a sensible level.
// Pure JS, no DOM; used by the live tutor and by the offline evaluation harness.
const TAPS=24;// half-width in output-sample units of the windowed-sinc kernel
export class Resampler{
 constructor(from,to=16000){this.r=from/to;this.pos=0;this.buf=new Float32Array(0);this.base=0;this.fc=Math.min(1,1/this.r)*0.94;this.passthru=Math.abs(this.r-1)<1e-6}
 /** Push input samples, get the new 16 kHz output samples. */
 push(x){if(this.passthru)return x;
  const hw=Math.ceil(TAPS*Math.max(1,this.r));const nb=new Float32Array(this.buf.length+x.length);nb.set(this.buf);nb.set(x,this.buf.length);this.buf=nb;
  const out=[];const fc=this.fc,r=this.r;
  while(this.pos+hw<this.base+this.buf.length){const c=this.pos-this.base;const i0=Math.ceil(c-hw),i1=Math.floor(c+hw);let s=0,w=0;
   for(let i=i0;i<=i1;i++){if(i<0||i>=this.buf.length)continue;const d=(i-c)/r;const a=Math.PI*d*fc;const sinc=Math.abs(d)<1e-9?fc:Math.sin(a)/(Math.PI*d);const win=0.5+0.5*Math.cos(Math.PI*(i-c)/hw);const k=sinc*win;s+=this.buf[i]*k;w+=k}
   out.push(w?s/w:0);this.pos+=r}
  const drop=Math.max(0,Math.floor(this.pos-hw)-this.base);if(drop>0){this.buf=this.buf.slice(drop);this.base+=drop}
  return Float32Array.from(out)}}
/** One-pole high-pass (removes DC offset and handling rumble) + slow AGC toward a target RMS. State is kept across chunks. */
export class Conditioner{
 constructor(o={}){this.hp=o.hp??0.995;this.px=0;this.py=0;this.target=o.target??0.07;this.maxGain=o.maxGain??12;this.gain=1;this.env=0.003;this.agc=o.agc!==false}
 process(x){const o=new Float32Array(x.length);let px=this.px,py=this.py;
  for(let i=0;i<x.length;i++){const y=this.hp*(py+x[i]-px);px=x[i];py=y;o[i]=y}this.px=px;this.py=py;
  if(this.agc){let e=0;for(let i=0;i<o.length;i++)e+=o[i]*o[i];const rms=Math.sqrt(e/Math.max(1,o.length));
   // follow the level of actual speech, ignore silence: only raise the envelope when something is audible
   if(rms>this.env*0.7||rms>0.01)this.env+=(rms-this.env)*(rms>this.env?0.25:0.02);
   const want=Math.min(this.maxGain,Math.max(0.5,this.target/Math.max(this.env,1e-4)));this.gain+=(want-this.gain)*0.1;
   for(let i=0;i<o.length;i++){const v=o[i]*this.gain;o[i]=v>1?1:v<-1?-1:v}}
  return o}}
