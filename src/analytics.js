// Anonymous, cookie-free aggregate counts via GoatCounter (https://quransafar.goatcounter.com).
// No personal data; respects Do Not Track; skipped in automated browsers (tests) unless localStorage.gcDebug=1.
const ENDPOINT='https://quransafar.goatcounter.com/count';
const native=()=>!!window.Capacitor?.isNativePlatform?.();
const dnt=()=>navigator.doNotTrack==='1'||window.doNotTrack==='1'||navigator.globalPrivacyControl===true;
const off=()=>dnt()||(navigator.webdriver&&localStorage.getItem('gcDebug')!=='1');
const q=[];let loaded=false;
export function init(){if(off())return;window.goatcounter=Object.assign(window.goatcounter||{},{no_onload:true,allow_local:native(),endpoint:ENDPOINT});
 const s=document.createElement('script');s.async=true;s.src='https://gc.zgo.at/count.js';s.dataset.goatcounter=ENDPOINT;s.onload=()=>{loaded=true;q.splice(0).forEach(send)};document.head.append(s)}
function send(o){try{window.goatcounter?.count?.(o);(window.__gc??=[]).push(o)}catch{/* ignore */}}
export function hit(o){if(off())return;if(loaded&&window.goatcounter?.count)send(o);else q.push(o)}
export const page=path=>hit({path:(native()?'/app':'')+path,title:document.title});
export const event=name=>hit({path:name,title:name,event:true});
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true||native();
export function startup(){init();if(sessionStorage.getItem('gcOpen'))return;sessionStorage.setItem('gcOpen','1');
 event(native()?'app-open-native':standalone()?'app-open-standalone':'app-open-browser');
 if(standalone()&&!localStorage.getItem('gcInstalled')){localStorage.setItem('gcInstalled','1');event('pwa-installed')}
 addEventListener('appinstalled',()=>{if(!localStorage.getItem('gcInstalled')){localStorage.setItem('gcInstalled','1');event('pwa-installed')}})}
const FEAT={tasbeeh:'tasbeeh',prayer:'prayer',qibla:'qibla',hsearch:'hadith-search',mosques:'mosques',zakat:'zakat',names:'names',duas:'duas',mushaf:'mushaf',hifz:'hifz',khatam:'khatam',tracker:'prayer-tracker',calendar:'calendar',ramadan:'ramadan'};
export function route(p){const seg=p[0]||'home';page('/'+seg+(seg==='hadith'&&p[1]?'/'+p[1]:''));if(FEAT[seg])event('feature-'+FEAT[seg]);if(seg==='hadith'&&p[2]==='n')event('feature-hadith-search')}
