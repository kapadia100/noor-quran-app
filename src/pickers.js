// Quran pickers: translation = language + translator (two controls), reciter = its own list. Pure helpers, no DOM.
import {orderLangs,langName,langRank} from './hadith-lang.js';

const PREFER={en:'en.sahih',ur:'ur.jalandhry'};
const nameOf=e=>e.englishName||e.name||'';
const isArabicName=s=>/[\u0600-\u06FF]/.test(s||'');

/** Languages present in the translation list: English, Urdu, Arabic, then the rest A–Z by English name. */
export function transLangs(list){return orderLangs([...new Set(list.map(e=>e.language))])}

/** Language of the stored translation id (falls back to the id prefix, then English). */
export function langOfEdition(list,id){const e=list.find(x=>x.identifier===id);return e?e.language:(String(id||'').split('.')[0]||'en')}

/** Translators of one language, A–Z by name, with the well-known default first. */
export function translators(list,lang){
 const l=list.filter(e=>e.language===lang).sort((a,b)=>nameOf(a).localeCompare(nameOf(b),'en'));
 const p=l.findIndex(e=>e.identifier===PREFER[lang]);if(p>0)l.unshift(l.splice(p,1)[0]);return l}

/** Which translator to select when the user switches language (the first one, or the well-known default). */
export function defaultTranslator(list,lang){return translators(list,lang)[0]?.identifier}

/** The id to keep after the list loads: the stored one when it still exists, else the best match. */
export function keepTranslation(list,id){return list.some(e=>e.identifier===id)?id:(defaultTranslator(list,'en')||list[0]?.identifier||id)}

export function translatorLabel(e){const n=nameOf(e);return n+(e.name&&e.name!==n&&!/^[\s\-–—]*$/.test(e.name)?' — '+e.name:'')}

/** Reciter label: full English name plus the Arabic name when the data has one (Urdu UI puts Arabic first). */
export function reciterLabel(e,ui='en'){const en=nameOf(e),ar=isArabicName(e.name)?e.name:'';if(!ar||ar===en)return en;return ui==='ur'?`${ar} — ${en}`:`${en} — ${ar}`}

/** Reciters only (Arabic recitations; translation audio has its own picker). The default reciter first, then A–Z.
 *  The currently selected id is always kept, even if it is not an Arabic reciter, so nobody loses their choice. */
export function reciters(list,sel,def='ar.alafasy'){
 const l=list.filter(e=>e.language==='ar'||e.identifier===sel).sort((a,b)=>nameOf(a).localeCompare(nameOf(b),'en'));
 const p=l.findIndex(e=>e.identifier===def);if(p>0)l.unshift(l.splice(p,1)[0]);return l}

const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export const langOptions=(langs,sel,ui)=>langs.map(l=>`<option value="${esc(l)}" ${l===sel?'selected':''}>${esc(langName(l,ui))}</option>`).join('');
export const translatorOptions=(list,lang,sel)=>translators(list,lang).map(e=>`<option value="${esc(e.identifier)}" ${e.identifier===sel?'selected':''}>${esc(translatorLabel(e))}</option>`).join('');
export const reciterOptions=(list,sel,ui)=>reciters(list,sel).map(e=>`<option value="${esc(e.identifier)}" data-en="${esc(nameOf(e))}" ${e.identifier===sel?'selected':''}>${esc(reciterLabel(e,ui))}</option>`).join('');
export {langRank};
