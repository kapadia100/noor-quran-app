// Offline place names: nearest bundled city to a GPS point (no network, location never leaves the device).
import * as PR from './prayer.js';
let DB=null,loading=null;
const uiUr=()=>{try{return JSON.parse(localStorage.getItem('settings')||'{}').ui==='ur'}catch{return false}};
/** Load the bundled list [[en,ur,lat,lng],...] once. */
export function load(){if(DB)return Promise.resolve(DB);return loading||(loading=fetch('./offline/cities.json').then(r=>r.ok?r.json():[]).then(d=>(DB=d)).catch(()=>{loading=null;return []}))}
/** Nearest city to (lat,lng) in list: {en,ur,km} or null. */
export function nearest(lat,lng,list=DB,R=25){if(!list||!list.length||!isFinite(lat)||!isFinite(lng))return null;const k=Math.cos(lat*Math.PI/180);let b=null,bd=Infinity,big=null,bp=-1,gd=0;
 for(const c of list){const dy=c[2]-lat;let dx=Math.abs(c[3]-lng);if(dx>180)dx=360-dx;const d=Math.sqrt(dy*dy+dx*k*dx*k)*111.2;if(d<bd){bd=d;b=c}if(d<=R&&(c[4]||0)>bp){bp=c[4]||0;big=c;gd=d}}
 // within R km prefer the main city (largest population) over a suburb, e.g. "Dubai" not a district of it
 const w=big||b,cl=x=>String(x).replace(/\s*\(.*?\)/g,'').trim();return w&&{en:cl(w[0]),ur:cl(w[1]||w[0]),km:Math.round(big?gd:bd)}}
const base=n=>String(n||'').replace(/\s*\((PK|IN)\)$/,'');
/** Display name for the saved location in the current UI language (sync; uses cache, else a neutral fallback). */
export function label(P=PR.P,ur=uiUr()){
 if(P.src!=='gps'){const n=base(P.city);if(!ur)return n;const c=DB&&nearest(+P.lat,+P.lng);return c&&c.km<15?c.ur:n}
 const nr=P.near&&P.near.at===`${P.lat},${P.lng}`?P.near:null;
 if(nr){const n=ur?nr.ur:nr.en;return nr.km>60?(ur?`${n} کے قریب`:`Near ${n}`):n}
 return ur?'موجودہ مقام':'Current location'}
/** Resolve and cache the nearest city for the saved GPS point; resolves true when the label changed. */
export async function resolve(P=PR.P){const key=`${P.lat},${P.lng}`;if(P.src!=='gps'){await load();return !!uiUr()}
 if(P.near&&P.near.at===key)return false;const c=nearest(+P.lat,+P.lng,await load());if(!c)return false;P.near={at:key,...c};P.city=c.en;PR.saveP();return true}
/** Fill every [data-place] element with the current label. */
export function paint(){const t=label();document.querySelectorAll('[data-place]').forEach(e=>{e.textContent=t;e.title=t})}
export const refresh=()=>resolve().then(paint);
