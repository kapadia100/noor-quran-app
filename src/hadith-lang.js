// Language names for the Hadith screens. The data uses three-letter codes (ara, eng, urd...); people see proper names, never the codes.
// Each row: code, BCP-47 tag (for speech voices), English name, name in its own language, Urdu name.
const ROWS=[
 ['ara','ar','Arabic','العربية','عربی'],['ben','bn','Bengali','বাংলা','بنگالی'],['eng','en','English','English','انگریزی'],['fra','fr','French','Français','فرانسیسی'],
 ['ind','id','Indonesian','Bahasa Indonesia','انڈونیشیائی'],['rus','ru','Russian','Русский','روسی'],['tur','tr','Turkish','Türkçe','ترکی'],['urd','ur','Urdu','اردو','اردو'],
 ['tam','ta','Tamil','தமிழ்','تامل'],['hin','hi','Hindi','हिन्दी','ہندی'],['fas','fa','Persian','فارسی','فارسی'],['deu','de','German','Deutsch','جرمن'],
 ['spa','es','Spanish','Español','ہسپانوی'],['ita','it','Italian','Italiano','اطالوی'],['por','pt','Portuguese','Português','پرتگالی'],['nld','nl','Dutch','Nederlands','ڈچ'],
 ['zho','zh','Chinese','中文','چینی'],['jpn','ja','Japanese','日本語','جاپانی'],['kor','ko','Korean','한국어','کوریائی'],['msa','ms','Malay','Bahasa Melayu','ملے'],
 ['pus','ps','Pashto','پښتو','پشتو'],['sin','si','Sinhala','සිංහල','سنہالا'],['tha','th','Thai','ไทย','تھائی'],['vie','vi','Vietnamese','Tiếng Việt','ویتنامی'],
 ['swa','sw','Swahili','Kiswahili','سواحلی'],['hau','ha','Hausa','Hausa','ہوسا'],['som','so','Somali','Soomaali','صومالی'],['kur','ku','Kurdish','Kurdî','کردی'],
 ['uzb','uz','Uzbek','Oʻzbekcha','ازبک'],['kaz','kk','Kazakh','Қазақша','قازق'],['aze','az','Azerbaijani','Azərbaycanca','آذربائیجانی'],['tgl','fil','Filipino','Filipino','فلپینی'],
 ['sqi','sq','Albanian','Shqip','البانوی'],['bos','bs','Bosnian','Bosanski','بوسنیائی'],['mal','ml','Malayalam','മലയാളം','ملیالم'],['tel','te','Telugu','తెలుగు','تیلگو'],
 ['kan','kn','Kannada','ಕನ್ನಡ','کنڑ'],['guj','gu','Gujarati','ગુજરાતી','گجراتی'],['pan','pa','Punjabi','ਪੰਜਾਬੀ','پنجابی'],['mar','mr','Marathi','मराठी','مراٹھی'],
 ['nep','ne','Nepali','नेपाली','نیپالی'],['amh','am','Amharic','አማርኛ','امہاری']];
export const LANGS=Object.fromEntries(ROWS.map(([c,b,en,nat,ur])=>[c,{bcp:b,en,nat,ur}]));
const BY2=Object.fromEntries(ROWS.map(r=>[r[1],r[0]])),ALIAS={in:'ind',iw:'heb',jw:'jav',no:'nor',nb:'nor',tl:'tgl',cmn:'zho',zlm:'msa',ur:'urd'};
/** Normalise any language code ("eng", "en", "en-US", "en_US", "ara-bukhari") to the three-letter code used in the data, or '' when unknown. */
export function codeOf(x){const s=String(x||'').toLowerCase().replace(/_/g,'-').split('-')[0];return LANGS[s]?s:LANGS[ALIAS[s]]?ALIAS[s]:BY2[s]||''}
export const bcpOf=code=>LANGS[codeOf(code)]?.bcp||'';
const dn=(loc,code)=>{try{const v=new Intl.DisplayNames([loc],{type:'language'}).of(code);return v&&v.toLowerCase()!==String(code).toLowerCase()?v:''}catch{return ''}};
/** "Bengali (বাংলা)" / "انگریزی (English)"; a single name when both are the same; unknown codes fall back to the browser's own language names, then to a neutral label. */
export function langName(code,ui='en',short=false){
 const c=String(code||'').toLowerCase(),k=codeOf(c),r=LANGS[k];
 if(r){const n=ui==='ur'?r.ur:r.en;return !short&&r.nat&&r.nat.toLowerCase()!==n.toLowerCase()?`${n} (${r.nat})`:n}
 const tag=c.replace(/_/g,'-'),n=dn(ui==='ur'?'ur':'en',tag);
 if(n){const nat=short?'':dn(tag,tag);return nat&&nat.toLowerCase()!==n.toLowerCase()?`${n} (${nat})`:n}
 return ui==='ur'?'دوسری زبان':'Other language'}
/** Language code of an edition name such as "urd-bukhari". */
export const edLang=name=>String(name||'').split('-')[0];
/** Shared list order: 1) English, 2) Urdu, 3) Arabic, then every other language alphabetically by its English name. */
export const langRank=code=>{const k=codeOf(code);return k==='eng'?0:k==='urd'?1:k==='ara'?2:3};
/** Stable sort. `code(item)` gives the language code; `tie(item)` orders items of the same language (default: keep the original order). */
export function orderLangs(items,code=x=>x,tie=null){
 const ks=new Map(items.map((x,i)=>{const c=code(x);return[x,{i,r:langRank(c),n:langRank(c)===3?langName(c,'en',true).toLowerCase():'',t:tie?String(tie(x)).toLowerCase():''}]}));
 return [...items].sort((a,b)=>{const x=ks.get(a),y=ks.get(b);return x.r-y.r||(x.n<y.n?-1:x.n>y.n?1:0)||(x.t<y.t?-1:x.t>y.t?1:0)||x.i-y.i})}
