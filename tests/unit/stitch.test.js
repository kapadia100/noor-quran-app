import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import {parse,join,frameAt,sideInfo,silentCopy,leadFrames,trailFrames,trimPlan,compatible,KEEP_HEAD,KEEP_TAIL} from '../../src/stitch.js';
import {has,clipUrl,ayahUrls,sizeAt} from '../../src/stitch-net.js';
const rd=f=>new Uint8Array(fs.readFileSync(new URL('../fixtures/mp3/'+f,import.meta.url)));
describe('joined ayah clips (gapless recitation)',()=>{
 it('reads MP3 frames, dropping the ID3 tag and the Xing/Info header frame',()=>{const p=parse(rd('a.mp3'));
  expect(p.sr).toBe(22050);expect(p.spf).toBe(576);expect(p.mono).toBe(true);
  // 2.3 s of audio in 26.1 ms frames, plus encoder padding
  expect(p.ms).toBeGreaterThan(2280);expect(p.ms).toBeLessThan(2400);
  const [s]=p.frames[0];expect(frameAt(p.b,s)).not.toBe(null);
  const t=s+4+9;expect(String.fromCharCode(p.b[t],p.b[t+1],p.b[t+2],p.b[t+3])).not.toMatch(/Xing|Info/);
  expect(parse(new Uint8Array(100))).toBe(null)});
 it('joins clips back to back; each ayah\'s place is the sum of the frames before it',()=>{const a=parse(rd('a.mp3')),b=parse(rd('b.mp3'));
  const j=join([{p:a,key:1},{p:b,key:2},{p:a,key:3}]);
  const fm=576*1000/22050;
  expect(j.marks.map(m=>m.key)).toEqual([1,2,3]);expect(j.marks[0].from).toBe(0);expect(j.marks[1].from).toBe(Math.round(a.frames.length*fm));
  expect(j.marks[2].from).toBe(Math.round((a.frames.length+b.frames.length)*fm));expect(j.marks[1].to).toBe(j.marks[2].from);
  const bytes=[a,b,a].reduce((n,p)=>n+p.frames.reduce((x,f)=>x+f[1],0),0);expect(j.bytes.length).toBe(bytes);
  // the joined stream is frames only: every frame header is valid, end to end
  let o=0,n=0;while(o<j.bytes.length){const f=frameAt(j.bytes,o);expect(f).not.toBe(null);o+=f.len;n++}expect(n).toBe(a.frames.length*2+b.frames.length)});
 it('never joins clips of different formats',()=>{const a=parse(rd('a.mp3')),c=parse(rd('c44.mp3'));expect(compatible(a,a)).toBe(true);expect(compatible(a,c)).toBe(false)});
 it('a frame that would borrow bytes from another clip becomes an empty (silent) frame of the same length',()=>{const a=parse(rd('a.mp3'));const [s,l]=a.frames[3];
  const z=silentCopy(a.b,s,l);expect(z.length).toBe(l);const i=sideInfo(z,0,l);expect(i.mdb).toBe(0);
  for(let k=i.si;k<i.si+i.sl;k++)expect(z[k]).toBe(0);expect(Array.from(z.subarray(0,4))).toEqual(Array.from(a.b.subarray(s,s+4)));
  expect(a.b[s+i.si+i.sl]).toBe(z[i.si+i.sl])});
 it('finds near-silent padding at each end and keeps a natural pause',()=>{const spf=576,f=new Float32Array(spf*100);for(let k=30*spf;k<80*spf;k++)f[k]=0.2*Math.sin(k/5);
  expect(leadFrames(f,spf)).toBe(30);expect(trailFrames(f,spf)).toBe(20);
  // breath-level sound is not silence
  const g=new Float32Array(spf*10).fill(0.01);expect(leadFrames(g,spf)).toBe(0);
  const p={spf:576,sr:22050,frames:Array(100)};const fm=576*1000/22050;const t=trimPlan(p,{head:30,tail:20});
  expect((30-t.head)*fm).toBeGreaterThanOrEqual(KEEP_HEAD);expect((20-t.tail)*fm).toBeGreaterThanOrEqual(KEEP_TAIL);expect(t.head).toBeGreaterThan(0);
  expect(trimPlan(p,{head:2,tail:3})).toEqual({head:0,tail:0});expect(trimPlan(p,null)).toEqual({head:0,tail:0})});
 it('knows each reciter\'s clip folder and puts the reciter\'s own Bismillah before ayah 1 (not 1 and 9)',()=>{
  for(const r of ['ar.hudhaify','ar.mahermuaiqly','ar.muhammadjibreel','ar.parhizgar','ar.aymanswoaid','ar.husarymujawwad','ar.alafasy','ar.alafasy-2'])expect(has(r)).toBe(true);
  expect(has('ar.unknown')).toBe(false);
  expect(clipUrl('ar.parhizgar',2,255)).toBe('https://everyayah.com/data/Parhizgar_48kbps/002255.mp3');
  expect(ayahUrls('ar.aymanswoaid',36,1)).toEqual(['https://everyayah.com/data/Ayman_Sowaid_64kbps/001001.mp3','https://everyayah.com/data/Ayman_Sowaid_64kbps/036001.mp3']);
  expect(ayahUrls('ar.aymanswoaid',36,1,true)).toHaveLength(1);expect(ayahUrls('ar.aymanswoaid',1,1)).toHaveLength(1);expect(ayahUrls('ar.aymanswoaid',9,1)).toHaveLength(1);expect(ayahUrls('ar.aymanswoaid',36,2)).toHaveLength(1);
  expect([0,1,2,3,9].map(sizeAt)).toEqual([4,12,40,40,40])});
});
