// "My progress" screen: streak, last 7 days, per-surah accuracy, weak letters, recent mistakes. Everything is read from the on-device log.
import * as PG from './progress.js';
import {TIPS} from './tajweed.js';
import {esc} from './lib.js';
const NAMES={wrong:['Different word','دوسرا لفظ'],skip:['Skipped','چھوٹ گیا'],unclear:['Not clear','غیر واضح'],close:['Close','قریب']};
export async function progressPage(C,tt,ur,I){
 C.setTitle(tt('My progress','میری پیش رفت'));const P=PG.load(),S=PG.streak(P),days=PG.lastDays(P,7),mx=Math.max(1,...days.map(d=>d.ok));
 let list=[];try{list=await C.surahs();if(list.data)list=list.data}catch{/* names optional */}const nm=n=>{const s=list.find(x=>x.number===n);return s?(s.englishName||''):''};
 const tot=P.sess.reduce((a,s)=>({ok:a.ok+s.ok,all:a.all+s.ok+s.bad+s.unc,sec:a.sec+(s.sec||0)}),{ok:0,all:0,sec:0});
 const bs=PG.bySurah(P).filter(x=>x.acc!=null);
 const wl=PG.weakLetters(P,6),rc=PG.recent(P,12);
 const wk=['Su','Mo','Tu','We','Th','Fr','Sa'],wku=['اتوار','پیر','منگل','بدھ','جمعرات','جمعہ','ہفتہ'];
 const dn=k=>{const [y,m,d]=k.split('-').map(Number);const w=new Date(y,m-1,d).getDay();return ur()?wku[w]:wk[w]};
 const body=P.sess.length?`
 <div class="pg-top"><div class="pg-big"><b>🔥 ${S.cur}</b><small>${tt('day streak','دن کا سلسلہ')}</small></div><div class="pg-big"><b>${S.best}</b><small>${tt('best streak','بہترین سلسلہ')}</small></div><div class="pg-big"><b>${tot.all?Math.round(100*tot.ok/tot.all):0}%</b><small>${tt('first-try accuracy','پہلی کوشش کی درستی')}</small></div></div>
 <p class="muted pg-sub">${S.today?tt('You practised today. Keep it up!','آج آپ نے مشق کی۔ شاباش!'):tt('No practice yet today.','آج ابھی مشق نہیں ہوئی۔')} · ${tt(`${Math.round(tot.sec/60)} min in total`,`کل ${Math.round(tot.sec/60)} منٹ`)}</p>
 <div class="pg-card"><b>${tt('Last 7 days (words read correctly)','پچھلے 7 دن (درست پڑھے الفاظ)')}</b><div class="pg-bars">${days.map(d=>`<div><i style="height:${Math.max(4,Math.round(60*d.ok/mx))}px" class="${d.ok?'on':''}"></i><small>${dn(d.k)}</small><small>${d.ok||''}</small></div>`).join('')}</div></div>
 <div class="pg-card"><b>${tt('By surah (last 5 sessions)','سورت کے لحاظ سے (آخری 5 سیشن)')}</b>${bs.map(a=>{const n=a.sn,pc=Math.round(100*a.acc);return `<a class="pg-row" href="#/recite/${n}"><span class="num">${n}</span><span class="pg-nm">${esc(nm(n))}<small>${tt(`${a.sessions} sessions`,`${a.sessions} سیشن`)}</small></span><span class="pg-bar"><i style="width:${pc}%"></i></span><b>${pc}%</b></a>`}).join('')}</div>
 <div class="pg-card"><b>${tt('Letters to work on','جن حروف پر محنت کریں')}</b>${wl.length?wl.map(x=>{const t=TIPS[x.ch];return `<div class="pg-let"><span class="ar" dir="rtl" lang="ar">${esc(x.ch)}</span><div><b>${Math.round(100*x.rate)}%</b> ${tt(`missed (${x.miss} of ${x.seen} words)`,`غلط (${x.seen} میں سے ${x.miss} الفاظ)`)}<small>${t?esc(t.p[ur()?1:0]):''}</small></div></div>`}).join('')+`<small class="muted">${tt('Based on the letters inside words you missed. It is a guide, not a diagnosis.','یہ ان الفاظ کے حروف پر مبنی ہے جو غلط ہوئے۔ یہ اشارہ ہے، حتمی تشخیص نہیں۔')}</small>`:`<p class="muted">${tt('Not enough data yet — keep reciting.','ابھی کافی ڈیٹا نہیں — تلاوت جاری رکھیں۔')}</p>`}</div>
 <div class="pg-card"><b>${tt('Recent mistakes','حالیہ غلطیاں')}</b>${rc.length?rc.map(m=>`<a class="pg-m" href="#/recite/${m.sn}/${m.a}"><span class="ar" dir="rtl" lang="ar">${esc(m.t)}</span><span class="pg-t t-${m.type}">${esc(NAMES[m.type]?NAMES[m.type][ur()?1:0]:m.type)}</span><small>${m.sn}:${m.a}</small></a>`).join(''):`<p class="muted">${tt('None yet.','ابھی کوئی نہیں۔')}</p>`}</div>
 <p class="muted pg-sub">${tt('Stored only on this phone. “Different word” and “Skipped” are detected; extra words you add are not.','صرف اسی فون میں محفوظ۔ “دوسرا لفظ” اور “چھوٹا ہوا” پکڑے جاتے ہیں؛ اضافی الفاظ نہیں۔')}</p>
 <div class="bar"><button class="btn ghost" id="pgClr">${I.icon('trash')} ${tt('Reset progress','پیش رفت صاف کریں')}</button></div>`
 :`<div class="tutor-card" style="cursor:default"><span class="ti">${I.icon('tutor')}</span><div><b>${tt('My progress','میری پیش رفت')}</b><small>${tt('Recite with the tutor and your streak, accuracy and weak letters will appear here.','ٹیوٹر کے ساتھ تلاوت کریں؛ آپ کا سلسلہ، درستی اور کمزور حروف یہاں نظر آئیں گے۔')}</small></div></div><p class="c"><a class="btn" href="#/recite">${tt('Start reciting','تلاوت شروع کریں')}</a></p>`;
 C.app().innerHTML=`<div class="pg">${body}</div>`;
 const b=document.getElementById('pgClr');if(b){let arm=0;b.onclick=()=>{if(!arm){arm=1;b.textContent=tt('Tap again to reset','دوبارہ دبائیں');b.classList.add('danger');setTimeout(()=>{arm=0;if(b.isConnected){b.textContent=tt('Reset progress','پیش رفت صاف کریں');b.classList.remove('danger')}},4000);return}localStorage.removeItem(PG.KEY);progressPage(C,tt,ur,I)}}}
