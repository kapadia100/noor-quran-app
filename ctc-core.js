// On-device Quran CTC front end: Kaldi-compatible 80-bin fbank (25ms/10ms, povey, 20Hz..7600Hz) + CTC greedy decode.
const SHIFT=160,LEN=400,NFFT=512,NB=80,EPS=1.1920929e-7;
const mel=f=>1127*Math.log(1+f/700);
const WIN=new Float32Array(LEN);for(let i=0;i<LEN;i++)WIN[i]=Math.pow(0.5-0.5*Math.cos(2*Math.PI*i/(LEN-1)),0.85);
const BANKS=(()=>{const bins=NFFT/2,width=16000/NFFT,lo=mel(20),hi=mel(7600),d=(hi-lo)/(NB+1),out=[];
 for(let b=0;b<NB;b++){const l=lo+b*d,c=lo+(b+1)*d,r=lo+(b+2)*d;let s=-1;const w=[];for(let i=0;i<bins;i++){const m=mel(width*i);if(m>l&&m<r){if(s<0)s=i;w.push(m<=c?(m-l)/(c-l):(r-m)/(r-c))}else if(s>=0)break}out.push({s,w:Float32Array.from(w)})}return out})();
const COS=new Float32Array(NFFT/2),SIN=new Float32Array(NFFT/2);for(let i=0;i<NFFT/2;i++){COS[i]=Math.cos(2*Math.PI*i/NFFT);SIN[i]=-Math.sin(2*Math.PI*i/NFFT)}
const REV=(()=>{const r=new Uint16Array(NFFT),b=Math.log2(NFFT);for(let i=0;i<NFFT;i++){let x=i,y=0;for(let k=0;k<b;k++){y=(y<<1)|(x&1);x>>=1}r[i]=y}return r})();
const re=new Float32Array(NFFT),im=new Float32Array(NFFT);
function fft(){for(let i=0;i<NFFT;i++){const j=REV[i];if(j>i){let t=re[i];re[i]=re[j];re[j]=t;t=im[i];im[i]=im[j];im[j]=t}}
 for(let size=2;size<=NFFT;size<<=1){const half=size>>1,step=NFFT/size;for(let s=0;s<NFFT;s+=size)for(let k=0;k<half;k++){const wr=COS[k*step],wi=SIN[k*step],a=s+k,b=a+half;const tr=re[b]*wr-im[b]*wi,ti=re[b]*wi+im[b]*wr;re[b]=re[a]-tr;im[b]=im[a]-ti;re[a]+=tr;im[a]+=ti}}}
export const numFrames=n=>Math.floor((n+SHIFT/2)/SHIFT);
/** wave: Float32Array 16 kHz in [-1,1]. Returns {data: Float32Array(T*80), T}. */
export function fbank(wave){const n=wave.length,T=numFrames(n),out=new Float32Array(T*NB),fr=new Float32Array(LEN);
 for(let t=0;t<T;t++){const st=t*SHIFT+SHIFT/2-LEN/2;let mean=0;
  for(let i=0;i<LEN;i++){let k=st+i;if(k<0)k=-k-1;if(k>=n)k=2*n-1-k;k=Math.min(Math.max(k,0),n-1);const v=wave[k];fr[i]=v;mean+=v}mean/=LEN;
  for(let i=0;i<LEN;i++)fr[i]-=mean;
  for(let i=LEN-1;i>0;i--)fr[i]=(fr[i]-0.97*fr[i-1])*WIN[i];fr[0]=fr[0]*(1-0.97)*WIN[0];
  re.fill(0);im.fill(0);for(let i=0;i<LEN;i++)re[i]=fr[i];fft();
  for(let b=0;b<NB;b++){const {s,w}=BANKS[b];let acc=0;for(let i=0;i<w.length;i++){const q=s+i;acc+=(re[q]*re[q]+im[q]*im[q])*w[i]}out[t*NB+b]=Math.log(Math.max(acc,EPS))}}
 return {data:out,T}}
export const TOKENS=['','ء','ا','ب','ت','ث','ج','ح','خ','د','ذ','ر','ز','س','ش','ص','ض','ط','ظ','ع','غ','ف','ق','ك','ل','م','ن','ه','و','ي',' '];
/** Greedy CTC over logp (Float32Array [T*V]). Returns chars [{c,t,p}] (t = frame index, 40 ms each) and joined text. */
export function greedy(logp,T,V=31){const chars=[];let prev=0;for(let t=0;t<T;t++){let b=0,bv=-1e30;for(let v=0;v<V;v++){const x=logp[t*V+v];if(x>bv){bv=x;b=v}}
 if(b!==0&&b!==prev)chars.push({c:TOKENS[b],t,p:bv});prev=b}
 return {text:chars.map(x=>x.c).join('').replace(/\s+/g,' ').trim(),chars}}
/** Group greedy chars into heard words with times in seconds (relative to the decoded audio). */
export function heardWords(chars){const out=[];let cur=null;for(const ch of chars){if(ch.c===' '){if(cur)out.push(cur);cur=null}else{if(!cur)cur={s:'',t0:ch.t*0.04,t1:0};cur.s+=ch.c;cur.t1=ch.t*0.04+0.04}}if(cur)out.push(cur);return out}
