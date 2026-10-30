import {dayIn} from './lib.js';
import * as DT from './dates.js';
import {Coordinates,CalculationMethod,PrayerTimes,Madhab,Qibla,HighLatitudeRule} from 'adhan';
import {Capacitor} from '@capacitor/core';
import {LocalNotifications} from '@capacitor/local-notifications';
const LS={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};
export const CITIES=[['Karachi',24.8607,67.0011,'Asia/Karachi','Karachi'],['Lahore',31.5204,74.3587,'Asia/Karachi','Karachi'],['Islamabad',33.6844,73.0479,'Asia/Karachi','Karachi'],['Peshawar',34.0151,71.5249,'Asia/Karachi','Karachi'],['Quetta',30.1798,66.975,'Asia/Karachi','Karachi'],['Hyderabad (PK)',25.396,68.3578,'Asia/Karachi','Karachi'],['Multan',30.1575,71.5249,'Asia/Karachi','Karachi'],['Faisalabad',31.4504,73.135,'Asia/Karachi','Karachi'],['Mumbai',19.076,72.8777,'Asia/Kolkata','Karachi'],['Delhi',28.6139,77.209,'Asia/Kolkata','Karachi'],['Hyderabad (IN)',17.385,78.4867,'Asia/Kolkata','Karachi'],['Lucknow',26.8467,80.9462,'Asia/Kolkata','Karachi'],['Kolkata',22.5726,88.3639,'Asia/Kolkata','Karachi'],['Bengaluru',12.9716,77.5946,'Asia/Kolkata','Karachi'],['Dhaka',23.8103,90.4125,'Asia/Dhaka','Karachi'],['Makkah',21.3891,39.8579,'Asia/Riyadh','UmmAlQura'],['Madinah',24.5247,39.5692,'Asia/Riyadh','UmmAlQura'],['Riyadh',24.7136,46.6753,'Asia/Riyadh','UmmAlQura'],['Dubai',25.2048,55.2708,'Asia/Dubai','Dubai'],['Doha',25.2854,51.531,'Asia/Qatar','Qatar'],['Kuwait City',29.3759,47.9774,'Asia/Kuwait','Kuwait'],['Cairo',30.0444,31.2357,'Africa/Cairo','Egyptian'],['Istanbul',41.0082,28.9784,'Europe/Istanbul','Turkey'],['Tehran',35.6892,51.389,'Asia/Tehran','Tehran'],['Kabul',34.5553,69.2075,'Asia/Kabul','Karachi'],['Jakarta',-6.2088,106.8456,'Asia/Jakarta','Singapore'],['Kuala Lumpur',3.139,101.6869,'Asia/Kuala_Lumpur','Singapore'],['Singapore',1.3521,103.8198,'Asia/Singapore','Singapore'],['London',51.5074,-0.1278,'Europe/London','MuslimWorldLeague'],['Birmingham',52.4862,-1.8904,'Europe/London','MuslimWorldLeague'],['Paris',48.8566,2.3522,'Europe/Paris','MuslimWorldLeague'],['Berlin',52.52,13.405,'Europe/Berlin','MuslimWorldLeague'],['New York',40.7128,-74.006,'America/New_York','NorthAmerica'],['Chicago',41.8781,-87.6298,'America/Chicago','NorthAmerica'],['Houston',29.7604,-95.3698,'America/Chicago','NorthAmerica'],['Toronto',43.6532,-79.3832,'America/Toronto','NorthAmerica'],['Los Angeles',34.0522,-118.2437,'America/Los_Angeles','NorthAmerica'],['Sydney',-33.8688,151.2093,'Australia/Sydney','MuslimWorldLeague'],['Johannesburg',-26.2041,28.0473,'Africa/Johannesburg','MuslimWorldLeague'],['Lagos',6.5244,3.3792,'Africa/Lagos','MuslimWorldLeague']];
export const METHODS={Karachi:'Karachi (Univ. of Islamic Sciences)',MuslimWorldLeague:'Muslim World League',NorthAmerica:'ISNA (North America)',UmmAlQura:'Umm al-Qura, Makkah',Egyptian:'Egyptian General Authority',Dubai:'Dubai',Qatar:'Qatar',Kuwait:'Kuwait',Turkey:'Turkey (Diyanet)',Tehran:'Tehran',Singapore:'Singapore/MUIS',MoonsightingCommittee:'Moonsighting Committee'};
export const PRAYERS=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
export const PNAME={fajr:['Fajr','فجر'],sunrise:['Sunrise','طلوع'],dhuhr:['Dhuhr','ظہر'],asr:['Asr','عصر'],maghrib:['Maghrib','مغرب'],isha:['Isha','عشاء']};
export const P=Object.assign({city:'Karachi',lat:24.8607,lng:67.0011,tz:'Asia/Karachi',src:'city',method:'Karachi',madhab:'Hanafi',hijriAdj:0,alerts:{fajr:true,dhuhr:true,asr:true,maghrib:true,isha:true,sunrise:false},adhan:true,days:7},LS.get('prayer',{}));
export const saveP=()=>LS.set('prayer',P);
export function params(){const p=(CalculationMethod[P.method]||CalculationMethod.Karachi)();p.madhab=P.madhab==='Hanafi'?Madhab.Hanafi:Madhab.Shafi;if(P.hlr&&P.hlr!=='auto'&&HighLatitudeRule[P.hlr])p.highLatitudeRule=HighLatitudeRule[P.hlr];else if(Math.abs(P.lat)>48)p.highLatitudeRule=HighLatitudeRule.recommended(new Coordinates(P.lat,P.lng));if(P.adj)for(const k of Object.keys(p.adjustments))p.adjustments[k]=+P.adj[k]||0;return p}
// Prayer times for the calendar day of `date` in the selected city's timezone (not the device's).
export function times(date=new Date()){return new PrayerTimes(new Coordinates(P.lat,P.lng),dayIn(P.tz,date),params())}
export const fmt=d=>d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:P.tz||undefined});
export function fmt12(d){return d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZone:P.tz||undefined})}
export function next(now=new Date()){for(let i=0;i<2;i++){const day=new Date(now.getTime()+i*864e5),pt=times(day);for(const k of PRAYERS){if(k==='sunrise')continue;if(pt[k]>now)return{key:k,time:pt[k]}}}}
export const qibla=()=>Qibla(new Coordinates(P.lat,P.lng));
export const hijri=(d=new Date(),lang='en')=>DT.hijriText(d,lang,+P.hijriAdj||0);
export const greg=(d=new Date(),lang='en')=>DT.gregText(d,lang);
export function locate(){return new Promise((res,rej)=>{if(!navigator.geolocation)return rej(new Error('no geolocation'));navigator.geolocation.getCurrentPosition(p=>{P.lat=+p.coords.latitude.toFixed(4);P.lng=+p.coords.longitude.toFixed(4);P.src='gps';P.city='GPS '+P.lat+', '+P.lng;P.tz=Intl.DateTimeFormat().resolvedOptions().timeZone;saveP();res(P)},e=>rej(new Error(e.code===1?'permission denied':e.code===3?'timeout':'position unavailable')),{enableHighAccuracy:false,timeout:15000,maximumAge:6e5})})}
export function setCity(name){const c=CITIES.find(c=>c[0]===name);if(!c)return;[P.city,P.lat,P.lng,P.tz]=c;P.method=c[4];P.src='city';saveP()}
// ---- notifications ----
const native=()=>Capacitor.isNativePlatform();export const isNative=native;let webTimers=[];
export async function schedule(){const now=new Date();const items=[];
 for(let d=0;d<(P.days||7);d++){const pt=times(new Date(now.getTime()+d*864e5));for(const k of PRAYERS){if(!P.alerts[k]||pt[k]<=now)continue;items.push({k,at:pt[k]})}}
 if(native()){const perm=await LocalNotifications.requestPermissions();if(perm.display!=='granted')return {ok:false,reason:'permission denied'};
  try{await LocalNotifications.createChannel({id:'adhan',name:'Adhan',importance:5,sound:'adhan.wav',vibration:true});await LocalNotifications.createChannel({id:'prayer',name:'Prayer alerts',importance:4,vibration:true})}catch{}
  const pend=await LocalNotifications.getPending();if(pend.notifications.length)await LocalNotifications.cancel({notifications:pend.notifications.map(n=>({id:n.id}))});
  const list=items.slice(0,60).map((x,i)=>({id:1000+i,title:`${PNAME[x.k][0]} · ${PNAME[x.k][1]}`,body:`It's time for ${PNAME[x.k][0]} (${fmt12(x.at)}) — ${P.city}`,schedule:{at:x.at,allowWhileIdle:true},channelId:P.adhan&&x.k!=='sunrise'?'adhan':'prayer',sound:P.adhan&&x.k!=='sunrise'?'adhan.wav':undefined}));
  if(list.length)await LocalNotifications.schedule({notifications:list});return {ok:true,count:list.length,mode:'native'}}
 if(!('Notification' in window))return {ok:false,reason:'notifications unsupported'};
 const perm=Notification.permission==='granted'?'granted':await Notification.requestPermission();if(perm!=='granted')return {ok:false,reason:'permission denied'};
 webTimers.forEach(clearTimeout);webTimers=items.filter(x=>x.at-now<2**31-1).map(x=>setTimeout(()=>{new Notification(`${PNAME[x.k][0]} · ${PNAME[x.k][1]}`,{body:`It's time for ${PNAME[x.k][0]} — ${P.city}`,icon:import.meta.env.BASE_URL+'icon.svg'});if(P.adhan&&x.k!=='sunrise')new Audio(import.meta.env.BASE_URL+'adhan.wav').play().catch(()=>{})},x.at-now));
 return {ok:true,count:webTimers.length,mode:'web (while app is open)'}}
export async function cancelAll(){webTimers.forEach(clearTimeout);webTimers=[];if(native()){const p=await LocalNotifications.getPending();if(p.notifications.length)await LocalNotifications.cancel({notifications:p.notifications.map(n=>({id:n.id}))})}}
// ---- generic reminders (khatam, ayah of the day, calendar events) ----
// group: string key; items: [{at:Date,title,body}]. Native ids: 5000 + group slot*200 + i.
const GROUPS=['khatam','aotd','events','ramadan'];let webRem={};
export async function setReminders(group,items){const now=new Date();items=items.filter(x=>x.at>now).slice(0,group==='events'?20:14);const base=5000+GROUPS.indexOf(group)*200;
 if(native()){const perm=await LocalNotifications.requestPermissions();if(perm.display!=='granted')return {ok:false,reason:'permission denied'};
  const pend=await LocalNotifications.getPending();const mine=pend.notifications.filter(n=>n.id>=base&&n.id<base+200);if(mine.length)await LocalNotifications.cancel({notifications:mine.map(n=>({id:n.id}))});
  if(items.length)await LocalNotifications.schedule({notifications:items.map((x,i)=>({id:base+i,title:x.title,body:x.body,schedule:{at:x.at,allowWhileIdle:true},channelId:'prayer'}))});return {ok:true,count:items.length,mode:'native'}}
 (webRem[group]||[]).forEach(clearTimeout);webRem[group]=[];if(!items.length)return {ok:true,count:0};
 if(!('Notification' in window))return {ok:false,reason:'notifications unsupported'};
 const perm=Notification.permission==='granted'?'granted':await Notification.requestPermission();if(perm!=='granted')return {ok:false,reason:'permission denied'};
 webRem[group]=items.filter(x=>x.at-now<2**31-1).map(x=>setTimeout(()=>new Notification(x.title,{body:x.body,icon:import.meta.env.BASE_URL+'icon-192.png'}),x.at-now));return {ok:true,count:webRem[group].length,mode:'web (while app is open)'}}
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
