// Nearby mosques: pure logic (query, parse, dedupe, distance, cache, links). The UI lives in features.js.
export const MIRRORS=['https://overpass-api.de/api/interpreter','https://lz4.overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter','https://overpass.private.coffee/api/interpreter','https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
/** v3.7.6: one fixed search radius (metres); re-query when the user has moved this far. */
export const RAD=2000,MOVE=400,TTL=6*3600e3;
/** Great-circle (haversine) distance in metres. */
export function hav(a,b,c,d){const R=6371008.8,r=x=>x*Math.PI/180;const h=Math.sin(r(c-a)/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(r(d-b)/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(h)))}
export const buildQuery=(lat,lng,rad)=>{const a=`(around:${Math.round(rad)},${(+lat).toFixed(5)},${(+lng).toFixed(5)})`;return `[out:json][timeout:12];(nw["amenity"="place_of_worship"]["religion"="muslim"]${a};nw["building"="mosque"]${a};nw["amenity"="place_of_worship"][!"religion"]["name"~"mosque|masjid|masjed|jama|jami|مسجد|جامع",i]${a};);out center tags qt;`};
const nameKey=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[\u064B-\u065F\u0670\u0300-\u036f]/g,'').replace(/\b(masjid|mosque|jamia|jama|jami|masjed|masjid-e|e|al|the)\b|[^\p{L}\p{N}]+/gu,'');
/** OSM elements -> [{id,name,lat,lng,named}] (centre for ways/relations). */
export function parse(els){const out=[];for(const e of els||[]){const lat=e.lat??e.center?.lat,lng=e.lon??e.center?.lon;if(!(Number.isFinite(lat)&&Number.isFinite(lng)))continue;const t=e.tags||{};const name=t.name||t['name:en']||t['name:ur']||t['name:ar']||t['alt_name']||'';
  out.push({id:(e.type||'n')+e.id,name:name.trim(),lat,lng,named:!!name.trim(),alt:{en:t['name:en']||'',ur:t['name:ur']||'',ar:t['name:ar']||''}})}return out}
/** Remove duplicates: the same OSM object, the same name within 60 m, or an unnamed object within 30 m of any other (node inside its own building way). Named entries win. */
export function dedupe(list){const seen=new Set,res=[];const sorted=[...list].sort((a,b)=>(b.named-a.named));
 for(const m of sorted){if(seen.has(m.id))continue;seen.add(m.id);const k=nameKey(m.name);
  const dup=res.some(o=>{const d=hav(o.lat,o.lng,m.lat,m.lng);if(m.named&&o.named)return k&&k===nameKey(o.name)?d<60:d<8;return d<30});if(!dup)res.push(m)}
 return res}
/** Add distance, keep within radius (+0 tolerance), nearest first. */
export function rank(list,lat,lng,rad){return list.map(m=>({...m,d:hav(lat,lng,m.lat,m.lng)})).filter(m=>m.d<=rad).sort((a,b)=>a.d-b.d)}
export const fmtDist=d=>d<1000?Math.round(d/10)*10+' m':(d/1000).toFixed(d<10000?1:0)+' km';
export const gmapsDir=(lat,lng)=>`https://www.google.com/maps/dir/?api=1&destination=${(+lat).toFixed(6)},${(+lng).toFixed(6)}`;
const isIOS=ua=>/iPhone|iPad|iPod/i.test(ua)||(/Macintosh/i.test(ua)&&/Mobile|Safari/i.test(ua)&&typeof navigator!=='undefined'&&navigator.maxTouchPoints>1);
export const appleDir=(lat,lng,name)=>`https://maps.apple.com/?daddr=${(+lat).toFixed(6)},${(+lng).toFixed(6)}&q=${encodeURIComponent(name||'Mosque')}`;
/** Directions links: on iOS Apple Maps first (Google as the alternative); elsewhere Google Maps only. */
export function dirLinks(lat,lng,name,ua=''){const g={k:'g',href:gmapsDir(lat,lng)};if(isIOS(ua))return [{k:'a',href:appleDir(lat,lng,name)},g];return [g]}
/** Race all mirrors in parallel (first good answer wins, the rest are aborted); per-request timeout; a second round only if every mirror failed. Returns {els,mirror}. */
export async function overpass(q,{fetchFn=fetch,mirrors=MIRRORS,timeout=12000,rounds=2,wait=ms=>new Promise(r=>setTimeout(r,ms))}={}){let err;
 for(let r=0;r<rounds;r++){const acs=mirrors.map(()=>new AbortController());
  const one=async(u,i)=>{const ac=acs[i];const tm=setTimeout(()=>ac.abort(),timeout);
   try{const res=await fetchFn(u,{method:'POST',body:'data='+encodeURIComponent(q),headers:{'Content-Type':'application/x-www-form-urlencoded'},signal:ac.signal});if(!res.ok)throw new Error('http '+res.status);const d=await res.json();if(!d||!Array.isArray(d.elements))throw new Error('bad json');if(d.remark&&/runtime error|timed out/i.test(d.remark)&&!d.elements.length)throw new Error('remark');return {els:d.elements,mirror:u,i}}finally{clearTimeout(tm)}};
  try{const w=await Promise.any(mirrors.map(one));acs.forEach((ac,i)=>{if(i!==w.i)ac.abort()});return {els:w.els,mirror:w.mirror}}catch(e){err=e.errors?.[0]||e}
  if(r<rounds-1)await wait(700*(r+1))}
 throw err||new Error('overpass unavailable')}
/** Cache: entries {lat,lng,rad,t,els}; usable when centred within 400 m and radius >= requested. */
const CK='mosqCache2';
export function cacheGet(lat,lng,rad,store=localStorage){try{const a=JSON.parse(store.getItem(CK)||'[]');return a.filter(e=>e.rad>=rad&&hav(e.lat,e.lng,lat,lng)<400).sort((x,y)=>y.t-x.t)[0]||null}catch{return null}}
export function cachePut(lat,lng,rad,els,store=localStorage){try{let a=JSON.parse(store.getItem(CK)||'[]').filter(e=>!(e.rad<=rad&&hav(e.lat,e.lng,lat,lng)<400));a.unshift({lat,lng,rad,t:Date.now(),els:els.map(e=>({type:e.type,id:e.id,lat:e.lat,lon:e.lon,center:e.center,tags:e.tags&&{name:e.tags.name,'name:en':e.tags['name:en'],'name:ur':e.tags['name:ur'],'name:ar':e.tags['name:ar']}}))});a=a.slice(0,6);
  while(a.length){try{store.setItem(CK,JSON.stringify(a));return}catch{a.pop()}}}catch{}}
/** Instant cached result for this place (any age), or null. */
export function cached(lat,lng,rad,store=localStorage){const c=cacheGet(lat,lng,rad,store);return c?{list:rank(dedupe(parse(c.els)),lat,lng,rad),fromCache:true,age:Date.now()-c.t,raw:c.els.length}:null}
/** Full pipeline. Returns {list,fromCache,age}. Throws {code:'offline'|'error'}. */
export async function find(lat,lng,rad,{online=navigator.onLine,store,fetchFn,mirrors,timeout,rounds,wait}={}){
 const fin=(els,fromCache,t)=>({list:rank(dedupe(parse(els)),lat,lng,rad),fromCache,age:t?Date.now()-t:0,raw:els.length});
 if(online!==false){try{const {els}=await overpass(buildQuery(lat,lng,rad),{fetchFn,mirrors,timeout,rounds,wait});cachePut(lat,lng,rad,els,store||localStorage);return fin(els,false,0)}catch{}}
 const c=cacheGet(lat,lng,rad,store||localStorage);if(c)return fin(c.els,true,c.t);
 const e=new Error(online===false?'offline':'error');e.code=online===false?'offline':'error';throw e}
