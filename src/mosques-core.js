// Nearby mosques: pure logic (query, parse, dedupe, distance, cache, links). The UI lives in features.js.
export const MIRRORS=['https://overpass-api.de/api/interpreter','https://lz4.overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter','https://overpass.private.coffee/api/interpreter','https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
/** v3.7.6: one fixed search radius (metres); re-query when the user has moved this far. */
export const RAD=2000,MOVE=400,TTL=6*3600e3;
/** Great-circle (haversine) distance in metres. */
export function hav(a,b,c,d){const R=6371008.8,r=x=>x*Math.PI/180;const h=Math.sin(r(c-a)/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(r(d-b)/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(h)))}
export const buildQuery=(lat,lng,rad)=>{const a=`(around:${Math.round(rad)},${(+lat).toFixed(5)},${(+lng).toFixed(5)})`;return `[out:json][timeout:40];(nw["amenity"="place_of_worship"]["religion"="muslim"]${a};nw["building"="mosque"]${a};nw["amenity"="place_of_worship"][!"religion"]["name"~"mosque|masjid|masjed|jama|jami|مسجد|جامع",i]${a};);out center tags qt;`};
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
export async function overpass(q,{fetchFn=fetch,mirrors=MIRRORS,timeout=45000,rounds=1,wait=ms=>new Promise(r=>setTimeout(r,ms))}={}){let err;
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
/** v3.7.7 keyless CORS fallbacks (OSM-based search services). Results normalised to OSM-element shape so parse/dedupe/cache work unchanged. */
export const PHOTON='https://photon.komoot.io/api/',NOMI='https://nominatim.openstreetmap.org/search';
const bbox=(lat,lng,rad)=>{const dy=rad/111320,dx=rad/(111320*Math.cos(lat*Math.PI/180));return [lng-dx,lat-dy,lng+dx,lat+dy]};
const isMosque=(name,cat,type)=>type==='mosque'||/mosque|masjid|masjed|jam[ie]?a|مسجد|جامع/i.test(name||'')||(cat==='amenity'&&type==='place_of_worship'&&/mosque|masjid|مسجد/i.test(name||''));
const tmo=(ms,fetchFn,u,o={})=>{const ac=new AbortController;const t=setTimeout(()=>ac.abort(),ms);return fetchFn(u,{...o,signal:ac.signal}).then(r=>{if(!r.ok)throw new Error('http '+r.status);return r.json()}).finally(()=>clearTimeout(t))};
export async function photon(lat,lng,rad,{fetchFn=fetch,timeout=15000}={}){const [w,s,e,n]=bbox(lat,lng,rad);let ok=0;const out=[];
 await Promise.all(['masjid','mosque','مسجد','jamia'].map(q=>tmo(timeout,fetchFn,`${PHOTON}?q=${encodeURIComponent(q)}&lat=${lat}&lon=${lng}&limit=50&bbox=${w.toFixed(5)},${s.toFixed(5)},${e.toFixed(5)},${n.toFixed(5)}&osm_tag=amenity:place_of_worship`).then(d=>{ok++;for(const f of d.features||[]){const p=f.properties||{},c=f.geometry?.coordinates;if(!c||!isMosque(p.name,'amenity',p.osm_value)&&!/mosque|masjid|مسجد/i.test(q))continue;out.push({type:({N:'node',W:'way',R:'relation'})[p.osm_type]||'node',id:p.osm_id,lat:c[1],lon:c[0],tags:{name:p.name||''}})}}).catch(()=>{})));
 if(!ok)throw new Error('photon unavailable');return out}
export async function nominatim(lat,lng,rad,{fetchFn=fetch,timeout=15000,wait=ms=>new Promise(r=>setTimeout(r,ms))}={}){const [w,s,e,n]=bbox(lat,lng,rad);const vb=`${w.toFixed(5)},${n.toFixed(5)},${e.toFixed(5)},${s.toFixed(5)}`;let ok=0;const out=[];
 for(const q of ['q=%D9%85%D8%B3%D8%AC%D8%AF','amenity=mosque','q=masjid']){try{const d=await tmo(timeout,fetchFn,`${NOMI}?${q}&format=jsonv2&limit=50&bounded=1&viewbox=${vb}`);ok++;for(const x of d||[])if(x.category==='amenity'||x.type==='mosque')out.push({type:x.osm_type,id:x.osm_id,lat:+x.lat,lon:+x.lon,tags:{name:x.name||''}})}catch{}await wait(1100)}  // usage policy: ≤1 request/second
 if(!ok)throw new Error('nominatim unavailable');return out}
/** Last resort: bundled offline mosque list (Karachi area), loaded lazily. */
export const BUNDLE='offline/mosques-khi.json';
export async function bundled(lat,lng,rad,{fetchFn=fetch}={}){const d=await tmo(15000,fetchFn,BUNDLE);const out=[];for(const [la,ln,nm,id] of d.m||[])if(hav(lat,lng,la,ln)<=rad*1.2)out.push({type:'node',id:'b'+(id??out.length),lat:la,lon:ln,tags:{name:nm||''}});if(!out.length)throw new Error('outside bundle');return out}
/** Full pipeline (v3.7.7): the main OSM query is raced across mirrors while keyless search fallbacks run alongside;
 *  onPartial(result) gets the first usable list as soon as any source answers. Overpass is preferred (most complete) and merged
 *  with fallback hits; if it fails, fallbacks are used; then the bundled list; then the cache. Throws {code:'offline'|'error'} only if nothing works. */
export async function find(lat,lng,rad,{online=navigator.onLine,store,fetchFn=fetch,mirrors,timeout,rounds,wait,onPartial,fallbacks=true}={}){
 const fin=(els,fromCache,t,src)=>({list:rank(dedupe(parse(els)),lat,lng,rad),fromCache,age:t?Date.now()-t:0,raw:els.length,src});
 const st=store||localStorage;
 if(online!==false){let fb=[],fbOk=false,partial=false;
  const op=overpass(buildQuery(lat,lng,rad),{fetchFn,mirrors,timeout,rounds,wait}).then(r=>r.els);
  const extra=!fallbacks?[]:[photon(lat,lng,rad,{fetchFn}),nominatim(lat,lng,rad,{fetchFn,wait})].map(p=>p.then(els=>{fbOk=true;fb=fb.concat(els);const r=fin(fb,false,0,'fallback');if(onPartial&&r.list.length){partial=true;onPartial(r)}return els},()=>[]));
  try{const els=await op;const all=els.concat(fb);cachePut(lat,lng,rad,all,st);return fin(all,false,0,'osm')}catch{}
  await Promise.all(extra);if(fbOk&&fb.length){cachePut(lat,lng,rad,fb,st);return fin(fb,false,0,'fallback')}
  try{const b=await bundled(lat,lng,rad,{fetchFn});return {...fin(b.concat(fb),false,0,'bundle'),bundled:true}}catch{}
  if(fbOk&&!partial){const c0=cacheGet(lat,lng,rad,st);if(!c0)return fin([],false,0,'fallback')}}
 const c=cacheGet(lat,lng,rad,st);if(c)return fin(c.els,true,c.t,'cache');
 if(online===false){try{const b=await bundled(lat,lng,rad,{fetchFn});return {...fin(b,false,0,'bundle'),bundled:true}}catch{}}
 const e=new Error(online===false?'offline':'error');e.code=online===false?'offline':'error';throw e}
