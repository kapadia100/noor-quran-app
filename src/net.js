// Automatic offline mode. Phones have no airplane-mode API, so this watches
// navigator.onLine, the online/offline events, and failed remote fetches
// (iOS often leaves onLine true when the radio is down).
const REMOTE=/alquran\.cloud|jsdelivr\.net|islamic\.network|everyayah\.com|quran\.com|huggingface\.co|github\.io\/noor-quran-app\/models/;
let offline=false,fails=[],hooked=false;
export const isOffline=()=>offline;
export const isOnline=()=>!offline;
const label=()=>{let ur=false;try{ur=JSON.parse(localStorage.getItem('settings')||'{}').ui==='ur'}catch{/* ignore */}
 if(!ur)try{ur=document.documentElement.lang==='ur'}catch{/* ignore */}return ur?'آف لائن':'Offline'};
function paint(){const el=document.getElementById('netPill');document.documentElement.classList.toggle('is-offline',offline);
 if(!el)return;el.hidden=!offline;el.textContent=offline?label():''}
function setOffline(v){const next=!!v;if(next===offline){paint();return}offline=next;if(!offline)fails=[];paint();
 try{dispatchEvent(new CustomEvent('qs-net',{detail:{offline}}))}catch{/* ignore */}}
export function isRemote(url){try{const base=typeof location!=='undefined'&&location.href?location.href:'http://localhost/';const u=new URL(String(url),base);if(typeof location!=='undefined'&&location.origin&&u.origin===location.origin)return false;if(u.origin==='http://localhost')return false;return REMOTE.test(u.href)}catch{return false}}
/** A remote fetch finished. HTTP errors are not "offline" — the server answered. A thrown fetch is. */
export function noteResult(url,ok){if(!isRemote(url))return;const now=Date.now();
 if(ok){fails=[];if(navigator.onLine!==false)setOffline(false);return}
 fails=fails.filter(t=>now-t<20000);fails.push(now);
 if(navigator.onLine===false||fails.length>=2)setOffline(true)}
export function install(){if(hooked||typeof window==='undefined'||!window.fetch)return;hooked=true;
 const orig=window.fetch.bind(window);
 window.fetch=async function(input,init){const url=typeof input==='string'?input:(input&&input.url)||'';
  try{const res=await orig(input,init);if(res&&res.ok)noteResult(url,true);return res}
  catch(e){noteResult(url,false);throw e}};
 addEventListener('online',()=>setOffline(false));
 addEventListener('offline',()=>setOffline(true));
 setOffline(navigator.onLine===false)}
export const refreshLabel=()=>paint();
/** Pure transition used by tests. state: {offline,fails,onLine}. ev: offline|online|ok|fail. */
export function nextState(state,ev,now=0){const fails=(state.fails||[]).filter(t=>now-t<20000);
 if(ev==='offline')return{offline:true,fails};
 if(ev==='online')return{offline:false,fails:[]};
 if(ev==='ok')return{offline:state.onLine===false?!!state.offline:false,fails:[]};
 if(ev==='fail'){fails.push(now);return{offline:state.onLine===false||fails.length>=2||!!state.offline,fails}}
 return{offline:!!state.offline,fails}}
