// Pace follower for Qaida read-along: turns the microphone level into "one spoken burst = one item".
// It does NOT recognise what was said (the speech model cannot recognise isolated letters/syllables: measured), so everything it
// drives is labelled "follow-along". Pure, streaming, 16 kHz mono Float32 in; events out. Shared with the offline evaluation.
export const PACE={
 frame:160,            // 10 ms at 16 kHz
 onFrames:4,           // speech must persist 40 ms before an item is advanced (live: highlight appears this fast)
 hangFrames:15,        // 150 ms of silence closes a burst (a pause between items)
 minBurst:0.09,        // a burst shorter than this is a click/tap/cough and the advance is taken back
 onDb:9,offDb:6,       // dB above the noise floor to start / keep going
 absDb:-52,            // never trigger below this level (dBFS)
 floorWin:400,         // noise floor = low percentile of the last 4 s
 floorPct:0.15,
 warm:40,            // first 400 ms only measure the room (the UI says "get ready")
 valley:0              // >0: dB dip inside a burst that starts a new item (off by default; see docs)
};
export class Pace{
 constructor(cfg={}){this.c={...PACE,...cfg};this.buf=new Float32Array(0);this.e=[];this.t=0;this.nf=-70;this.state=0;this.run=0;this.quiet=0;this.start=0;this.n=0;this.count=0;this.cnt=0;this.lastDb=-90;this.hist=[]}
 /** Push samples; returns events [{type:'on'|'revoke'|'end', t, i}] (t in stream seconds). */
 push(x){const c=this.c,ev=[];let a=x;if(this.buf.length){a=new Float32Array(this.buf.length+x.length);a.set(this.buf);a.set(x,this.buf.length)}
  let p=0;for(;p+c.frame<=a.length;p+=c.frame){let s=0;for(let k=0;k<c.frame;k++){const v=a[p+k];s+=v*v}
   const db=10*Math.log10(s/c.frame+1e-10);this.frame(db,ev)}
  this.buf=a.slice(p);return ev}
 floor(){const h=this.e;if(h.length<20)return Math.min(...h,-60);const s=Float32Array.from(h).sort();return s[Math.floor(s.length*this.c.floorPct)]}
 frame(db,ev){const c=this.c;this.lastDb=db;const tt=this.t*c.frame/16000;this.t++;
  this.e.push(db);if(this.e.length>c.floorWin)this.e.shift();if(this.t%10===1||this.t<30)this.nf=this.floor();
  if(this.t<=c.warm)return;
  const on=Math.max(this.nf+c.onDb,c.absDb),off=Math.max(this.nf+c.offDb,c.absDb-3);
  if(this.state===0){if(db>on){this.run++;if(this.run===1)this.s0=tt;if(this.run>=c.onFrames){this.state=1;this.quiet=0;this.start=this.s0;this.peak=db;this.cnt++;this.open=true;ev.push({type:'on',t:this.s0,at:tt,i:this.cnt-1})}}else this.run=0}
  else{if(db>this.peak)this.peak=db;
   if(db>=off){this.quiet=0;this.last=tt}else{this.quiet++;if(this.quiet>=c.hangFrames){const end=tt-this.quiet*c.frame/16000+c.frame/16000;this.state=0;this.run=0;const dur=end-this.start;
     if(dur<c.minBurst){this.cnt--;ev.push({type:'revoke',t:end,i:this.cnt})}else ev.push({type:'end',t:end,dur,i:this.cnt-1})}}}}
 /** Number of items currently counted (revoked bursts excluded). */
 get items(){return this.cnt}
}
