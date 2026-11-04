const C='qsafar-v95'; // bump on every release
const EDS=['ar','en.sahih','ur.jalandhry','ur.kanzuliman'];
const SHELL0=['./fonts/fraunces-la.woff2','./fonts/fraunces-lx.woff2','./fonts/dmsans-la.woff2','./fonts/dmsans-lx.woff2','./fonts/amiriquran-ar.woff2','./fonts/amiriquran-la.woff2','./fonts/amiri-ar.woff2','./fonts/schehera-ar.woff2','./fonts/nastaliq-ar.woff2','./','./index.html','./offline/rukus.json','./manifest.webmanifest','./icon.svg','./icon-192.png','./offline/surahs.json','./offline/cities.json','./offline/ed.json','./offline/translations.json','./offline/x/duas.json','./offline/x/hisn.json','./offline/x/names.json','./offline/x/dict.json','./offline/x/dict-idx.json','./offline/x/pages.json','./offline/x/muslim-map.json','./icon-512.png','./icon-maskable-512.png','./favicon-32.png','./apple-touch-icon.png','./vad/silero16k.bin','./img/st-ayah.webp','./img/st-dua.webp','./img/st-names.webp','./img/st-tasbeeh.webp','./img/st-ramadan.webp'];
const SHELL=[...SHELL0,...EDS.flatMap(e=>Array.from({length:114},(_,i)=>`./offline/s/${e}/${i+1}.json`))];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)))});
self.addEventListener('message',e=>{if(e.data==='skip')self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x.startsWith('qsafar-')).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
 if(/\/models\/(qs-asr-base|qs-ctc)\//.test(u.pathname))return; // speech model (~19 MB): straight from the network; the tutor worker caches it itself (never a second copy here)
 if(/(^|\.)(huggingface\.co|hf\.co)$/.test(u.hostname))return; // remote audio (HF): let the browser handle range/redirects
 if(/\/models\/rt\//.test(u.pathname)){e.respondWith(caches.open('qs-asr-rt').then(async c=>(await c.match(r))||fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res})));return} // recognizer runtime: cache-first
 if(/\/vad\/[^/]+\.bin$/.test(u.pathname)){e.respondWith(caches.open(C).then(async c=>(await c.match(r))||fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res})));return} // voice-activity weights: cache-first
 if(/\/qaida\/[^/]+\.mp3$/.test(u.pathname)&&!r.headers.has('range')){e.respondWith(caches.open(C).then(async c=>(await c.match(r))||fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res})));return} // Qaida letter clips: cache-first (fetched whole, so they work offline)
 if(/\.(mp3|ogg|wav)$/.test(u.pathname)||r.headers.has('range'))return; // media streams bypass cache
 // App shell (HTML/JS/CSS/manifest): network-first so a new release is picked up immediately; cache only as offline fallback.
 const shell=u.origin===location.origin&&(r.mode==='navigate'||/\.(html|js|css|webmanifest)$/.test(u.pathname)||u.pathname.endsWith('/'))&&!/\/sw\.js$/.test(u.pathname);
 if(shell){e.respondWith(caches.open(C).then(c=>fetch(r,{cache:'no-store'}).then(res=>{if(res.ok)c.put(r.mode==='navigate'?'./index.html':r,res.clone());return res}).catch(()=>c.match(r.mode==='navigate'?'./index.html':r).then(h=>h||c.match('./index.html')))));return}
 if(/photon\.komoot|nominatim\.openstreetmap|overpass|maps\.mail\.ru/.test(u.host))return; // live mosque lookups: never served from the SW cache (the app keeps its own TTL cache)
 const api=/alquran\.cloud|jsdelivr|quran\.com|overpass/.test(u.host);
 // API: network-first (fresh), cache fallback. App assets/fonts/bundled data: cache-first + background refresh.
 if(api){e.respondWith(caches.open(C).then(c=>fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res}).catch(()=>c.match(r).then(h=>h||Response.error()))));return}
 e.respondWith(caches.open(C).then(async c=>{const hit=await c.match(r);const net=fetch(r).then(res=>{if(res.ok||res.type==='opaque')c.put(r,res.clone());return res}).catch(()=>hit||Response.error());return hit||net}))});
// ---- Local notifications: the app saves the plan in IndexedDB; we show whatever became due whenever this worker wakes ----
const NDB=()=>new Promise((res,rej)=>{const r=indexedDB.open('qs-notify',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
const nGet=async k=>{const d=await NDB();return new Promise((res,rej)=>{const q=d.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})};
const nSet=async(k,v)=>{const d=await NDB();return new Promise((res,rej)=>{const t=d.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=()=>res();t.onerror=()=>rej(t.error)})};
let nBusy=null,nLast=0;
async function catchUp(){const now=Date.now();nLast=now;const plans=(await nGet('plans'))||{},shown=(await nGet('shown'))||{};let ch=false;
 for(const [g,items] of Object.entries(plans))for(const x of items||[]){const grace=x.grace||30*6e4;if(x.at<=now&&now-x.at<grace&&!shown[x.id]){shown[x.id]=now;ch=true;
  await self.registration.showNotification(x.title,{body:x.body,tag:x.id,icon:'./icon-192.png',badge:'./favicon-32.png',lang:x.lang,dir:x.dir,timestamp:x.at,data:{url:x.url||'./',g,id:x.id}})}}
 for(const k in shown)if(now-shown[k]>3*864e5){delete shown[k];ch=true}
 if(ch)await nSet('shown',shown)}
const nCheck=()=>nBusy||(nBusy=catchUp().catch(()=>{}).finally(()=>{nBusy=null}));
self.addEventListener('periodicsync',e=>{if(e.tag==='qs-notify')e.waitUntil(nCheck())});
self.addEventListener('message',e=>{if(e.data&&e.data.type==='qs-check')e.waitUntil(nCheck())});
self.addEventListener('activate',e=>e.waitUntil(nCheck()));
self.addEventListener('fetch',e=>{if(Date.now()-nLast>6e4)e.waitUntil(nCheck())});
// Ready for a push server later: a push either carries a notification ({title,body,url}) or just wakes us ({type:'check'}).
self.addEventListener('push',e=>{let d;try{d=e.data?e.data.json():{}}catch{d={}}
 e.waitUntil(d.title?self.registration.showNotification(d.title,{body:d.body||'',tag:d.tag,icon:'./icon-192.png',badge:'./favicon-32.png',data:{url:d.url||'./'}}).then(nCheck):nCheck())});
self.addEventListener('notificationclick',e=>{e.notification.close();const url=new URL((e.notification.data&&e.notification.data.url)||'./',self.registration.scope).href;
 e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{const c=cs.find(c=>c.url.startsWith(self.registration.scope));if(c){c.focus();if(c.url!==url&&'navigate' in c)return c.navigate(url).catch(()=>{})}else return self.clients.openWindow(url)}))});
