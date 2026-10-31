// Highlight what is being recited in the Quran reader.
// Ayah level always; word level only where the timing data is known to match the audio we play
// (per-ayah Mishary al-Afasy clips = Quran.com recitation 7, checked against clip durations).
const SEG_REC={'ar.alafasy':7};
const cache=new Map();
const LETTER=/[\u0621-\u064A\u066E-\u06D3\u06FA-\u06FF]/;
/** Word timings [[pos,startMs,endMs],...] for each ayah of surah s, or null. */
export async function segmentsFor(reciter,s){const r=SEG_REC[reciter];if(!r)return null;const k=r+':'+s;
 if(!cache.has(k))cache.set(k,fetch(`https://api.quran.com/api/v4/recitations/${r}/by_chapter/${s}?fields=segments&per_page=300`).then(x=>x.ok?x.json():null).then(d=>{if(!d)return null;const m={};
  for(const a of d.audio_files||[]){const n=+a.verse_key.split(':')[1];m[n]=(a.segments||[]).filter(g=>g.length>=3).map(g=>g.length>=4?[+g[1],+g[2],+g[3]]:[+g[0],+g[1],+g[2]])}return m}).catch(()=>{cache.delete(k);return null}));
 return cache.get(k)}
/** Word elements of an ayah's Arabic line. Wraps plain text into spans (same characters, same spaces) when needed. Returns null in tajweed colouring. */
export function wordEls(el){const p=el?.querySelector('p.ar');if(!p)return null;let ws=[...p.querySelectorAll('.w')];
 if(!ws.length){if(p.querySelector('span:not(.end)'))return null;const tn=p.firstChild;if(!tn||tn.nodeType!==3)return null;
  const frag=document.createDocumentFragment();for(const part of tn.nodeValue.split(/( +)/)){if(!part)continue;if(/^ +$/.test(part)||!LETTER.test(part)){frag.append(part);continue}const s=document.createElement('span');s.className='pw';s.textContent=part;frag.append(s)}
  p.replaceChild(frag,tn);ws=[...p.querySelectorAll('.pw')]}else ws=ws.filter(w=>LETTER.test(w.textContent));return ws}
let raf=0;
/** Start/stop the word follower. get() → {audio, segs, el} or null. */
export function follow(get){cancelAnimationFrame(raf);let last=null;
 const tick=()=>{raf=requestAnimationFrame(tick);const g=get();if(!g){if(last){last.classList.remove('wplay');last=null}return}
  const {audio,segs,ws}=g;if(segs&&ws&&!audio.paused){const t=audio.currentTime*1000;const seg=segs.find(x=>t>=x[1]-40&&t<x[2]+60);const w=seg?ws[seg[0]-1]:null;
   if(w!==last&&(w||t>((segs.at(-1)||[0,0,0])[2]+60))){last?.classList.remove('wplay');w?.classList.add('wplay');last=w}}};raf=requestAnimationFrame(tick)}
export function clearWords(){document.querySelectorAll('.wplay').forEach(e=>e.classList.remove('wplay'))}
