// Fetches per-ayah clips and joins them into one continuous MP3 (see stitch.js), for reciters with no timed surah file
// and for the Ruqyah list (ayat from many surahs). Clips come from a host that allows the page to read them.
import {parse,join,leadFrames,trailFrames,trimPlan,compatible} from './stitch.js';
const EA={
 'ar.alafasy':'Alafasy_128kbps','ar.husary':'Husary_128kbps','ar.husarymujawwad':'Husary_128kbps_Mujawwad',
 'ar.abdurrahmaansudais':'Abdurrahmaan_As-Sudais_192kbps','ar.shaatree':'Abu_Bakr_Ash-Shaatree_128kbps','ar.hanirifai':'Hani_Rifai_192kbps',
 'ar.saoodshuraym':'Saood_ash-Shuraym_128kbps','ar.abdulsamad':'AbdulSamad_64kbps_QuranExplorer.Com','ar.abdulbasitmurattal':'Abdul_Basit_Murattal_192kbps',
 'ar.minshawi':'Minshawy_Murattal_128kbps','ar.minshawimujawwad':'Minshawy_Mujawwad_192kbps','ar.hudhaify':'Hudhaify_128kbps',
 'ar.ahmedajamy':'Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net','ar.mahermuaiqly':'MaherAlMuaiqly128kbps','ar.muhammadayyoub':'Muhammad_Ayyoub_128kbps',
 'ar.muhammadjibreel':'Muhammad_Jibreel_128kbps','ar.abdullahbasfar':'Abdullah_Basfar_192kbps','ar.parhizgar':'Parhizgar_48kbps',
 'ar.aymanswoaid':'Ayman_Sowaid_64kbps','ar.ibrahimakhbar':'Ibrahim_Akhdar_32kbps'};
const base=r=>String(r||'').replace(/-\d+$/,'');
export const has=r=>!!EA[base(r)];
const p3=n=>String(n).padStart(3,'0');
export const clipUrl=(r,s,a)=>`https://everyayah.com/data/${EA[base(r)]}/${p3(s)}${p3(a)}.mp3`;
/** Clip URLs of one ayah: the reciter's own Bismillah (1:1) before ayah 1 of every surah except 1 and 9, unless noBas. */
export const ayahUrls=(r,s,a,noBas=false)=>a===1&&s!==1&&s!==9&&!noBas?[clipUrl(r,1,1),clipUrl(r,s,a)]:[clipUrl(r,s,a)];
// ---- fetch pool + clip cache (parsed frames + trim plan) ----
let active=0;const waiting=[];const MAXN=6;
const slot=()=>active<MAXN?(active++,Promise.resolve()):new Promise(r=>waiting.push(r));
const done=()=>{active--;const n=waiting.shift();if(n){active++;n()}};
const cache=new Map();let bytes=0;const LIMIT=40e6;
function remember(k,v){cache.set(k,v);v.then(x=>{bytes+=x.size;while(bytes>LIMIT&&cache.size>1){const [k0,v0]=cache.entries().next().value;cache.delete(k0);v0.then(y=>{bytes-=y.size}).catch(()=>{})}}).catch(()=>cache.delete(k))}
let ctxs={};
async function pcm(p,from,to){const AC=globalThis.OfflineAudioContext||globalThis.webkitOfflineAudioContext;if(!AC)return null;
 const j=join([{p:{...p,frames:p.frames.slice(from,to)},key:0}]);if(!j.bytes.length)return null;
 const ctx=ctxs[p.sr]||(ctxs[p.sr]=new AC(1,1,p.sr));
 const ab=await new Promise((res,rej)=>{try{const r=ctx.decodeAudioData(j.bytes.buffer.slice(0),res,rej);if(r&&r.then)r.then(res,rej)}catch(e){rej(e)}});
 return ab.getChannelData(0)}
/** How much near-silent padding the clip has at each end (frames), from its first and last ~2 s only. */
async function silence(p){const fm=p.spf*1000/p.sr,w=Math.min(p.frames.length,Math.ceil(2000/fm));
 try{const h=await pcm(p,0,w);const t=await pcm(p,Math.max(0,p.frames.length-w-2),p.frames.length);return {head:leadFrames(h,p.spf),tail:trailFrames(t,p.spf)}}catch{return null}}
export let fetcher=(u)=>fetch(u);
export const setFetcher=f=>{fetcher=f};
export function clip(url,{trim=true}={}){if(cache.has(url))return cache.get(url);
 const v=(async()=>{await slot();let buf;try{const r=await fetcher(url);if(!r.ok)throw new Error('clip '+r.status);buf=await r.arrayBuffer()}finally{done()}
  const p=parse(buf);if(!p)throw new Error('not mp3');const sil=trim?await silence(p):null;return {p,trim:trimPlan(p,sil),size:buf.byteLength}})();
 remember(url,v);return v}
/** Build one joined chunk. list: [{key, urls:[...]}] in play order. Stops early (never mixes formats) at the first clip
 *  that cannot be joined. → {url (blob:), marks:[{key,from,to}] ms, ms, keys, size, cbr, partial (only the first ayah's leading clip)} */
export async function build(list){const got=await Promise.all(list.map(it=>Promise.all(it.urls.map(u=>clip(u)))));
 const items=[],keys=[];let ref=null,partial=false;
 outer:for(let k=0;k<list.length;k++){const parts=got[k];ref=ref||parts[0].p;
  for(let n=0;n<parts.length;n++)if(!compatible(ref,parts[n].p)){
   // first ayah's own clips differ (e.g. the Bismillah clip is stereo, the ayah mono): play the Bismillah alone; the ayah starts the next chunk
   if(k===0&&n>0){parts.slice(0,n).forEach((c,m)=>items.push({p:c.p,trim:c.trim,key:list[k].key,part:m}));keys.push(list[k].key);partial=true}
   break outer}
  parts.forEach((c,n)=>items.push({p:c.p,trim:c.trim,key:list[k].key,part:n}));keys.push(list[k].key)}
 if(!items.length)throw new Error('empty');
 const j=join(items);const marks=[];for(const m of j.marks){const l=marks.at(-1);if(l&&l.key===m.key)l.to=m.to;else marks.push({...m})}
 const rates=new Set(items.flatMap(x=>[...x.p.kbps]));// one bitrate: the browser can seek inside the chunk exactly
 const blob=new Blob([j.bytes],{type:'audio/mpeg'});return {url:URL.createObjectURL(blob),marks,ms:j.ms,keys,size:j.bytes.length,cbr:rates.size===1,partial}}
export const release=c=>{try{if(c?.url)URL.revokeObjectURL(c.url)}catch{/* ignore */}};
/** Chunk sizes: a short first one so playback starts fast, then longer ones built while the previous plays. */
export const SIZES=[4,12,40];
export const sizeAt=k=>SIZES[Math.min(k,SIZES.length-1)];
