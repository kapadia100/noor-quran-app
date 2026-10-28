// Listen buttons on hadith cards: Play / Pause / Stop with the phone's own voices, speed, and "play next automatically".
import*as H from'./hadith-tts.js';
import{codeOf}from'./hadith-lang.js';
const TX={en:{play:'Play',pause:'Pause',resume:'Resume',stop:'Stop',arOnly:'Listening is for translations. Choose another language to play.',speed:'Speed',cont:'Play next automatically',none:'No voice for this language on your device',silent:'Nothing played: your device did not speak. Check the volume and the silent switch.'},
 ur:{play:'سنیں',pause:'وقفہ',resume:'جاری رکھیں',stop:'بند',arOnly:'سننے کی سہولت ترجمے کے لیے ہے۔ سننے کے لیے کوئی اور زبان چنیں۔',speed:'رفتار',cont:'اگلی حدیث خود چلائیں',none:'آپ کے آلے پر اس زبان کی آواز موجود نہیں',silent:'آواز نہیں چلی: آپ کے آلے نے آواز نہیں دی۔ والیوم اور سائلنٹ سوئچ دیکھیں۔'}};
const LSK='qsHadithListen';
const pref=()=>{try{return{rate:1,cont:false,...JSON.parse(localStorage.getItem(LSK)||'{}')}}catch{return{rate:1,cont:false}}};
const savePref=p=>{try{localStorage.setItem(LSK,JSON.stringify(p))}catch{/* ignore */}};
const I={play:'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="currentColor"/></svg>',pause:'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor"/></svg>',stop:'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 6h12v12H6z" fill="currentColor"/></svg>'};
let AUTO=null,off=[];
/** Settings strip shown above the hadith cards (hidden until the device is known to have a voice, or to explain why not). */
export const listenBar=ui=>{const t=TX[ui]||TX.en,p=pref();return `<div class="card hl" id="hlBar" hidden><div class="hl-row" id="hlRow"><label>${t.speed} <select id="hlRate" aria-label="${t.speed}">${[0.8,1,1.2].map(r=>`<option value="${r}" ${r===p.rate?'selected':''}>${r}×</option>`).join('')}</select></label><label><input type="checkbox" id="hlCont" ${p.cont?'checked':''}> ${t.cont}</label></div><p class="muted" id="hlNote" role="status"></p></div>`};
/** Stops speech when leaving the screen / changing hadith. */
export function leave(){H.stop();off.forEach(f=>f());off=[];if(AUTO&&AUTO.fresh)AUTO.fresh=false;else AUTO=null}
/** Wires the cards in `root`. lang = language code of the shown translation; nextHash = where "play next" continues after the last card (or ''). */
export async function mount(root,{lang,ui='en',nextHash=''}={}){
 const t=TX[ui]||TX.en,bar=root.querySelector('#hlBar'),note=root.querySelector('#hlNote'),cards=[...root.querySelectorAll('article.hd')];
 if(!bar||!cards.length)return;
 const voices=await H.voicesReady();if(!root.isConnected)return;
 // Play exists only for the translation language; the Arabic hadith text is never read aloud.
 const isAr=codeOf(lang)==='ara',trV=H.supported()&&!isAr?H.pickVoice(voices,lang):null,can=!!trV;
 bar.hidden=false;bar.querySelector('#hlRow').hidden=!can;
 note.textContent=isAr?t.arOnly:!trV?t.none:'';
 if(!can)return;
 cards.forEach((c,i)=>{c.dataset.i=i;const at=c.querySelector('.tools .grow');
  const mk=(kind,label)=>`<button type="button" class="hl-b" data-hl="${kind}" data-i="${i}" aria-label="${label}">${I.play}<span>${label}</span></button>`;
  let h=mk('tr',t.play);h+=`<button type="button" class="hl-b hl-x" data-hl-stop data-i="${i}" aria-label="${t.stop}" hidden>${I.stop}</button>`;
  at?.insertAdjacentHTML('beforebegin',`<span class="hl-btns">${h}</span>`)});
 const rate=()=>+root.querySelector('#hlRate').value||1,cont=()=>root.querySelector('#hlCont').checked;
 root.querySelector('#hlRate').onchange=()=>{savePref({...pref(),rate:rate()});H.setRate(rate())};
 root.querySelector('#hlCont').onchange=()=>savePref({...pref(),cont:cont()});
 const idOf=i=>`${i}:tr`;
 const start=i=>{const c=cards[i],el=c&&c.querySelector('.tr');if(!el||!c.querySelector('[data-hl="tr"]'))return false;
  note.textContent='';
  return H.play({id:idOf(i),text:el.textContent,lang,voice:trV,rate:rate(),onEnd:()=>{
   if(!cont())return;
   for(let n=i+1;n<cards.length;n++)if(start(n)){cards[n].scrollIntoView?.({block:'center',behavior:'smooth'});return}
   if(nextHash&&root.isConnected){AUTO={fresh:true};location.hash=nextHash}}})};
 const paint=s=>{root.querySelectorAll('.hl-b[data-hl]').forEach(b=>{const on=s.id===idOf(b.dataset.i),lab=t.play;
   const txt=!on?lab:s.state==='paused'?t.resume:t.pause;b.querySelector('span').textContent=txt;b.setAttribute('aria-label',txt);b.dataset.st=on?s.state:'idle';
   b.querySelector('svg').outerHTML=on&&s.state!=='paused'?I.pause:I.play});
  root.querySelectorAll('.hl-x').forEach(b=>{b.hidden=!(s.id&&s.id.split(':')[0]===b.dataset.i)});
  cards.forEach((c,i)=>c.classList.toggle('hd-on',!!s.id&&s.id.split(':')[0]===String(i)))};
 off.push(H.onChange(paint),H.onError(()=>{note.textContent=t.silent}));
 root.addEventListener('click',e=>{const x=e.target.closest('[data-hl-stop]');if(x){H.stop();return}
  const b=e.target.closest('[data-hl]');if(!b)return;const i=+b.dataset.i,id=idOf(i),s=H.info();
  if(s.id===id&&(s.state==='playing'||s.state==='starting'))H.pause();else if(s.id===id&&s.state==='paused')H.resume();else start(i)});
 if(AUTO){AUTO=null;setTimeout(()=>{if(root.isConnected&&!H.info().id)start(0)},350)}
}
