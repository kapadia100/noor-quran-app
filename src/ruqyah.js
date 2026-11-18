// v3.7.9 Ruqyah Shariah: the standard Quranic ruqyah set read from the app's own Quran text (offline/s/ar), played as one
// continuous stream (the reciter's ayah clips joined, see stitch-net.js; ayah by ayah only if that cannot load) with the user's chosen reciter; the prophetic duas are shown as text (never spoken by the device voice).
import*as H from'./hadith-tts.js';
import {ayahText} from'./lib.js';
import {kick as glide} from'./glide.js';
import {follow} from'./follow.js';
import*as MP from'./miniplayer.js';import*as SP from'./speed.js';
import*as SN from'./stitch-net.js';
const API='https://api.alquran.cloud/v1';
/** Quranic sections: [surah, fromAyah, toAyah]. */
export const RQ=[[1,1,7],[2,1,5],[2,102,102],[2,163,164],[2,255,255],[2,285,286],[3,18,19],[7,54,56],[7,117,122],[10,81,82],[20,69,69],[23,115,118],[37,1,10],[46,29,32],[55,33,36],[59,21,24],[72,1,9],[112,1,4],[113,1,5],[114,1,6]];
/** Prophetic ruqyah duas (sound hadith). [arabic, repeat, en ref, ur ref, en note, ur note] */
export const DUAS=[
 ['بِسْمِ اللَّهِ أَرْقِيكَ، مِنْ كُلِّ شَيْءٍ يُؤْذِيكَ، مِنْ شَرِّ كُلِّ نَفْسٍ أَوْ عَيْنِ حَاسِدٍ، اللَّهُ يَشْفِيكَ، بِسْمِ اللَّهِ أَرْقِيكَ',1,'Muslim 2186','مسلم ۲۱۸۶'],
 ['اللَّهُمَّ رَبَّ النَّاسِ، أَذْهِبِ الْبَأْسَ، اشْفِ وَأَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ، شِفَاءً لَا يُغَادِرُ سَقَمًا',1,'Bukhari 5743, Muslim 2191','بخاری ۵۷۴۳، مسلم ۲۱۹۱'],
 ['بِسْمِ اللَّهِ',3,'Muslim 2202','مسلم ۲۲۰۲'],
 ['أَعُوذُ بِاللَّهِ وَقُدْرَتِهِ مِنْ شَرِّ مَا أَجِدُ وَأُحَاذِرُ',7,'Muslim 2202','مسلم ۲۲۰۲'],
 ['أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّةِ، مِنْ كُلِّ شَيْطَانٍ وَهَامَّةٍ، وَمِنْ كُلِّ عَيْنٍ لَامَّةٍ',1,'Bukhari 3371','بخاری ۳۳۷۱'],
 ['أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',3,'Muslim 2708','مسلم ۲۷۰۸']];
const BISM='بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
const arN=n=>(+n).toLocaleString('ar-EG');
/** Text of ayah a of surah s from the app's text (ayah 1 of surahs other than 1 and 9 carries the basmala, shown separately). */
// Same display text as the reader (lib.ayahText): the Bismillah prefix of ayah 1 is matched without diacritics, because the
// Quran file writes shadda+fatha in the other mark order than BISM, so a plain startsWith never matched and it showed twice.
export const ayahTxt=(s,a,t)=>s===9?t:ayahText(s,a,t);
let off=[];const au=SP.bind(new Audio());au.preload='auto';const pre=SP.bind(new Audio());pre.preload='auto';
export function leave(){au.pause();pre.removeAttribute('src');H.stop();if(typeof navigator!=='undefined'&&'mediaSession' in navigator&&au.src){try{navigator.mediaSession.metadata=null;for(const a of['play','pause','stop','previoustrack','nexttrack'])navigator.mediaSession.setActionHandler(a,null)}catch{/* ignore */}try{dispatchEvent(new Event('qs:media-restore'))}catch{/* ignore */}}document.body.classList.remove('mp-alt');off.forEach(f=>f());off=[]}
export async function page(C,tt,ur,I){
 leave();C.setTitle(tt('Ruqyah Shariah','رقیہ شرعیہ'));
 const ML={prev:tt('Previous ayah','پچھلی آیت'),next:tt('Next ayah','اگلی آیت'),play:tt('Play','چلائیں'),pause:tt('Pause','وقفہ'),close:tt('Stop and close','بند کریں'),ur,speed:true};
 const app=C.app();app.innerHTML=`<p class="muted c">${tt('Loading…','لوڈ ہو رہا ہے…')}</p>`;
 const [txt,list]=await Promise.all([C.arabic([...new Set(RQ.map(x=>x[0]))]),C.surahs()]);
 if(!app.isConnected)return;
 const seq=[];// {k,s,a} ayahs then {k,d} duas
 const sec=RQ.map(([s,f,t],i)=>{const m=list[s-1],ays=[];for(let a=f;a<=t;a++){seq.push({k:'q',s,a,i:seq.length});ays.push(`<span class="rq-a" data-i="${seq.length-1}" role="button" tabindex="0">${C.esc?C.esc(ayahTxt(s,a,txt[s-1][a-1])):ayahTxt(s,a,txt[s-1][a-1])} <span class="rq-n">﴿${arN(a)}﴾</span></span>`)}
  const whole=f===1&&t===m.numberOfAyahs,ref=whole?`${s}`:f===t?`${s}:${f}`:`${s}:${f}–${t}`;
  return `<section class="card rq-sec" id="rq${i}"><div class="rq-h"><b class="ar">${m.name}</b><span class="badge" dir="ltr">${ref}</span></div>${s!==1&&s!==9&&f===1?`<div class="ar bism c">${BISM}</div>`:''}<p class="ar rq-t" dir="rtl" lang="ar">${ays.join(' ')}</p></section>`}).join('');
 
 const duas=`<section class="card rq-sec rq-duas" id="rqDuas"><div class="rq-h"><b>${tt('Prophetic ruqyah duas','مسنون دعائیں')}</b></div>${DUAS.map(d=>`<div class="rq-d"><p class="ar" dir="rtl" lang="ar">${d[0]}</p><small class="muted">${d[1]>1?tt(`${d[1]} times · `,`${d[1]} بار · `):''}${tt(d[2],d[3])}</small></div>`).join('')}<p class="muted rq-nov">${tt('Read these duas yourself; only the Quran ayat above are played.','یہ دعائیں خود پڑھیں؛ صرف اوپر کی آیات سنائی جاتی ہیں۔')}</p></section>`;
 app.innerHTML=`<div class="rq" dir="${ur()?'rtl':'ltr'}"><div class="card rq-top"><p class="muted">${tt('The Quranic ruqyah verses with the prophetic duas. Press Play to hear it all in Arabic; tap any ayah to start from there.','قرآنی آیاتِ رقیہ اور مسنون دعائیں۔ پوری عربی سننے کے لیے سنیں دبائیں، یا کسی بھی آیت کو چھو کر وہیں سے شروع کریں۔')}</p>
 <div class="rq-ctl"><button class="btn rq-play" id="rqPlay">${I.icon('play')}<span>${tt('Play all','پورا سنیں')}</span></button></div>
 <div class="prog" aria-hidden="true"><i id="rqBar" style="width:0%"></i></div><p class="muted rq-st" id="rqSt" role="status">${tt(`${seq.length} ayahs · ${RQ.length} passages`,`${seq.length} آیات · ${RQ.length} حصے`)}</p></div>${sec}${duas}${MP.miniHTML({root:'rqMini',prev:'rqMPrev',play:'rqMP',next:'rqMNext',info:'rqMS',close:'rqMStop'},ML)}</div>`;
 const q=s=>app.querySelector(s),st={i:-1,state:'idle'},urls={};
 
 const getUrl=async s=>urls[s]??=C.j(`${API}/surah/${s}/${C.S.reciter||'ar.alafasy'}`).then(r=>r.ayahs.map(x=>x.audio));
 let paint=()=>{queueMicrotask(glide);const on=st.state==='playing'||st.state==='loading';q('#rqPlay').innerHTML=`${I.icon(on?'pause':'play')}<span>${on?tt('Pause','وقفہ'):st.state==='paused'?tt('Resume','جاری رکھیں'):tt('Play all','پورا سنیں')}</span>`;
q('#rqBar').style.width=st.i<0?'0%':`${Math.round((st.i+(st.state==='idle'?0:1))/seq.length*100)}%`;
  app.querySelectorAll('.rq-on').forEach(e=>e.classList.remove('rq-on'));
  if(st.i>=0&&st.state!=='idle'){const e=app.querySelector(`[data-i="${st.i}"]`);e?.classList.add('rq-on');const x=seq[st.i];
   q('#rqSt').textContent=x.k==='q'?`${list[x.s-1].name} ${arN(x.a)} · ${st.i+1} / ${seq.length}`:`${tt('Dua','دعا')} ${x.j+1} · ${st.i+1} / ${seq.length}`}};
 const top=q('.rq-top'),mini=q('#rqMini');let topVis=true;
 const mp=()=>{SP.paint();mini.hidden=topVis||st.state==='idle';app.classList.toggle('rq-live',st.state!=='idle');document.body.classList.toggle('mp-alt',st.state!=='idle');MP.setPlaying(q('#rqMP'),st.state!=='paused',ML);q('#rqMS').textContent=q('#rqSt').textContent};
 try{new IntersectionObserver(([e])=>{topVis=e.isIntersecting;mp()}).observe(top)}catch{/* old browsers: no mini player */}
 const end=()=>{st.state='idle';st.i=-1;paint();mediaOff();q('#rqSt').textContent=tt('Finished.','مکمل ہوا۔')};
 const paint0=paint;paint=()=>{paint0();mp()};
 // Gapless: the ayat are joined into chunks (4, then 12, then 40 ayat) that play back to back on the same element;
 // the next chunk is built while the current one plays. Highlight follows the joined stream's ayah times.
 const R=C.S.reciter||'ar.alafasy',joinable=SN.has(R),chMem=new Map();let ch=null;
 const chunk=(from,k)=>{const size=SN.sizeAt(k),key=from+':'+size;if(chMem.has(key))return chMem.get(key);const list=[];
  for(let i=from;i<Math.min(seq.length,from+size);i++){const x=seq[i];if(x.k!=='q')break;list.push({key:i,urls:[SN.clipUrl(R,x.s,x.a)]})}
  const pr=SN.build(list).then(c=>{c.first=from;c.last=c.marks.at(-1).key;c.k=k;pr.value=c;return c});chMem.set(key,pr);pr.catch(()=>chMem.delete(key));
  while(chMem.size>6){const [k0,p0]=chMem.entries().next().value;chMem.delete(k0);p0.then(c=>{if(ch!==c)SN.release(c)}).catch(()=>{})}return pr};
 off.push(()=>{for(const p of chMem.values())p.then(c=>SN.release(c)).catch(()=>{});chMem.clear();ch=null});
 const ahead=c=>{if(c.last+1<seq.length)chunk(c.last+1,c.k+1).catch(()=>{})};
 const playChunk=(c,i)=>{ch=c;au.src=c.url;media(seq[i]);ahead(c);au.play().then(()=>{if(ch===c&&st.state==='loading'){st.state='playing';paint()}else if(ch!==c||st.state!=='playing'&&st.state!=='loading')au.pause()}).catch(()=>{if(ch===c&&st.state==='loading'){st.state='paused';paint()}})};
 const at=ms=>{let k=ch.first;for(const m of ch.marks){if(ms+15>=m.from)k=m.key;else break}return k};
 au.ontimeupdate=()=>{if(!ch||!app.isConnected||st.state!=='playing')return;const k=at(au.currentTime*1000);if(k!==st.i){st.i=k;paint();const e=app.querySelector(`[data-i="${k}"]`);requestAnimationFrame(()=>follow(e));media(seq[k])}};
 let joinOk=joinable;// one failed join (clip host down): ayah by ayah for the rest of this visit
 const goJoined=async i=>{let c;try{c=await chunk(i,0)}catch{c=null;joinOk=false}if(st.i!==i||st.state!=='loading')return true;if(!c)return false;playChunk(c,i);return true};
 /** The chunk ended: start the next inside the same 'ended' task when it is ready (no gap; iOS keeps playing locked). */
 const nextChunk=()=>{const c=ch;if(c.last+1>=seq.length){ch=null;end();return}const i=c.last+1,pr=chunk(i,c.k+1);st.i=i;paint();
  if(pr.value){st.state='loading';playChunk(pr.value,i);return}st.state='loading';paint();pr.then(n=>{if(st.i===i&&st.state==='loading')playChunk(n,i)}).catch(()=>{if(st.i===i&&st.state==='loading'){ch=null;go1(i)}})};
 const go=async i=>{if(i>=seq.length){end();return}
  st.i=i;st.state='loading';ch=null;paint();const e=app.querySelector(`[data-i="${i}"]`);requestAnimationFrame(()=>follow(e));
  try{dispatchEvent(new CustomEvent('qs:audio',{detail:'ruqyah'}))}catch{/* ignore */}
  if(joinOk&&seq[i].k==='q'&&await goJoined(i))return;if(st.i!==i||st.state!=='loading')return;go1(i)};
 const go1=async i=>{const x=seq[i];
  if(x.k==='q'){let u;try{u=(await getUrl(x.s))[x.a-1]}catch{u=null}if(st.i!==i||st.state!=='loading')return;
   if(!u){st.state='idle';paint();q('#rqSt').textContent=tt('Could not load the audio. Check your connection.','آڈیو لوڈ نہیں ہو سکی۔ کنکشن چیک کریں۔');return}
   preNext(i);au.src=u;media(x);au.play().then(()=>{if(st.i===i&&st.state==='loading'){st.state='playing';paint()}else if(st.i!==i||st.state!=='playing')au.pause()}).catch(()=>{if(st.i===i&&st.state==='loading'){st.state='paused';paint()}})}
};
 // Lock-screen / headset controls (Media Session) drive the same mini player; the next ayah is preloaded so it starts from 'ended' even in the background.
 const preNext=async i=>{const n=seq[i+1];if(!n||n.k!=='q')return;try{const v=(await getUrl(n.s))[n.a-1];if(v&&pre.src!==v)pre.src=v}catch{/* optional */}};
 const MS=()=>typeof navigator!=='undefined'&&'mediaSession' in navigator?navigator.mediaSession:null;
 const media=x=>{const ms=MS();if(!ms)return;try{ms.metadata=new MediaMetadata({title:`${tt('Ruqyah','رقیہ')} · ${x.s}:${x.a}`,artist:C.S.reciterName||C.S.reciter||'',album:'Quran Safar',artwork:[{src:import.meta.env.BASE_URL+'icon-192.png',sizes:'192x192',type:'image/png'},{src:import.meta.env.BASE_URL+'icon-512.png',sizes:'512x512',type:'image/png'}]});
  const h=(a,f)=>{try{ms.setActionHandler(a,f)}catch{/* unsupported */}};h('play',()=>{if(st.state==='paused')q('#rqPlay').click();else if(st.state==='playing')au.play().catch(()=>{})});h('pause',()=>{if(st.state==='playing'||st.state==='loading')q('#rqPlay').click()});
  h('previoustrack',()=>jump(-1));h('nexttrack',()=>jump(1));h('stop',()=>q('#rqMStop').click())}catch{/* ignore */}};
 const mediaOff=()=>{const ms=MS();if(!ms)return;try{ms.metadata=null;ms.playbackState='none';for(const a of['play','pause','stop','previoustrack','nexttrack'])ms.setActionHandler(a,null)}catch{/* ignore */}try{dispatchEvent(new Event('qs:media-restore'))}catch{/* ignore */}};
 au.onplay=()=>{const ms=MS();if(ms)try{ms.playbackState='playing'}catch{/* ignore */}};au.onpause=()=>{const ms=MS();if(ms&&st.state!=='idle')try{ms.playbackState='paused'}catch{/* ignore */}};
 au.onended=()=>{if(!app.isConnected||st.state!=='playing')return;if(ch)return nextChunk();go(st.i+1)};
 au.onerror=()=>{if(app.isConnected&&st.state!=='idle'&&au.src){st.state='idle';paint();q('#rqSt').textContent=tt('Could not load the audio. Check your connection.','آڈیو لوڈ نہیں ہو سکی۔ کنکشن چیک کریں۔')}};
 q('#rqPlay').onclick=()=>{const x=seq[st.i];
  if(st.state==='playing'||st.state==='loading'){if(x?.k==='d')H.pause();else au.pause();st.state='paused';paint()}
  else if(st.state==='paused'){if(x?.k==='d')H.resume();else au.play().catch(()=>{});st.state='playing';paint()}
  else go(0)};
 q('#rqMP').onclick=()=>q('#rqPlay').click();
 q('#rqMStop').onclick=()=>{au.pause();H.stop();ch=null;st.state='idle';st.i=-1;paint();mediaOff()};
 const jump=d=>{if(st.i<0)return;const n=Math.max(0,Math.min(seq.length-1,st.i+d));au.pause();H.stop();go(n)};q('#rqMPrev').onclick=()=>jump(-1);q('#rqMNext').onclick=()=>jump(1);
 const pick=e=>{const el=e.target.closest('[data-i]');if(!el)return;au.pause();H.stop();go(+el.dataset.i)};
 app.addEventListener('click',e=>{if(e.target.closest('.rq-a,.rq-d'))pick(e)});
 app.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest('.rq-a,.rq-d')){e.preventDefault();pick(e)}});
 const other=e=>{if(e.detail!=='ruqyah'&&st.state==='playing'){au.pause();H.pause();st.state='paused';paint()}};
 addEventListener('qs:audio',other);off.push(()=>removeEventListener('qs:audio',other));
 window.__rq={seq:()=>seq.length,state:()=>({...st}),au,chunk:()=>ch}}
