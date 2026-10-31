// v3.7.9 Ruqyah Shariah: the standard Quranic ruqyah set read from the app's own Quran text (offline/s/ar), played ayah by ayah
// with the user's chosen reciter, then the prophetic ruqyah duas with the device's Arabic voice when one exists.
import*as H from'./hadith-tts.js';
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
export const ayahTxt=(s,a,t)=>s!==1&&s!==9&&a===1&&t.startsWith(BISM)?t.slice(BISM.length).trim():t;
let off=[];const au=new Audio();au.preload='auto';
export function leave(){au.pause();H.stop();off.forEach(f=>f());off=[]}
export async function page(C,tt,ur,I){
 leave();C.setTitle(tt('Ruqyah Shariah','رقیہ شرعیہ'));
 const app=C.app();app.innerHTML=`<p class="muted c">${tt('Loading…','لوڈ ہو رہا ہے…')}</p>`;
 const [txt,list]=await Promise.all([C.arabic([...new Set(RQ.map(x=>x[0]))]),C.surahs()]);
 if(!app.isConnected)return;
 const seq=[];// {k,s,a} ayahs then {k,d} duas
 const sec=RQ.map(([s,f,t],i)=>{const m=list[s-1],ays=[];for(let a=f;a<=t;a++){seq.push({k:'q',s,a,i:seq.length});ays.push(`<span class="rq-a" data-i="${seq.length-1}" role="button" tabindex="0">${C.esc?C.esc(ayahTxt(s,a,txt[s-1][a-1])):ayahTxt(s,a,txt[s-1][a-1])} <span class="rq-n">﴿${arN(a)}﴾</span></span>`)}
  const whole=f===1&&t===m.numberOfAyahs,ref=whole?`${s}`:f===t?`${s}:${f}`:`${s}:${f}–${t}`;
  return `<section class="card rq-sec" id="rq${i}"><div class="rq-h"><b class="ar">${m.name}</b><span class="badge" dir="ltr">${ref}</span></div>${s!==1&&s!==9&&f===1?`<div class="ar bism c">${BISM}</div>`:''}<p class="ar rq-t" dir="rtl" lang="ar">${ays.join(' ')}</p></section>`}).join('');
 
 const duas=`<section class="card rq-sec rq-duas" id="rqDuas"><div class="rq-h"><b>${tt('Prophetic ruqyah duas','مسنون دعائیں')}</b></div>${DUAS.map(d=>`<div class="rq-d"><p class="ar" dir="rtl" lang="ar">${d[0]}</p><small class="muted">${d[1]>1?tt(`${d[1]} times · `,`${d[1]} بار · `):''}${tt(d[2],d[3])}</small></div>`).join('')}<p class="muted rq-nov">${tt('Read these duas yourself; only the Quran ayat above are played.','یہ دعائیں خود پڑھیں؛ صرف اوپر کی آیات سنائی جاتی ہیں۔')}</p></section>`;
 app.innerHTML=`<div class="rq" dir="${ur()?'rtl':'ltr'}"><div class="card rq-top"><p class="muted">${tt('The Quranic ruqyah verses with the prophetic duas. Press Play to hear it all in Arabic; tap any ayah to start from there.','قرآنی آیاتِ رقیہ اور مسنون دعائیں۔ پوری عربی سننے کے لیے سنیں دبائیں، یا کسی بھی آیت کو چھو کر وہیں سے شروع کریں۔')}</p>
 <div class="rq-ctl"><button class="btn rq-play" id="rqPlay">${I.icon('play')}<span>${tt('Play all','پورا سنیں')}</span></button><button class="btn ghost" id="rqStop" disabled>${tt('Stop','بند')}</button></div>
 <div class="prog" aria-hidden="true"><i id="rqBar" style="width:0%"></i></div><p class="muted rq-st" id="rqSt" role="status">${tt(`${seq.length} ayahs · ${RQ.length} passages`,`${seq.length} آیات · ${RQ.length} حصے`)}</p></div>${sec}${duas}<div class="rq-mini" id="rqMini" hidden><button class="btn rq-mp" id="rqMP" aria-label="${tt('Pause or resume','وقفہ یا جاری')}"></button><span id="rqMS" aria-live="polite"></span><button class="btn rq-mstop" id="rqMStop" aria-label="${tt('Stop','بند')}"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor"/></svg></button><div class="prog"><i id="rqMB"></i></div></div></div>`;
 const q=s=>app.querySelector(s),st={i:-1,state:'idle'},urls={};
 
 const getUrl=async s=>urls[s]??=C.j(`${API}/surah/${s}/${C.S.reciter||'ar.alafasy'}`).then(r=>r.ayahs.map(x=>x.audio));
 let paint=()=>{const on=st.state==='playing'||st.state==='loading';q('#rqPlay').innerHTML=`${I.icon(on?'pause':'play')}<span>${on?tt('Pause','وقفہ'):st.state==='paused'?tt('Resume','جاری رکھیں'):tt('Play all','پورا سنیں')}</span>`;
  q('#rqStop').disabled=st.state==='idle';q('#rqBar').style.width=st.i<0?'0%':`${Math.round((st.i+(st.state==='idle'?0:1))/seq.length*100)}%`;
  app.querySelectorAll('.rq-on').forEach(e=>e.classList.remove('rq-on'));
  if(st.i>=0&&st.state!=='idle'){const e=app.querySelector(`[data-i="${st.i}"]`);e?.classList.add('rq-on');const x=seq[st.i];
   q('#rqSt').textContent=x.k==='q'?`${list[x.s-1].name} ${arN(x.a)} · ${st.i+1} / ${seq.length}`:`${tt('Dua','دعا')} ${x.j+1} · ${st.i+1} / ${seq.length}`}};
 const top=q('.rq-top'),mini=q('#rqMini');let topVis=true;
 const mp=()=>{mini.hidden=topVis||st.state==='idle';app.classList.toggle('rq-live',st.state!=='idle');q('#rqMP').innerHTML=I.icon(st.state==='paused'?'play':'pause');q('#rqMS').textContent=q('#rqSt').textContent;q('#rqMB').style.width=q('#rqBar').style.width};
 try{new IntersectionObserver(([e])=>{topVis=e.isIntersecting;mp()}).observe(top)}catch{/* old browsers: no mini player */}
 const end=()=>{st.state='idle';st.i=-1;paint();q('#rqSt').textContent=tt('Finished.','مکمل ہوا۔')};
 const paint0=paint;paint=()=>{paint0();mp()};
 const go=async i=>{if(i>=seq.length){end();return}
  st.i=i;st.state='loading';paint();const e=app.querySelector(`[data-i="${i}"]`);e?.scrollIntoView({block:'center',behavior:'smooth'});const x=seq[i];
  try{dispatchEvent(new CustomEvent('qs:audio',{detail:'ruqyah'}))}catch{/* ignore */}
  if(x.k==='q'){let u;try{u=(await getUrl(x.s))[x.a-1]}catch{u=null}if(st.i!==i||st.state!=='loading')return;
   if(!u){st.state='idle';paint();q('#rqSt').textContent=tt('Could not load the audio. Check your connection.','آڈیو لوڈ نہیں ہو سکی۔ کنکشن چیک کریں۔');return}
   au.src=u;au.play().then(()=>{if(st.i===i&&st.state==='loading'){st.state='playing';paint()}else if(st.i!==i||st.state!=='playing')au.pause()}).catch(()=>{if(st.i===i&&st.state==='loading'){st.state='paused';paint()}})}
};
 au.onended=()=>{if(app.isConnected&&st.state==='playing')go(st.i+1)};
 au.onerror=()=>{if(app.isConnected&&st.state!=='idle'&&au.src){st.state='idle';paint();q('#rqSt').textContent=tt('Could not load the audio. Check your connection.','آڈیو لوڈ نہیں ہو سکی۔ کنکشن چیک کریں۔')}};
 q('#rqPlay').onclick=()=>{const x=seq[st.i];
  if(st.state==='playing'||st.state==='loading'){if(x?.k==='d')H.pause();else au.pause();st.state='paused';paint()}
  else if(st.state==='paused'){if(x?.k==='d')H.resume();else au.play().catch(()=>{});st.state='playing';paint()}
  else go(0)};
 q('#rqMP').onclick=()=>q('#rqPlay').click();q('#rqMStop').onclick=()=>q('#rqStop').click();
 q('#rqStop').onclick=()=>{au.pause();H.stop();st.state='idle';st.i=-1;paint()};
 const pick=e=>{const el=e.target.closest('[data-i]');if(!el)return;au.pause();H.stop();go(+el.dataset.i)};
 app.addEventListener('click',e=>{if(e.target.closest('.rq-a,.rq-d'))pick(e)});
 app.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest('.rq-a,.rq-d')){e.preventDefault();pick(e)}});
 const other=e=>{if(e.detail!=='ruqyah'&&st.state==='playing'){au.pause();H.pause();st.state='paused';paint()}};
 addEventListener('qs:audio',other);off.push(()=>removeEventListener('qs:audio',other));
 window.__rq={seq:()=>seq.length,state:()=>({...st}),au}}
