// v96: pure helpers for Voice Search (normalisation, matching, Quran/Hadith choice). No DOM, no network.
const HARAKAT=/[\u0610-\u061A]|[\u064B-\u065F]|\u0670|[\u06D6-\u06ED]|\u0640|[\u08D3-\u08FF]/g;
/** Normalise Arabic / Urdu / Latin text for matching: drops harakat, Quranic marks and tatweel, unifies alef/hamza/ya/ta-marbuta/kaf/heh variants, Arabic-Indic digits, case and punctuation. */
export function norm(s=''){
 return String(s).normalize('NFC').replace(HARAKAT,'')
  .replace(/[أإآٱٲٳ]/g,'ا').replace(/[ؤ]/g,'و').replace(/[ئىیيۍێ]/g,'ي').replace(/ء/g,'')
  .replace(/[ةۃ]/g,'ه').replace(/[ہھۀە]/g,'ه').replace(/[کك]/g,'ك').replace(/[گ]/g,'گ')
  .replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
  .normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
  .replace(/[^\p{L}\p{M}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
}
export const isArabicScript=s=>/[\u0600-\u06FF]/.test(s);
/** Which source the user picked, from a tap or a spoken answer. Returns 'quran' | 'hadith' | null. */
export function parseChoice(t=''){
 const n=norm(t);if(!n)return null;
 const w=' '+n+' ',has=L=>L.some(x=>w.includes(' '+norm(x)+' '));
 const q=has(['quran','koran','qur an','kuran','quraan','قرآن','القرآن','क़ुरान','कुरान','कुरआन','क़ुरआन']);
 const h=has(['hadith','hadees','hadis','hades','ahadith','حدیث','حديث','احادیث','हदीस']);
 return q&&!h?'quran':h&&!q?'hadith':null;
}
/** Search ayahs. ed = {ar:[[...114 surahs]], tr:[[...]]} (any may be missing). mode 'ar' searches Arabic, 'tr' the translation. Returns [{s,a}] in mushaf order. */
export function searchAyahs(q,ed,mode,limit=200){
 const nq=norm(q);if(!nq)return {count:0,hits:[]};const src=mode==='ar'?ed.ar:ed.tr;const hits=[];let count=0;
 if(!src)return {count:0,hits};
 for(let s=0;s<src.length;s++){const L=src[s]||[];for(let a=0;a<L.length;a++){const t=norm(L[a]);
  if(mode==='ar'?t.includes(nq):(' '+t+' ').includes(' '+nq+' ')||(nq.length>3&&t.includes(nq))){count++;if(hits.length<limit)hits.push({s:s+1,a:a+1})}}}
 return {count,hits};
}
/** Dictionary meaning for a single spoken word: Arabic form, roman transliteration, English or Urdu meaning. */
export function dictLookup(q,words=[]){
 const nq=norm(q);if(!nq||nq.includes(' '))return null;
 const rom=s=>norm(s).replace(/[^a-z0-9]/g,'');const rq=rom(q);
 return words.find(w=>norm(w.h)===nq||norm(w.l||'')===nq)
  ||(rq&&words.find(w=>rom(w.t)===rq))
  ||words.find(w=>String(w.e||'').split(/[;,]/).some(x=>norm(x)===nq))
  ||words.find(w=>String(w.u||'').split(/[؛;,،]/).some(x=>norm(x)===nq))||null;
}
/** Speech-recognition language for the chip. */
export const SR_LANG={ur:'ur-PK',ar:'ar-SA',en:'en-US'};
