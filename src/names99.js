import {brand} from './qrbrand.js';
import {icon} from './icons.js';
// t174u: 99 Names of Allah — colourful cards, swipeable detail, share images, favourites, name of the day, learn (flashcards + quiz)
const LS={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};
export const hue=n=>Math.round((n*137.508+28)%360);
export const dayIndex=(d=new Date())=>{const s=new Date(d.getFullYear(),0,0);return Math.floor((d-s)/864e5)%99};
export function mount(ctx){const {app,tt,esc,ur,I_,shareBtn,siteUrl,N,start}=ctx;const $=s=>document.querySelector(s);
 const fav=()=>LS.get('namesFav',[]),learned=()=>LS.get('namesLearned',[]);const tog=(k,n)=>{const a=LS.get(k,[]);const i=a.indexOf(n);i<0?a.push(n):a.splice(i,1);LS.set(k,a);return i<0};
 const sty=n=>`--h:${hue(n.n)}`;const mean=n=>ur()?n.ur:n.en,desc=n=>ur()?n.urD:n.enD;
 const refL=n=>n.ref?`<a class="nm-ref" href="#/surah/${n.ref.replace(':','/')}">${tt('Qur’an','قرآن')} <bdi dir="ltr">${n.ref}</bdi></a>`:'';
 let tab=LS.get('namesTab','all');const td=N[dayIndex()];
 const card=n=>`<button class="name nm-card${fav().includes(n.n)?' fav':''}${learned().includes(n.n)?' lrn':''}" style="${sty(n)}" data-n="${n.n}" data-q="${esc((n.tr+' '+n.en+' '+n.ur+' '+n.ar+' '+n.n).toLowerCase())}"><span class="nm-no">${n.n}</span>${fav().includes(n.n)?'<i class="nm-heart">♥</i>':''}<span class="ar" lang="ar" dir="rtl">${esc(n.ar)}</span><b>${esc(n.tr)}</b><small>${esc(mean(n))}</small></button>`;
 function page(){const L=learned().length;
  app().innerHTML=`<section class="nm-hero" style="${sty(td)}" data-n="${td.n}"><span class="nm-tag">${tt('Name of the day','آج کا اسم')}</span><div class="ar" lang="ar" dir="rtl">${esc(td.ar)}</div><b>${esc(td.tr)}</b><p>${esc(mean(td))}</p><button class="nm-open" data-n="${td.n}">${tt('Reflect','غور کریں')} ›</button></section>
  <div class="nm-prog"><div><b>${L}</b>/99 ${tt('names learned','اسماء یاد')}</div><div class="nm-bar"><i style="width:${L/99*100}%"></i></div></div>
  <div class="nm-tabs" role="tablist">${[['all',tt('All 99','تمام 99')],['fav',tt('Favourites','پسندیدہ')+` (${fav().length})`],['learn',tt('Learn','یاد کریں')]].map(([k,l])=>`<button role="tab" data-tab="${k}" class="${tab===k?'on':''}">${l}</button>`).join('')}</div>
  <div id="nmBody"></div>`;body()}
 function body(){const B=$('#nmBody');if(tab==='learn')return learn(B);const list=tab==='fav'?N.filter(n=>fav().includes(n.n)):N;
  B.innerHTML=`<input id="nf" class="inp" aria-label="Filter" placeholder="${tt('Search name, meaning or number…','نام، معنی یا نمبر تلاش کریں…')}"><div class="names nm-grid" id="nl">${list.length?list.map(card).join(''):`<p class="muted nm-empty">${tt('Tap ♡ on any name to keep it here.','کسی بھی اسم پر ♡ دبائیں تاکہ وہ یہاں محفوظ ہو جائے۔')}</p>`}</div>`;
  $('#nf').oninput=e=>{const q=e.target.value.toLowerCase().trim();const nz=x=>x.replace(/[-'`’ ]/g,'').replace(/(.)\1+/g,'$1').replace(/[\u064B-\u0652\u0670]/g,'');B.querySelectorAll('.name').forEach(b=>b.hidden=!!q&&(/^\d+$/.test(q)?b.dataset.n!==q:!nz(b.dataset.q).includes(nz(q))))}}
 // ---- learn: flashcards + quiz
 let mode=LS.get('namesMode','cards'),qi=null;
 function learn(B){const L=learned(),left=N.filter(n=>!L.includes(n.n));
  B.innerHTML=`<div class="nm-seg">${[['cards',tt('Flashcards','فلیش کارڈز')],['quiz',tt('Quiz','کوئز')]].map(([k,l])=>`<button data-mode="${k}" class="${mode===k?'on':''}">${l}</button>`).join('')}</div><div id="nmL"></div>`;
  const P=$('#nmL');if(!left.length){P.innerHTML=`<div class="card c nm-done"><div class="ar" lang="ar">مَا شَاءَ اللَّهُ</div><p>${tt('You have learned all 99 names.','آپ نے تمام 99 اسماء یاد کر لیے۔')}</p><button class="btn" id="nmReset">${tt('Start again','دوبارہ شروع کریں')}</button></div>`;$('#nmReset').onclick=()=>{LS.set('namesLearned',[]);page()};return}
  const pick=()=>left[Math.floor(Math.random()*left.length)];
  if(mode==='cards'){const n=pick();P.innerHTML=`<div class="nm-flip" id="nmFlip" style="${sty(n)}" data-n="${n.n}"><div class="nm-fc front"><span class="nm-no">${n.n}</span><div class="ar" lang="ar" dir="rtl">${esc(n.ar)}</div><small>${tt('Tap to reveal the meaning','معنی دیکھنے کے لیے ٹیپ کریں')}</small></div><div class="nm-fc back"><b>${esc(n.tr)}</b><p class="nm-m">${esc(n.en)}</p><p class="nm-u" lang="ur" dir="rtl">${esc(n.ur)}</p></div></div>
   <div class="nm-acts"><button class="btn" id="nmAgain">${tt('Not yet','ابھی نہیں')}</button><button class="btn pri" id="nmKnow">${tt('I know it','یاد ہے')} ✓</button></div><p class="muted c">${left.length} ${tt('names left to learn','اسماء باقی')}</p>`;
   $('#nmFlip').onclick=e=>e.currentTarget.classList.toggle('flip');$('#nmAgain').onclick=()=>learn(B);$('#nmKnow').onclick=()=>{tog('namesLearned',n.n);page()}}
  else{const n=qi&&left.find(x=>x.n===qi)||pick();qi=n.n;const opts=[n,...N.filter(x=>x.n!==n.n).sort(()=>Math.random()-.5).slice(0,3)].sort(()=>Math.random()-.5);
   P.innerHTML=`<div class="nm-q" style="${sty(n)}" data-n="${n.n}"><small>${tt('What does this name mean?','اس اسم کا مطلب کیا ہے؟')}</small><div class="ar" lang="ar" dir="rtl">${esc(n.ar)}</div></div><div class="nm-opts">${opts.map(o=>`<button class="nm-opt" data-a="${o.n}">${esc(mean(o))}</button>`).join('')}</div><p class="muted c" id="nmQmsg">${left.length} ${tt('names left to learn','اسماء باقی')}</p>`;
   P.querySelector('.nm-opts').onclick=e=>{const b=e.target.closest('.nm-opt');if(!b||P.querySelector('.ok'))return;const ok=+b.dataset.a===n.n;b.classList.add(ok?'ok':'no');P.querySelector(`[data-a="${n.n}"]`).classList.add('ok');
    $('#nmQmsg').innerHTML=(ok?tt('Correct! Marked as learned.','درست! یاد شدہ میں شامل۔'):`${esc(n.tr)} — ${esc(mean(n))}`)+` <button class="btn" id="nmNext">${tt('Next','اگلا')} ›</button>`;if(ok&&!learned().includes(n.n))tog('namesLearned',n.n);qi=null;$('#nmNext').onclick=()=>ok?page():learn(B)}}}
 // ---- full-screen swipeable detail
 function open(i){let v=$('#nmv');if(!v){v=document.createElement('div');v.id='nmv';document.body.appendChild(v)}
  v.innerHTML=`<button class="nm-x" id="nmX" aria-label="${tt('Close','بند کریں')}">✕</button><div class="nm-track" id="nmT" dir="ltr">${N.map(n=>`<article class="nm-slide" dir="${ur()?'rtl':'ltr'}" style="${sty(n)}" data-n="${n.n}"><div class="nm-in"><span class="nm-no">${n.n} / 99</span><div class="nm-ring"><div class="ar" lang="ar" dir="rtl">${esc(n.ar)}</div></div><h2>${esc(n.tr)}</h2><p class="nm-m">${esc(n.en)}</p><p class="nm-u" lang="ur" dir="rtl">${esc(n.ur)}</p><p class="nm-d">${esc(desc(n)||'')}</p>${refL(n)}
   <div class="nm-acts"><button class="nm-ic nm-fav${fav().includes(n.n)?' on':''}" data-fav="${n.n}" aria-label="${tt('Favourite','پسندیدہ')}">${fav().includes(n.n)?'♥':'♡'}</button><button class="nm-ic nm-lrn${learned().includes(n.n)?' on':''}" data-lrn="${n.n}" aria-label="${tt('Learned','یاد ہے')}">✓</button><button class="btn nm-img" data-img="${n.n}">${I_('image')} ${tt('Share image','تصویر شیئر کریں')}</button>${shareBtn({ar:n.ar,tr:`${n.tr} — ${mean(n)}${desc(n)?'\n'+desc(n):''}`,ref:`${tt('99 Names of Allah','اسماء الحسنیٰ')} · ${n.n}. ${n.tr}`,url:siteUrl('#/names/'+n.n)})}</div></div></article>`).join('')}</div><div class="nm-hint">‹ ${tt('swipe','سوائپ کریں')} ›</div>`;
  v.hidden=false;document.body.classList.add('nm-lock');const T=$('#nmT');const w=()=>T.clientWidth;requestAnimationFrame(()=>{T.scrollLeft=i*w();T.querySelectorAll('.nm-slide')[i].classList.add('on')});
  T.onscroll=()=>{const k=Math.round(T.scrollLeft/w());T.querySelectorAll('.nm-slide').forEach((s,j)=>s.classList.toggle('on',j===k))};
  $('#nmX').onclick=close;v.onclick=e=>{const f=e.target.closest('[data-fav]'),l=e.target.closest('[data-lrn]'),im=e.target.closest('[data-img]');
   if(f){const on=tog('namesFav',+f.dataset.fav);f.classList.toggle('on',on);f.textContent=on?'♥':'♡'}if(l){l.classList.toggle('on',tog('namesLearned',+l.dataset.lrn))}if(im)shareImg(N[im.dataset.img-1])}}
 function close(){const v=$('#nmv');if(v){v.hidden=true;v.innerHTML=''}document.body.classList.remove('nm-lock');if(/^#\/names\/\d+/.test(location.hash))history.replaceState(null,'','#/names');page()}
 // ---- share image (square + story)
 async function shareImg(n){const sh=$('#sheet');sh.hidden=false;const sq=await drawCard(n,1080,1080),st=await drawCard(n,1080,1920);const u1=sq.toDataURL('image/png'),u2=st.toDataURL('image/png');
  $('#sheetBody').innerHTML=`<h2 class="h3">${tt('Share this name','یہ اسم شیئر کریں')}</h2><div class="nm-prev"><figure><img id="nmSq" src="${u1}" alt="${esc(n.tr)} square"><figcaption>${tt('Square','مربع')}</figcaption></figure><figure><img id="nmSt" src="${u2}" alt="${esc(n.tr)} story"><figcaption>${tt('Story','اسٹوری')}</figcaption></figure></div><p class="muted nm-tip" style="text-align:center;font-size:12.5px;margin:10px 0 0">${tt('Tip: choose “Save Image” in the share menu to keep it in Photos.','تصویر محفوظ کرنے کے لیے شیئر مینو میں “Save Image” چنیں۔')}</p><div class="shgrid nm-acts"><button class="btn" id="nmShSq" data-sz="sq">${icon('share')} ${tt('Share square','مربع شیئر کریں')}</button><button class="btn" id="shImg" data-sz="st">${icon('image')} ${tt('Share story','اسٹوری شیئر کریں')}</button></div>`;
  // Blobs/files are prepared up front so navigator.share runs inside the tap (iOS drops the gesture after an await).
  const mk=(cv,k)=>new Promise(r=>cv.toBlob(b=>r(new File([b],`name-${n.n}-${k}.png`,{type:'image/png'})),'image/png'));const F={sq:await mk(sq,'square'),st:await mk(st,'story')};
  $('#sheetBody').querySelector('.nm-acts').onclick=e=>{const b=e.target.closest('[data-sz]');if(!b)return;const file=F[b.dataset.sz];
   if(navigator.canShare?.({files:[file]})){navigator.share({files:[file],title:`${n.tr} — Quran Safar`}).catch(x=>{if(x.name!=='AbortError')openImg(file)});return}openImg(file)}}
 function openImg(file){const u=URL.createObjectURL(file);if(!window.open(u,'_blank')){location.href=u}}
 app().onclick=e=>{const t=e.target.closest('[data-tab]');if(t){tab=t.dataset.tab;LS.set('namesTab',tab);page();return}const m=e.target.closest('[data-mode]');if(m){mode=m.dataset.mode;LS.set('namesMode',mode);qi=null;learn($('#nmBody'));return}
  const b=e.target.closest('.name,.nm-open,.nm-hero');if(b&&b.dataset.n){const i=+b.dataset.n-1;history.replaceState(null,'','#/names/'+(i+1));open(i)}};
 page();if(start>=1&&start<=99)open(start-1);return {open,close}}
export async function drawCard(n,W,H){const cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d'),h=hue(n.n);
 try{await Promise.all([document.fonts.load('120px "Amiri Quran"'),document.fonts.load('40px "Noto Nastaliq Urdu"'),document.fonts.load('600 40px Fraunces'),document.fonts.load('40px "DM Sans"')])}catch{}
 const gr=g.createLinearGradient(0,0,W,H);gr.addColorStop(0,`hsl(${h} 46% 30%)`);gr.addColorStop(1,`hsl(${(h+38)%360} 52% 14%)`);g.fillStyle=gr;g.fillRect(0,0,W,H);
 const rg=g.createRadialGradient(W/2,H*.42,40,W/2,H*.42,W*.75);rg.addColorStop(0,`hsla(${h},70%,70%,.28)`);rg.addColorStop(1,'transparent');g.fillStyle=rg;g.fillRect(0,0,W,H);
 g.save();g.strokeStyle='rgba(243,217,160,.10)';g.lineWidth=2;const s=90;for(let y=-s;y<H+s;y+=s)for(let x=(y/s%2?s/2:0)-s;x<W+s;x+=s){g.save();g.translate(x,y);for(const r of[0,Math.PI/4]){g.save();g.rotate(r);g.strokeRect(-22,-22,44,44);g.restore()}g.restore()}g.restore();
 const gold=g.createLinearGradient(0,0,W,0);gold.addColorStop(0,'#C9A24E');gold.addColorStop(.5,'#F6E2A8');gold.addColorStop(1,'#B88A35');
 g.strokeStyle=gold;g.lineWidth=5;g.strokeRect(44,44,W-88,H-88);g.lineWidth=2;g.strokeRect(62,62,W-124,H-124);
 const cy=H*(H>W?.38:.35),R=W*(H>W?.34:.23);g.beginPath();g.arc(W/2,cy,R,0,7);g.lineWidth=4;g.strokeStyle=gold;g.stroke();g.beginPath();g.arc(W/2,cy,R-16,0,7);g.lineWidth=1.5;g.stroke();
 for(let k=0;k<16;k++){const a=k*Math.PI/8;g.beginPath();g.arc(W/2+Math.cos(a)*(R+22),cy+Math.sin(a)*(R+22),k%2?4:7,0,7);g.fillStyle='#E9CF8C';g.fill()}
 g.textAlign='center';g.direction='rtl';g.fillStyle='#FFF6DD';g.shadowColor='rgba(0,0,0,.35)';g.shadowBlur=18;let fs=n.ar.length>14?110:170;g.font=`${fs}px "Amiri Quran", Amiri, serif`;while(g.measureText(n.ar).width>R*1.75&&fs>60){fs-=6;g.font=`${fs}px "Amiri Quran", Amiri, serif`}g.fillText(n.ar,W/2,cy+fs*.32);g.shadowBlur=0;
 
 let y=cy+R+(H>W?150:90);g.fillStyle='#FFF6DD';g.font='600 64px Fraunces, Georgia, serif';g.fillText(n.tr,W/2,y);y+=H>W?70:60;g.fillStyle='#F3D9A0';g.font='italic 42px Fraunces, Georgia, serif';g.fillText(n.en,W/2,y);
 g.direction='rtl';g.font='40px "Noto Nastaliq Urdu", serif';g.fillStyle='rgba(255,246,221,.92)';y+=H>W?110:70;g.fillText(n.ur,W/2,y);
 if(H>W&&n.enD){g.direction='ltr';g.font='34px "DM Sans", sans-serif';g.fillStyle='rgba(255,246,221,.82)';const words=n.enD.split(' ');let line='',ly=y+110;for(const w of words){if(g.measureText(line+w).width>W-240){g.fillText(line.trim(),W/2,ly);ly+=50;line=''}line+=w+' '}g.fillText(line.trim(),W/2,ly)}
 brand(g,W,H,{cell:H>W?4:3,bottom:H>W?90:78});return cv}
