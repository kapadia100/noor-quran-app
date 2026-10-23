// v2 feature screens. Everything stays in the same visual system (cards, lists, .btn) and supports EN/UR + dark mode.
import * as L from './lib.js';
import * as PR from './prayer.js';
import * as I from './icons.js';
import * as GC from './analytics.js';
const I_=I.icon;
const {esc,ymd}=L;
let C,PAGES=null;export const init=ctx=>{C=ctx;X('pages.json').then(p=>PAGES=p).catch(()=>{})};
export const pageFor=(s,a)=>PAGES?L.pageOf(PAGES,s,a):'';
const app=()=>C.app();const $=s=>document.querySelector(s);const S=()=>C.S;
const ur=()=>C.S.ui==='ur';const tt=(en,u)=>ur()?u:en;
const LS={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};
const X=f=>C.j(import.meta.env.BASE_URL+'offline/x/'+f);
const vib=p=>{try{navigator.vibrate?.(p)}catch{}};
const ar=s=>(+s).toLocaleString('ar-EG');

// ---------- reading streak ----------
export function markRead(){const d=LS.get('readDays',[]),k=ymd(new Date());if(!d.includes(k)){d.push(k);LS.set('readDays',d.slice(-400))}}
export const readStreak=()=>L.streak(LS.get('readDays',[]));

// ---------- dashboard ----------
// [route, icon, EN, UR, size] — 'L' = large 2-column card, otherwise compact
const TILES=[['#/quran','quran','Quran','قرآن','L'],['#/mushaf','mushaf','Mushaf','مصحف','L'],['#/duas','duas','Duas & Azkar','دعائیں و اذکار','L'],['#/prayer','prayer','Prayer times','اوقاتِ نماز','L'],['#/tasbeeh','tasbeeh','Tasbeeh','تسبیح','L'],['#/qibla','qibla','Qibla','قبلہ','L'],
 ['#/names','names','99 Names','اسماء الحسنیٰ'],['#/tracker','tracker','Prayer tracker','نماز ٹریکر'],['#/khatam','khatam','Khatam','ختم پلانر'],['#/hifz','hifz','Hifz','حفظ'],['#/calendar','calendar','Calendar','اسلامی کیلنڈر'],['#/ramadan','ramadan','Ramadan','رمضان'],
 ['#/zakat','zakat','Zakat','زکوٰۃ'],['#/mosques','mosques','Mosques','قریبی مساجد'],['#/hadith','hadith','Hadith','حدیث'],['#/notes','notes','Notes','نوٹس'],['#/search','search','Search','تلاش'],['#/settings','settings','Settings','ترتیبات']];
const SUB={quran:['114 surahs · 30 paras','114 سورتیں · 30 پارے'],mushaf:['604 pages','604 صفحات'],duas:['Morning, evening, Hisn','صبح، شام، حصن'],prayer:['Times & alerts','اوقات و الرٹس'],tasbeeh:['Counter & history','کاؤنٹر'],qibla:['Compass','کمپاس']};
const grid=list=>{const big=list.filter(x=>x[4]),sm=list.filter(x=>!x[4]);
 return `<div class="fgrid">${big.map(([h,i,e,u])=>`<a class="fcard" href="${h}">${I.corner}<span class="fi">${I.icon(i)}</span><b>${tt(e,u)}</b><small>${SUB[i]?tt(...SUB[i]):''}</small></a>`).join('')}</div>
 <div class="cgrid">${sm.map(([h,i,e,u])=>`<a class="ccard" href="${h}"><span class="fi">${I.icon(i)}</span><span>${tt(e,u)}</span></a>`).join('')}</div>`};
function nowPrayer(){const n=new Date(),pt=PR.times(n);let cur='isha';for(const k of PR.PRAYERS)if(pt[k]<=n)cur=k;return cur}
const STORIES=[['#aotd','st-ayah','Ayah of day','آج کی آیت'],['#/duas/daily-dua','st-dua','Dua of day','آج کی دعا'],['#/names','st-names','99 Names','اسماء'],['#/tasbeeh','st-tasbeeh','Tasbeeh','تسبیح'],['#/ramadan','st-ramadan','Ramadan','رمضان']];
export async function dashboard(){C.setTitle(tt('Quran Safar','قرآن سفر'));document.body.classList.add('is-home');const [AR,tr,list]=await Promise.all([C.arabic([L.ayahOfDay().s]),C.transFor(L.ayahOfDay().s),C.surahs()]);
 const {s,a}=L.ayahOfDay(),lr=LS.get('lastRead'),st=readStreak(),kp=LS.get('khatam');const nx=PR.next();const plan=kp?L.khatamPlan({current:kp.page,end:kp.end}):null;const B=import.meta.env.BASE_URL;
 app().innerHTML=`<section class="hero">
  <div class="htop"><a class="round" href="#/more" aria-label="${tt('Menu','مینو')}">${I.icon('menu')}</a><div class="htitle"><b class="appname">${tt('Quran Safar','قرآن سفر')}</b><small>${PR.hijri(new Date(),S().ui)} · <span class="streak" id="streak"><b>${st}</b> ${tt('day streak','دن مسلسل')}</span></small></div></div>
  <a class="pcard" href="#/prayer">${I.mosqueArt}<div class="pnow"><small>${tt('Now','اب')}</small><b>${C.pn(nowPrayer())}</b></div>${nx?`<span class="parr">→</span><div class="pnext"><small>${tt('Next','اگلی')} · ${PR.fmt12(nx.time)}</small><b>${C.pn(nx.key)}</b><span class="cd" data-at="${+nx.time}"></span></div>`:''}</a>
  <div class="stories">${STORIES.map(([h,img,e,u])=>`<a class="story" href="${h}"><img src="${B}img/${img}.webp" alt="" width="68" height="68" loading="lazy"><span>${tt(e,u)}</span></a>`).join('')}</div>
  <div class="srow"><form class="sbar" id="hs">${I.icon('search')}<input id="hq" aria-label="${tt('Search','تلاش')}" placeholder="${C.t('q')}"></form><a class="round heart" href="#/bookmarks" aria-label="${tt('Favourites','پسندیدہ')}">${I.icon('heart')}</a></div>
 </section>
 <div class="quick">${[['#/bookmarks','bookmarks','Bookmarks','نشانیاں'],['#/notes','notes','Notes','نوٹس'],['#/duas','duas','Duas','دعائیں'],['#/help','help','FAQ','سوالات']].map(([h,i,e,u])=>`<a href="${h}"><span class="fi">${I.icon(i)}</span>${tt(e,u)}</a>`).join('')}</div>
 <section class="dsec">
 ${lr?`<a class="card hl cont" href="#/surah/${lr.s}/${lr.a}">${I.icon('quran')}<span>${C.t('lastRead')}<br><b>${esc(lr.name)} ${lr.s}:${lr.a}</b></span></a>`:`<a class="card hl cont" href="#/surah/1">${I.icon('quran')}<span>${tt('Start reading','پڑھنا شروع کریں')}</span></a>`}
 ${plan?`<a class="card kcard" href="#/khatam">${I.icon('khatam')} ${tt('Khatam','ختم')}: <b>${plan.pct}%</b> · ${tt('today','آج')} ${plan.perDay} ${tt('pages','صفحات')}<div class="prog"><i style="width:${plan.pct}%"></i></div></a>`:''}
 ${grid(TILES)}
 <div class="card aotd" id="aotd">${I.corner}<small class="muted">${tt('Ayah of the day','آج کی آیت')} · ${esc(list[s-1].englishName)} ${s}:${a}</small><p class="ar" dir="rtl" lang="ar">${esc(L.ayahText(s,a,AR[s-1][a-1]))}</p><p class="tr" dir="${tr.edition.direction==='rtl'?'rtl':'ltr'}">${esc(tr.texts[a-1]||'')}</p>
 <div class="bar"><a class="btn" href="#/surah/${s}/${a}">${I.icon('quran')} ${tt('Open','کھولیں')}</a><button class="btn ghost" id="aShare">${I.icon('share')} ${tt('Share image','تصویر شیئر')}</button></div></div>
 </section>`;
 $('#aShare').onclick=()=>shareAyah(s,a);$('#hs').onsubmit=e=>{e.preventDefault();location.hash='#/search/'+encodeURIComponent($('#hq').value)};
 app().querySelector('a[href="#aotd"]').onclick=e=>{e.preventDefault();$('#aotd').scrollIntoView({behavior:'smooth',block:'center'})};C.tick()}
export function more(){C.setTitle(tt('More','مزید'));app().innerHTML=`<section class="dsec">${grid(TILES)}</section><p class="ver" id="ver">Quran Safar v${__APP_VERSION__}</p>`}
export function ibadat(){C.setTitle(tt('Ibadat','عبادات'));const k=['#/prayer','#/qibla','#/tasbeeh','#/duas','#/tracker','#/ramadan','#/calendar','#/zakat','#/mosques','#/names'];app().innerHTML=`<section class="dsec">${grid(k.map((h,i)=>{const x=TILES.find(t=>t[0]===h);return i<4?[...x.slice(0,4),'L']:x.slice(0,4)}))}</section>`}
export function help(){C.setTitle(tt('FAQ & Help','سوالات و مدد'));const Q=[['How does Practice help work?','Open a surah, tap 🎙 Practice help, then Start and recite aloud. Words turn green as they are heard. If a word is clearly wrong or missed, the correct word is shown with its pronunciation and a ▶ button to hear it. Amber means unclear: repeat if you like. It checks words only, not full tajweed. The first use downloads a speech model once (about 77 MB); your voice is processed on your phone and never uploaded.','سورت کھولیں، 🎙 مشق میں مدد دبائیں اور تلاوت کریں۔ سنے گئے الفاظ سبز ہو جاتے ہیں۔ واضح غلطی یا چھوٹا ہوا لفظ ہو تو درست لفظ اور اس کی آواز دکھائی جاتی ہے۔ پیلا مطلب غیر واضح۔ یہ صرف الفاظ چیک کرتا ہے، مکمل تجوید نہیں۔ پہلی بار تقریباً 77 MB ماڈل ڈاؤن لوڈ ہوتا ہے؛ آپ کی آواز فون پر ہی رہتی ہے۔'],['Does it work offline?','The full Quran text, English & Urdu translations, duas, 99 Names and mushaf pages are bundled. Audio, tafsir and hadith need internet the first time.','کیا یہ آف لائن کام کرتی ہے؟','مکمل قرآن، ترجمہ، دعائیں اور مصحف صفحات ایپ میں شامل ہیں۔ آڈیو، تفسیر اور حدیث کے لیے انٹرنیٹ درکار ہے۔'],['How are prayer times calculated?','On your phone, from your city or GPS location and the calculation method you choose in Prayer settings.','نماز کے اوقات کیسے نکلتے ہیں؟','آپ کے شہر یا GPS اور منتخب طریقے کے مطابق ایپ میں حساب ہوتا ہے۔'],['How do I enable alerts?','Open Prayer times and tap “Enable prayer alerts”, then allow notifications.','الرٹس کیسے فعال کریں؟','نماز کے صفحے پر “الرٹس فعال کریں” دبائیں اور اجازت دیں۔'],['Is my data private?','Bookmarks, notes and trackers stay on your device. No account, no ads, no cookies. We only count anonymous, aggregate usage (e.g. how many times the prayer screen is opened) with GoatCounter, with no personal data. Turn on Do Not Track to switch this off.','کیا میرا ڈیٹا محفوظ ہے؟','نشانیاں، نوٹس اور ٹریکر صرف آپ کے فون پر رہتے ہیں۔ کوئی اکاؤنٹ، اشتہار یا کوکی نہیں۔ ہم صرف گمنام مجموعی استعمال (مثلاً نماز کا صفحہ کتنی بار کھلا) GoatCounter سے گنتے ہیں، کوئی ذاتی معلومات نہیں۔ Do Not Track آن کرنے سے یہ بند ہو جاتا ہے۔']];
 app().innerHTML=Q.map(([q,a,uq,ua])=>`<details class="card faq"><summary>${I.icon('help')} <b>${tt(q,uq)}</b></summary><p>${tt(a,ua)}</p></details>`).join('')+`<section class="card" id="credits"><h2 class="h3">${tt('About & Credits','تعارف و حوالہ جات')}</h2><p class="muted">Quran Safar v${__APP_VERSION__}</p><ul class="credits">
 <li>Quran text: Tanzil Project (tanzil.net), CC BY 3.0, unmodified text</li><li>Quran translations & tafsir editions via AlQuran.cloud; word-by-word & Indo-Pak script via Quran.com API</li><li>Recitation audio: Islamic Network CDN (EveryAyah reciters)</li>
 <li>Hadith collections: fawazahmed0/hadith-api; reference numbers cross-checked with sunnah.com</li><li>Duas: fitrahive/dua-dhikr (MIT), Hisn al-Muslim JSON (MIT); Hisn al-Muslim audio: hisnmuslim.com</li><li>99 Names: AlAdhan API</li>
 <li>Prayer times: Adhan library (MIT) · Maps: © OpenStreetMap contributors (ODbL), Overpass API, Nominatim, Leaflet</li><li>Anonymous usage counts: GoatCounter (no cookies)</li><li>Practice help speech model: tarteel-ai/whisper-base-ar-quran (Apache-2.0), ONNX conversion; runs on-device via Transformers.js (Apache-2.0) and ONNX Runtime Web (MIT)</li><li>Fonts: Amiri Quran, Scheherazade New, Noto Nastaliq Urdu, Inter (SIL OFL)</li></ul></section>`}

// ---------- share ayah as image ----------
export async function ayahCard(s,a){const [AR,tr,list]=await Promise.all([C.arabic([s]),C.transFor(s),C.surahs()]);const W=1080,H=1350,cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');
 try{await Promise.all([document.fonts.load('48px "Amiri Quran"'),document.fonts.load('32px "Noto Nastaliq Urdu"')])}catch{}
 const gr=g.createLinearGradient(0,0,W,H);gr.addColorStop(0,'#0f766e');gr.addColorStop(1,'#064e3b');g.fillStyle=gr;g.fillRect(0,0,W,H);
 g.strokeStyle='rgba(255,255,255,.35)';g.lineWidth=4;g.strokeRect(40,40,W-80,H-80);g.fillStyle='#fff';g.textAlign='center';
 const arT=L.ayahText(s,a,AR[s-1][a-1]);let fs=64;g.direction='rtl';let lines;do{g.font=`${fs}px "Amiri Quran", serif`;lines=L.wrapText(arT,W-200,x=>g.measureText(x).width);fs-=4}while(lines.length*fs*1.9>620&&fs>28);
 let y=170;lines.forEach(l=>{g.fillText(l,W/2,y+=fs*1.9)});
 const trT=tr.texts[a-1]||'',isRtl=tr.edition.direction==='rtl';g.direction=isRtl?'rtl':'ltr';let fs2=38,l2;do{g.font=`${fs2}px ${isRtl?'"Noto Nastaliq Urdu"':'Inter, sans-serif'}`;l2=L.wrapText(trT,W-200,x=>g.measureText(x).width);fs2-=2}while(l2.length*fs2*1.6>H-y-260&&fs2>18);
 g.fillStyle='rgba(255,255,255,.92)';y+=50;l2.forEach(l=>g.fillText(l,W/2,y+=fs2*(isRtl?2:1.5)));
 g.direction='ltr';g.font='600 34px Inter, sans-serif';g.fillStyle='#fde68a';g.fillText(`${list[s-1].englishName} ${s}:${a}`,W/2,H-140);g.font='28px Inter, sans-serif';g.fillStyle='rgba(255,255,255,.7)';g.fillText('Quran Safar',W/2,H-90);
 return cv}
export async function shareAyah(s,a){GC.event('share-ayah-image');const cv=await ayahCard(s,a);const blob=await new Promise(r=>cv.toBlob(r,'image/png'));const file=new File([blob],`ayah-${s}-${a}.png`,{type:'image/png'});
 if(navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:`Quran ${s}:${a}`});return 'shared'}catch(e){if(e.name==='AbortError')return 'cancelled'}}
 const u=URL.createObjectURL(blob);const sh=$('#sheet');sh.hidden=false;$('#sheetBody').innerHTML=`<h2 class="h3">${tt('Ayah image','آیت کی تصویر')}</h2><img id="cardImg" src="${u}" alt="Ayah ${s}:${a}" style="width:100%;border-radius:12px"><p><a class="btn" download="ayah-${s}-${a}.png" href="${u}">⬇ ${tt('Download','ڈاؤن لوڈ')}</a></p>`;return 'download'}

// ---------- universal share (hadith, duas, 99 names) ----------
const SH=[];export const shareBtn=item=>{SH.push(item);return `<button class="shr" data-shr="${SH.length-1}" aria-label="${tt('Share','شیئر')}">${I_('share')}</button>`};
export const shareText=it=>[it.ar,it.tr,`— ${it.ref}`,'via Quran Safar',it.url].filter(Boolean).join('\n\n');
async function nativeShare(o){try{const {Capacitor}=await import('@capacitor/core');if(Capacitor.isNativePlatform()){const {Share}=await import('@capacitor/share');await Share.share(o);return true}}catch{}return false}
export async function textCard(it){const W=1080,H=1350,cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');
 try{await Promise.all([document.fonts.load('48px "Amiri Quran"'),document.fonts.load('32px "Noto Nastaliq Urdu"')])}catch{}
 const gr=g.createLinearGradient(0,0,W,H);gr.addColorStop(0,'#1d6b47');gr.addColorStop(1,'#0b2e22');g.fillStyle=gr;g.fillRect(0,0,W,H);g.strokeStyle='rgba(217,178,95,.7)';g.lineWidth=4;g.strokeRect(40,40,W-80,H-80);g.textAlign='center';g.fillStyle='#fff';
 let y=120,fs=it.ar.length>400?40:58,lines;g.direction='rtl';do{g.font=`${fs}px "Amiri Quran", serif`;lines=L.wrapText(it.ar,W-200,x=>g.measureText(x).width);fs-=3}while(lines.length*fs*1.8>(it.tr?560:900)&&fs>22);lines.forEach(l=>g.fillText(l,W/2,y+=fs*1.8));
 if(it.tr){const rtl=/[\u0600-\u06ff]/.test(it.tr.slice(0,40));g.direction=rtl?'rtl':'ltr';let f2=36,l2;do{g.font=`${f2}px ${rtl?'"Noto Nastaliq Urdu"':'Inter, sans-serif'}`;l2=L.wrapText(it.tr,W-200,x=>g.measureText(x).width);f2-=2}while(l2.length*f2*(rtl?2:1.5)>H-y-280&&f2>16);g.fillStyle='rgba(255,255,255,.92)';y+=40;l2.forEach(l=>g.fillText(l,W/2,y+=f2*(rtl?2:1.5)))}
 g.direction='ltr';g.font='600 34px Inter, sans-serif';g.fillStyle='#fde68a';g.fillText(it.ref,W/2,H-140);g.font='28px Inter, sans-serif';g.fillStyle='rgba(255,255,255,.7)';g.fillText('Quran Safar',W/2,H-90);return cv}
export function openShare(it){const txt=shareText(it);$('#sheet').hidden=false;
 $('#sheetBody').innerHTML=`<h2 class="h3">${tt('Share','شیئر کریں')}</h2><pre class="shtxt" id="shTxt">${esc(txt)}</pre>
 <div class="shgrid"><button class="btn" id="shText">${I_('share')} ${tt('Share text','متن شیئر')}</button><a class="btn wa" id="shWa" onclick="window.__gcShare&&window.__gcShare('share-whatsapp')" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(txt)}">${I_('whatsapp')} WhatsApp</a>
 <button class="btn ghost" id="shCopy">${I_('copy')} ${tt('Copy','کاپی')}</button><button class="btn ghost" id="shImg">${I_('image')} ${tt('Share image','تصویر شیئر')}</button></div><div id="shOut"></div>`;
 $('#shText').onclick=async()=>{GC.event('share-text');if(await nativeShare({title:it.ref,text:txt}))return;if(navigator.share){try{await navigator.share({title:it.ref,text:txt})}catch{}}else copy()};
 const copy=async()=>{GC.event('share-copy');try{await navigator.clipboard.writeText(txt)}catch{const t=document.createElement('textarea');t.value=txt;document.body.append(t);t.select();document.execCommand('copy');t.remove()}C.toast(tt('Copied','کاپی ہو گیا'))};$('#shCopy').onclick=copy;
 $('#shImg').onclick=async()=>{GC.event('share-image');const cv=await textCard(it);const blob=await new Promise(r=>cv.toBlob(r,'image/png'));const name=it.ref.replace(/\W+/g,'-')+'.png';const file=new File([blob],name,{type:'image/png'});
  if(navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:it.ref});return}catch(e){if(e.name==='AbortError')return}}
  const u=URL.createObjectURL(blob);$('#shOut').innerHTML=`<img id="cardImg" src="${u}" alt="${esc(it.ref)}" style="width:100%;border-radius:14px;margin-top:10px"><p><a class="btn" download="${name}" href="${u}">${tt('Download','ڈاؤن لوڈ')}</a></p>`}}
document.addEventListener('click',e=>{const b=e.target.closest('[data-shr]');if(b){e.stopPropagation();openShare(SH[+b.dataset.shr])}},true);
window.__gcShare=n=>GC.event(n);
export const siteUrl=h=>location.origin+location.pathname+h;

// ---------- tasbeeh ----------
const DHIKR=[['سُبْحَانَ ٱللَّٰهِ','SubhanAllah'],['ٱلْحَمْدُ لِلَّٰهِ','Alhamdulillah'],['ٱللَّٰهُ أَكْبَرُ','Allahu Akbar'],['لَا إِلَٰهَ إِلَّا ٱللَّٰهُ','La ilaha illallah'],['أَسْتَغْفِرُ ٱللَّٰهَ','Astaghfirullah'],['ٱللَّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ','Salawat']];
export function tasbeeh(){C.setTitle(tt('Tasbeeh','تسبیح'));const st=LS.get('tasbeeh',{i:0,count:0,target:33,custom:[],hist:[]});const all=[...DHIKR,...st.custom.map(c=>[c,c])];if(st.i>=all.length)st.i=0;
 const draw=()=>{const [arT]=all[st.i];app().innerHTML=`<div class="bar"><select id="dk" aria-label="Dhikr">${all.map((d,i)=>`<option value="${i}" ${i===st.i?'selected':''}>${esc(d[1])}</option>`).join('')}</select><button class="btn" id="dkAdd">＋</button></div>
 <div class="bar">${[33,34,100,0].map(n=>`<button class="btn ${st.target===n||(n===0&&![33,34,100].includes(st.target))?'on':''}" data-tg="${n}">${n||tt('Custom','اپنی')}</button>`).join('')}</div>
 <button id="tap" class="tap"><span class="ar">${esc(arT)}</span><b id="cnt">${st.count}</b><small>/ ${st.target} · ${tt('round','چکر')} ${Math.floor(st.count/st.target)+ (st.count%st.target?1:0)||1}</small></button>
 <div class="bar c"><button class="btn" id="tReset">↺ ${tt('Save & reset','محفوظ کر کے صفر')}</button><button class="btn" id="tUndo">−1</button></div>
 <h2 class="h3">${tt('History','تاریخچہ')}</h2><ul class="list">${st.hist.slice(0,30).map(h=>`<li class="row"><span class="grow"><b>${esc(h.d)}</b><small>${esc(h.date)}</small></span><b>${h.n}</b></li>`).join('')||`<li class="muted">${C.t('none')}</li>`}</ul>`;
  $('#dk').onchange=e=>{commit();st.i=+e.target.value;save();draw()};
  $('#dkAdd').onclick=()=>{const v=prompt(tt('New dhikr text','نیا ذکر'));if(v?.trim()){st.custom.push(v.trim());all.push([v.trim(),v.trim()]);st.i=all.length-1;st.count=0;save();draw()}};
  app().querySelectorAll('[data-tg]').forEach(b=>b.onclick=()=>{let n=+b.dataset.tg;if(!n){n=parseInt(prompt(tt('Target count','ہدف'),'99'));if(!(n>0))return}st.target=n;save();draw()});
  $('#tap').onclick=()=>{st.count++;save();$('#cnt').textContent=st.count;if(st.count%st.target===0){vib([80,60,80]);C.toast(tt(`${st.target} completed`,`${st.target} مکمل`));draw()}else vib(15)};
  $('#tUndo').onclick=()=>{st.count=Math.max(0,st.count-1);save();draw()};$('#tReset').onclick=()=>{commit();st.count=0;save();draw()}};
 const commit=()=>{if(st.count>0)st.hist.unshift({d:all[st.i][1],n:st.count,date:new Date().toLocaleString()});st.hist=st.hist.slice(0,200)};
 const save=()=>LS.set('tasbeeh',st);draw()}

// ---------- duas & azkar ----------
const DTABS=[['morning-dhikr','Morning','صبح'],['evening-dhikr','Evening','شام'],['dhikr-after-salah','After Salah','نماز کے بعد'],['daily-dua','Daily','روزمرہ'],['selected-dua','Selected','منتخب'],['hisn','Hisn al-Muslim','حصن المسلم']];
export async function duas(tab='morning-dhikr',ch){C.setTitle(tt('Duas & Azkar','دعائیں و اذکار'));C.loading();
 const head=`<div class="tabs scroll">${DTABS.map(([k,e,u])=>`<a href="#/duas/${k}" class="${k===tab?'on':''}">${tt(e,u)}</a>`).join('')}</div>`;
 if(tab==='hisn'){const H=await X('hisn.json');
  if(!ch){app().innerHTML=head+`<input id="hf" class="inp" aria-label="Filter" placeholder="${tt('Search chapters…','باب تلاش کریں…')}"><ul class="list" id="hl">${H.map(c=>`<li data-q="${esc(c.t.toLowerCase())}"><a href="#/duas/hisn/${c.id}"><b class="num">${c.id}</b><span><b>${esc(c.t)}</b><small>${c.items.length} ${tt('duas','دعائیں')}</small></span></a></li>`).join('')}</ul>`;
   $('#hf').oninput=e=>{const q=e.target.value.toLowerCase();app().querySelectorAll('#hl li').forEach(li=>li.hidden=!li.dataset.q.includes(q))};return}
  const c=H.find(x=>x.id===+ch);if(!c){location.hash='#/duas/hisn';return}C.setTitle(c.t);return items(head,c.items.map((x,i)=>({...x,key:'h'+c.id+'_'+i})),c.au)}
 const D=await X('duas.json');return items(head,(D[tab]||[]).map((x,i)=>({...x,key:tab+i})))}
function items(head,list,chAudio){const k='azkar_'+ymd(new Date());const prog=LS.get(k,{});
 app().innerHTML=head+(chAudio?`<button class="btn" data-au="${esc(chAudio)}">${I_('speaker')} ${tt('Play chapter audio','باب کی آڈیو')}</button>`:'')+`<p class="muted">${tt('Tap the counter each time you recite.','ہر بار پڑھنے پر کاؤنٹر دبائیں۔')}</p>`+list.map(x=>{const done=prog[x.key]||0;return `<article class="ayah dua ${done>=x.n?'done':''}">${x.t?`<b>${esc(x.t)}</b>`:''}<p class="ar" dir="rtl" lang="ar">${esc(x.ar)}</p>${x.lat?`<p class="muted lat">${esc(x.lat)}</p>`:''}<p class="tr">${esc(x.en)}</p>${x.note?`<small class="muted">${esc(x.note)}</small>`:''}${x.src?`<small class="muted">— ${esc(x.src)}</small>`:''}
 <div class="tools"><button class="btn cnt" data-k="${x.key}" data-n="${x.n}">${done}/${x.n}</button>${x.au?`<button data-au="${esc(x.au)}" aria-label="Play audio">${I_('speaker')}</button>`:''}${shareBtn({ar:x.ar,tr:x.en,ref:(x.t||x.src||tt('Dua','دعا')).toString().slice(0,60),url:siteUrl(location.hash)})}</div></article>`}).join('');
 app().onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.k){const p=LS.get(k,{});const n=+b.dataset.n;p[b.dataset.k]=Math.min(n,(p[b.dataset.k]||0)+1);LS.set(k,p);b.textContent=`${p[b.dataset.k]}/${n}`;if(p[b.dataset.k]>=n){b.closest('.dua').classList.add('done');vib([60,40,60])}else vib(15)}
  if(b.dataset.au)C.playUrl(b.dataset.au,tt('Dua','دعا'))}}

// ---------- 99 names ----------
export async function names(){C.setTitle(tt('99 Names of Allah','اسماء الحسنیٰ'));const N=await X('names.json');
 app().innerHTML=`<input id="nf" class="inp" aria-label="Filter" placeholder="${tt('Search names…','نام تلاش کریں…')}"><div class="names" id="nl">${N.map(n=>`<button class="name" data-n="${n.n}" data-q="${esc((n.tr+' '+n.en+' '+n.ur+' '+n.ar).toLowerCase())}"><small>${n.n}</small><span class="ar">${esc(n.ar)}</span><b>${esc(n.tr)}</b><small>${esc(ur()?n.ur:n.en)}</small></button>`).join('')}</div>`;
 $('#nf').oninput=e=>{const q=e.target.value.toLowerCase();const nz=x=>x.replace(/[-'`’ ]/g,'').replace(/(.)\1+/g,'$1');app().querySelectorAll('.name').forEach(b=>b.hidden=!nz(b.dataset.q).includes(nz(q)))};
 app().onclick=e=>{const b=e.target.closest('.name');if(!b)return;const n=N[+b.dataset.n-1];$('#sheet').hidden=false;$('#sheetBody').innerHTML=`<div class="c"><div class="ar big">${esc(n.ar)}</div><h2 class="h3">${n.n}. ${esc(n.tr)}</h2><p><b>${esc(n.en)}</b></p><p class="ur" dir="rtl"><b>${esc(n.ur)}</b></p></div><p>${esc(n.enD||'')}</p><p class="ur" dir="rtl">${esc(n.urD||'')}</p><div class="c">${shareBtn({ar:n.ar,tr:`${n.tr} — ${ur()?n.ur:n.en}${(ur()?n.urD:n.enD)?'\n'+(ur()?n.urD:n.enD):''}`,ref:`${tt('99 Names of Allah','اسماء الحسنیٰ')} · ${n.n}. ${n.tr}`,url:siteUrl('#/names')})}</div>`}}

// ---------- prayer tracker + qaza ----------
const FIVE=['fajr','dhuhr','asr','maghrib','isha'];
export function tracker(){C.setTitle(tt('Prayer tracker','نماز ٹریکر'));const T=LS.get('ptrack',{days:{},qaza:{fajr:0,dhuhr:0,asr:0,maghrib:0,isha:0,witr:0}});
 const draw=()=>{const days=[...Array(7)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-i);return ymd(d)});const today=T.days[days[0]]||{};const done=FIVE.filter(k=>today[k]==='done').length;
 const week=days.reduce((n,d)=>n+FIVE.filter(k=>(T.days[d]||{})[k]==='done').length,0);
 app().innerHTML=`<div class="card c"><b>${tt('Today','آج')}: ${done}/5</b> · <small class="muted">${tt('Last 7 days','پچھلے 7 دن')}: ${week}/35</small><div class="prog"><i style="width:${done*20}%"></i></div></div>
 <table class="grid"><thead><tr><th></th>${FIVE.map(k=>`<th>${C.pn(k)}</th>`).join('')}</tr></thead><tbody>${days.map((d,i)=>`<tr><th>${i?new Date(d+'T12:00').toLocaleDateString(ur()?'ur-PK':'en-GB',{weekday:'short',day:'numeric'}):tt('Today','آج')}</th>${FIVE.map(k=>{const v=(T.days[d]||{})[k];return `<td><button class="pt ${v||''}" data-d="${d}" data-k="${k}" aria-label="${k} ${d}: ${v||'not marked'}">${v==='done'?'✓':v==='missed'?'✗':'·'}</button></td>`}).join('')}</tr>`).join('')}</tbody></table>
 <small class="muted">${tt('Tap: ✓ prayed → ✗ missed (adds to qaza) → clear','دبائیں: ✓ ادا → ✗ قضا (قضا میں شامل) → صاف')}</small>
 <h2 class="h3">${tt('Qaza (missed prayers to make up)','قضا نمازیں')}</h2><ul class="list">${Object.keys(T.qaza).map(k=>`<li class="row"><span class="grow"><b>${k==='witr'?tt('Witr','وتر'):C.pn(k)}</b></span><button class="btn" data-q="${k}" data-v="-1" aria-label="Made up one ${k}">−</button><b class="qz" id="q_${k}">${T.qaza[k]}</b><button class="btn" data-q="${k}" data-v="1" aria-label="Add one ${k}">＋</button></li>`).join('')}</ul>
 <p class="muted">${tt('Total qaza','کل قضا')}: <b id="qt">${Object.values(T.qaza).reduce((a,b)=>a+b,0)}</b></p>`};
 draw();app().onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.d){const dd=T.days[b.dataset.d]||(T.days[b.dataset.d]={});const cur=dd[b.dataset.k];const nxt=cur==='done'?'missed':cur==='missed'?undefined:'done';if(nxt==='missed')T.qaza[b.dataset.k]++;if(cur==='missed')T.qaza[b.dataset.k]=Math.max(0,T.qaza[b.dataset.k]-1);if(nxt)dd[b.dataset.k]=nxt;else delete dd[b.dataset.k];LS.set('ptrack',T);vib(10);draw()}
  if(b.dataset.q){T.qaza[b.dataset.q]=Math.max(0,T.qaza[b.dataset.q]+ +b.dataset.v);LS.set('ptrack',T);draw()}}}

// ---------- khatam planner ----------
export async function khatam(){C.setTitle(tt('Khatam planner','ختم پلانر'));let K=LS.get('khatam');const pages=await X('pages.json');
 const def=new Date();def.setDate(def.getDate()+30);
 if(!K){app().innerHTML=`<div class="form"><p>${tt('Plan a complete reading of the Quran (604 pages).','پورے قرآن (604 صفحات) کی تلاوت کا منصوبہ بنائیں۔')}</p><label>${tt('Finish by','ختم کی تاریخ')}<input type="date" id="kEnd" value="${ymd(def)}"></label><div class="bar">${[[30,'30 days'],[60,'60 days'],[29,'Ramadan']].map(([d,l])=>`<button class="btn" data-days="${d}">${l}</button>`).join('')}</div><label>${tt('Daily reminder','روزانہ یاددہانی')}<input type="time" id="kTime" value="20:00"></label><button class="btn pri" id="kGo">${tt('Start plan','منصوبہ شروع کریں')}</button></div>`;
  app().querySelectorAll('[data-days]').forEach(b=>b.onclick=()=>{const d=new Date();d.setDate(d.getDate()+ +b.dataset.days);$('#kEnd').value=ymd(d)});
  $('#kGo').onclick=async()=>{K={start:ymd(new Date()),end:$('#kEnd').value,page:0,time:$('#kTime').value,log:{}};LS.set('khatam',K);await remind();khatam()};return}
 const p=L.khatamPlan({current:K.page,end:K.end});const nextP=Math.min(604,K.page+1);const [s,a]=pages[nextP-1];
 app().innerHTML=`<div class="card c"><div class="big"><b>${p.pct}%</b></div><div class="prog"><i style="width:${p.pct}%"></i></div><p>${tt('Page','صفحہ')} <b>${K.page}</b>/604 · ${p.remaining} ${tt('left','باقی')} · ${p.daysLeft} ${tt('days','دن')}</p><p>${I_('khatam')} ${tt('Daily target','روزانہ ہدف')}: <b id="kTarget">${p.perDay}</b> ${tt('pages','صفحات')}</p>${p.done?`<p>${I_('party')} ${tt('Khatam complete! May Allah accept it.','ختم مکمل! اللہ قبول فرمائے۔')}</p>`:''}</div>
 <div class="bar"><a class="btn pri" href="#/mushaf/${nextP}">${I_('mushaf')} ${tt('Continue at page','صفحہ سے جاری')} ${nextP} (${s}:${a})</a></div>
 <div class="form"><label>${tt('I have read up to page','میں نے صفحہ تک پڑھ لیا')}<input type="number" id="kPage" min="0" max="604" value="${K.page}"></label><button class="btn" id="kSave">✓ ${tt('Update','محفوظ')}</button><button class="btn" id="kPlus">+${p.perDay} ${tt('pages (today’s target)','صفحات (آج کا ہدف)')}</button>
 <label>${tt('Daily reminder','روزانہ یاددہانی')}<input type="time" id="kTime" value="${K.time||''}"></label><small id="kMsg" class="muted"></small><button class="btn" id="kDel">${I_('trash')} ${tt('Reset plan','منصوبہ ختم کریں')}</button></div>`;
 const upd=v=>{K.page=Math.max(0,Math.min(604,v));K.log[ymd(new Date())]=K.page;LS.set('khatam',K);markRead();khatam()};
 $('#kSave').onclick=()=>upd(+$('#kPage').value);$('#kPlus').onclick=()=>upd(K.page+p.perDay);$('#kTime').onchange=async e=>{K.time=e.target.value;LS.set('khatam',K);const r=await remind();$('#kMsg').textContent=r.ok?`✓ ${r.count} ${tt('reminders','یاددہانیاں')}`:r.reason};
 $('#kDel').onclick=()=>{if(confirm(tt('Reset khatam plan?','منصوبہ ختم کریں؟'))){localStorage.removeItem('khatam');PR.setReminders('khatam',[]);khatam()}};
 async function remind(){if(!K.time)return PR.setReminders('khatam',[]);const pp=L.khatamPlan({current:K.page,end:K.end});return PR.setReminders('khatam',PR.dailyAt(K.time,7).map(at=>({at,title:tt('Khatam reminder','ختم کی یاددہانی'),body:tt(`Today's target: ${pp.perDay} pages (from page ${K.page+1})`,`آج کا ہدف: ${pp.perDay} صفحات`)}))).catch(e=>({ok:false,reason:e.message}))}}

// ---------- mushaf page view ----------
export async function mushaf(p){p=Math.max(1,Math.min(604,+p||LS.get('mushafPage',1)));C.loading();C.setTitle(`${tt('Page','صفحہ')} ${p}`);LS.set('mushafPage',p);markRead();
 const pages=await X('pages.json');const ays=L.pageAyahs(pages,p);const [AR,list]=await Promise.all([C.arabic(ays.map(x=>x[0])),C.surahs()]);let indo=null;
 if(S().script==='indopak'){try{const d=await C.j(`https://api.quran.com/api/v4/quran/verses/indopak?page_number=${p}`);indo=Object.fromEntries((d.verses||[]).map(v=>[v.verse_key,v.text_indopak]))}catch{C.toast(tt('Indo-Pak script needs internet the first time; showing Uthmani.','انڈو پاک رسم الخط کے لیے انٹرنیٹ درکار؛ عثمانی دکھایا جا رہا ہے۔'))}}
 const juz=L.JUZ.filter(([s,a])=>s*1000+a<=ays[0][0]*1000+ays[0][1]).length;
 let h='',cur=0;for(const [s,a] of ays){if(s!==cur&&a===1){h+=`<div class="sh"><span class="ar">${esc(list[s-1].name)}</span></div>${s!==1&&s!==9?'<div class="ar bism c">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>':''}`}cur=s;
  const txt=indo?.[`${s}:${a}`]?.replace(/[\u200f\u06DD]|[٠-٩۰-۹]+\s*$/g,'').trim()||L.ayahText(s,a,AR[s-1][a-1]);h+=`<span class="mv" data-r="${s}:${a}">${esc(txt)} <span class="end">﴿${ar(a)}﴾</span></span> `}
 app().innerHTML=`<div class="bar"><select id="msc" aria-label="Script"><option value="uthmani">${tt('Uthmani','عثمانی')}</option><option value="indopak" ${S().script==='indopak'?'selected':''}>${tt('Indo-Pak','انڈو پاک')}</option></select><input type="number" id="mpg" min="1" max="604" value="${p}" aria-label="Page"><button class="btn" id="mgo">${tt('Go','جائیں')}</button></div>
 <div class="mushaf ${indo?'indopak':''}" dir="rtl" lang="ar"><div class="mh"><span>${esc(list[ays[0][0]-1].englishName)}</span><span>${tt('Juz','پارہ')} ${juz}</span></div><p class="mt">${h}</p><div class="mf">${ar(p)}</div></div>
 <div class="pager"><a class="btn" href="#/mushaf/${Math.min(604,p+1)}" ${p>=604?'style="visibility:hidden"':''}>‹ ${p+1}</a><a class="btn" href="#/mushaf/${Math.max(1,p-1)}" ${p<=1?'style="visibility:hidden"':''}>${p-1} ›</a></div>`;
 $('#msc').onchange=e=>{S().script=e.target.value;C.save();mushaf(p)};$('#mgo').onclick=()=>location.hash='#/mushaf/'+$('#mpg').value;
 app().onclick=e=>{const v=e.target.closest('.mv');if(v)location.hash='#/surah/'+v.dataset.r.replace(':','/')};
 // swipe (RTL book: swipe right = next page)
 let x0=null;const m=app().querySelector('.mushaf');m.ontouchstart=e=>x0=e.touches[0].clientX;m.ontouchend=e=>{if(x0==null)return;const dx=e.changedTouches[0].clientX-x0;if(Math.abs(dx)>70)location.hash='#/mushaf/'+Math.max(1,Math.min(604,p+(dx>0?1:-1)));x0=null};document.getElementById('app').scrollTo(0,0)}

// ---------- notes ----------
export const getNotes=()=>LS.get('notes',{});
export function editNote(ref,onSave){const N=getNotes();$('#sheet').hidden=false;$('#sheetBody').innerHTML=`<h2 class="h3">${I_('notes')} ${tt('Note','نوٹ')} ${ref}</h2><textarea id="nt" rows="6" class="inp" aria-label="Note">${esc(N[ref]?.text||'')}</textarea><div class="bar"><button class="btn pri" id="ntSave">${tt('Save','محفوظ')}</button>${N[ref]?`<button class="btn" id="ntDel">${I_('trash')}</button>`:''}</div>`;
 $('#ntSave').onclick=()=>{const v=$('#nt').value.trim();const N2=getNotes();if(v)N2[ref]={text:v,at:Date.now()};else delete N2[ref];LS.set('notes',N2);$('#sheet').hidden=true;C.toast(tt('Note saved','نوٹ محفوظ'));onSave?.(!!v)};
 const d=$('#ntDel');if(d)d.onclick=()=>{const N2=getNotes();delete N2[ref];LS.set('notes',N2);$('#sheet').hidden=true;onSave?.(false)}}
export function notes(){C.setTitle(tt('My notes','میرے نوٹس'));const N=Object.entries(getNotes()).sort((a,b)=>b[1].at-a[1].at);
 app().innerHTML=N.length?N.map(([r,n])=>`<a class="card" href="#/surah/${r.replace(':','/')}"><span class="badge">${r}</span><p>${esc(n.text)}</p><small class="muted">${new Date(n.at).toLocaleString()}</small></a>`).join(''):`<p class="muted c">${tt('No notes yet. Tap the note icon on any ayah.','ابھی کوئی نوٹ نہیں۔ کسی آیت پر نوٹ آئیکن دبائیں۔')}</p>`}

// ---------- Islamic calendar + events ----------
export function calendar(off=0){C.setTitle(tt('Islamic calendar','اسلامی کیلنڈر'));const adj=+PR.P.hijriAdj||0;const now=new Date();const base=new Date(now.getFullYear(),now.getMonth()+ +off,1);
 const days=new Date(base.getFullYear(),base.getMonth()+1,0).getDate();const first=(base.getDay()+6)%7;const evs=L.upcomingEvents(new Date(base.getFullYear(),base.getMonth(),1),days,adj);const evDays=new Set(evs.map(e=>e.date.getDate()));
 const hs=L.hijriParts(new Date(base.getFullYear(),base.getMonth(),1,12),adj),he=L.hijriParts(new Date(base.getFullYear(),base.getMonth(),days,12),adj);const HM=ur()?L.HMONTHS_UR:L.HMONTHS;
 let cells='<div></div>'.repeat(first);for(let d=1;d<=days;d++){const dt=new Date(base.getFullYear(),base.getMonth(),d,12);const h=L.hijriParts(dt,adj);const today=ymd(dt)===ymd(now);cells+=`<div class="cd2 ${today?'today':''} ${evDays.has(d)?'ev':''}"><b>${d}</b><small>${h.d}</small></div>`}
 const up=L.upcomingEvents(now,400,adj).slice(0,8);const rem=LS.get('evRem',false);
 app().innerHTML=`<div class="bar"><a class="btn" href="#/calendar/${+off-1}" aria-label="Previous month">‹</a><b class="grow c">${base.toLocaleDateString(ur()?'ur-PK':'en-GB',{month:'long',year:'numeric'})}<br><small class="muted">${HM[hs.m-1]}${hs.m!==he.m?' – '+HM[he.m-1]:''} ${he.y} AH</small></b><a class="btn" href="#/calendar/${+off+1}" aria-label="Next month">›</a></div>
 <div class="cal">${(ur()?['پیر','منگل','بدھ','جمعرات','جمعہ','ہفتہ','اتوار']:['Mo','Tu','We','Th','Fr','Sa','Su']).map(d=>`<div class="muted c">${d}</div>`).join('')}${cells}</div>
 <h2 class="h3">${tt('Upcoming events','آنے والے ایام')}</h2><ul class="list">${up.map(e=>`<li><span><b>${esc(ur()?e.ur:e.en)}</b><small>${e.hd} ${HM[e.hm-1]} ${e.hy} · ${e.date.toLocaleDateString(ur()?'ur-PK':'en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}</small></span><small>${e.inDays===0?tt('Today','آج'):tt(`in ${e.inDays} d`,`${e.inDays} دن`)}</small></li>`).join('')}</ul>
 <label class="card"><input type="checkbox" id="evR" ${rem?'checked':''}> ${tt('Remind me on event days (9:00 AM)','ایام پر یاددہانی (صبح 9 بجے)')}</label><small id="evMsg" class="muted"></small>
 <p class="muted">${tt('Dates use the Umm al-Qura calendar; local moon sighting may differ by a day — adjust in Prayer › Hijri adjustment.','تاریخیں ام القریٰ کیلنڈر سے ہیں؛ رویت ہلال سے ایک دن کا فرق ممکن ہے۔')}</p>`;
 $('#evR').onchange=async e=>{LS.set('evRem',e.target.checked);const r=await PR.setReminders('events',e.target.checked?L.upcomingEvents(now,400,adj).map(ev=>({at:new Date(ev.date.getFullYear(),ev.date.getMonth(),ev.date.getDate(),9),title:ev.en,body:`${ev.ur} · ${ev.hd} ${L.HMONTHS[ev.hm-1]}`})):[]).catch(er=>({ok:false,reason:er.message}));$('#evMsg').textContent=r.ok?`✓ ${r.count}`:r.reason}}

// ---------- Ramadan: sehri/iftar + fasting tracker ----------
export function ramadan(){C.setTitle(tt('Ramadan','رمضان'));const adj=+PR.P.hijriAdj||0;const R=L.nextRamadan(new Date(),adj);const F=LS.get('fasts_'+R.hy,{});const today=ymd(new Date());
 const rows=R.days.map(({date,hd})=>{const pt=PR.times(date);return `<tr class="${ymd(date)===today?'on':''}"><th>${hd}</th><td>${date.toLocaleDateString(ur()?'ur-PK':'en-GB',{day:'numeric',month:'short',weekday:'short'})}</td><td>${PR.fmt12(pt.fajr)}</td><td>${PR.fmt12(pt.maghrib)}</td><td><input type="checkbox" data-f="${hd}" aria-label="Fasted day ${hd}" ${F[hd]?'checked':''}></td></tr>`}).join('');
 const n=Object.values(F).filter(Boolean).length;const start=R.days[0]?.date;const inD=start?Math.ceil((start-new Date())/864e5):0;
 app().innerHTML=`<div class="card c"><b>${I_('ramadan')} Ramadan ${R.hy} AH</b><br><small class="muted">${inD>0?tt(`Starts in ~${inD} days (${start.toDateString()})`,`تقریباً ${inD} دن میں`):tt('Ramadan Mubarak','رمضان مبارک')} · ${I_('pin')} ${esc(PR.P.city)}</small><p>${tt('Fasts kept','روزے رکھے')}: <b id="fN">${n}</b>/${R.days.length}</p><div class="prog"><i style="width:${n/R.days.length*100}%"></i></div></div>
 <p class="muted">${tt('Sehri ends at Fajr; Iftar at Maghrib (your prayer settings). Many people stop eating a few minutes earlier for caution.','سحری فجر پر ختم؛ افطار مغرب پر (آپ کی نماز کی ترتیبات کے مطابق)۔')}</p>
 <table class="grid rt"><thead><tr><th>#</th><th>${tt('Date','تاریخ')}</th><th>${tt('Sehri ends','سحری')}</th><th>${tt('Iftar','افطار')}</th><th>✓</th></tr></thead><tbody>${rows}</tbody></table>`;
 app().querySelectorAll('[data-f]').forEach(c=>c.onchange=()=>{F[c.dataset.f]=c.checked;LS.set('fasts_'+R.hy,F);$('#fN').textContent=Object.values(F).filter(Boolean).length})}

// ---------- zakat ----------
export function zakat(){C.setTitle(tt('Zakat calculator','زکوٰۃ کیلکولیٹر'));const Z=LS.get('zakat',{currency:'PKR',basis:'silver'});
 const f=(k,en,u,hint='')=>`<label>${tt(en,u)}${hint?` <small class="muted">${hint}</small>`:''}<input type="number" inputmode="decimal" min="0" id="z_${k}" value="${Z[k]??''}"></label>`;
 app().innerHTML=`<div class="form"><label>${tt('Currency','کرنسی')}<input id="z_currency" value="${esc(Z.currency)}" maxlength="5"></label>
 ${f('goldPrice','Gold price per gram','سونے کی قیمت فی گرام','(today’s local rate)')}${f('silverPrice','Silver price per gram','چاندی کی قیمت فی گرام','(today’s local rate)')}
 ${f('cash','Cash & bank balance','نقد و بینک')}${f('gold_g','Gold owned (grams)','سونا (گرام)','1 tola ≈ 11.66 g')}${f('silver_g','Silver owned (grams)','چاندی (گرام)')}${f('business','Business stock / investments','کاروباری مال / سرمایہ')}${f('receivables','Money owed to you','قابل وصول رقم')}${f('debts','Debts due now','واجب الادا قرض')}
 <label>${tt('Nisab basis','نصاب کی بنیاد')}<select id="z_basis"><option value="silver">${tt('Silver (612.36 g) — common Hanafi view','چاندی (612.36 گرام)')}</option><option value="gold" ${Z.basis==='gold'?'selected':''}>${tt('Gold (87.48 g)','سونا (87.48 گرام)')}</option></select></label></div>
 <div class="card c" id="zr"></div><p class="muted">${tt('Zakat is 2.5% of net zakatable wealth held for one lunar year once it reaches nisab. Consult a scholar for your situation.','زکوٰۃ نصاب تک پہنچنے والے مال پر ایک قمری سال گزرنے کے بعد 2.5% ہے۔ اپنی صورت حال کے لیے عالم سے رجوع کریں۔')}</p>`;
 const calc=()=>{app().querySelectorAll('[id^=z_]').forEach(i=>{const k=i.id.slice(2);Z[k]=i.type==='number'?(i.value===''?'':+i.value):i.value});LS.set('zakat',Z);const r=L.zakat(Z);const m=v=>`${esc(Z.currency)} ${Math.round(v).toLocaleString()}`;
  $('#zr').innerHTML=!(Z.silverPrice>0||Z.goldPrice>0)?tt('Enter today’s gold/silver price to compute nisab.','نصاب کے لیے سونے/چاندی کی قیمت درج کریں۔'):`${tt('Net wealth','خالص مال')}: <b>${m(r.net)}</b><br>${tt('Nisab','نصاب')}: ${m(r.nisab)}<br><span class="big" id="zDue">${r.eligible?`${tt('Zakat due','واجب زکوٰۃ')}: <b>${m(r.due)}</b>`:tt('Below nisab — no zakat due','نصاب سے کم — زکوٰۃ واجب نہیں')}</span>`};
 app().oninput=calc;app().onchange=calc;calc()}

// ---------- nearby mosques (OpenStreetMap) ----------
/** Fallback when all Overpass mirrors are unreachable: Nominatim search for mosques/masjids inside a bounding box. */
async function nominatim(lat,lng,rad){const dLat=rad/111320,dLng=rad/(111320*Math.cos(lat*Math.PI/180));const vb=[lng-dLng,lat+dLat,lng+dLng,lat-dLat].map(v=>v.toFixed(5)).join(',');const seen=new Set,out=[];
 for(const q of ['place of worship','mosque']){const r=await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=jsonv2&extratags=1&limit=50&bounded=1&viewbox=${vb}`);if(!r.ok)continue;for(const x of await r.json()){seen.add('q');const rel=x.extratags?.religion;const isM=rel==='muslim'||(!rel&&/mosque|masjid|jamia|مسجد/i.test(x.name||''));if(x.category!=='amenity'||!isM||seen.has(x.osm_id))continue;seen.add(x.osm_id);out.push({name:x.name||'Mosque',lat:+x.lat,lng:+x.lon})}}
 if(!out.length&&seen.size===0)throw new Error('nominatim');return out}
const OVERPASS=['https://overpass-api.de/api/interpreter','https://maps.mail.ru/osm/tools/overpass/api/interpreter','https://overpass.private.coffee/api/interpreter'];
/** Query Overpass with per-mirror timeout and fallback; caches last good result per query for offline use. */
async function overpass(q){const ck='ovp_'+q.length+'_'+q.slice(-60);for(const u of OVERPASS){const ac=new AbortController();const tm=setTimeout(()=>ac.abort(),8000);
 try{const r=await fetch(u,{method:'POST',body:'data='+encodeURIComponent(q),headers:{'Content-Type':'application/x-www-form-urlencoded'},signal:ac.signal});if(!r.ok)throw new Error(r.status);const d=await r.json();try{localStorage.setItem(ck,JSON.stringify(d))}catch{}return d}catch{}finally{clearTimeout(tm)}}
 const c=localStorage.getItem(ck);if(c)return JSON.parse(c);throw new Error('overpass unavailable')}
export async function mosques(){C.setTitle(tt('Nearby mosques','قریبی مساجد'));const P=PR.P;
 app().innerHTML=`<div class="bar"><button class="btn" id="mGps">${I_('gps')} ${tt('Use my location','میری لوکیشن')}</button><select id="mRad" aria-label="Radius">${[1000,2000,5000].map(r=>`<option value="${r}" ${r===2000?'selected':''}>${r/1000} km</option>`).join('')}</select></div><small class="muted">${I_('pin')} ${esc(P.city)}</small>
 <div id="map" class="map"></div><ul class="list" id="ml"><li class="muted">${C.t('loading')}</li></ul>`;
 let map,layer;const Lf=await import('leaflet');await import('leaflet/dist/leaflet.css');
 const run=async()=>{const lat=PR.P.lat,lng=PR.P.lng,rad=+$('#mRad').value;if(!map){map=Lf.map('map',{zoomControl:true}).setView([lat,lng],14);Lf.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map)}else map.setView([lat,lng],14);
  layer?.remove();layer=Lf.layerGroup().addTo(map);Lf.circleMarker([lat,lng],{radius:7,color:'#2563eb'}).addTo(layer).bindPopup(tt('You','آپ'));
  const q=`[out:json][timeout:25];(nwr["amenity"="place_of_worship"]["religion"="muslim"](around:${rad},${lat},${lng}););out center 60;`;
  try{let list;try{const d=await overpass(q);list=d.elements.map(e=>({name:e.tags?.name||e.tags?.['name:en']||tt('Mosque','مسجد'),lat:e.lat??e.center?.lat,lng:e.lon??e.center?.lon}))}catch{list=await nominatim(lat,lng,rad)}
   const ms=list.filter(m=>m.lat).filter(m=>L.distM(lat,lng,m.lat,m.lng)<=rad*1.2).map(m=>({...m,d:L.distM(lat,lng,m.lat,m.lng)})).sort((a,b)=>a.d-b.d);
   ms.forEach(m=>Lf.circleMarker([m.lat,m.lng],{radius:6,color:'#0f766e',fillOpacity:.8}).addTo(layer).bindPopup(esc(m.name)));
   $('#ml').innerHTML=ms.length?ms.map(m=>`<li class="row"><span class="grow"><b>${I_('mosques')} ${esc(m.name)}</b><small>${m.d<1000?Math.round(m.d)+' m':(m.d/1000).toFixed(1)+' km'}</small></span><a class="btn" target="_blank" rel="noopener" href="https://www.openstreetmap.org/directions?route=${lat}%2C${lng}%3B${m.lat}%2C${m.lng}">${tt('Directions','راستہ')}</a></li>`).join(''):`<li class="muted">${tt('No mosques found in this radius.','اس دائرے میں کوئی مسجد نہیں ملی۔')}</li>`}
  catch{$('#ml').innerHTML=`<li class="muted">${tt('Could not load mosques. Check your connection.','مساجد لوڈ نہیں ہو سکیں۔')}</li>`}};
 $('#mGps').onclick=async()=>{try{await PR.locate();run()}catch(e){C.toast('GPS: '+e.message)}};$('#mRad').onchange=run;run()}

// ---------- hifz setup ----------
export async function hifz(){C.setTitle(tt('Hifz mode','حفظ موڈ'));const list=await C.surahs();const H=LS.get('hifzCfg',{s:LS.get('lastRead',{}).s||1,from:1,to:5,each:3,range:2,hide:false});const prog=LS.get('hifzDone',{});
 const total=Object.keys(prog).length;
 app().innerHTML=`<div class="form"><label>${tt('Surah','سورت')}<select id="hS">${list.map(s=>`<option value="${s.number}" ${s.number===H.s?'selected':''}>${s.number}. ${esc(s.englishName)}</option>`).join('')}</select></label>
 <div class="row2"><label>${tt('From ayah','آیت سے')}<input type="number" id="hF" min="1" value="${H.from}"></label><label>${tt('To ayah','آیت تک')}<input type="number" id="hT" min="1" value="${H.to}"></label></div>
 <div class="row2"><label>${tt('Repeat each ayah','ہر آیت دہرائیں')}<input type="number" id="hE" min="1" max="50" value="${H.each}"></label><label>${tt('Repeat whole range','پوری حد دہرائیں')}<input type="number" id="hR" min="1" max="50" value="${H.range}"></label></div>
 <label><input type="checkbox" id="hH" ${H.hide?'checked':''}> ${tt('Hide Arabic text (tap an ayah to peek)','عربی متن چھپائیں (دیکھنے کے لیے دبائیں)')}</label>
 <button class="btn pri" id="hGo">▶ ${tt('Start hifz session','حفظ شروع کریں')}</button></div>
 <h2 class="h3">${tt('Progress','پیش رفت')}</h2><p>${tt('Ayahs marked memorised','حفظ شدہ آیات')}: <b>${total}</b> / 6236</p><div class="prog"><i style="width:${total/6236*100}%"></i></div>
 <ul class="list">${list.filter(s=>Object.keys(prog).some(k=>k.startsWith(s.number+':'))).map(s=>{const n=Object.keys(prog).filter(k=>k.startsWith(s.number+':')).length;return `<li><a href="#/surah/${s.number}"><span><b>${esc(s.englishName)}</b><small>${n}/${s.numberOfAyahs}</small></span><div class="prog sm"><i style="width:${n/s.numberOfAyahs*100}%"></i></div></a></li>`}).join('')}</ul>`;
 $('#hS').onchange=e=>{const n=list[e.target.value-1].numberOfAyahs;$('#hT').max=$('#hF').max=n;if(+$('#hT').value>n)$('#hT').value=n};
 $('#hGo').onclick=()=>{const s=+$('#hS').value,n=list[s-1].numberOfAyahs;const c={s,from:Math.max(1,Math.min(n,+$('#hF').value||1)),each:Math.max(1,+$('#hE').value||1),range:Math.max(1,+$('#hR').value||1),hide:$('#hH').checked};c.to=Math.max(c.from,Math.min(n,+$('#hT').value||c.from));LS.set('hifzCfg',c);C.S.hifzHide=c.hide;C.save();C.startHifz(c);location.hash=`#/surah/${s}/${c.from}`}}
export const toggleMemorised=ref=>{const p=LS.get('hifzDone',{});if(p[ref])delete p[ref];else p[ref]=Date.now();LS.set('hifzDone',p);return !!p[ref]};
export const isMemorised=ref=>!!LS.get('hifzDone',{})[ref];

// ---------- word by word ----------
const wbwCache={};
export async function wbw(s){const lang=C.S.wbwLang||(C.S.ui==='ur'?'ur':'en');const key=s+lang;if(wbwCache[key])return wbwCache[key];const out={};let page=1,tp;
 do{const d=await fetch(`https://api.quran.com/api/v4/verses/by_chapter/${s}?words=true&word_fields=text_uthmani&language=${lang}&per_page=50&page=${page}`).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()});
  for(const v of d.verses)out[v.verse_number]=v.words.filter(w=>w.char_type_name==='word').map(w=>({t:w.text_uthmani,m:w.translation?.text||'',tr:w.transliteration?.text||'',au:w.audio_url?'https://audio.qurancdn.com/'+w.audio_url:''}));tp=d.pagination.total_pages}while(++page<=tp);
 return wbwCache[key]=out}
