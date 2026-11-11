// Gapless recitation from per-ayah MP3 clips. The clips are fetched and joined, frame by frame, into one MP3 stream that
// plays through the app's normal <audio> element (so speed, lock-screen controls and background playback on iOS stay the
// same). Joining removes the stop-and-start between ayahs; each ayah's place in the stream is known exactly from its frames.
// Only near-silent padding at the very start/end of a clip is shortened, never below KEEP_HEAD/KEEP_TAIL, so the reciter's
// own breath between ayahs stays.
const BR1=[0,32,40,48,56,64,80,96,112,128,160,192,224,256,320],BR2=[0,8,16,24,32,40,48,56,64,80,96,112,128,144,160];
const SR={3:[44100,48000,32000],2:[22050,24000,16000],0:[11025,12000,8000]};
/** One MPEG audio layer III frame header at o, or null. */
export function frameAt(b,o){if(o+4>b.length||b[o]!==0xFF||(b[o+1]&0xE0)!==0xE0)return null;
 const ver=(b[o+1]>>3)&3,layer=(b[o+1]>>1)&3,bi=b[o+2]>>4,si=(b[o+2]>>2)&3,pad=(b[o+2]>>1)&1,mono=(b[o+3]>>6)===3;
 if(ver===1||layer!==1||bi===0||bi===15||si===3)return null;
 const kbps=(ver===3?BR1:BR2)[bi],sr=SR[ver][si],spf=ver===3?1152:576,len=Math.floor((ver===3?144:72)*kbps*1000/sr)+pad;
 return {ver,sr,spf,kbps,len,mono}}
const syncsafe=(b,o)=>(b[o]&127)<<21|(b[o+1]&127)<<14|(b[o+2]&127)<<7|(b[o+3]&127);
/** Parse a clip: audio frames only (ID3/APE tags and the Xing/Info/VBRI header frame dropped).
 *  → {frames:[[start,len]], sr, spf, kbps:Set, bytes} or null when it is not an MP3. */
export function parse(buf){const b=buf instanceof Uint8Array?buf:new Uint8Array(buf);let o=0;
 while(o+10<=b.length&&b[o]===0x49&&b[o+1]===0x44&&b[o+2]===0x33){o+=10+syncsafe(b,o+6)+((b[o+5]&16)?10:0)}
 // find first frame followed by a second valid one (skips stray bytes / leftovers)
 let first=-1;for(let k=o;k<Math.min(b.length-4,o+65536);k++){const f=frameAt(b,k);if(f&&frameAt(b,k+f.len)){first=k;break}}
 if(first<0)return null;const frames=[];let sr=0,spf=0,ch=null;const kb=new Set();o=first;
 while(o<b.length){const f=frameAt(b,o);if(!f||o+f.len>b.length)break;if(!sr){sr=f.sr;spf=f.spf;ch=f.mono}
  if(f.sr!==sr)break;
  if(!frames.length){const side=f.ver===3?(f.mono?17:32):(f.mono?9:17),t=o+4+side,tag=String.fromCharCode(b[t],b[t+1],b[t+2],b[t+3]),v=String.fromCharCode(b[o+36],b[o+37],b[o+38],b[o+39]);
   if(tag==='Xing'||tag==='Info'||v==='VBRI'){o+=f.len;continue}}
  frames.push([o,f.len]);kb.add(f.kbps);o+=f.len}
 if(!frames.length)return null;return {b,frames,sr,spf,mono:ch,kbps:kb,ms:frames.length*spf*1000/sr}}
/** Near-silent frames at the start (lead) or end (trail) of decoded PCM (Float32, one channel). */
const peak=(pcm,a,z)=>{let m=0;for(let i=Math.max(0,a);i<Math.min(pcm.length,z);i++){const v=pcm[i]<0?-pcm[i]:pcm[i];if(v>m)m=v}return m};
export const THR=0.0045;// about -47 dBFS: digital silence and encoder padding, well under a breath
export function leadFrames(pcm,spf,thr=THR){if(!pcm||!pcm.length)return 0;let f=0;while((f+1)*spf<=pcm.length&&peak(pcm,f*spf,(f+1)*spf)<thr)f++;return f}
export function trailFrames(pcm,spf,thr=THR){if(!pcm||!pcm.length)return 0;let f=0;const L=pcm.length;while(L-(f+1)*spf>=0&&peak(pcm,L-(f+1)*spf,L-f*spf)<thr)f++;return f}
export const KEEP_HEAD=120,KEEP_TAIL=260;// ms of silence always kept at the start / end of each clip
/** How many frames to cut at each end, keeping at least KEEP_* ms and one spare frame of silence. */
export function trimPlan(p,sil){if(!p||!sil)return {head:0,tail:0};const fm=p.spf*1000/p.sr;
 const cut=(n,keep)=>Math.max(0,n-Math.ceil(keep/fm)-1);let head=cut(sil.head,KEEP_HEAD),tail=cut(sil.tail,KEEP_TAIL);
 if(head+tail>=p.frames.length-2){head=0;tail=0}return {head,tail}}
// Layer III frames may borrow bytes from the frames before them (the bit reservoir). A clip's first kept frame must not
// reach back into another clip or into frames that were cut, so such frames are rewritten as silent frames
// (no audio data, same length), which they already are: they sit inside the kept silence at the start of a clip.
export function sideInfo(b,o,len){const ver=(b[o+1]>>3)&3,crc=!(b[o+1]&1),mono=(b[o+3]>>6)===3,si=o+4+(crc?2:0),sl=ver===3?(mono?17:32):(mono?9:17);
 const mdb=ver===3?(b[si]<<1|b[si+1]>>7):b[si];return {ver,mono,si,sl,mdb,payload:len-(si-o)-sl}}
/** Copy of the frame at [o,len] with all side information zeroed: an empty frame (decodes to silence, borrows nothing). */
export function silentCopy(b,o,len){const f=new Uint8Array(len);f.set(b.subarray(o,o+len));const i=sideInfo(b,o,len);f.fill(0,i.si-o,i.si-o+i.sl);return f}
/** Join parsed clips (in order) into one MP3. items: [{p, trim:{head,tail}, key}] → {bytes, marks:[{key,from,to}] ms, ms}. */
export function join(items){const parts=[];let total=0,ms=0;const marks=[];
 for(const it of items){const t=it.trim||{head:0,tail:0},p=it.p,fm=p.spf*1000/p.sr,from=ms;let avail=0;
  for(let k=t.head;k<p.frames.length-t.tail;k++){const [s,l]=p.frames[k];let chunk=p.b.subarray(s,s+l);
   if(avail<512){const i=sideInfo(p.b,s,l);if(i.mdb>avail)chunk=silentCopy(p.b,s,l);avail+=Math.max(0,i.payload)}
   parts.push(chunk);total+=l;ms+=fm}
  marks.push({key:it.key,from:Math.round(from),to:Math.round(ms)})}
 const out=new Uint8Array(total);let o=0;for(const c of parts){out.set(c,o);o+=c.length}
 return {bytes:out,marks,ms}}
/** Clips can only be joined when they share sample rate and channel layout. */
export const compatible=(a,b)=>a&&b&&a.sr===b.sr&&a.spf===b.spf&&a.mono===b.mono;
