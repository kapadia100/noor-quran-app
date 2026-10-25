// The ONLY place that knows how Qaida is entered. To promote Qaida to the front later, call qaidaEntry(tt,I) from Home (it returns one self-contained card/row).
export const QAIDA_HREF='#/qaida';
/** Items learned in both Qaida courses (Noorani key qsQaida, Madani key qsQaidaM). */
const learned=()=>{let g=0;for(const k of ['qsQaida','qsQaidaM']){try{const P=JSON.parse(localStorage.getItem(k))||{};for(const v of Object.values(P.lessons||{})){g+=Object.keys(v.got||{}).length}}catch{/* no progress yet */}}return g};
/** More always opens the chooser. Home opens the last-used Qaida (the chooser the first time). */
const lastHref=()=>{try{const v=localStorage.getItem('qsQaidaPick');return v==='n'||v==='m'?'#/qaida/'+v:QAIDA_HREF}catch{return QAIDA_HREF}};
export function qaidaEntry(tt,I,{big=false}={}){
 const g=learned();
 const tot=g?tt(`${g} items learned`,`${g} اسباق یاد`):tt('Madani or Noorani: learn to read Arabic, step by step','مدنی یا نورانی: عربی پڑھنا قدم بہ قدم سیکھیں');
 return big?`<a class="tutor-card" href="${QAIDA_HREF}" id="qaidaEntry"><span class="ti">${I.icon('letters')}</span><div><b>${tt('Qaida','قاعدہ')}</b><small>${tot}</small></div><span class="go">›</span></a>`
 :`<a class="mrc-row" href="${QAIDA_HREF}" id="mrcQaida"><span class="mi">${I.icon('letters')}</span><span class="mt"><b>${tt('Qaida (learn to read)','قاعدہ (پڑھنا سیکھیں)')}</b><small>${tot}</small></span><span class="go">›</span></a>`}

/** Compact Home card (third in the row): opens the last-used Qaida (the chooser the first time), where every lesson starts with a Live button. */
export function qaidaHomeCard(tt,I){
 return `<a class="hc hc-qaida" href="${lastHref()}" id="homeQaida"><span class="ti">${I.icon('letters')}</span><span class="hc-live">● ${tt('LIVE','لائیو')}</span><b>${tt('Qaida','قاعدہ')}</b><small>${tt('Read letters live','حروف لائیو پڑھیں')}</small></a>`}
