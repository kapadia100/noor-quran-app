// Evens out the recorded word clips before they play: trims the silence at both ends, brings every clip to the same loudness and keeps peaks under a ceiling
// (the source clips range about 10 dB in loudness, start up to 0.4 s late and one in seven clips clips at the peak). Pure functions, no browser APIs except in polishBlob().
export const TARGET_DB=-14,CEIL_DB=-1.5,LEAD_S=0.04,TAIL_S=0.12;
const lin=d=>10**(d/20),db=x=>20*Math.log10(Math.max(x,1e-9));
/** Mono Float32Array at `sr` -> polished Float32Array, or null when the clip is unusable (silent/too short): the caller then plays the original. */
export function polish(x,sr){
 const n=x.length,fl=Math.max(1,Math.round(sr*0.01)),m=Math.floor(n/fl);if(m<4)return null;
 const e=new Float64Array(m);for(let i=0;i<m;i++){let s=0;for(let j=i*fl;j<(i+1)*fl;j++)s+=x[j]*x[j];e[i]=db(Math.sqrt(s/fl))}
 const so=[...e].sort((a,b)=>a-b),noise=so[Math.floor(m*0.1)],top=so[Math.floor(m*0.95)],thr=Math.min(Math.max(noise+10,top-30),top-12); // never above the loud part (clips with no pauses)
 if(top<-60)return null;
 let a=-1,z=-1;for(let i=0;i<m;i++)if(e[i]>thr){if(a<0)a=i;z=i}
 if(a<0)return null;
 const s0=Math.max(0,a*fl-Math.round(sr*LEAD_S)),s1=Math.min(n,(z+1)*fl+Math.round(sr*TAIL_S));
 const y=Float32Array.from(x.subarray(s0,s1));
 let en=0,cnt=0;for(let i=a;i<=z;i++){if(e[i]>thr){en+=Math.pow(10,e[i]/10);cnt++}}
 const arms=10*Math.log10(en/Math.max(1,cnt)),g=lin(Math.max(-12,Math.min(9,TARGET_DB-arms)));
 const ceil=lin(CEIL_DB),k=0.6*ceil;
 for(let i=0;i<y.length;i++){let v=y[i]*g;const av=Math.abs(v);if(av>k)v=Math.sign(v)*(k+(ceil-k)*Math.tanh((av-k)/(ceil-k)));y[i]=v}
 const fi=Math.min(Math.round(sr*0.005),y.length>>1),fo=Math.min(Math.round(sr*0.04),y.length>>1);
 for(let i=0;i<fi;i++)y[i]*=i/fi;for(let i=0;i<fo;i++)y[y.length-1-i]*=i/fo;
 return y}
/** 16-bit mono WAV bytes. */
export function wavBytes(y,sr){
 const d=new DataView(new ArrayBuffer(44+y.length*2)),w=(o,s)=>{for(let i=0;i<s.length;i++)d.setUint8(o+i,s.charCodeAt(i))};
 w(0,'RIFF');d.setUint32(4,36+y.length*2,true);w(8,'WAVE');w(12,'fmt ');d.setUint32(16,16,true);d.setUint16(20,1,true);d.setUint16(22,1,true);d.setUint32(24,sr,true);d.setUint32(28,sr*2,true);d.setUint16(32,2,true);d.setUint16(34,16,true);w(36,'data');d.setUint32(40,y.length*2,true);
 for(let i=0;i<y.length;i++)d.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,y[i]))*32767),true);
 return new Uint8Array(d.buffer)}
/** Browser: decode a clip (offline context, so the phone's audio session is never touched), polish it, return a WAV Blob; null on any problem. */
export async function polishBlob(blob){
 try{const C=typeof OfflineAudioContext!=='undefined'?OfflineAudioContext:globalThis.webkitOfflineAudioContext||null;if(!C)return null;
  const buf=await blob.arrayBuffer(),sr=44100,ctx=new C(1,1,sr),ab=await new Promise((res,rej)=>{const p=ctx.decodeAudioData(buf,res,rej);p?.then?.(res,rej)});
  const ch=ab.numberOfChannels,n=ab.length,x=new Float32Array(n);for(let c=0;c<ch;c++){const d=ab.getChannelData(c);for(let i=0;i<n;i++)x[i]+=d[i]/ch}
  const y=polish(x,ab.sampleRate);return y?new Blob([wavBytes(y,ab.sampleRate)],{type:'audio/wav'}):null}
 catch{return null}}
