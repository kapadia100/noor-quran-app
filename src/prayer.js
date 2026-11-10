import {dayIn} from './lib.js';
import * as DT from './dates.js';
import {Coordinates,CalculationMethod,PrayerTimes,Madhab,Qibla,HighLatitudeRule} from 'adhan';
import {Capacitor} from '@capacitor/core';
import {LocalNotifications} from '@capacitor/local-notifications';
import * as N from './notify.js';
const LS={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};
export const CITIES=[['Karachi',24.8607,67.0011,'Asia/Karachi','Karachi'],['Lahore',31.5204,74.3587,'Asia/Karachi','Karachi'],['Islamabad',33.6844,73.0479,'Asia/Karachi','Karachi'],['Peshawar',34.0151,71.5249,'Asia/Karachi','Karachi'],['Quetta',30.1798,66.975,'Asia/Karachi','Karachi'],['Hyderabad (PK)',25.396,68.3578,'Asia/Karachi','Karachi'],['Multan',30.1575,71.5249,'Asia/Karachi','Karachi'],['Faisalabad',31.4504,73.135,'Asia/Karachi','Karachi'],['Mumbai',19.076,72.8777,'Asia/Kolkata','Karachi'],['Delhi',28.6139,77.209,'Asia/Kolkata','Karachi'],['Hyderabad (IN)',17.385,78.4867,'Asia/Kolkata','Karachi'],['Lucknow',26.8467,80.9462,'Asia/Kolkata','Karachi'],['Kolkata',22.5726,88.3639,'Asia/Kolkata','Karachi'],['Bengaluru',12.9716,77.5946,'Asia/Kolkata','Karachi'],['Dhaka',23.8103,90.4125,'Asia/Dhaka','Karachi'],['Makkah',21.3891,39.8579,'Asia/Riyadh','UmmAlQura'],['Madinah',24.5247,39.5692,'Asia/Riyadh','UmmAlQura'],['Riyadh',24.7136,46.6753,'Asia/Riyadh','UmmAlQura'],['Dubai',25.2048,55.2708,'Asia/Dubai','Dubai'],['Doha',25.2854,51.531,'Asia/Qatar','Qatar'],['Kuwait City',29.3759,47.9774,'Asia/Kuwait','Kuwait'],['Cairo',30.0444,31.2357,'Africa/Cairo','Egyptian'],['Istanbul',41.0082,28.9784,'Europe/Istanbul','Turkey'],['Tehran',35.6892,51.389,'Asia/Tehran','Tehran'],['Kabul',34.5553,69.2075,'Asia/Kabul','Karachi'],['Jakarta',-6.2088,106.8456,'Asia/Jakarta','Singapore'],['Kuala Lumpur',3.139,101.6869,'Asia/Kuala_Lumpur','Singapore'],['Singapore',1.3521,103.8198,'Asia/Singapore','Singapore'],['London',51.5074,-0.1278,'Europe/London','MuslimWorldLeague'],['Birmingham',52.4862,-1.8904,'Europe/London','MuslimWorldLeague'],['Paris',48.8566,2.3522,'Europe/Paris','MuslimWorldLeague'],['Berlin',52.52,13.405,'Europe/Berlin','MuslimWorldLeague'],['New York',40.7128,-74.006,'America/New_York','NorthAmerica'],['Chicago',41.8781,-87.6298,'America/Chicago','NorthAmerica'],['Houston',29.7604,-95.3698,'America/Chicago','NorthAmerica'],['Toronto',43.6532,-79.3832,'America/Toronto','NorthAmerica'],['Los Angeles',34.0522,-118.2437,'America/Los_Angeles','NorthAmerica'],['Sydney',-33.8688,151.2093,'Australia/Sydney','MuslimWorldLeague'],['Johannesburg',-26.2041,28.0473,'Africa/Johannesburg','MuslimWorldLeague'],['Lagos',6.5244,3.3792,'Africa/Lagos','MuslimWorldLeague']];
export const METHODS_UR={Karachi:'کراچی (جامعہ علومِ اسلامیہ)',MuslimWorldLeague:'مسلم ورلڈ لیگ',NorthAmerica:'اسنا (شمالی امریکہ)',UmmAlQura:'امّ القریٰ، مکہ',Egyptian:'مصری جنرل اتھارٹی',Dubai:'دبئی',Qatar:'قطر',Kuwait:'کویت',Turkey:'ترکی (دیانت)',Tehran:'تہران',Singapore:'سنگاپور (MUIS)',MoonsightingCommittee:'رؤیتِ ہلال کمیٹی'};
export const METHODS={Karachi:'Karachi (University of Islamic Sciences)',MuslimWorldLeague:'Muslim World League',NorthAmerica:'ISNA (North America)',UmmAlQura:'Umm al-Qura, Makkah',Egyptian:'Egyptian General Authority',Dubai:'Dubai',Qatar:'Qatar',Kuwait:'Kuwait',Turkey:'Turkey (Diyanet)',Tehran:'Tehran',Singapore:'Singapore/MUIS',MoonsightingCommittee:'Moonsighting Committee'};
export const PRAYERS=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
export const PNAME={fajr:['Fajr','فجر'],sunrise:['Sunrise','طلوع'],dhuhr:['Dhuhr','ظہر'],asr:['Asr','عصر'],maghrib:['Maghrib','مغرب'],isha:['Isha','عشاء']};
export const P=Object.assign({city:'Karachi',lat:24.8607,lng:67.0011,tz:'Asia/Karachi',src:'city',method:'Karachi',madhab:'Hanafi',hijriAdj:0,alerts:{fajr:true,dhuhr:true,asr:true,maghrib:true,isha:true,sunrise:false},adhan:true,days:7},LS.get('prayer',{}));
// Official/default method + Asr school by time zone (country). South Asia follows Hanafi Asr; elsewhere the standard (Shafi'i) Asr the national authorities publish.
const TZM=[[/^Asia\/(Karachi|Kolkata|Calcutta|Dhaka|Kabul|Kathmandu|Colombo)$/,'Karachi','Hanafi'],[/^Asia\/Dubai$/,'Dubai'],[/^Asia\/Muscat$/,'Dubai'],[/^Asia\/Riyadh$/,'UmmAlQura'],[/^Asia\/(Aden|Bahrain)$/,'UmmAlQura'],[/^Asia\/Qatar$/,'Qatar'],[/^Asia\/Kuwait$/,'Kuwait'],[/^Africa\/Cairo$/,'Egyptian'],[/^(Europe\/Istanbul|Asia\/Istanbul)$/,'Turkey'],[/^Asia\/Tehran$/,'Tehran'],[/^Asia\/(Kuala_Lumpur|Kuching|Singapore|Brunei|Jakarta|Pontianak|Makassar|Jayapura)$/,'Singapore'],[/^(America\/|Canada\/|US\/)/,'NorthAmerica']];
export function defaultsFor(tz){for(const [re,m,h] of TZM)if(re.test(tz||''))return{method:m,madhab:h||'Shafi'};return{method:'MuslimWorldLeague',madhab:'Shafi'}}
/** Apply the country default method/Asr school unless the user picked their own. */
export function autoMethod(){const d=defaultsFor(P.tz);if(!P.methodUser)P.method=d.method;if(!P.madhabUser){P.madhab=d.madhab;P.madhabUser=true}}
export const saveP=()=>LS.set('prayer',P);
// v94: a stored Asr school / method is the user's choice and is never overridden (country defaults, city picks, migrations).
// Old data cannot tell a default from a choice, so any stored value counts as explicit; only users with nothing stored get the country default.
export function migrate(st){if(P.autoV2)return;if(st.madhab)P.madhabUser=true;if(st.method)P.methodUser=true;P.autoV2=1}
migrate(LS.get('prayer',{}));
// Dubai IACAD timetable fitted at 18.2°/18.2° (Nov 2026, max 1 min error): the library preset's +3 Asr made Asr ~2 min late.
export const DUBAI_ADJ={fajr:0,sunrise:-4,dhuhr:3,asr:1,maghrib:4,isha:0};
export function params(){const p=(CalculationMethod[P.method]||CalculationMethod.Karachi)();if(P.method==='Dubai')p.methodAdjustments={...DUBAI_ADJ};p.madhab=P.madhab==='Hanafi'?Madhab.Hanafi:Madhab.Shafi;if(P.hlr&&P.hlr!=='auto'&&HighLatitudeRule[P.hlr])p.highLatitudeRule=HighLatitudeRule[P.hlr];else if(Math.abs(P.lat)>48)p.highLatitudeRule=HighLatitudeRule.recommended(new Coordinates(P.lat,P.lng));if(P.adj)for(const k of Object.keys(p.adjustments))p.adjustments[k]=+P.adj[k]||0;return p}
// Prayer times for the calendar day of `date` in the selected city's timezone (not the device's).
export function times(date=new Date()){return new PrayerTimes(new Coordinates(P.lat,P.lng),dayIn(P.tz,date),params())}
export const fmt=d=>d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:P.tz||undefined});
export function fmt12(d){return d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZone:P.tz||undefined})}
export function next(now=new Date()){for(let i=0;i<2;i++){const day=new Date(now.getTime()+i*864e5),pt=times(day);for(const k of PRAYERS){if(k==='sunrise')continue;if(pt[k]>now)return{key:k,time:pt[k]}}}}
export const qibla=()=>Qibla(new Coordinates(P.lat,P.lng));
export const hijri=(d=new Date(),lang='en')=>DT.hijriText(d,lang,+P.hijriAdj||0);
export const greg=(d=new Date(),lang='en')=>DT.gregText(d,lang);
export function locate(){return new Promise((res,rej)=>{if(!navigator.geolocation)return rej(new Error('no geolocation'));navigator.geolocation.getCurrentPosition(p=>{P.lat=+p.coords.latitude.toFixed(4);P.lng=+p.coords.longitude.toFixed(4);P.src='gps';P.city='GPS '+P.lat+', '+P.lng;P.tz=Intl.DateTimeFormat().resolvedOptions().timeZone;autoMethod();saveP();res(P)},e=>rej(new Error(e.code===1?'permission denied':e.code===3?'timeout':'position unavailable')),{enableHighAccuracy:false,timeout:15000,maximumAge:6e5})})}
export function setCity(name){const c=CITIES.find(c=>c[0]===name);if(!c)return;[P.city,P.lat,P.lng,P.tz]=c;P.src='city';autoMethod();if(!P.methodUser)P.method=c[4];saveP()}
// ---- notifications ----
const native=()=>Capacitor.isNativePlatform();export const isNative=native;
/** iOS keeps at most 64 pending local notifications and silently drops anything past that. */
export const IOS_PENDING_LIMIT=64;
export const PRAYER_ID_BASE=1000;
export const REMINDER_ID_BASE=5000;
export const REMINDER_SPAN=200;
export const REMINDER_GROUPS=['khatam','aotd','events','ramadan'];
const COORD_LABEL=/^(?:GPS\s+)?-?\d{1,3}\.\d+\s*,\s*-?\d{1,3}\.\d+$/i;
export const isCoordLabel=s=>COORD_LABEL.test(String(s||'').trim());
export const isPrayerNotifId=id=>id>=PRAYER_ID_BASE&&id<REMINDER_ID_BASE;
export function reminderRange(group){const i=REMINDER_GROUPS.indexOf(group);if(i<0)return null;const base=REMINDER_ID_BASE+i*REMINDER_SPAN;return {base,end:base+REMINDER_SPAN}}
/** Split pending notifications into the ones this scheduler owns and the ones it must leave alone. */
export function partitionPending(pending,owns){const mine=[],keep=[];for(const n of pending||[])(owns(n.id)?mine:keep).push(n);return {mine,keep}}
/** How many of `items` fit without pushing the kept notifications past the iOS cap. */
export function fitPending(items,kept,limit=IOS_PENDING_LIMIT){return (items||[]).slice(0,Math.max(0,limit-(kept|0)))}
/** City name for an alert. Never a GPS coordinate string. */
export function alertPlace(p=P,ur=false){
 if(p.src==='gps'){const key=`${p.lat},${p.lng}`,nr=p.near&&p.near.at===key?p.near:null;
  if(nr){const n=ur&&nr.ur?nr.ur:nr.en;if(n&&!isCoordLabel(n))return nr.km>60?(ur?`${n} کے قریب`:`Near ${n}`):n}
  if(p.place&&p.placeAt===key&&!isCoordLabel(p.place))return p.place;return ''}
 const n=String(p.city||'').trim();return isCoordLabel(n)?'':n}
async function ensureAlertPlace(){if(P.src!=='gps')return;const key=`${P.lat},${P.lng}`;
 if(P.near&&P.near.at===key&&P.near.en&&!isCoordLabel(P.near.en))return;
 try{const m=await import('./places.js');await m.resolve(P)}catch{}}
// One native schedule at a time, so a prayer refresh and a reminder refresh cannot both read a stale pending list and exceed 64.
let nativeQueue=Promise.resolve();
const nativeTurn=fn=>{const run=nativeQueue.then(fn);nativeQueue=run.then(()=>{},()=>{});return run};
const cancelIds=list=>list.length?LocalNotifications.cancel({notifications:list.map(n=>({id:n.id}))}):Promise.resolve();
export async function schedule(){await ensureAlertPlace();const now=new Date();const items=[];
 for(let d=0;d<(P.days||7);d++){const pt=times(new Date(now.getTime()+d*864e5));for(const k of PRAYERS){if(!P.alerts[k]||pt[k]<=now)continue;items.push({k,at:pt[k]})}}
 if(native()){const perm=await LocalNotifications.requestPermissions();if(perm.display!=='granted')return {ok:false,reason:'permission denied'};
  try{await LocalNotifications.createChannel({id:'adhan',name:'Adhan',importance:5,sound:'adhan.wav',vibration:true});await LocalNotifications.createChannel({id:'prayer',name:'Prayer alerts',importance:4,vibration:true})}catch{}
  const place=alertPlace(P,false);
  return nativeTurn(async()=>{const pend=(await LocalNotifications.getPending()).notifications||[];const {mine,keep}=partitionPending(pend,isPrayerNotifId);await cancelIds(mine);
   const list=fitPending(items,keep.length).map((x,i)=>({id:PRAYER_ID_BASE+i,title:`${PNAME[x.k][0]} · ${PNAME[x.k][1]}`,body:`It's time for ${PNAME[x.k][0]} (${fmt12(x.at)})${place?` — ${place}`:''}`,schedule:{at:x.at,allowWhileIdle:true},channelId:P.adhan&&x.k!=='sunrise'?'adhan':'prayer',sound:P.adhan&&x.k!=='sunrise'?'adhan.wav':undefined}));
   if(list.length)await LocalNotifications.schedule({notifications:list});return {ok:true,count:list.length,mode:'native'}})}
 return webArm('prayer',plan(now),true)}
// When each prayer's time ends (used for the optional "ends soon" reminder). Isha is left out: its end differs by fiqh.
const ENDS={fajr:'sunrise',dhuhr:'asr',asr:'maghrib',maghrib:'isha'};
const uiUr=()=>{try{return JSON.parse(localStorage.getItem('settings'))?.ui==='ur'}catch{return false}};
/** Web notification plan for the next P.days days: prayer start (+ optional "ends in N min") for each enabled prayer. */
export function plan(now=new Date()){const ur=uiUr(),out=[],em=+P.endMin||15,place=alertPlace(P,ur);
 for(let d=0;d<(P.days||7);d++){const pt=times(new Date(now.getTime()+d*864e5));
  for(const k of PRAYERS){if(!P.alerts[k])continue;const at=pt[k],n=PNAME[k],tm=fmt12(at);
   if(at>now)out.push({id:`p-${k}-${+at}`,at,lang:ur?'ur':'en',dir:ur?'rtl':'ltr',url:'./#/prayer',
    title:k==='sunrise'?(ur?'طلوعِ آفتاب — فجر کا وقت ختم':'Sunrise — Fajr time has ended'):(ur?`${n[1]} کا وقت`:`${n[0]} time · ${n[1]}`),
    body:k==='sunrise'?(ur?`طلوع ${tm}${place?' · '+place:''}`:`Sunrise at ${tm}${place?' · '+place:''}`):(ur?`${n[1]} کا وقت شروع ہو گیا · ${tm}${place?' · '+place:''}`:`${n[0]} began at ${tm}${place?' · '+place:''}`)});
   const e=ENDS[k];if(P.endAlert&&e){const end=pt[e],at2=new Date(+end-em*6e4);if(at2>now&&at2>at)out.push({id:`e-${k}-${+end}`,at:at2,grace:em*6e4,lang:ur?'ur':'en',dir:ur?'rtl':'ltr',url:'./#/prayer',
    title:ur?`${n[1]} کا وقت ختم ہونے والا ہے`:`${n[0]} time ends soon`,body:ur?`${em} منٹ باقی · ${fmt12(end)} تک`:`${em} min left · ends at ${fmt12(end)}`})}}}
 return out.sort((x,y)=>x.at-y.at)}
async function webArm(group,items,adhan){if(!N.supported())return {ok:false,reason:'unsupported'};
 const perm=await N.ask();if(perm!=='granted')return {ok:false,reason:perm==='denied'?'permission denied':'permission not given'};
 const r=await N.arm(group,items,{onFire:x=>{if(adhan&&P.adhan&&/^p-/.test(x.id)&&!/^p-sunrise/.test(x.id)&&!document.hidden)new Audio(import.meta.env.BASE_URL+'adhan.wav').play().catch(()=>{})}});
 return {...r,mode:r.mode==='trigger'?'scheduled':r.bg?'background':'open'}}
export async function cancelAll(){if(!native()&&N.supported())await N.clear('prayer').catch(()=>{});
 if(!native())return;return nativeTurn(async()=>{const pend=(await LocalNotifications.getPending()).notifications||[];const mine=pend.filter(n=>isPrayerNotifId(n.id));await cancelIds(mine);return {ok:true,count:mine.length}})}
// ---- generic reminders (khatam, ayah of the day, calendar events, Ramadan) ----
// group: string key; items: [{at:Date,title,body}]. Native ids: REMINDER_ID_BASE + group slot*REMINDER_SPAN + i.
// Prayer alerts occupy 1000–4999 and never cancel these.
export async function setReminders(group,items){const now=new Date(),range=reminderRange(group);items=(items||[]).filter(x=>x.at>now).slice(0,group==='events'?20:14);
 if(!range)return {ok:false,reason:'unknown group'};
 if(native()){const perm=await LocalNotifications.requestPermissions();if(perm.display!=='granted')return {ok:false,reason:'permission denied'};
  return nativeTurn(async()=>{const pend=(await LocalNotifications.getPending()).notifications||[];const owns=id=>id>=range.base&&id<range.end;const {mine,keep}=partitionPending(pend,owns);await cancelIds(mine);
   const fit=fitPending(items,keep.length);
   if(fit.length)await LocalNotifications.schedule({notifications:fit.map((x,i)=>({id:range.base+i,title:x.title,body:x.body,schedule:{at:x.at,allowWhileIdle:true},channelId:'prayer'}))});
   return {ok:true,count:fit.length,mode:'native'}})}
 if(!items.length){if(N.supported())await N.clear(group).catch(()=>{});return {ok:true,count:0}}
 return webArm(group,items.map((x,i)=>({id:`r-${group}-${+x.at}-${i}`,at:x.at,title:x.title,body:x.body,grace:2*36e5,url:x.url})),false)}
/** Daily times at HH:MM for the next n days. */
export function dailyAt(hhmm,n=7,from=new Date()){const [h,m]=hhmm.split(':').map(Number);const out=[];for(let i=0;i<=n;i++){const d=new Date(from.getFullYear(),from.getMonth(),from.getDate()+i,h,m);if(d>from)out.push(d)}return out.slice(0,n)}
// Home header state. Makrooh windows (minutes) are constants.
export const MAKROOH={afterSunrise:20,beforeDhuhr:10,beforeMaghrib:15};
// pt: today's times; nx: next prayer {key,time}. Returns {mode:'makrooh',kind,from,until} | {mode:'current',key:'fajr',from,time} | {mode:'next',key,time}
export function headerState(pt,now,nx){const m=6e4,t=+now;
 if(t>=+pt.sunrise&&t<+pt.sunrise+MAKROOH.afterSunrise*m)return{mode:'makrooh',kind:'sunrise',from:pt.sunrise,until:new Date(+pt.sunrise+MAKROOH.afterSunrise*m)};
 if(t>=+pt.dhuhr-MAKROOH.beforeDhuhr*m&&t<+pt.dhuhr)return{mode:'makrooh',kind:'zawal',from:new Date(+pt.dhuhr-MAKROOH.beforeDhuhr*m),until:pt.dhuhr};
 if(t>=+pt.maghrib-MAKROOH.beforeMaghrib*m&&t<+pt.maghrib)return{mode:'makrooh',kind:'sunset',from:new Date(+pt.maghrib-MAKROOH.beforeMaghrib*m),until:pt.maghrib};
 if(t>=+pt.fajr&&t<+pt.sunrise)return{mode:'current',key:'fajr',from:pt.fajr,time:pt.sunrise};
 return nx?{mode:'next',key:nx.key,time:nx.time}:null}
