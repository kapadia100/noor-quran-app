// Self-contained Mushaf reader: flowing page view + authentic line-by-line layouts (Madani 15, Indo-Pak 15/16).
const QDC='https://api.qurancdn.com/api/qdc';
export const LAYOUTS={
 flow:{n:604,en:'Flowing',ur:'رواں'},
 m15:{n:604,id:1,lines:15,f:'text_uthmani',en:'15 · Madani',ur:'۱۵ · مدنی'},
 ip15:{n:610,id:6,lines:15,f:'text_indopak',en:'15 · Indo-Pak',ur:'۱۵ · انڈو پاک'},
 ip16:{n:548,id:7,lines:16,f:'text_indopak',en:'16 · Indo-Pak',ur:'۱۶ · انڈو پاک'}};
const KEY='mushafV';const BISM='بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
const get=()=>{let v={};try{v=JSON.parse(localStorage.getItem(KEY))||{}}catch{/* */}return{lay:'flow',zoom:1,speed:30,night:false,bm:{},last:{},...v}};
const put=v=>localStorage.setItem(KEY,JSON.stringify(v));
let wl=null;const wake=async on=>{try{if(on&&!wl&&navigator.wakeLock){wl=await navigator.wakeLock.request('screen');wl.addEventListener?.('release',()=>{wl=null})}else if(!on&&wl){await wl.release();wl=null}}catch{/* unsupported */}};
let auto=false;// survives page turns while auto-scrolling
const mem={};
export async function qdcPage(id,p,f){const u=`${QDC}/verses/by_page/${p}?words=true&word_fields=line_number,page_number,${f}&mushaf=${id}&per_page=all`;
 if(mem[u])return mem[u];const r=await fetch(u);if(!r.ok)throw new Error(r.status);return mem[u]=(await r.json()).verses||[]}
async function qdcPageOf(id,s,a){const r=await fetch(`${QDC}/verses/by_key/${s}:${a}?words=true&word_fields=page_number&mushaf=${id}`);const d=await r.json();return d.verse?.words?.[0]?.page_number||d.verse?.page_number||1}
const flowPageOf=(pages,s,a)=>{let p=1;for(let i=0;i<pages.length;i++){const [ps,pa]=pages[i];if(ps<s||(ps===s&&pa<=a))p=i+1;else break}return p};
// Build line rows (pure; exported for unit tests)
export function buildLines(verses,p,lay){const L=LAYOUTS[lay],by={};
 for(const v of verses){const [s,a]=v.verse_key.split(':').map(Number);for(const w of v.words){if(w.page_number!==p)continue;(by[w.line_number]??=[]).push({s,a,pos:w.position,t:w.char_type_name==='end'?null:(w[L.f]??w.text??'').replace(/[\uE000-\uF8FF\u200F]/g,''),end:w.char_type_name==='end'})}}
 const rows=[];let empty=0,last=null;
 for(let ln=1;ln<=L.lines;ln++){const ws=by[ln];if(!ws){empty++;continue}const f=ws[0];
  if(empty&&f.a===1&&f.pos===1){const need=f.s!==1&&f.s!==9;if(empty>=2||!need)rows.push({k:'name',s:f.s});if(need)rows.push({k:'bism'})}
  empty=0;rows.push({k:'ayah',ws});last=ws[ws.length-1]}
 if(empty&&last&&p<L.n){const s=last.s+1;if(s<=114){rows.push({k:'name',s});if(empty>=2&&s!==9)rows.push({k:'bism'})}}
 return rows}
export async function view(K,p0){const {C,L,X,ar,esc,tt,markRead,app}=K;const st=get();const lay=LAYOUTS[st.lay]?st.lay:'flow',LY=LAYOUTS[lay];
 const p=Math.max(1,Math.min(LY.n,+p0||st.last[lay]||1));st.last[lay]=p;put(st);C.loading();C.setTitle(`${tt('Page','صفحہ')} ${p}`);localStorage.setItem('mushafPage',JSON.stringify(p));markRead();
 const list=await C.surahs();let body,sur,juz,indo=false;
 if(lay==='flow'){const pages=await X('pages.json');const ays=L.pageAyahs(pages,p);const AR=await C.arabic(ays.map(x=>x[0]));let ix=null;
  if(C.S.script==='indopak'){try{const d=await C.j(`https://api.quran.com/api/v4/quran/verses/indopak?page_number=${p}`);ix=Object.fromEntries((d.verses||[]).map(v=>[v.verse_key,v.text_indopak]));indo=true}catch{C.toast(tt('Indo-Pak script needs internet the first time; showing Uthmani.','انڈو پاک رسم الخط کے لیے انٹرنیٹ درکار؛ عثمانی دکھایا جا رہا ہے۔'))}}
  sur=ays[0][0];juz=L.JUZ.filter(([s,a])=>s*1000+a<=ays[0][0]*1000+ays[0][1]).length;
  let h='',cur=0;for(const [s,a] of ays){if(s!==cur&&a===1){h+=`<div class="sh"><span class="ar">${esc(list[s-1].name)}</span></div>${s!==1&&s!==9?`<div class="ar bism c">${BISM}</div>`:''}`}cur=s;
   const txt=ix?.[`${s}:${a}`]?.replace(/[\u200f\u06DD]|[٠-٩۰-۹]+\s*$/g,'').trim()||L.ayahText(s,a,AR[s-1][a-1]);h+=`<span class="mv" data-r="${s}:${a}">${esc(txt)} <span class="end">﴿${ar(a)}﴾</span></span> `}
  body=`<div class="mt">${h}</div>`}
 else{let vs;try{vs=await qdcPage(LY.id,p,LY.f)}catch{C.toast(tt('Line layouts need internet; showing flowing view.','سطری ترتیب کیلئے انٹرنیٹ درکار؛ رواں صفحہ دکھایا جا رہا ہے۔'));st.lay='flow';put(st);return view(K)}
  sur=+vs[0].verse_key.split(':')[0];juz=vs[0].juz_number;const rows=buildLines(vs,p,lay);
  body=`<div class="ml-wrap ${lay==='m15'?'':'mushaf-ip'}" style="--lines:${LY.lines}">${rows.map(r=>r.k==='name'?`<div class="ml ml-h"><span class="ar">${esc(list[r.s-1].name)}</span></div>`:r.k==='bism'?`<div class="ml c ml-b"><span class="w">${BISM}</span></div>`
   :`<div class="ml">${r.ws.map(w=>w.end?`<span class="w end mv" data-r="${w.s}:${w.a}">﴿${ar(w.a)}﴾</span>`:`<span class="w" data-r="${w.s}:${w.a}">${esc(w.t)}</span>`).join('')}</div>`).join('')}</div>`}
 const bm=!!st.bm[`${lay}:${p}`];const seg=Object.entries(LAYOUTS).map(([k,v])=>`<button role="tab" data-lay="${k}" class="${k===lay?'on':''}" aria-selected="${k===lay}">${tt(v.en,v.ur)}</button>`).join('');
 app().innerHTML=`<div class="mz-top" id="mzTop"><div class="mz-seg" role="tablist" aria-label="Layout">${seg}</div>
 <div class="bar">${lay==='flow'?`<select id="msc" aria-label="Script"><option value="uthmani">${tt('Uthmani','عثمانی')}</option><option value="indopak" ${C.S.script==='indopak'?'selected':''}>${tt('Indo-Pak','انڈو پاک')}</option></select>`:''}<input type="number" id="mpg" min="1" max="${LY.n}" value="${p}" aria-label="Page"><button class="btn" id="mgo">${tt('Go','جائیں')}</button></div>
 <div class="bar mz-nav"><select id="msur" aria-label="Surah"><option value="">${tt('Surah…','سورت…')}</option>${list.map((s,i)=>`<option value="${i+1}">${i+1}. ${esc(C.S.ui==='ur'?s.name:s.englishName)}</option>`).join('')}</select><select id="mjuz" aria-label="Juz"><option value="">${tt('Juz…','پارہ…')}</option>${L.JUZ.map((_,i)=>`<option value="${i+1}">${tt('Juz','پارہ')} ${i+1}</option>`).join('')}</select></div>
 <div class="mz-tools"><button id="mzm" aria-label="Smaller">A−</button><button id="mzp" aria-label="Larger">A+</button><button id="mnight" aria-pressed="${st.night}" aria-label="Night">☾</button><button id="mfocus" aria-label="Focus">⛶</button><button id="mbm" aria-pressed="${bm}" aria-label="Bookmark">${bm?'★':'☆'}</button><button id="mplay" aria-label="Auto-scroll">${auto?'❚❚':'▶'}</button><input type="range" id="mspd" min="5" max="150" value="${st.speed}" aria-label="Scroll speed"></div></div>
 <div class="mushaf mz ${indo?'indopak':''} ${st.night?'mz-night':''} lay-${lay}" id="mz" dir="rtl" lang="ar" style="--mz:${st.zoom}"><div class="mh"><span>${esc(list[sur-1].englishName)} · ${esc(list[sur-1].name)}</span><span>${tt('Juz','پارہ')} ${juz} · ${tt('Page','صفحہ')} ${p}/${LY.n}</span></div>${body}<div class="mf">${ar(p)}</div></div>
 <button class="tb-exit mz-exit" id="mzX" hidden>✕ ${tt('Exit','باہر')}</button>
 <div class="pager"><a class="btn" href="#/mushaf/${Math.min(LY.n,p+1)}" ${p>=LY.n?'style="visibility:hidden"':''}>‹ ${p+1}</a><a class="btn" href="#/mushaf/${Math.max(1,p-1)}" ${p<=1?'style="visibility:hidden"':''}>${p-1} ›</a></div>`;
 const $=s=>document.getElementById(s),sc=document.getElementById('app'),mz=$('mz'),go=n=>{location.hash='#/mushaf/'+Math.max(1,Math.min(LY.n,n))};
 const fit=()=>{const w=mz.querySelector('.ml-wrap');if(!w)return;w.style.setProperty('--mf','20px');const ls=[...w.querySelectorAll('.ml:not(.ml-h)')];const avail=w.clientWidth;
  const nat=ls.map(l=>{let t=0;for(const c of l.children)t+=c.getBoundingClientRect().width;return t+(l.children.length-1)*20*.22});const mx=Math.max(...nat,1);
  const f=Math.max(13,Math.min(34,20*avail/mx*.97));w.style.setProperty('--mf',f+'px');ls.forEach((l,i)=>l.classList.toggle('c',l.classList.contains('ml-b')||nat[i]<mx*.7))};
 fit();if(document.fonts?.ready)document.fonts.ready.then(fit);
 const setZ=z=>{st.zoom=Math.round(Math.max(.7,Math.min(2.2,z))*100)/100;put(st);mz.style.setProperty('--mz',st.zoom)};
 $('mzm').onclick=()=>setZ(st.zoom-.1);$('mzp').onclick=()=>setZ(st.zoom+.1);
 $('mnight').onclick=()=>{st.night=!st.night;put(st);mz.classList.toggle('mz-night',st.night);$('mnight').setAttribute('aria-pressed',st.night)};
 $('mbm').onclick=()=>{const k=`${lay}:${p}`;if(st.bm[k])delete st.bm[k];else st.bm[k]=Date.now();put(st);const on=!!st.bm[k];$('mbm').textContent=on?'★':'☆';$('mbm').setAttribute('aria-pressed',on);C.toast(on?tt('Page bookmarked','صفحہ محفوظ'):tt('Bookmark removed','نشان ہٹا دیا'))};
 const focusOn=on=>{document.body.classList.toggle('mz-focus',on);$('mzX').hidden=!on;if(on)try{history.pushState({mzf:1},'')}catch{/* */}};
 $('mfocus').onclick=()=>focusOn(true);$('mzX').onclick=()=>{if(history.state?.mzf)history.back();else focusOn(false)};
 addEventListener('popstate',function pp(){if(!document.getElementById('mz')){removeEventListener('popstate',pp);return}if(document.body.classList.contains('mz-focus')){document.body.classList.remove('mz-focus');$('mzX').hidden=true}});
 $('mspd').oninput=e=>{st.speed=+e.target.value;put(st)};
 let raf=0,t0=0,acc=0;const step=t=>{if(!auto||!document.getElementById('mz'))return;const dt=t0?Math.min(100,t-t0):16;t0=t;acc+=st.speed*dt/1000;const d=Math.floor(acc);if(d){acc-=d;sc.scrollTop+=d}
  if(sc.scrollTop+sc.clientHeight>=sc.scrollHeight-2){if(!sc._end)sc._end=t;if(t-sc._end>1200){sc._end=0;if(p<LY.n){go(p+1);return}auto=false;paint()}}else sc._end=0;raf=requestAnimationFrame(step)};
 const paint=()=>{$('mplay').textContent=auto?'❚❚':'▶';wake(auto);if(auto){t0=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(step)}else cancelAnimationFrame(raf)};
 $('mplay').onclick=e=>{e.stopPropagation();auto=!auto;paint()};
 // tap on page: pause auto-scroll, else toggle toolbar — never leave Mushaf
 mz.onclick=()=>{if(auto){auto=false;paint();return}$('mzTop').classList.toggle('mz-hide')};
 $('mgo').onclick=()=>go(+$('mpg').value);
 const lsc=$('msc');if(lsc)lsc.onchange=e=>{C.S.script=e.target.value;C.save();view(K,p)};
 const jump=async(s,a)=>{if(lay==='flow')go(flowPageOf(await X('pages.json'),s,a));else{try{go(await qdcPageOf(LY.id,s,a))}catch{C.toast(tt('Needs internet','انٹرنیٹ درکار'))}}};
 $('msur').onchange=e=>e.target.value&&jump(+e.target.value,1);$('mjuz').onchange=e=>{const j=L.JUZ[+e.target.value-1];if(j)jump(j[0],j[1])};
 mz.parentElement.querySelectorAll('[data-lay]').forEach(b=>b.onclick=async()=>{const k=b.dataset.lay;if(k===lay)return;const f=(mz.querySelector('[data-r]')?.dataset.r||'1:1').split(':').map(Number);st.lay=k;put(st);
  let np=1;try{np=k==='flow'?flowPageOf(await X('pages.json'),f[0],f[1]):await qdcPageOf(LAYOUTS[k].id,f[0],f[1])}catch{/* */}if(+location.hash.split('/')[2]===np)view(K,np);else go(np)});
 // swipe (RTL book: swipe right = next page) + pinch zoom
 let x0=null,y0=0,pd=0,pz=1;mz.ontouchstart=e=>{if(e.touches.length===2){pd=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);pz=st.zoom;x0=null}else{x0=e.touches[0].clientX;y0=e.touches[0].clientY}};
 mz.ontouchmove=e=>{if(e.touches.length===2&&pd){e.preventDefault();const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);setZ(pz*d/pd)}};
 mz.ontouchend=e=>{if(pd){if(!e.touches.length)pd=0;return}if(x0==null)return;const dx=e.changedTouches[0].clientX-x0,dy=e.changedTouches[0].clientY-y0;if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.5)go(p+(dx>0?1:-1));x0=null};
 addEventListener('hashchange',function h(){removeEventListener('hashchange',h);if(!/^#\/mushaf/.test(location.hash)){auto=false;wake(false);document.body.classList.remove('mz-focus')}});
 sc.scrollTo(0,0);if(auto)paint()}
