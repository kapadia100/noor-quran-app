// Qaida audio: ONE player for the whole Qaida (taps, Hear & repeat, Play lesson, Play all), plus the "Play lesson" bar.
// Rules: never two sounds at once; any other audio in the app (the Quran player) takes over and stops this one; playback never starts while
// the microphone is live; a clip that cannot be loaded is reported as SILENT and is never counted as played.
const base=()=>import.meta.env.BASE_URL||'/';
const BR=typeof window!=='undefined'&&typeof document!=='undefined';
const WD=()=>BR&&navigator.webdriver&&!window.__qRealAudio;
const G=ms=>WD()?ms*(window.__qGap??1):ms; // tests shrink the pauses between clips
export const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let el=null,gen=0,paused=false,inClip=false,rate=1,fail=null,pend=null;const blobs=new Map();
const AUD_CACHE='qsq-audio'; // Quran Safar Qaida clips (letters, vowels, words) kept for offline use; survives app updates
const elem=()=>{if(!el){el=new Audio();el.preload='auto';try{el.preservesPitch=true;el.webkitPreservesPitch=true}catch{/* older browsers */}}return el};
/** Blob URL for a clip. Local clips and remote word clips are stored in Cache Storage the first time they are fetched, so they play offline afterwards. */
async function srcOf(u){if(blobs.has(u))return blobs.get(u);
 const remote=/^https?:/.test(u),url=remote?u:base()+u;let r=null;
 try{const c=await caches.open(AUD_CACHE);r=await c.match(url);if(!r){const n=await fetch(url,remote?{mode:'cors'}:undefined);if(!n.ok)throw new Error('audio');c.put(url,n.clone()).catch(()=>{});r=n}}
 catch{if(!r){try{const n=await fetch(url,remote?{mode:'cors'}:undefined);if(!n.ok)throw new Error('audio');r=n}catch{if(remote&&navigator.onLine!==false)return u;throw new Error('audio')}}}
 const b=URL.createObjectURL(await r.blob());blobs.set(u,b);return b}
const SIL='data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
/** Call inside a tap: unlocks the one audio element for iOS/Safari so later clips (which start after an await) are allowed to play. */
export function unlock(){if(!BR||WD())return;try{const a=elem();if(a.dataset.unlocked)return;a.dataset.unlocked='1';a.src=SIL;a.play().then(()=>{if(a.src===SIL)a.pause()}).catch(()=>{})}catch{/* ignore */}}
export const getGen=()=>gen;
export const lastFail=()=>fail;
export const getRate=()=>rate;
export function setRate(r){rate=r;if(el)try{el.playbackRate=r}catch{/* ignore */}}
export function stop(){gen++;paused=false;inClip=false;const p=pend;pend=null;p?.();try{el?.pause()}catch{/* ignore */}}
export function begin(){stop();return ++gen}
export const isPaused=()=>paused;
export function pause(){if(paused)return;paused=true;if(inClip)try{el.pause()}catch{/* ignore */}}
export function resume(){if(!paused)return;paused=false;if(inClip)elem().play().catch(()=>{})}
if(BR)addEventListener('qs:audio',e=>{if(e.detail!=='qaida')stop()}); // the Quran player (or anything else) started: yield
/** Plays one clip; true when it ended, false when interrupted or when it could not be played (see lastFail()). */
export async function one(u,my){
 while(paused&&my===gen)await sleep(60);
 if(my!==gen)return false;fail=null;
 if(WD()){if(window.__qSilent?.some(s=>u.includes(s))){fail={u,why:'missing'};return false}
  dispatchEvent(new CustomEvent('qs:audio',{detail:'qaida'}));(window.__qplays??=[]).push(u);(window.__qRates??=[]).push(rate);inClip=true;await sleep(window.__qDelay??5);
  while(paused&&my===gen)await sleep(20);inClip=false;return my===gen}
 try{const s=await srcOf(u);if(my!==gen)return false;const a=elem();dispatchEvent(new CustomEvent('qs:audio',{detail:'qaida'}));
  await new Promise((res,rej)=>{pend=res;inClip=true;const off=()=>{a.removeEventListener('ended',ok);a.removeEventListener('error',bad)};const ok=()=>{off();inClip=false;pend=null;res()},bad=()=>{off();inClip=false;pend=null;rej(new Error('audio'))};
   a.addEventListener('ended',ok);a.addEventListener('error',bad);a.src=s;a.playbackRate=rate;a.play().catch(bad)});
  return my===gen}
 catch{inClip=false;if(my!==gen)return false;fail={u,why:navigator.onLine===false?'offline':'missing'};return false}}
export const play=u=>one(u,begin());
export async function playSeq(urls,gap=350){const my=begin();for(let i=0;i<urls.length;i++){if(!await one(urls[i],my))return false;if(i<urls.length-1)await sleep(gap);if(my!==gen)return false}return true}
export const playU=u=>u.includes('|')?playSeq(u.split('|')):play(u);
/** Warm the cache for the next clips while one is playing (no-op for silent/failed ones). */
export const prefetch=us=>{if(WD())return;for(const u of us)srcOf(u).catch(()=>{})};

// ---- lesson structure ----
/** Lessons that have nothing recorded to play as a lesson: joined letters (shapes only) and the prayer phrases (typed text). */
export const SILENT_KINDS=['joined','salah'];
export const lessonHasAudio=(les,count)=>!SILENT_KINDS.includes(les.kind)&&count>0;
const AUTO='qsQAuto',PREF='qsQaidaPlay',LAST=cid=>'qsQaidaLast_'+cid;
const jget=(s,k)=>{try{return JSON.parse(s.getItem(k))}catch{return null}};
const jset=(s,k,v)=>{try{s.setItem(k,JSON.stringify(v))}catch{/* optional */}};
export const lastLesson=cid=>{try{return localStorage.getItem(LAST(cid))}catch{return null}};
/** Where Play all / continue should go next: the first lesson after `from` that has audio (or the first one when from is null). */
export function nextPlayable(cr,count,fromId){const L=cr.LESSONS;let i=fromId==null?0:L.findIndex(x=>x.id===fromId)+1;const skipped=[];
 for(;i<L.length;i++){if(lessonHasAudio(L[i],count(L[i])))return{les:L[i],skipped};skipped.push(L[i])}return{les:null,skipped}}
export function startAuto(cr,les,skipped){jset(sessionStorage,AUTO,{cont:true,skipped:skipped.map(x=>x.id),at:Date.now()});location.hash=`${cr.href}/${les.id}`}
const takeAuto=()=>{const a=jget(sessionStorage,AUTO);try{sessionStorage.removeItem(AUTO)}catch{/* ignore */}return a&&Date.now()-a.at<15000?a:null};

let cur=null;
/** Mounts the "Play lesson" bar of one lesson screen. env: {tt,les,cr,root,count,live:()=>bool,msg?}. Returns {stop,dispose,playing}. */
export function mountPlayer(env){
 cur?.dispose();
 const {tt,les,cr,root}=env,bar=root.querySelector('#qPl');if(!bar)return{stop(){},dispose(){},playing:()=>false};
 const P={rate:1,repeat:false,cont:false,...(jget(localStorage,PREF)||{})};if(![0.75,1].includes(P.rate))P.rate=1;setRate(P.rate);
 const $=s=>bar.querySelector(s),msg=$('#qPlMsg');
 const list=()=>[...root.querySelectorAll('#qBody [data-u]')];
 const label=x=>(x.querySelector('.ar')?.textContent||x.textContent||'').trim().slice(0,24);
 let run=0,state='idle',res=null,skipNote='';
 const savePref=()=>jset(localStorage,PREF,{rate:P.rate,repeat:P.repeat,cont:P.cont});
 const paintOpts=()=>{bar.querySelectorAll('[data-rate]').forEach(b=>{const on=+b.dataset.rate===P.rate;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});
  for(const [id,k] of [['#qPlRep','repeat'],['#qPlCont','cont']]){const b=$(id);b.classList.toggle('on',P[k]);b.setAttribute('aria-pressed',P[k])}};
 const ui=s=>{state=s;$('#qPlPlay').hidden=s!=='idle';$('#qPlPause').hidden=s==='idle';$('#qPlStop').hidden=s==='idle';
  $('#qPlPause').innerHTML=s==='paused'?`▶ ${tt('Resume','جاری رکھیں')}`:`⏸ ${tt('Pause','وقفہ')}`;bar.classList.toggle('q-playing',s!=='idle')};
 const clearMarks=()=>root.querySelectorAll('.q-play').forEach(x=>x.classList.remove('q-play'));
 const say=(t,silent)=>{msg.innerHTML='';const p=document.createElement('span');p.textContent=t;msg.append(p);if(skipNote){const k=document.createElement('span');k.id='qPlSkip';k.className='q-silents';k.textContent=skipNote;msg.append(document.createElement('br'),k)}
  if(res?.off){const o=document.createElement('span');o.id='qPlOffline';o.className='q-silents';o.textContent=tt(' Some sounds are not saved for offline use yet. Connect once and play the lesson to save them.',' کچھ آوازیں ابھی آف لائن کے لیے محفوظ نہیں۔ ایک بار انٹرنیٹ سے سبق چلا کر محفوظ کریں۔');msg.append(o)}
  if(silent?.length){const d=document.createElement('span');d.className='q-silents';d.id='qPlSilent';d.append(` ${tt('No recording (silent, skipped):','ریکارڈنگ نہیں (خاموش، چھوڑ دیے):')} `);silent.forEach(s=>{const b=document.createElement('b');b.className='ar';b.dir='rtl';b.textContent=s;d.append(b,' ')});msg.append(document.createElement('br'),d)}};
 const media=(name)=>{if(!BR||!('mediaSession' in navigator))return;try{mset=true;navigator.mediaSession.metadata=new MediaMetadata({title:name,artist:tt(cr.en,cr.ur),album:'Quran Safar'});navigator.mediaSession.playbackState=state==='paused'?'paused':'playing';
  const h=(a,f)=>{try{navigator.mediaSession.setActionHandler(a,f)}catch{/* unsupported */}};h('play',()=>{if(state==='paused')P.pause()});h('pause',()=>{if(state==='playing')P.pause()});h('stop',()=>P.stop());h('previoustrack',()=>seek(-1));h('nexttrack',()=>seek(1))}catch{/* ignore */}};
 let mset=false;
 const mediaOff=()=>{if(!mset||!BR||!('mediaSession' in navigator))return;mset=false;try{navigator.mediaSession.metadata=null;navigator.mediaSession.playbackState='none'}catch{/* ignore */}
  for(const a of['play','pause','stop','previoustrack','nexttrack'])try{navigator.mediaSession.setActionHandler(a,null)}catch{/* unsupported */}dispatchEvent(new Event('qs:media-restore'))};
 let idx=0,skip=0;
 const seek=d=>{if(state==='idle')return;if(state==='paused'){resume();ui('playing')}skip=d;stop()}; // jump handled by the run loop (it sees the interruption and restarts at idx+d)
 async function itemRun(x,my){const us=x.dataset.u.split('|').filter(Boolean);if(!us.length)return false;
  for(const u of us){const ok=await one(u,my);if(my!==gen)return null;if(!ok)return false;await sleep(G(180/P.rate))}return true}
 async function go(start=0,auto=null){
  if(env.live()){say(tt('Stop live reading first, so the speaker does not get into the microphone.','پہلے لائیو پڑھنا بند کریں، تاکہ اسپیکر کی آواز مائیک میں نہ جائے۔'));return}
  const items=list();if(!items.length)return;
  let my=begin();const mine=++run;ui('playing');res={played:0,silent:[],off:0};idx=start;skip=0;
  try{localStorage.setItem(LAST(cr.id),les.id)}catch{/* optional */}
  for(;;){
   while(idx<items.length){
    const x=items[idx];clearMarks();x.classList.add('q-play');
    try{x.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}catch{/* ignore */}
    say(tt(`Playing ${idx+1} of ${items.length}`,`${items.length} میں سے ${idx+1} چل رہا ہے`),res.silent);media(`${tt(les.en,les.ur)} · ${idx+1}/${items.length}`);
    const nx=items[idx+1];if(nx)prefetch(nx.dataset.u.split('|'));
    const ok=await itemRun(x,my);
    if(mine!==run)return; // another play took over
    if(ok!==null){if(ok){res.played++;x.classList.remove('q-silent')}else{x.classList.add('q-silent');res.silent.push(label(x));x.dataset.silent='1';if(lastFail()?.why==='offline')res.off++}
     idx++;if(idx<items.length)await sleep(G(380/P.rate));if(mine!==run)return}
    if(my!==gen){ // interrupted: a seek button (previous/next track), or something else took the player
     if(skip){const d=skip;skip=0;idx=Math.max(0,Math.min(items.length-1,idx+(ok===null?d:d-1)));my=begin();continue}
     if(state==='paused')return;
     clearMarks();ui('idle');say(tt('Stopped.','روک دیا۔'),res.silent);mediaOff();return}}
   if(P.repeat){idx=0;res.played=0;res.silent=[];res.off=0;continue}
   break}
  clearMarks();ui('idle');mediaOff();
  const n=items.length,s=res.silent.length;
  say(s?tt(`Played ${res.played} of ${n}. ${s} had no recording and were skipped.`,`${n} میں سے ${res.played} چلائے گئے۔ ${s} کی ریکارڈنگ نہیں تھی، چھوڑ دیے گئے۔`):tt(`Played all ${n} items.`,`تمام ${n} چیزیں چلائی گئیں۔`),res.silent);
  if(P.cont||auto?.cont){const nx=nextPlayable(cr,env.count,les.id);
   if(nx.les){jset(sessionStorage,AUTO,{cont:true,skipped:nx.skipped.map(k=>k.id),at:Date.now()});location.replace(`${cr.href}/${nx.les.id}`)}
   else say(tt('That was the last lesson with a recording.','یہ آخری سبق تھا جس کی ریکارڈنگ ہے۔'),res.silent)}}
 P.stop=()=>{if(state==='idle')return;run++;stop();clearMarks();ui('idle');say(tt('Stopped.','روک دیا۔'),res?.silent);mediaOff()};
 P.pause=()=>{if(state==='playing'){pause();ui('paused');say(tt('Paused.','وقفہ۔'),res?.silent);media(tt(les.en,les.ur))}else if(state==='paused'){resume();ui('playing');say(tt(`Playing ${idx+1} of ${list().length}`,`${list().length} میں سے ${idx+1} چل رہا ہے`),res?.silent)}};
 P.dispose=()=>{run++;if(state!=='idle'){stop();clearMarks();ui('idle')}mediaOff();if(cur===P)cur=null};
 $('#qPlPlay').onclick=()=>{unlock();go(0)};$('#qPlPause').onclick=()=>P.pause();$('#qPlStop').onclick=()=>P.stop();
 bar.querySelectorAll('[data-rate]').forEach(b=>b.onclick=()=>{P.rate=+b.dataset.rate;setRate(P.rate);savePref();paintOpts()});
 $('#qPlRep').onclick=()=>{P.repeat=!P.repeat;if(P.repeat)P.cont=false;savePref();paintOpts()};
 $('#qPlCont').onclick=()=>{P.cont=!P.cont;if(P.cont)P.repeat=false;savePref();paintOpts()};
 paintOpts();ui('idle');
 P.playing=()=>state!=='idle';
 cur=P;
 const auto=takeAuto();
 if(auto){P.cont=true;paintOpts();if(auto.skipped?.length){const names=auto.skipped.map(id=>cr.LESSONS.find(x=>x.id===id)).filter(Boolean).map(l=>`${l.n}`).join(', ');skipNote=tt(`Skipped, no recording: lesson ${names}.`,`چھوڑ دیا، ریکارڈنگ نہیں: سبق ${names}۔`);say('')}
  setTimeout(()=>{if(cur===P&&state==='idle')go(0,auto)},350)}
 return P}
