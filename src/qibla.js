// Qibla Finder: great-circle bearing (true north), WMM2025 declination grid (epoch 2026.8, 10° grid), compass UI.
export const KAABA=[21.422487,39.826206];
const R=Math.PI/180;
export function bearing(lat,lng){const [La,Lo]=KAABA,a=lat*R,b=La*R,d=(Lo-lng)*R;
 return (Math.atan2(Math.sin(d)*Math.cos(b),Math.cos(a)*Math.sin(b)-Math.sin(a)*Math.cos(b)*Math.cos(d))/R+360)%360}
export function distKm(lat,lng){const [La,Lo]=KAABA,dl=(La-lat)*R,dg=(Lo-lng)*R,h=Math.sin(dl/2)**2+Math.cos(lat*R)*Math.cos(La*R)*Math.sin(dg/2)**2;return 2*6371.0088*Math.asin(Math.sqrt(h))}
const G=[[128.4,116.3,105.2,95.1,85.7,76.9,68.6,60.5,52.6,44.9,37.3,29.8,22.3,14.8,7.3,-0.2,-7.9,-15.8,-23.9,-32.2,-40.8,-49.7,-58.8,-68.1,-77.7,-87.5,-97.8,-108.6,-120.0,-132.2,-145.3,-159.3,-174.0,170.9,155.9,141.6,128.4],[85.9,77.9,71.3,65.8,60.7,55.9,51.0,45.9,40.4,34.5,28.4,22.2,16.0,10.0,4.2,-1.6,-7.5,-13.9,-20.9,-28.4,-36.4,-44.7,-53.0,-61.4,-69.6,-77.7,-86.0,-94.6,-104.0,-115.2,-130.0,-152.4,173.6,137.1,112.1,96.5,85.9],[48.9,47.4,45.6,43.9,42.4,40.8,39.0,36.4,32.8,28.0,22.2,15.9,9.5,3.8,-1.1,-5.4,-9.5,-14.4,-20.3,-27.4,-35.2,-43.2,-50.8,-57.8,-63.8,-68.9,-73.0,-75.8,-76.7,-74.0,-61.5,-17.4,30.6,45.2,49.3,49.8,48.9],[31.9,32.1,31.7,31.1,30.6,30.3,30.0,29.2,27.1,23.2,17.3,10.0,2.4,-4.1,-8.8,-11.8,-13.9,-16.6,-20.9,-27.2,-34.7,-42.2,-48.7,-53.7,-57.0,-58.1,-56.8,-52.1,-43.2,-29.4,-12.7,3.0,14.9,23.0,28.0,30.7,31.9],[23.0,23.5,23.5,23.2,22.8,22.6,22.6,22.4,21.3,18.0,12.0,3.6,-5.2,-12.4,-16.9,-19.1,-19.9,-20.3,-21.8,-25.9,-32.1,-38.4,-43.3,-46.0,-46.3,-43.7,-38.3,-30.1,-20.3,-10.7,-2.5,4.4,10.3,15.3,19.1,21.6,23.0],[17.3,17.8,17.9,17.8,17.4,17.0,16.6,16.4,15.5,12.5,6.3,-2.5,-11.6,-18.4,-22.2,-23.8,-24.0,-22.6,-20.5,-20.3,-23.1,-27.6,-31.2,-32.7,-31.5,-27.7,-22.0,-15.1,-8.4,-3.2,0.6,3.9,7.5,11.0,14.0,16.1,17.3],[13.5,13.8,13.9,13.8,13.6,13.0,12.4,12.0,11.0,7.9,1.5,-7.2,-15.5,-21.2,-23.8,-24.0,-22.6,-19.3,-14.6,-10.7,-9.9,-12.2,-15.7,-17.9,-17.7,-15.3,-11.5,-6.9,-2.6,-0.0,1.3,2.9,5.4,8.3,10.8,12.6,13.5],[11.2,11.2,11.0,11.0,10.8,10.3,9.7,9.2,8.0,4.5,-1.9,-9.9,-17.0,-21.3,-22.3,-20.6,-17.1,-12.7,-8.0,-4.1,-1.8,-2.3,-5.0,-7.7,-8.6,-7.9,-5.9,-3.1,-0.4,0.8,0.9,1.7,3.8,6.4,8.8,10.5,11.2],[10.0,9.7,9.4,9.3,9.3,8.9,8.3,7.6,6.0,2.2,-4.1,-11.1,-16.9,-19.8,-19.3,-16.1,-11.7,-7.3,-3.8,-0.9,1.3,1.7,-0.1,-2.4,-3.6,-3.8,-3.1,-1.6,-0.0,0.3,-0.2,0.1,2.1,4.8,7.4,9.3,10.0],[9.1,9.1,8.9,8.9,9.1,8.8,8.1,7.1,4.8,0.4,-5.6,-11.7,-16.2,-17.7,-16.1,-12.4,-8.0,-4.1,-1.3,0.7,2.5,3.2,2.1,0.3,-0.9,-1.4,-1.5,-1.0,-0.4,-0.8,-1.8,-1.8,-0.1,2.7,5.6,8.0,9.1],[8.0,8.8,9.1,9.6,10.1,10.0,9.2,7.4,4.2,-0.8,-6.9,-12.2,-15.3,-15.6,-13.4,-9.9,-5.8,-2.2,0.2,1.9,3.3,4.0,3.3,1.9,0.9,0.3,-0.2,-0.5,-1.0,-2.2,-3.7,-4.2,-2.8,-0.2,3.0,6.0,8.0],[6.1,8.2,9.6,10.9,11.8,11.9,10.9,8.5,4.3,-1.6,-8.0,-12.8,-14.9,-14.3,-11.9,-8.5,-4.7,-1.3,1.2,2.8,4.0,4.7,4.5,3.7,2.9,2.2,1.3,0.1,-1.5,-3.8,-6.0,-7.0,-6.0,-3.6,-0.3,3.2,6.1],[3.9,7.2,10.0,12.2,13.7,14.0,12.8,9.8,4.7,-2.3,-9.2,-13.9,-15.5,-14.5,-11.8,-8.4,-4.7,-1.2,1.6,3.5,5.0,6.0,6.4,6.4,6.0,5.1,3.5,1.2,-2.0,-5.5,-8.5,-9.9,-9.2,-6.9,-3.5,0.2,3.9],[2.0,6.2,10.1,13.3,15.4,16.1,14.9,11.3,4.9,-3.4,-11.2,-16.2,-17.7,-16.5,-13.7,-10.0,-6.0,-2.1,1.4,4.1,6.4,8.3,9.8,10.8,10.8,9.7,7.0,2.9,-2.3,-7.5,-11.3,-12.9,-12.2,-9.7,-6.2,-2.2,2.0],[0.6,5.4,9.9,13.9,16.8,18.1,17.1,12.7,4.5,-6.1,-15.4,-20.8,-22.2,-20.8,-17.5,-13.3,-8.7,-3.9,0.6,4.8,8.6,12.1,15.2,17.3,18.1,16.9,13.0,6.4,-1.8,-9.2,-14.1,-15.8,-14.9,-12.2,-8.5,-4.1,0.6],[-1.5,3.7,8.8,13.3,16.9,18.6,17.4,11.6,0.2,-13.9,-24.4,-29.2,-29.5,-27.0,-22.8,-17.6,-11.8,-5.8,0.2,6.2,12.0,17.5,22.3,26.3,28.7,28.7,24.9,16.0,3.1,-9.1,-16.4,-19.0,-18.2,-15.4,-11.3,-6.6,-1.5],[-8.0,-2.8,1.9,5.7,7.9,7.1,1.7,-9.6,-24.0,-34.8,-39.6,-39.7,-36.8,-32.0,-26.2,-19.6,-12.5,-5.2,2.2,9.8,17.2,24.6,31.6,38.2,44.0,48.5,50.6,48.1,36.0,10.8,-12.4,-22.3,-24.1,-22.0,-18.0,-13.2,-8.0]]; // rows lat -80..80 step 10, cols lng -180..180 step 10, degrees east-positive
export function declination(lat,lng){const y=Math.min(16,Math.max(0,(lat+80)/10)),x=Math.min(36,Math.max(0,(lng+180)/10)),i=Math.min(15,Math.floor(y)),j=Math.min(35,Math.floor(x)),fy=y-i,fx=x-j;
 return G[i][j]*(1-fx)*(1-fy)+G[i][j+1]*fx*(1-fy)+G[i+1][j]*(1-fx)*fy+G[i+1][j+1]*fx*fy}
export const screenAngle=()=>{try{const a=screen.orientation?.angle??window.orientation??0;return +a||0}catch{return 0}};
// heading of the top of the screen, true north. Both iOS webkitCompassHeading and Android absolute alpha are magnetic -> add declination once.
export const trueHeading=(mag,dec,scr=0)=>((mag+dec+scr)%360+360)%360;
// where the Kaaba marker appears on screen, clockwise from the top pointer
export const markerAngle=(q,h)=>((q-h)%360+360)%360;
export const diff=(q,h)=>{let d=((q-h)%360+540)%360-180;return d===-180?180:d};

const tick=()=>{let s='';for(let a=0;a<360;a+=5){const m=a%30===0,r1=m?126:a%10===0?131:134;s+=`<line x1="150" y1="${150-140}" x2="150" y2="${150-r1+0}" transform="rotate(${a} 150 150)" class="${m?'tk tkM':'tk'}"/>`;
 if(m&&a%90)s+=`<text x="150" y="44" transform="rotate(${a} 150 150)" class="tn">${a}</text>`}
 return s+[['N',0],['E',90],['S',180],['W',270]].map(([t,a])=>`<text x="150" y="48" transform="rotate(${a} 150 150)" class="tc${t==='N'?' tN':''}">${t}</text>`).join('')};

export function render(app,{P,ur,icon,esc}){const tt=(e,u)=>ur?u:e,q=bearing(+P.lat,+P.lng),km=distKm(+P.lat,+P.lng),dec=declination(+P.lat,+P.lng);
 app.innerHTML=`<div class="qf" id="qf">
 <div class="qf-loc card"><span>${icon('pin')} <b>${esc(P.city)}</b><small class="muted">${(+P.lat).toFixed(4)}, ${(+P.lng).toFixed(4)}</small></span><span class="qf-km"><b>${Math.round(km).toLocaleString('en')}</b> <small>${tt('km to Makkah','کلومیٹر مکہ تک')}</small></span></div>
 <div class="qf-wrap"><div class="qf-ptr" aria-hidden="true"></div>
  <div class="qf-dial" id="dial"><svg viewBox="0 0 300 300" aria-hidden="true"><defs><radialGradient id="qfg" cx="50%" cy="45%" r="60%"><stop offset="0" class="qs0"/><stop offset="1" class="qs1"/></radialGradient></defs>
   <g id="qrot" transform="rotate(0 150 150)"><circle cx="150" cy="150" r="146" class="qring"/><circle cx="150" cy="150" r="118" fill="url(#qfg)" class="qin"/>${tick()}
   <g id="qk" class="qf-kaaba" data-q="${q.toFixed(2)}" transform="rotate(${q.toFixed(2)} 150 150)"><line x1="150" y1="150" x2="150" y2="40" class="qray"/><g id="qki" transform="rotate(${(-q).toFixed(2)} 150 6)"><rect x="127" y="-17" width="46" height="46" rx="12" class="qkb"/><svg x="136" y="-8" width="28" height="28" viewBox="0 0 24 24" class="qki">${icon('kaaba').replace(/^<svg[^>]*>|<\/svg>$/g,'')}</svg></g></g></g></svg></div>
  <div class="qf-hub"><div class="deg">${q.toFixed(1)}°</div><small>${tt('from True North','حقیقی شمال سے')}</small></div></div>
 <p id="hd" class="qf-hd" aria-live="polite">${tt('Hold your phone flat…','فون سیدھا رکھیں…')}</p>
 <div id="qcal" class="qf-cal" hidden><svg viewBox="0 0 60 30" aria-hidden="true"><path d="M30 15c-6-8-18-8-18 0s12 8 18 0 18-8 18 0-12 8-18 0"/></svg><span>${tt('Compass accuracy is low. Move away from metal and wave your phone in a figure-8.','کمپاس کی درستی کم ہے۔ دھات سے دور ہو کر فون کو 8 کی شکل میں گھمائیں۔')}</span></div>
 <div class="qf-btns" id="qbtns" hidden><button class="btn pri" id="cmp">${icon('qibla')} ${tt('Allow compass','کمپاس کی اجازت دیں')}</button></div>
 <small class="muted qf-note">${tt(`Qibla ${q.toFixed(1)}° clockwise from true north (shortest path to the Kaaba). Compass corrected for magnetic declination ${dec>=0?'+':''}${dec.toFixed(1)}°.`,`قبلہ حقیقی شمال سے گھڑی کی سمت ${q.toFixed(1)}° (کعبہ تک مختصر ترین راستہ)۔ کمپاس میں مقناطیسی انحراف ${dec>=0?'+':''}${dec.toFixed(1)}° درست کیا گیا ہے۔`)}</small></div>`;
 const $=s=>app.querySelector(s),dial=$('#dial'),qf=$('#qf'),hd=$('#hd'),cal=$('#qcal');
 const rot=$('#qrot'),ki=$('#qki');let shown=null,target=null,raf=0,ok=false,gotAbs=false,t0=0;
 const draw=()=>{raf=0;if(!dial.isConnected||target==null)return;
  shown=shown==null?target:shown+diff(target,((shown%360)+360)%360)*0.25; // low-pass on unwrapped angle
  if(Math.abs(diff(target,((shown%360)+360)%360))>0.05)raf=requestAnimationFrame(draw);
  const H=((shown%360)+360)%360;rot.setAttribute('transform',`rotate(${(-H).toFixed(2)} 150 150)`);ki.setAttribute('transform',`rotate(${(H-q).toFixed(2)} 150 6)`);
  dial.dataset.h=H.toFixed(2);
  const d=diff(q,H),a=Math.abs(d),now=a<=3;
  if(now!==ok){ok=now;qf.classList.toggle('ok',ok);if(ok&&navigator.vibrate)try{navigator.vibrate([40,60,40])}catch{}}
  hd.textContent=ok?tt('✓ Facing Qibla','✓ رخ قبلہ کی طرف ہے'):(d>0?tt(`Turn right ${a.toFixed(0)}°`,`دائیں ${a.toFixed(0)}° مڑیں`):tt(`Turn left ${a.toFixed(0)}°`,`بائیں ${a.toFixed(0)}° مڑیں`));
  qf.classList.toggle('near',!ok&&a<=20)};
 const on=e=>{if(!dial.isConnected)return off();let h=null;
  if(e.webkitCompassHeading!=null&&e.webkitCompassHeading>=0){h=e.webkitCompassHeading;const acc=e.webkitCompassAccuracy;cal.hidden=!(acc<0||acc>25)} // iOS: magnetic, already screen-independent of alpha
  else if(e.alpha!=null&&(e.absolute||e.type==='deviceorientationabsolute')){h=(360-e.alpha)%360;gotAbs=true;cal.hidden=true}
  if(h==null){if(Date.now()-t0>2500&&!gotAbs)cal.hidden=false;return}
  h=trueHeading(h,dec,screenAngle());target=h;if(!raf)raf=requestAnimationFrame(draw)};
 const off=()=>{if(raf)cancelAnimationFrame(raf);raf=0;removeEventListener('deviceorientationabsolute',on);removeEventListener('deviceorientation',on)};
 const G='qiblaMotion',btns=$('#qbtns');let started=false;
 const listen=()=>{off();t0=Date.now();qf.classList.add('live');if('ondeviceorientationabsolute' in window)addEventListener('deviceorientationabsolute',on);addEventListener('deviceorientation',on)};
 const begin=()=>{started=true;btns.remove();qf.removeEventListener('click',ask);listen()};
 const prompt=()=>{if(started||!btns.isConnected)return;btns.hidden=false;hd.textContent=tt('Tap anywhere to allow the compass.','کمپاس کی اجازت کے لیے کہیں بھی ٹیپ کریں۔');qf.addEventListener('click',ask)};
 async function ask(){if(started)return;try{if(await DeviceOrientationEvent.requestPermission()!=='granted'){try{localStorage.removeItem(G)}catch{}hd.textContent=tt('Motion permission denied. Enable it in Settings › Safari › Motion & Orientation.','موشن کی اجازت نہیں ملی۔ سیٹنگز › سفاری › موشن اور اورینٹیشن میں فعال کریں۔');return}}catch{hd.textContent=tt('Motion permission was not granted.','موشن کی اجازت نہیں ملی۔');return}
  try{localStorage.setItem(G,'1')}catch{}begin()}
 // auto-start: no permission API -> start now; iOS -> start if granted before (events flow), else one prompt / tap anywhere
 if(!window.DeviceOrientationEvent){btns.remove();hd.textContent=tt('Compass not supported on this device. Use the bearing above.','اس فون پر کمپاس دستیاب نہیں۔ اوپر کا زاویہ استعمال کریں۔')}
 else if(typeof DeviceOrientationEvent.requestPermission!=='function')begin();
 else{let rem=false;try{rem=localStorage.getItem(G)==='1'}catch{}
  if(rem){listen();const chk=()=>{if(target!=null){started=true;btns.remove()}else{off();qf.classList.remove('live');prompt()}};setTimeout(chk,1500)}
  else Promise.resolve().then(()=>DeviceOrientationEvent.requestPermission()).then(r=>{if(r==='granted'&&!started){try{localStorage.setItem(G,'1')}catch{}begin()}else prompt()},prompt)}
 return off}
