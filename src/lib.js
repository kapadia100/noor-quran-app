// Pure, testable logic
export const FIX={"2:181": "فَمَنۢ بَدَّلَهُۥ بَعْدَ مَا سَمِعَهُۥ فَإِنَّمَآ إِثْمُهُۥ عَلَى ٱلَّذِينَ يُبَدِّلُونَهُۥٓ ۚ إِنَّ ٱللَّهَ سَمِيعٌ عَلِيمٌ", "8:6": "يُجَـٰدِلُونَكَ فِى ٱلْحَقِّ بَعْدَ مَا تَبَيَّنَ كَأَنَّمَا يُسَاقُونَ إِلَى ٱلْمَوْتِ وَهُمْ يَنظُرُونَ", "12:39": "يَـٰصَـٰحِبَىِ ٱلسِّجْنِ ءَأَرْبَابٌ مُّتَفَرِّقُونَ خَيْرٌ أَمِ ٱللَّهُ ٱلْوَٰحِدُ ٱلْقَهَّارُ", "12:41": "يَـٰصَـٰحِبَىِ ٱلسِّجْنِ أَمَّآ أَحَدُكُمَا فَيَسْقِى رَبَّهُۥ خَمْرًا ۖ وَأَمَّا ٱلْـَٔاخَرُ فَيُصْلَبُ فَتَأْكُلُ ٱلطَّيْرُ مِن رَّأْسِهِۦ ۚ قُضِىَ ٱلْأَمْرُ ٱلَّذِى فِيهِ تَسْتَفْتِيَانِ", "13:37": "وَكَذَٰلِكَ أَنزَلْنَـٰهُ حُكْمًا عَرَبِيًّا ۚ وَلَئِنِ ٱتَّبَعْتَ أَهْوَآءَهُم بَعْدَ مَا جَآءَكَ مِنَ ٱلْعِلْمِ مَا لَكَ مِنَ ٱللَّهِ مِن وَلِىٍّ وَلَا وَاقٍ"};
export const stripB=x=>{x=x.replace(/^\uFEFF/,'');const w=x.split(' ');const bare=y=>(y||'').replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g,'');return bare(w[0])==='بسم'&&bare(w[1])==='ٱلله'&&w.length>4?w.slice(4).join(' '):x};
export const JUZ=[[1,1],[2,142],[2,253],[3,93],[4,24],[4,148],[5,82],[6,111],[7,88],[8,41],[9,93],[11,6],[12,53],[15,1],[17,1],[18,75],[21,1],[23,1],[25,21],[27,56],[29,46],[33,31],[36,28],[39,32],[41,47],[46,1],[51,31],[58,1],[67,1],[78,1]];
export const JUZN=['Alif Lam Meem','Sayaqool','Tilkal Rusul','Lan Tana Loo','Wal Mohsanat','La Yuhibbullah','Wa Iza Samiu','Wa Lau Annana','Qalal Malao','Wa A\'lamu','Yatazeroon','Wa Mamin Da\'abat','Wa Ma Ubrioo','Rubama','Subhanallazi','Qal Alam','Aqtarabo','Qadd Aflaha','Wa Qalallazina','A\'man Khalaq','Utlu Ma Oohi','Wa Manyaqnut','Wa Mali','Faman Azlam','Elahe Yuruddo','Ha\'a Meem','Qala Fama Khatbukum','Qadd Sami Allah','Tabarakallazi','Amma Yatasa\'aloon'];

export const AYAH_COUNTS=[7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
/** Display text for ayah (1-based surah, ayah): applies verified fixes and removes the basmala prefix from ayah 1 (except Al-Fatiha). */
export function ayahText(s,a,raw){const f=FIX[`${s}:${a}`];if(f)return f;return a===1&&s!==1?stripB(raw):raw}
/** Parse "2", "2:255", "2 255", "2.255" -> {s,a} or null if out of range. */
export function parseRef(v){const m=String(v).trim().match(/^(\d{1,3})(?:\s*[:.\s]\s*(\d{1,3}))?$/);if(!m)return null;const s=+m[1],a=m[2]?+m[2]:null;
 if(s<1||s>114)return null;if(a!=null&&(a<1||a>AYAH_COUNTS[s-1]))return null;return {s,a}}
export const validSurah=n=>Number.isInteger(n)&&n>=1&&n<=114;
export const validJuz=n=>Number.isInteger(n)&&n>=1&&n<=30;
/** Juz n -> list of [surah, fromAyah, toAyah]. */
export function juzRanges(n){const [s0,a0]=JUZ[n-1],end=JUZ[n]||[115,1];const out=[];for(let s=s0;s<=Math.min(end[0],114);s++){const from=s===s0?a0:1;const to=s===end[0]?end[1]-1:AYAH_COUNTS[s-1];if(to>=from)out.push([s,from,to])}return out}
/** Calendar date (as a local-midnight Date) of instant d in IANA zone tz. Used so prayer times are for the city's day, not the device's. */
export function dayIn(tz,d=new Date()){try{const p=new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);const g=k=>+p.find(x=>x.type===k).value;return new Date(g('year'),g('month')-1,g('day'))}catch{return new Date(d.getFullYear(),d.getMonth(),d.getDate())}}
/** Signed turn needed (-180..180] from heading h to qibla q. */
export const turn=(q,h)=>{let d=((q-h)%360+540)%360-180;return d===-180?180:d};
/** Next audio position after (s,i) in continuous mode. counts = ayah counts. Returns null at end of Quran. */
export function nextPos(s,i){if(i+1<AYAH_COUNTS[s-1])return {s,i:i+1};if(s<114)return {s:s+1,i:0};return null}
export const clampAdj=v=>Math.max(-2,Math.min(2,+v||0));
/** Escape then highlight q (case-insensitive) safely. */
export const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export function highlight(text,q){if(!q)return esc(text);const r=new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi');let out='',last=0;String(text).replace(r,(m,off)=>{out+=esc(text.slice(last,off))+'<mark>'+esc(m)+'</mark>';last=off+m.length;return m});return out+esc(String(text).slice(last))}

/** Fuzzy key for transliterated surah names: 'Yaseen'/'Yasin'/'Ya-Sin' -> 'ysn'. */
export const skel=s=>String(s).toLowerCase().replace(/^a[a-z]{0,2}-/,'').replace(/[^a-z0-9]/g,'').replace(/[aeiou]/g,'').replace(/(.)\1+/g,'$1');
export function surahMatch(s,q){q=String(q).trim().toLowerCase();if(!q)return true;const hay=(s.number+' '+s.englishName+' '+s.englishNameTranslation+' '+s.name).toLowerCase();if(hay.includes(q))return true;if(/^\d+$/.test(q))return String(s.number)===q;const k=skel(q);return k.length>1&&skel(s.englishName).startsWith(k)}

// ===== v2 feature logic =====
export const ymd=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const DAY=864e5;
/** Hijri {y,m,d} (Umm al-Qura) for a date, with ±day adjustment. */
export function hijriParts(date=new Date(),adj=0){const x=new Date(date.getTime()+adj*DAY);const p=new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn',{year:'numeric',month:'numeric',day:'numeric'}).formatToParts(x);const g=k=>parseInt(p.find(v=>v.type===k).value);return {y:g('year'),m:g('month'),d:g('day')}}
export const HMONTHS=['Muharram','Safar','Rabi al-Awwal','Rabi al-Thani','Jumada al-Ula','Jumada al-Akhirah','Rajab',"Sha'ban",'Ramadan','Shawwal',"Dhu al-Qa'dah",'Dhu al-Hijjah'];
export const HMONTHS_UR=['محرم','صفر','ربیع الاول','ربیع الثانی','جمادی الاول','جمادی الثانی','رجب','شعبان','رمضان','شوال','ذوالقعدہ','ذوالحجہ'];
export const EVENTS=[[1,1,'Islamic New Year','اسلامی نیا سال'],[1,10,'Day of Ashura','یوم عاشور'],[3,12,'Mawlid an-Nabi','عید میلاد النبی'],[7,27,"Isra & Mi'raj",'شب معراج'],[8,15,"Shab-e-Barat (15 Sha'ban)",'شب برات'],[9,1,'Ramadan begins','آغاز رمضان'],[9,27,'Laylat al-Qadr (27th night)','شب قدر (27ویں شب)'],[10,1,'Eid al-Fitr','عید الفطر'],[12,8,'Hajj begins (Yawm at-Tarwiyah)','آغاز حج'],[12,9,'Day of Arafah','یوم عرفہ'],[12,10,'Eid al-Adha','عید الاضحی']];
/** Upcoming Islamic events from `from` within `days` days: [{date,hm,hd,en,ur,inDays}]. */
export function upcomingEvents(from=new Date(),days=400,adj=0){const out=[];const base=new Date(from.getFullYear(),from.getMonth(),from.getDate());
 for(let i=0;i<days;i++){const d=new Date(base.getTime()+i*DAY+12*36e5);const h=hijriParts(d,adj);const e=EVENTS.find(e=>e[0]===h.m&&e[1]===h.d);if(e)out.push({date:new Date(base.getTime()+i*DAY),hy:h.y,hm:h.m,hd:h.d,en:e[2],ur:e[3],inDays:i})}return out}
/** Gregorian dates of a Hijri month (default: next/current Ramadan). */
export function hijriMonthDays(hy,hm,adj=0,from=new Date()){const out=[];const base=new Date(from.getFullYear(),from.getMonth(),from.getDate());for(let i=-40;i<420&&out.length<31;i++){const d=new Date(base.getTime()+i*DAY+12*36e5);const h=hijriParts(d,adj);if(h.y===hy&&h.m===hm)out.push({date:new Date(base.getTime()+i*DAY),hd:h.d});else if(out.length)break}return out}
export function nextRamadan(from=new Date(),adj=0){const h=hijriParts(from,adj);const y=h.m<=9?h.y:h.y+1;return {hy:y,days:hijriMonthDays(y,9,adj,from)}}
/** Zakat. All money in the same currency. Nisab: 87.48 g gold or 612.36 g silver (default silver, the lower threshold). */
export const NISAB_GOLD_G=87.48,NISAB_SILVER_G=612.36;
export function zakat({cash=0,gold_g=0,silver_g=0,goldPrice=0,silverPrice=0,business=0,receivables=0,debts=0,basis='silver'}){const n=v=>Math.max(0,+v||0);
 const assets=n(cash)+n(gold_g)*n(goldPrice)+n(silver_g)*n(silverPrice)+n(business)+n(receivables);const net=Math.max(0,assets-n(debts));
 const nisab=basis==='gold'?NISAB_GOLD_G*n(goldPrice):NISAB_SILVER_G*n(silverPrice);const due=nisab>0&&net>=nisab?net*0.025:0;return {assets,net,nisab,eligible:due>0,due:Math.round(due*100)/100}}
/** Khatam plan: pages remaining and pages/day needed to finish by `end`. */
export function khatamPlan({start=1,current,end,today=new Date(),total=604}){const cur=Math.min(total,Math.max(current??start-1,0));const remaining=total-cur;
 const daysLeft=Math.max(1,Math.ceil((new Date(end).setHours(23,59,59)-new Date(today).setHours(0,0,0))/DAY));return {remaining,daysLeft,perDay:remaining?Math.ceil(remaining/daysLeft):0,pct:Math.round(cur/total*100),done:remaining===0}}
/** Page (1..604) containing surah:ayah, given page start table [[s,a],...]. */
export function pageOf(pages,s,a){let lo=0,hi=pages.length-1;const key=(x)=>x[0]*1000+x[1],k=s*1000+a;while(lo<hi){const m=(lo+hi+1)>>1;if(key(pages[m])<=k)lo=m;else hi=m-1}return lo+1}
/** All [s,a] on page p. */
export function pageAyahs(pages,p){const [s0,a0]=pages[p-1],end=pages[p]||[115,1];const out=[];let s=s0,a=a0;while(s<end[0]||(s===end[0]&&a<end[1])){out.push([s,a]);if(a<AYAH_COUNTS[s-1])a++;else{s++;a=1;if(s>114)break}}return out}
/** Deterministic ayah of the day (same for everyone on a date). */
export function ayahOfDay(date=new Date()){const k=ymd(date);let h=2166136261;for(const c of k){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0}let g=h%6236;for(let s=1;s<=114;s++){if(g<AYAH_COUNTS[s-1])return {s,a:g+1};g-=AYAH_COUNTS[s-1]}}
/** Consecutive-day streak ending today (or yesterday if today not yet done). */
export function streak(days,today=new Date()){const set=new Set(days);let d=new Date(today.getFullYear(),today.getMonth(),today.getDate());if(!set.has(ymd(d)))d=new Date(d.getTime()-DAY);let n=0;while(set.has(ymd(d))){n++;d=new Date(d.getFullYear(),d.getMonth(),d.getDate()-1)}return n}
/** Hifz repeat engine. cfg {s,from,to,each,range}; pos {a,c,r} (ayah, repetition of ayah, repetition of range). Returns next pos or null when finished. */
export function hifzNext(cfg,pos){if(pos.c+1<cfg.each)return {a:pos.a,c:pos.c+1,r:pos.r};if(pos.a<cfg.to)return {a:pos.a+1,c:0,r:pos.r};if(pos.r+1<cfg.range)return {a:cfg.from,c:0,r:pos.r+1};return null}
/** Distance in metres (haversine). */
export function distM(a,b,c,d){const R=6371e3,r=x=>x*Math.PI/180;const x=Math.sin(r(c-a)/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(r(d-b)/2)**2;return 2*R*Math.asin(Math.sqrt(x))}
/** Wrap text into lines that fit maxW using measure(str)->px. */
export function wrapText(text,maxW,measure){const words=String(text).split(/\s+/);const lines=[];let cur='';for(const w of words){const t=cur?cur+' '+w:w;if(measure(t)>maxW&&cur){lines.push(cur);cur=w}else cur=t}if(cur)lines.push(cur);return lines}
