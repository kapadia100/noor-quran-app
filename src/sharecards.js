// t181: Quran + hadith share cards in the 99 Names style. Every image holds whole ayahs / a whole hadith part; long content becomes a numbered set.
import {brand} from './qrbrand.js';
import {wrapText} from './lib.js';
export const W=1080,H=1350;const PADX=150,TOP=150,FOOT=300,MAXH=H-TOP-FOOT,AF='"Amiri Quran", Amiri, serif',UF='"Noto Nastaliq Urdu", serif',EF='"DM Sans", Inter, sans-serif';
const rtlOf=t=>/[\u0600-\u06ff]/.test(String(t).slice(0,60));
export async function fonts(){try{await Promise.all([document.fonts.load(`48px ${AF}`),document.fonts.load(`32px ${UF}`),document.fonts.load('600 40px Fraunces'),document.fonts.load('32px "DM Sans"')])}catch{/* offline */}}
const mctx=()=>{const c=document.createElement('canvas').getContext('2d');return c};
// layout one block (ar + tr) at a scale k (1 = biggest)
function lay(g,b,k){const fa=Math.round(58*k),ft=Math.round((b.trRtl?34:36)*k),w=W-PADX*2;g.font=`${fa}px ${AF}`;const la=b.ar?wrapText(b.ar,w,x=>g.measureText(x).width):[];
 g.font=`${ft}px ${b.trRtl?UF:EF}`;const lt=b.tr?wrapText(b.tr,w,x=>g.measureText(x).width):[];const lha=fa*1.85,lht=ft*(b.trRtl?2.05:1.5);
 return {fa,ft,la,lt,lha,lht,h:la.length*lha+(lt.length?(la.length?30:0)+lt.length*lht:0)+(b.ref?70:0)}}
const GAP=60;
/** Split blocks into pages. Never splits a block across pages unless one block alone cannot fit (then: Arabic page(s), then translation page(s), split on sentence/word boundaries). */
export function paginate(blocks){const g=mctx();const out=[];let cur=[];const K=[1,.9,.8,.72,.64,.56,.5];
 const fitK=bs=>{for(const k of K){const ls=bs.map(b=>lay(g,b,k));const h=ls.reduce((s,l)=>s+l.h,0)+GAP*(bs.length-1);if(h<=MAXH)return {k,ls}}return null};
 const flush=()=>{if(cur.length){out.push({blocks:cur});cur=[]}};
 for(const b0 of blocks){const b={...b0,trRtl:rtlOf(b0.tr||'')};
  if(!fitK([b])){flush();for(const part of splitBlock(g,b))out.push({blocks:[part]});continue}
  // prefer readable size: add to current page only if it still fits at k>=.72
  const f=fitK([...cur,b]);if(cur.length&&(!f||f.k<.72)){flush()}cur.push(b)}
 flush();return out.map(p=>({...p,...fitK(p.blocks)}))}
function splitBlock(g,b){const parts=[];const k=.5;const chunk=(txt,key)=>{const sents=txt.split(/(?<=[.!?؟۔।])\s+/);let acc='';const res=[];for(const s of sents){const t=acc?acc+' '+s:s;if(lay(g,{...b,ar:key==='ar'?t:'',tr:key==='tr'?t:'',ref:''},k).h>MAXH-80&&acc){res.push(acc);acc=s}else acc=t}if(acc)res.push(acc);
  // a single sentence still too long: split by words
  return res.flatMap(r=>{if(lay(g,{...b,ar:key==='ar'?r:'',tr:key==='tr'?r:'',ref:''},k).h<=MAXH-80)return [r];const w=r.split(/\s+/),o=[];let a='';for(const x of w){const t=a?a+' '+x:x;if(lay(g,{...b,ar:key==='ar'?t:'',tr:key==='tr'?t:'',ref:''},k).h>MAXH-80&&a){o.push(a);a=x}else a=t}if(a)o.push(a);return o})};
 if(b.ar){const fa=fitAlone({...b,tr:'',ref:''});if(fa)parts.push({...b,tr:'',ref:''});else chunk(b.ar,'ar').forEach(t=>parts.push({...b,ar:t,tr:'',ref:''}))}
 if(b.tr){const ft=fitAlone({...b,ar:'',ref:''});if(ft)parts.push({...b,ar:'',ref:''});else chunk(b.tr,'tr').forEach(t=>parts.push({...b,ar:'',tr:t,ref:''}))}
 parts[parts.length-1].ref=b.ref;return parts;
 function fitAlone(x){return lay(g,x,.5).h<=MAXH}}
// ---------- background (matches 99 Names card) ----------
export function bg(g,hue=160){const gr=g.createLinearGradient(0,0,W,H);gr.addColorStop(0,`hsl(${hue} 46% 26%)`);gr.addColorStop(1,`hsl(${(hue+38)%360} 52% 11%)`);g.fillStyle=gr;g.fillRect(0,0,W,H);
 const rg=g.createRadialGradient(W/2,H*.42,40,W/2,H*.42,W*.8);rg.addColorStop(0,`hsla(${hue},70%,70%,.22)`);rg.addColorStop(1,'transparent');g.fillStyle=rg;g.fillRect(0,0,W,H);
 g.save();g.strokeStyle='rgba(243,217,160,.08)';g.lineWidth=2;const s=90;for(let y=-s;y<H+s;y+=s)for(let x=(y/s%2?s/2:0)-s;x<W+s;x+=s){g.save();g.translate(x,y);for(const r of[0,Math.PI/4]){g.save();g.rotate(r);g.strokeRect(-22,-22,44,44);g.restore()}g.restore()}g.restore();
 // faint watermark
 g.save();g.translate(W/2,H*.47);g.rotate(-Math.PI/9);g.textAlign='center';g.textBaseline='middle';g.fillStyle='rgba(255,246,221,.035)';g.font='600 150px Fraunces, Georgia, serif';g.fillText('Quran Safar',0,0);g.restore();
 // ornate golden border
 const gold=g.createLinearGradient(0,0,W,0);gold.addColorStop(0,'#C9A24E');gold.addColorStop(.5,'#F6E2A8');gold.addColorStop(1,'#B88A35');
 g.strokeStyle=gold;g.lineWidth=5;g.strokeRect(44,44,W-88,H-88);g.lineWidth=2;g.strokeRect(62,62,W-124,H-124);
 for(const [cx,cy] of [[53,53],[W-53,53],[53,H-53],[W-53,H-53]]){g.save();g.translate(cx,cy);g.rotate(Math.PI/4);g.fillStyle='#E9CF8C';g.fillRect(-14,-14,28,28);g.fillStyle=`hsl(${hue} 46% 20%)`;g.fillRect(-7,-7,14,14);g.restore()}
 g.fillStyle='#E9CF8C';for(const [x,y] of [[W/2,53],[W/2,H-53],[53,H/2],[W-53,H/2]]){g.beginPath();g.arc(x,y,7,0,7);g.fill()}
 return gold}
function drawPage(p,i,n,hue){const cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');bg(g,hue);g.textAlign='center';
 if(n>1){g.direction='ltr';g.font='600 30px "DM Sans", sans-serif';g.fillStyle='#F3D9A0';g.fillText(`${i+1}/${n}`,W-120,118)}
 const tot=p.ls.reduce((s,l)=>s+l.h,0)+GAP*(p.ls.length-1);let y=TOP+Math.max(0,(MAXH-tot)/2);
 p.blocks.forEach((b,j)=>{const l=p.ls[j];if(j){g.fillStyle='rgba(233,207,140,.55)';g.fillRect(W/2-40,y+GAP/2-1,80,2);y+=GAP}
  g.direction='rtl';g.font=`${l.fa}px ${AF}`;g.fillStyle='#FFF6DD';g.shadowColor='rgba(0,0,0,.3)';g.shadowBlur=10;l.la.forEach(t=>{y+=l.lha;g.fillText(t,W/2,y-l.lha*.3)});g.shadowBlur=0;
  if(l.lt.length){if(l.la.length)y+=30;g.direction=b.trRtl?'rtl':'ltr';g.font=`${l.ft}px ${b.trRtl?UF:EF}`;g.fillStyle='rgba(255,246,221,.9)';l.lt.forEach(t=>{y+=l.lht;g.fillText(t,W/2,y-l.lht*.28)})}
  if(b.ref){g.direction='ltr';g.font='italic 600 34px Fraunces, Georgia, serif';g.fillStyle='#F3D9A0';y+=70;g.fillText(b.ref,W/2,y-14)}});
 brand(g,W,H,{cell:4,bottom:90});return cv}
/** blocks: [{ar,tr,ref}] → array of canvases (each whole ayah / whole part). */
export async function render(blocks,{hue=160}={}){await fonts();const pages=paginate(blocks);return pages.map((p,i)=>drawPage(p,i,pages.length,hue))}
export const toFiles=async(cvs,base)=>Promise.all(cvs.map(async(c,i)=>new File([await new Promise(r=>c.toBlob(r,'image/png'))],`${base}${cvs.length>1?`-${i+1}of${cvs.length}`:''}.png`,{type:'image/png'})));
