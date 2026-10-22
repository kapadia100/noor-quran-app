const C='qsafar-v7';
const EDS=['ar','en.sahih','ur.jalandhry'];
const SHELL0=['./','./index.html','./manifest.webmanifest','./icon.svg','./icon-192.png','./offline/surahs.json','./offline/ed.json','./offline/translations.json','./offline/x/duas.json','./offline/x/hisn.json','./offline/x/names.json','./offline/x/pages.json','./icon-512.png','./img/st-ayah.webp','./img/st-dua.webp','./img/st-names.webp','./img/st-tasbeeh.webp','./img/st-ramadan.webp'];
const SHELL=[...SHELL0,...EDS.flatMap(e=>Array.from({length:114},(_,i)=>`./offline/s/${e}/${i+1}.json`))];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
 if(/\.(mp3|ogg|wav)$/.test(u.pathname)||r.headers.has('range'))return; // media streams bypass cache
 if(r.mode==='navigate'){e.respondWith(fetch(r).catch(()=>caches.match('./index.html')));return}
 const api=/alquran\.cloud|jsdelivr|quran\.com|overpass/.test(u.host);
 // API: network-first (fresh), cache fallback. App assets/fonts/bundled data: cache-first + background refresh.
 if(api){e.respondWith(caches.open(C).then(c=>fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res}).catch(()=>c.match(r).then(h=>h||Response.error()))));return}
 e.respondWith(caches.open(C).then(async c=>{const hit=await c.match(r);const net=fetch(r).then(res=>{if(res.ok||res.type==='opaque')c.put(r,res.clone());return res}).catch(()=>hit||Response.error());return hit||net}))});
