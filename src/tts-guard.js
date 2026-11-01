// Standing rule: the device voice (speechSynthesis) must NEVER speak Arabic-script text (Arabic, Urdu, Persian...).
// Quran / hadith Arabic is never sent to TTS; Urdu plays recorded audio only. This module is the single gate.
const ARS_G=/[\u0600-\u06FF\u0750-\u077F\u0870-\u089F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u{10E60}-\u{10E7F}\u{1EE00}-\u{1EEFF}]+/gu;
// Languages written in Arabic script: never spoken by the device voice.
const BLOCK=new Set(['ar','ara','arb','ur','urd','fa','fas','per','prs','ps','pus','sd','snd','ug','uig','ckb','ku','kur','ks','kas','bal','bqi','glk','mzn','pnb','skr','ota']);
const base=l=>String(l||'').toLowerCase().split(/[-_]/)[0];
/** true when device TTS may be used for this language code / BCP-47 tag. */
export const ttsLangOk=l=>{const b=base(l);return !!b&&!BLOCK.has(b)};
/** Removes every Arabic-script run (e.g. a quoted Arabic phrase inside an English translation). */
export const stripArabic=t=>String(t||'').replace(ARS_G,' ').replace(/[ \t]+/g,' ').replace(/\s*\(\s*\)\s*/g,' ').trim();
export const hasArabic=t=>{ARS_G.lastIndex=0;const r=ARS_G.test(String(t||''));ARS_G.lastIndex=0;return r};
/** Final check for one utterance: allowed language, allowed voice, and no Arabic script in the text. */
export function utteranceOk(u){if(!u)return false;const text=String(u.text||'');ARS_G.lastIndex=0;if(!text.trim()||ARS_G.test(text)){ARS_G.lastIndex=0;return false}ARS_G.lastIndex=0;
 if(u.lang&&!ttsLangOk(u.lang))return false;if(u.voice&&!ttsLangOk(u.voice.lang))return false;return true}
/** Wraps speechSynthesis.speak once so no code path (ours or a future one) can make the device voice speak Arabic script. */
export function install(g=globalThis){const s=g.speechSynthesis;if(!s||s.__qsGuard)return;const orig=s.speak?.bind(s);if(!orig)return;
 const guarded=u=>{if(!utteranceOk(u)){try{g.__ttsBlocked=(g.__ttsBlocked||0)+1}catch{/* ignore */}try{u?.onerror?.({error:'not-allowed',type:'error'})}catch{/* ignore */}return}return orig(u)};
 try{Object.defineProperty(s,'speak',{value:guarded,configurable:true,writable:true})}catch{try{s.speak=guarded}catch{/* ignore */}}
 try{Object.defineProperty(s,'__qsGuard',{value:true})}catch{/* ignore */}}
install();
