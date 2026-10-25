// v3.6.2 — one place for every date the app shows. Uses the DEVICE clock and local timezone (new Date()), never a saved city timezone.
// Gregorian is formatted by hand (no Intl era/locale surprises). Hijri uses Intl Umm al-Qura only when the result passes sanity checks;
// otherwise the Kuwaiti algorithm is used, and if even that is out of range nothing is shown (never "BC" or a wrong number).
const DAY=864e5;
export const GMONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
export const GMONTHS_UR=['جنوری','فروری','مارچ','اپریل','مئی','جون','جولائی','اگست','ستمبر','اکتوبر','نومبر','دسمبر'];
export const GDAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
export const GDAYS_UR=['اتوار','پیر','منگل','بدھ','جمعرات','جمعہ','ہفتہ'];
export const HMONTHS=['Muharram','Safar','Rabi al-Awwal','Rabi al-Thani','Jumada al-Ula','Jumada al-Akhirah','Rajab',"Sha'ban",'Ramadan','Shawwal',"Dhu al-Qa'dah",'Dhu al-Hijjah'];
export const HMONTHS_UR=['محرم','صفر','ربیع الاول','ربیع الثانی','جمادی الاول','جمادی الثانی','رجب','شعبان','رمضان','شوال','ذوالقعدہ','ذوالحجہ'];
export const HY_MIN=1400,HY_MAX=1600;
const ok=d=>d instanceof Date&&!isNaN(d.getTime());
export const validDate=ok;
/** Local calendar key YYYY-MM-DD of an instant (device timezone). */
export const dateKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
/** Milliseconds until the next local midnight. */
export const msToMidnight=(d=new Date())=>Math.max(1000,new Date(d.getFullYear(),d.getMonth(),d.getDate()+1,0,0,0,0).getTime()-d.getTime());
/** Gregorian text. opts: weekday 'long'|'short', day, month 'long'|'short'|'numeric', year (booleans / strings). */
export function gregText(d=new Date(),lang='en',o={weekday:'long',day:true,month:'long',year:true}){if(!ok(d))return '';const ur=lang==='ur',M=(ur?GMONTHS_UR:GMONTHS)[d.getMonth()],W=(ur?GDAYS_UR:GDAYS)[d.getDay()];
 const wd=o.weekday?(o.weekday==='short'&&!ur?W.slice(0,3):W):'';const mo=o.month==='short'&&!ur?M.slice(0,3):M;
 const core=[o.day?d.getDate():'',o.month?mo:'',o.year?d.getFullYear():''].filter(x=>x!=='').join(' ');
 return wd?(core?`${wd}${ur?'، ':', '}${core}`:wd):core}
/** Kuwaiti algorithm: Gregorian (y,m,d) -> Hijri {y,m,d}. Pure arithmetic, no Intl. */
export function kuwaiti(y,m,d){const a=Math.floor((m-14)/12);
 const jd=Math.floor((1461*(y+4800+a))/4)+Math.floor((367*(m-2-12*a))/12)-Math.floor((3*Math.floor((y+4900+a)/100))/4)+d-32075;
 let l=jd-1948440+10632;const n=Math.floor((l-1)/10631);l=l-10631*n+354;
 const j=Math.floor((10985-l)/5316)*Math.floor((50*l)/17719)+Math.floor(l/5670)*Math.floor((43*l)/15238);
 l=l-Math.floor((30-j)/15)*Math.floor((17719*j)/50)-Math.floor(j/16)*Math.floor((15238*j)/43)+29;
 const mo=Math.floor((24*l)/709);return {y:30*n+j-30,m:mo,d:l-Math.floor((709*mo)/24)}}
const approxDays=h=>h.y*354.367+(h.m-1)*29.53+h.d;
/** Umm al-Qura from Intl, or null if the engine gave anything doubtful (wrong calendar, BC/odd era, bad numbers). */
export function intlHijri(d){try{const f=new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn',{year:'numeric',month:'numeric',day:'numeric',era:'short'});
 if(!/islamic/.test(f.resolvedOptions().calendar||''))return null;
 const p=f.formatToParts(d);const g=k=>p.find(v=>v.type===k)?.value;const era=g('era');if(era!==undefined&&!/^(AH|A\.H\.|هـ|ه)/i.test(era.trim()))return null;
 const y=+g('year'),m=+g('month'),dd=+g('day');if(![y,m,dd].every(Number.isInteger)||m<1||m>12||dd<1||dd>30||y<HY_MIN||y>HY_MAX)return null;return {y,m,d:dd}}catch{return null}}
/** Valid Hijri {y,m,d,src} for the device-local day of `date` (± adj days), or null. Intl is cross-checked against the Kuwaiti algorithm. */
export function hijriParts(date=new Date(),adj=0){if(!ok(date))return null;const x=new Date(date.getTime()+(+adj||0)*DAY);
 const k=kuwaiti(x.getFullYear(),x.getMonth()+1,x.getDate());const i=intlHijri(x);
 // Umm al-Qura and the arithmetic calendar differ by at most a day or two; a bigger gap means Intl is wrong.
 if(i&&Math.abs(approxDays(i)-approxDays(k))<=4)return {...i,src:'intl'};
 if(k.y>=HY_MIN&&k.y<=HY_MAX&&k.m>=1&&k.m<=12&&k.d>=1&&k.d<=30)return {...k,src:'calc'};return null}
/** "14 Rabi al-Thani 1448 AH", or '' when no valid Hijri date can be produced. */
export function hijriText(date=new Date(),lang='en',adj=0){const h=hijriParts(date,adj);if(!h)return '';const ur=lang==='ur';return `${h.d} ${(ur?HMONTHS_UR:HMONTHS)[h.m-1]} ${h.y}${ur?' ھ':' AH'}`}
/** "24 Oct 2026, 14:05" for a stored timestamp (ms), device-local; '' if invalid. */
export function stampText(ts,lang='en'){const d=new Date(ts);if(!ok(d))return '';return `${gregText(d,lang,{day:true,month:'short',year:true})}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`}
