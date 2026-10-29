const C='qsafar-v46'; // bump on every release
const EDS=['ar','en.sahih','ur.jalandhry','ur.kanzuliman'];
const SHELL0=['./fonts/fraunces-la.woff2','./fonts/fraunces-lx.woff2','./fonts/dmsans-la.woff2','./fonts/dmsans-lx.woff2','./fonts/amiriquran-ar.woff2','./fonts/amiriquran-la.woff2','./fonts/amiri-ar.woff2','./fonts/schehera-ar.woff2','./fonts/nastaliq-ar.woff2','./','./index.html','./manifest.webmanifest','./icon.svg','./icon-192.png','./offline/surahs.json','./offline/ed.json','./offline/translations.json','./offline/x/duas.json','./offline/x/hisn.json','./offline/x/names.json','./offline/x/dict.json','./offline/x/dict-idx.json','./offline/x/pages.json','./offline/x/muslim-map.json','./icon-512.png','./vad/silero16k.bin','./img/st-ayah.webp','./img/st-dua.webp','./img/st-names.webp','./img/st-tasbeeh.webp','./img/st-ramadan.webp'];
const SHELL=[...SHELL0,...EDS.flatMap(e=>Array.from({length:114},(_,i)=>`./offline/s/${e}/${i+1}.json`))];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)))});
self.addEventListener('message',e=>{if(e.data==='skip')self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x.startsWith('qsafar-')).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
 if(/\/models\/qs-asr-base\//.test(u.pathname))return; // speech model: cached by the recognizer itself
 if(/\/models\/rt\//.test(u.pathname)){e.respondWith(caches.open('qs-asr-rt').then(async c=>(await c.match(r))||fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res})));return} // recognizer runtime: cache-first
 if(/\/vad\/[^/]+\.bin$/.test(u.pathname)){e.respondWith(caches.open(C).then(async c=>(await c.match(r))||fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res})));return} // voice-activity weights: cache-first
 if(/\/qaida\/[^/]+\.mp3$/.test(u.pathname)&&!r.headers.has('range')){e.respondWith(caches.open(C).then(async c=>(await c.match(r))||fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res})));return} // Qaida letter clips: cache-first (fetched whole, so they work offline)
 if(/\.(mp3|ogg|wav)$/.test(u.pathname)||r.headers.has('range'))return; // media streams bypass cache
 // App shell (HTML/JS/CSS/manifest): network-first so a new release is picked up immediately; cache only as offline fallback.
 const shell=u.origin===location.origin&&(r.mode==='navigate'||/\.(html|js|css|webmanifest)$/.test(u.pathname)||u.pathname.endsWith('/'))&&!/\/sw\.js$/.test(u.pathname);
 if(shell){e.respondWith(caches.open(C).then(c=>fetch(r,{cache:'no-store'}).then(res=>{if(res.ok)c.put(r.mode==='navigate'?'./index.html':r,res.clone());return res}).catch(()=>c.match(r.mode==='navigate'?'./index.html':r).then(h=>h||c.match('./index.html')))));return}
 const api=/alquran\.cloud|jsdelivr|quran\.com|overpass/.test(u.host);
 // API: network-first (fresh), cache fallback. App assets/fonts/bundled data: cache-first + background refresh.
 if(api){e.respondWith(caches.open(C).then(c=>fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res}).catch(()=>c.match(r).then(h=>h||Response.error()))));return}
 e.respondWith(caches.open(C).then(async c=>{const hit=await c.match(r);const net=fetch(r).then(res=>{if(res.ok||res.type==='opaque')c.put(r,res.clone());return res}).catch(()=>hit||Response.error());return hit||net}))});
