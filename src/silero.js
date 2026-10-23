// Neural voice-activity detector (speech vs. everything else), pure JS, no runtime download: the 16 kHz weights (1.2 MB) are a plain
// float32 file. Architecture = Silero VAD v5 (MIT): STFT conv -> 4 conv blocks -> LSTM cell -> sigmoid; 512-sample hop (32 ms).
// Verified against the original ONNX model (max |diff| < 1e-6, see tests/unit/silero.test.js).
const LAYOUT=[['stft',[258,1,256]],['e0w',[128,129,3]],['e0b',[128]],['e1w',[64,128,3]],['e1b',[64]],['e2w',[64,64,3]],['e2b',[64]],['e3w',[128,64,3]],['e3b',[128]],
 ['wih',[512,128]],['whh',[512,128]],['bih',[512]],['bhh',[512]],['dw',[1,128,1]],['db',[1]]];
export const SILERO_FILE='vad/silero16k.bin';
export function parseWeights(buf){const f=buf instanceof Float32Array?buf:new Float32Array(buf);const W={};let o=0;for(const [k,s] of LAYOUT){const n=s.reduce((a,b)=>a*b,1);W[k]=f.subarray(o,o+n);o+=n}
 if(o!==f.length)throw new Error('vad weights size');return W}
const CHUNK=512,CTX=64;
export class Silero{
 constructor(weights){this.W=weights instanceof Float32Array||weights instanceof ArrayBuffer?parseWeights(weights):weights;this.reset();
  this.x=new Float32Array(CTX+CHUNK+CTX);this.sp=new Float32Array(258*4);this.mag=new Float32Array(129*4);this.a0=new Float32Array(128*4);this.a1=new Float32Array(64*2);this.a2=new Float32Array(64);this.a3=new Float32Array(128);this.g=new Float32Array(512)}
 reset(){this.h=new Float32Array(128);this.c=new Float32Array(128);this.ctx=new Float32Array(CTX);this.buf=new Float32Array(0)}
 /** Push samples (16 kHz mono, float). Returns speech probabilities, one per 512 samples. */
 push(x){let a=x;if(this.buf.length){a=new Float32Array(this.buf.length+x.length);a.set(this.buf);a.set(x,this.buf.length)}
  const out=[];let p=0;for(;p+CHUNK<=a.length;p+=CHUNK)out.push(this.step(a.subarray(p,p+CHUNK)));this.buf=a.slice(p);return out}
 step(chunk){const W=this.W,X=this.x;X.set(this.ctx,0);X.set(chunk,CTX);for(let i=0;i<CTX;i++)X[CTX+CHUNK+i]=X[CTX+CHUNK-2-i];// reflect-pad right
  this.ctx.set(chunk.subarray(CHUNK-CTX));
  const sp=this.sp,mag=this.mag,B=W.stft;
  for(let t=0;t<4;t++){const o=t*128;for(let k=0;k<258;k++){let s=0;const b=k*256;for(let i=0;i<256;i++)s+=B[b+i]*X[o+i];sp[k*4+t]=s}}
  for(let k=0;k<129;k++)for(let t=0;t<4;t++){const r=sp[k*4+t],im=sp[(k+129)*4+t];mag[k*4+t]=Math.sqrt(r*r+im*im)}
  const conv=(inp,Ci,Ti,w,b,Co,stride,out)=>{const To=Math.floor((Ti+2-3)/stride)+1;for(let o=0;o<Co;o++){const bo=b[o];for(let t=0;t<To;t++){let s=bo;for(let k=0;k<3;k++){const ti=t*stride+k-1;if(ti<0||ti>=Ti)continue;for(let c=0;c<Ci;c++)s+=w[(o*Ci+c)*3+k]*inp[c*Ti+ti]}out[o*To+t]=s>0?s:0}}return To};
  conv(mag,129,4,W.e0w,W.e0b,128,1,this.a0);conv(this.a0,128,4,W.e1w,W.e1b,64,2,this.a1);conv(this.a1,64,2,W.e2w,W.e2b,64,2,this.a2);conv(this.a2,64,1,W.e3w,W.e3b,128,1,this.a3);
  const v=this.a3,g=this.g,h=this.h,c=this.c;
  for(let r=0;r<512;r++){let s=W.bih[r]+W.bhh[r];const a=r*128;for(let i=0;i<128;i++)s+=W.wih[a+i]*v[i]+W.whh[a+i]*h[i];g[r]=s}
  const sg=z=>1/(1+Math.exp(-z));
  for(let i=0;i<128;i++){const ig=sg(g[i]),fg=sg(g[128+i]),gg=Math.tanh(g[256+i]),og=sg(g[384+i]);c[i]=fg*c[i]+ig*gg;h[i]=og*Math.tanh(c[i])}
  let s=W.db[0];for(let i=0;i<128;i++)s+=W.dw[i]*(h[i]>0?h[i]:0);return sg(s)}}
