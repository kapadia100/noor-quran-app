// Central microphone manager. Every feature that records goes through here, so no stream can outlive its feature:
// the mic is released when the feature stops, and for ALL features on navigation (hashchange/popstate),
// when the app goes to the background (visibilitychange hidden) and on pagehide. Start again re-acquires.
const owners=new Map();// owner -> {streams:Set, ctxs:Set, onRevoke}
let installed=false;
const kill=o=>{for(const s of o.streams){try{s.getTracks().forEach(t=>t.stop())}catch{/* ignore */}}o.streams.clear();
 for(const c of o.ctxs){try{if(c.state!=='closed')c.close().catch(()=>{})}catch{/* ignore */}}o.ctxs.clear()};
function install(){if(installed||typeof window==='undefined')return;installed=true;
 const all=why=>releaseAll(why);
 addEventListener('hashchange',()=>all('nav'));addEventListener('popstate',()=>all('nav'));addEventListener('pagehide',()=>all('hide'));
 document.addEventListener('visibilitychange',()=>{if(document.hidden)all('hide')})}
/** Start a claim for owner. onRevoke(why) is called when the manager force-releases it (navigation / background). */
export function claim(owner,onRevoke){install();const prev=owners.get(owner);if(prev){prev.alive=false;kill(prev)}
 const o={streams:new Set(),ctxs:new Set(),onRevoke,alive:true};owners.set(owner,o);return o}
/** Attach an AudioContext to the claim (closed on release). */
export function addCtx(o,ac){if(!o.alive){try{ac.close().catch(()=>{})}catch{/* ignore */}return false}o.ctxs.add(ac);return true}
/** getUserMedia through the manager. Returns null if the claim was released while the permission prompt was open (the stream is stopped at once). */
export async function getMic(o,audio){const s=await navigator.mediaDevices.getUserMedia({audio});
 if(!o.alive){s.getTracks().forEach(t=>t.stop());return null}o.streams.add(s);return s}
/** Release one owner's claim (normal stop). */
export function release(owner){const o=owners.get(owner);if(!o)return;o.alive=false;kill(o);owners.delete(owner)}
/** Release everything; tells each feature so its UI shows stopped. */
export function releaseAll(why='nav'){for(const [k,o] of [...owners]){o.alive=false;kill(o);owners.delete(k);try{o.onRevoke?.(why)}catch{/* ignore */}}}
/** Live tracks still open (tests / diagnostics). */
export const liveTracks=()=>[...owners.values()].reduce((n,o)=>n+[...o.streams].reduce((m,s)=>m+s.getTracks().filter(t=>t.readyState==='live').length,0),0);
if(typeof window!=='undefined')window.__mic={liveTracks,releaseAll,owners:()=>[...owners.keys()]};
