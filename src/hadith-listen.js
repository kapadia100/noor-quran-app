// Listen buttons on hadith cards: Play / Pause / Stop with the phone's own voices, speed, and "play next automatically".
import*as H from'./hadith-tts.js';
import{langName}from'./hadith-lang.js';
const TX={en:{play:'Play',pause:'Pause',resume:'Resume',stop:'Stop',noV:n=>n==='Arabic'?'No Arabic voice on this device. Add one in your phone\'s language and speech settings to play Arabic.':`No ${n} voice on this device`,pl:n=>`Play ${n}`,speed:'Speed',cont:'Play next automatically',none:'No voice for this language on your device',silent:'Nothing played: your device did not speak. Check the volume and the silent switch.',auto:'Playing an auto-translated Urdu text (machine translation from English).'},
 ur:{play:'سنیں',pause:'وقفہ',resume:'جاری رکھیں',stop:'بند',noV:(n,a)=>a?'اس آلے پر عربی آواز موجود نہیں۔ عربی سننے کے لیے فون کی زبان اور آواز کی سیٹنگ میں عربی آواز شامل کریں۔':`اس آلے پر ${n} کی آواز موجود نہیں`,pl:n=>`${n} سنیں`,speed:'رفتار',cont:'اگلی حدیث خود چلائیں',none:'آپ کے آلے پر اس زبان کی آواز موجود نہیں',silent:'آواز نہیں چلی: آپ کے آلے نے آواز نہیں دی۔ والیوم اور سائلنٹ سوئچ دیکھیں۔',auto:'خودکار ترجمہ چل رہا ہے (انگریزی سے مشینی ترجمہ)۔'}};
const LSK='qsHadithListen';
const pref=()=>{try{return{rate:1,cont:false,...JSON.parse(localStorage.getItem(LSK)||'{}')}}catch{return{rate:1,cont:false}}};
const savePref=p=>{try{localStorage.setItem(LSK,JSON.stringify(p))}catch{/* ignore */}};
const I={play:'<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4zM15 8.6a4.8 4.8 0 010 6.8M17.4 6a8.4 8.4 0 010 12" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',pause:'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor"/></svg>',stop:'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 6h12v12H6z" fill="currentColor"/></svg>'};
let AUTO=null,off=[];
/** Settings strip shown above the hadith cards (hidden until the device is known to have a voice, or to explain why not). */
export const listenBar=ui=>{const t=TX[ui]||TX.en,p=pref();return `<div class="card hl" id="hlBar" hidden><div class="hl-row" id="hlRow"><label>${t.speed} <select id="hlRate" aria-label="${t.speed}">${[0.8,1,1.2].map(r=>`<option value="${r}" ${r===p.rate?'selected':''}>${r}×</option>`).join('')}</select></label><label><input type="checkbox" id="hlCont" ${p.cont?'checked':''}> ${t.cont}</label></div><p class="muted" id="hlNote" role="status"></p></div>`};
/** Stops speech when leaving the screen / changing hadith. */
export function leave(){H.stop();off.forEach(f=>f());off=[];if(AUTO&&AUTO.fresh)AUTO.fresh=false;else AUTO=null}
/** Wires the cards in `root`. Each card plays the text it currently shows (Arabic, Urdu, English...): Arabic only when Arabic is the picked text, with the device's Arabic voice. nextHash = where "play next" continues after the last card (or ''). */
export async function mount(root,{ui='en',nextHash=''}={}){
 const t=TX[ui]||TX.en,bar=root.querySelector('#hlBar'),note=root.querySelector('#hlNote'),cards=[...root.querySelectorAll('article.hd')];
 if(!bar||!cards.length)return;
 const sup=H.supported(),voices=sup?await H.voicesReady():[];if(!root.isConnected)return;
 const vf=l=>sup?H.pickVoice(voices,l):null;
 bar.hidden=false;bar.querySelector('#hlRow').hidden=!sup;note.textContent=sup?'':t.none;
 if(!sup)return;
 const panel=(c,l=c.dataset.sel)=>c.querySelector(`.hd-t[data-l="${l}"]`);
 const canPlay=c=>{const p=panel(c);return !!(p&&!p.dataset.miss&&vf(c.dataset.sel))};
 const idOf=i=>`${i}:${cards[i].dataset.sel}`;
 const mk=(c,i)=>{const nm=langName(c.dataset.sel,ui,true);const lab=t.pl(nm);
  c.querySelector('.hd-ctl').innerHTML=`<button type="button" class="hl-b hl-ic" data-hl="tr" data-i="${i}" aria-label="${lab}" title="${lab}">${I.play}<span class="hl-sr">${t.play}</span></button><button type="button" class="hl-b hl-x" data-hl-stop data-i="${i}" aria-label="${t.stop}" hidden>${I.stop}</button>`};
 const sync=c=>{const l=c.dataset.sel,b=c.querySelector('[data-hl]'),nv=c.querySelector('.hd-nv'),p=panel(c),miss=!p||p.dataset.miss,v=vf(l),i=+c.dataset.i,nm=langName(l,ui,true);
  const idle=!(H.info().id===idOf(i));if(idle){const lab=t.pl(nm);b.setAttribute('aria-label',lab);b.title=lab;b.querySelector('span').textContent=t.play}
  b.disabled=!(!miss&&v);if(!miss&&!v){nv.hidden=false;nv.textContent=t.noV(nm,l==='ara')}else{nv.hidden=true;nv.textContent=''}};
 cards.forEach((c,i)=>{c.dataset.i=i;mk(c,i);sync(c)});
 const rate=()=>+root.querySelector('#hlRate').value||1,cont=()=>root.querySelector('#hlCont').checked;
 root.querySelector('#hlRate').onchange=()=>{savePref({...pref(),rate:rate()});H.setRate(rate())};
 root.querySelector('#hlCont').onchange=()=>savePref({...pref(),cont:cont()});
 const start=i=>{const c=cards[i];if(!c||!canPlay(c))return false;const l=c.dataset.sel,p=panel(c),el=p.querySelector('p');if(!el)return false;
  note.textContent=p.dataset.auto?t.auto:'';
  return H.play({id:idOf(i),text:el.textContent,lang:l,voice:vf(l),rate:rate(),onEnd:()=>{
   if(!cont())return;
   for(let n=i+1;n<cards.length;n++)if(start(n)){cards[n].scrollIntoView?.({block:'center',behavior:'smooth'});return}
   if(nextHash&&root.isConnected){AUTO={fresh:true};location.hash=nextHash}}})};
 const paint=s=>{cards.forEach((c,i)=>{const on=!!s.id&&s.id===idOf(i),b=c.querySelector('[data-hl]');
   if(on){const txt=s.state==='paused'?t.resume:t.pause;b.querySelector('span').textContent=txt;b.setAttribute('aria-label',txt);b.title=txt}
   b.dataset.st=on?s.state:'idle';b.querySelector('svg').outerHTML=on&&s.state!=='paused'?I.pause:I.play;
   c.querySelector('.hl-x').hidden=!(s.id&&s.id.split(':')[0]===String(i));c.classList.toggle('hd-on',!!s.id&&s.id.split(':')[0]===String(i));if(!on)sync(c)});
  if(!s.id&&note.textContent===t.auto)note.textContent=''};
 off.push(H.onChange(paint),H.onError(()=>{note.textContent=t.silent}));
 // Picking another text on a card that is playing stops it; the speaker then follows the newly picked text.
 const onSel=e=>{const c=e.target.closest('article.hd');if(!c)return;const i=+c.dataset.i,s=H.info();if(s.id&&s.id.split(':')[0]===String(i))H.stop();note.textContent='';sync(c)};
 root.addEventListener('hd-sel',onSel);off.push(()=>root.removeEventListener('hd-sel',onSel));
 const onClick=e=>{const x=e.target.closest('[data-hl-stop]');if(x){H.stop();return}
  const b=e.target.closest('[data-hl]');if(!b||b.disabled)return;const i=+b.dataset.i,id=idOf(i),s=H.info();
  if(s.id===id&&(s.state==='playing'||s.state==='starting'))H.pause();else if(s.id===id&&s.state==='paused')H.resume();else start(i)};
 root.addEventListener('click',onClick);off.push(()=>root.removeEventListener('click',onClick));
 if(AUTO){AUTO=null;setTimeout(()=>{if(root.isConnected&&!H.info().id)start(0)},350)}
}
