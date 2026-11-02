// Background playback (v86). Recitation must keep playing when the app is in the background or the phone is locked.
// iOS 16.4+/17 Safari exposes navigator.audioSession: once any AudioContext or the mic has been used (tap tones, recite
// tutor, Qaida live check) the page's session can fall to 'ambient'/'play-and-record', which iOS silences on lock or app
// switch. We put it back to 'playback' whenever an app <audio> element starts, and use 'play-and-record' only while the
// mic is held. Nothing here changes what is played or when.
const AS=()=>{try{return typeof navigator!=='undefined'?navigator.audioSession:null}catch{return null}};
let micHeld=0;
export function setType(t){const s=AS();if(!s)return;try{if(s.type!==t)s.type=t}catch{/* unsupported */}}
/** Called before any app audio element plays. */
export const forPlayback=()=>{if(!micHeld)setType('playback')};
/** Mic manager hooks. */
export function micOn(){micHeld++;setType('play-and-record')}
export function micOff(n=1){micHeld=Math.max(0,micHeld-n);if(!micHeld)setType('playback')}
export const state=()=>({type:AS()?.type??null,micHeld});
let done=false;
/** Wrap HTMLMediaElement.play once so every app player (reader, Ruqyah, Qaida, hadith) gets the playback session. */
export function install(g=globalThis){if(done||!g.HTMLMediaElement)return;done=true;const P=g.HTMLMediaElement.prototype,orig=P.play;
 P.play=function(...a){forPlayback();return orig.apply(this,a)}}
/** A silent WAV of ms milliseconds (keeps the audio session alive across a background gap instead of a timer). */
export function silence(ms){const rate=8000,n=Math.max(1,Math.round(rate*ms/1000)),b=new ArrayBuffer(44+n),v=new DataView(b);
 const w=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};
 w(0,'RIFF');v.setUint32(4,36+n,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);
 v.setUint32(24,rate,true);v.setUint32(28,rate,true);v.setUint16(32,1,true);v.setUint16(34,8,true);w(36,'data');v.setUint32(40,n,true);
 for(let i=0;i<n;i++)v.setUint8(44+i,128);return b}
if(typeof window!=='undefined'){install();window.__bg=state}
