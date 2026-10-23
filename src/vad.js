// Shared voice-activity plumbing: loads the 16 kHz voice-model weights once (cached by the service worker) and offers a streaming wrapper.
// Used by the Qaida follow-along (via qaida-pace.js) and by the Quran live tutor (to gate the speech recogniser).
import {Silero,parseWeights,SILERO_FILE} from './silero.js';
import {VadGain,setVadWeights,vadReady,vadWeights} from './qaida-pace.js';
const base=()=>import.meta.env?.BASE_URL||'/';
let vadP=null;
export function ensureVad(){if(vadReady())return Promise.resolve();if(vadP)return vadP;
 vadP=fetch(base()+SILERO_FILE).then(r=>{if(!r.ok)throw new Error('vad '+r.status);return r.arrayBuffer()}).then(b=>{setVadWeights(parseWeights(b))}).catch(e=>{vadP=null;throw e});return vadP}
export {vadReady};
/** Streaming speech probability: push(Float32Array 16 kHz) -> [p per 32 ms frame]. Own level normaliser, own model state. */
export class VadStream{
 constructor(weights){this.v=new Silero(weights);this.g=new VadGain();this.buf=new Float32Array(0);this.n=0}
 push(x){let a=x;if(this.buf.length){a=new Float32Array(this.buf.length+x.length);a.set(this.buf);a.set(x,this.buf.length)}
  const out=[];let p=0;for(;p+512<=a.length;p+=512){out.push(this.v.step(this.g.process(a.subarray(p,p+512))));this.n++}this.buf=a.slice(p);return out}
 reset(){this.v.reset();this.g=new VadGain();this.buf=new Float32Array(0);this.n=0}}
/** A fresh streaming detector on the shared weights (null until the weights are loaded). */
export const newVadStream=()=>vadReady()?new VadStream(vadWeights()):null;
