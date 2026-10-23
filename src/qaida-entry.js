// The ONLY place that knows how Qaida is entered. To promote Qaida to the front later, call qaidaEntry(tt,I) from Home (it returns one self-contained card/row).
export const QAIDA_HREF='#/qaida';
export function qaidaEntry(tt,I,{big=false}={}){
 let g=0;try{const P=JSON.parse(localStorage.getItem('qsQaida'))||{};for(const v of Object.values(P.lessons||{})){g+=Object.keys(v.got||{}).length}}catch{/* no progress yet */}
 const tot=g?tt(`${g} items learned`,`${g} اسباق یاد`):tt('Learn to read Arabic, step by step','عربی پڑھنا قدم بہ قدم سیکھیں');
 return big?`<a class="tutor-card" href="${QAIDA_HREF}" id="qaidaEntry"><span class="ti">${I.icon('letters')}</span><div><b>${tt('Noorani Qaida','نورانی قاعدہ')}</b><small>${tot}</small></div><span class="go">›</span></a>`
 :`<a class="mrc-row" href="${QAIDA_HREF}" id="mrcQaida"><span class="mi">${I.icon('letters')}</span><span class="mt"><b>${tt('Noorani Qaida (learn to read)','نورانی قاعدہ (پڑھنا سیکھیں)')}</b><small>${tot}</small></span><span class="go">›</span></a>`}

/** Compact Home card (third in the row): opens Qaida, where every lesson starts with a Live button. */
export function qaidaHomeCard(tt,I){
 return `<a class="hc hc-qaida" href="${QAIDA_HREF}" id="homeQaida"><span class="ti">${I.icon('letters')}</span><span class="hc-live">● ${tt('LIVE','لائیو')}</span><b>${tt('Qaida','قاعدہ')}</b><small>${tt('Read live — letters light up','لائیو پڑھیں، حروف روشن')}</small></a>`}
