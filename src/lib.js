// Pure, testable logic
export const FIX={"2:181": "فَمَنۢ بَدَّلَهُۥ بَعْدَ مَا سَمِعَهُۥ فَإِنَّمَآ إِثْمُهُۥ عَلَى ٱلَّذِينَ يُبَدِّلُونَهُۥٓ ۚ إِنَّ ٱللَّهَ سَمِيعٌ عَلِيمٌ", "8:6": "يُجَـٰدِلُونَكَ فِى ٱلْحَقِّ بَعْدَ مَا تَبَيَّنَ كَأَنَّمَا يُسَاقُونَ إِلَى ٱلْمَوْتِ وَهُمْ يَنظُرُونَ", "12:39": "يَـٰصَـٰحِبَىِ ٱلسِّجْنِ ءَأَرْبَابٌ مُّتَفَرِّقُونَ خَيْرٌ أَمِ ٱللَّهُ ٱلْوَٰحِدُ ٱلْقَهَّارُ", "12:41": "يَـٰصَـٰحِبَىِ ٱلسِّجْنِ أَمَّآ أَحَدُكُمَا فَيَسْقِى رَبَّهُۥ خَمْرًا ۖ وَأَمَّا ٱلْـَٔاخَرُ فَيُصْلَبُ فَتَأْكُلُ ٱلطَّيْرُ مِن رَّأْسِهِۦ ۚ قُضِىَ ٱلْأَمْرُ ٱلَّذِى فِيهِ تَسْتَفْتِيَانِ", "13:37": "وَكَذَٰلِكَ أَنزَلْنَـٰهُ حُكْمًا عَرَبِيًّا ۚ وَلَئِنِ ٱتَّبَعْتَ أَهْوَآءَهُم بَعْدَ مَا جَآءَكَ مِنَ ٱلْعِلْمِ مَا لَكَ مِنَ ٱللَّهِ مِن وَلِىٍّ وَلَا وَاقٍ"};
export const stripB=x=>{x=x.replace(/^\uFEFF/,'');const w=x.split(' ');const bare=y=>(y||'').replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g,'');return bare(w[0])==='بسم'&&bare(w[1])==='ٱلله'&&w.length>4?w.slice(4).join(' '):x};
export const JUZ=[[1,1],[2,142],[2,253],[3,93],[4,24],[4,148],[5,82],[6,111],[7,88],[8,41],[9,93],[11,6],[12,53],[15,1],[17,1],[18,75],[21,1],[23,1],[25,21],[27,56],[29,46],[33,31],[36,28],[39,32],[41,47],[46,1],[51,31],[58,1],[67,1],[78,1]];
export const JUZN=['Alif Lam Meem','Sayaqool','Tilkal Rusul','Lan Tana Loo','Wal Mohsanat','La Yuhibbullah','Wa Iza Samiu','Wa Lau Annana','Qalal Malao','Wa A\'lamu','Yatazeroon','Wa Mamin Da\'abat','Wa Ma Ubrioo','Rubama','Subhanallazi','Qal Alam','Aqtarabo','Qadd Aflaha','Wa Qalallazina','A\'man Khalaq','Utlu Ma Oohi','Wa Manyaqnut','Wa Mali','Faman Azlam','Elahe Yuruddo','Ha\'a Meem','Qala Fama Khatbukum','Qadd Sami Allah','Tabarakallazi','Amma Yatasa\'aloon'];

export const AYAH_COUNTS=[7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
/** Display text for ayah (1-based surah, ayah): applies verified fixes and removes the basmala prefix from ayah 1 (except Al-Fatiha). */
export function ayahText(s,a,raw){const f=FIX[`${s}:${a}`];if(f)return f;return a===1&&s!==1?stripB(raw):raw}
/** Parse "2", "2:255", "2 255", "2.255" -> {s,a} or null if out of range. */
export function parseRef(v){const m=String(v).trim().match(/^(\d{1,3})(?:\s*[:.\s]\s*(\d{1,3}))?$/);if(!m)return null;const s=+m[1],a=m[2]?+m[2]:null;
 if(s<1||s>114)return null;if(a!=null&&(a<1||a>AYAH_COUNTS[s-1]))return null;return {s,a}}
export const validSurah=n=>Number.isInteger(n)&&n>=1&&n<=114;
export const validJuz=n=>Number.isInteger(n)&&n>=1&&n<=30;
/** Juz n -> list of [surah, fromAyah, toAyah]. */
export function juzRanges(n){const [s0,a0]=JUZ[n-1],end=JUZ[n]||[115,1];const out=[];for(let s=s0;s<=Math.min(end[0],114);s++){const from=s===s0?a0:1;const to=s===end[0]?end[1]-1:AYAH_COUNTS[s-1];if(to>=from)out.push([s,from,to])}return out}
/** Calendar date (as a local-midnight Date) of instant d in IANA zone tz. Used so prayer times are for the city's day, not the device's. */
export function dayIn(tz,d=new Date()){try{const p=new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);const g=k=>+p.find(x=>x.type===k).value;return new Date(g('year'),g('month')-1,g('day'))}catch{return new Date(d.getFullYear(),d.getMonth(),d.getDate())}}
/** Signed turn needed (-180..180] from heading h to qibla q. */
export const turn=(q,h)=>{let d=((q-h)%360+540)%360-180;return d===-180?180:d};
/** Next audio position after (s,i) in continuous mode. counts = ayah counts. Returns null at end of Quran. */
export function nextPos(s,i){if(i+1<AYAH_COUNTS[s-1])return {s,i:i+1};if(s<114)return {s:s+1,i:0};return null}
export const clampAdj=v=>Math.max(-2,Math.min(2,+v||0));
/** Escape then highlight q (case-insensitive) safely. */
export const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export function highlight(text,q){if(!q)return esc(text);const r=new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi');let out='',last=0;String(text).replace(r,(m,off)=>{out+=esc(text.slice(last,off))+'<mark>'+esc(m)+'</mark>';last=off+m.length;return m});return out+esc(String(text).slice(last))}

/** Fuzzy key for transliterated surah names: 'Yaseen'/'Yasin'/'Ya-Sin' -> 'ysn'. */
export const skel=s=>String(s).toLowerCase().replace(/^a[a-z]{0,2}-/,'').replace(/[^a-z0-9]/g,'').replace(/[aeiou]/g,'').replace(/(.)\1+/g,'$1');
export function surahMatch(s,q){q=String(q).trim().toLowerCase();if(!q)return true;const hay=(s.number+' '+s.englishName+' '+s.englishNameTranslation+' '+s.name).toLowerCase();if(hay.includes(q))return true;if(/^\d+$/.test(q))return String(s.number)===q;const k=skel(q);return k.length>1&&skel(s.englishName).startsWith(k)}
