const C='noor-v2',SHELL=['./','./index.html','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
 if(/\.(mp3|ogg)$/.test(u.pathname))return;
 if(r.mode==='navigate'){e.respondWith(fetch(r).catch(()=>caches.match('./index.html')));return}
 // stale-while-revalidate for app assets, API data and fonts
 e.respondWith(caches.open(C).then(async c=>{const hit=await c.match(r);const net=fetch(r).then(res=>{if(res.ok||res.type==='opaque')c.put(r,res.clone());return res}).catch(()=>hit);return hit||net}))});
