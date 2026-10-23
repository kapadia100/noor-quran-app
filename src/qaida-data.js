// Qaida (Arabic reading primer) content. Pure data + helpers, no DOM.
// Every Arabic string here was checked against the standard 29-letter Noorani Qaida set and the standard harakat/tanween/sukoon/shadda marks.
// Text pairs are [English, Urdu].

/** The 29 letters in standard Qaida order. i = file index (letters with recorded syllables: 1..28 in this order, hamza has none). */
export const LETTERS=[
 {c:'ا',en:'alif',ur:'الف',tr:'a'},{c:'ب',en:'bā',ur:'بے',tr:'ba'},{c:'ت',en:'tā',ur:'تے',tr:'ta'},{c:'ث',en:'thā',ur:'ثے',tr:'tha'},
 {c:'ج',en:'jīm',ur:'جیم',tr:'ja'},{c:'ح',en:'ḥā',ur:'حے',tr:'ḥa'},{c:'خ',en:'khā',ur:'خے',tr:'kha'},{c:'د',en:'dāl',ur:'دال',tr:'da'},
 {c:'ذ',en:'dhāl',ur:'ذال',tr:'dha'},{c:'ر',en:'rā',ur:'رے',tr:'ra'},{c:'ز',en:'zāy',ur:'زے',tr:'za'},{c:'س',en:'sīn',ur:'سین',tr:'sa'},
 {c:'ش',en:'shīn',ur:'شین',tr:'sha'},{c:'ص',en:'ṣād',ur:'صاد',tr:'ṣa'},{c:'ض',en:'ḍād',ur:'ضاد',tr:'ḍa'},{c:'ط',en:'ṭā',ur:'طوئے',tr:'ṭa'},
 {c:'ظ',en:'ẓā',ur:'ظوئے',tr:'ẓa'},{c:'ع',en:'ʿayn',ur:'عین',tr:'ʿa'},{c:'غ',en:'ghayn',ur:'غین',tr:'gha'},{c:'ف',en:'fā',ur:'فے',tr:'fa'},
 {c:'ق',en:'qāf',ur:'قاف',tr:'qa'},{c:'ك',en:'kāf',ur:'کاف',tr:'ka'},{c:'ل',en:'lām',ur:'لام',tr:'la'},{c:'م',en:'mīm',ur:'میم',tr:'ma'},
 {c:'ن',en:'nūn',ur:'نون',tr:'na'},{c:'و',en:'wāw',ur:'واؤ',tr:'wa'},{c:'ه',en:'hā',ur:'ہے',tr:'ha'},{c:'ء',en:'hamza',ur:'ہمزہ',tr:'ʾa'},
 {c:'ي',en:'yā',ur:'یے',tr:'ya'}];

/** Letters that do not join to the letter after them (so they have no initial/medial shape of their own). */
export const NOJOIN='ادذرزوء';

/** Marks. m = the mark drawn on a dotted-circle-free base; vw = vowel sound added to the letter's own sound. */
export const MARKS={
 a:{m:'\u064E',en:'fatḥa',ur:'زبر',v:'a'},i:{m:'\u0650',en:'kasra',ur:'زیر',v:'i'},u:{m:'\u064F',en:'ḍamma',ur:'پیش',v:'u'},
 an:{m:'\u064B',en:'fatḥatān',ur:'دو زبر',v:'an'},in:{m:'\u064D',en:'kasratān',ur:'دو زیر',v:'in'},un:{m:'\u064C',en:'ḍammatān',ur:'دو پیش',v:'un'}};

/** Isolated / initial / medial / final shapes via the zero-width joiner, so the font engine picks the correct glyph. */
export function forms(c){const J='\u200D';const nj=NOJOIN.includes(c);
 return {iso:c,ini:nj?c:c+J,med:nj?J+c:J+c+J,fin:J+c,nj}}

/** Letter + mark (+ the ʾalif-less carrier for the hamza). */
export const withMark=(c,k)=>c+MARKS[k].m;
/** Latin sound of letter + vowel: ba, bi, bu, ban, bin, bun. */
export const sound=(L,k)=>{const b=L.tr.replace(/a$/,'');return b+MARKS[k].v};

/** Where the recorded syllables live (public/qaida/<n>-<k>.mp3, n = 1..28). */
export const clipOf=(idx,k)=>`qaida/${idx+1}-${k}.mp3`;
/** Only letters 1..28 (everything except the hamza) have recorded syllables; the hamza uses the alif row (same sound with a carrier). */
export const hasClip=idx=>idx<27||idx===28?true:false;

// ---- Quranic example words (real words, each with its recitation word audio; text from the Quran word-by-word data) ----
// k = "surah:ayah:word" (audio is wbw/SSS_AAA_WWW.mp3), t = Uthmani text, tr = plain transliteration, e = English meaning, u = Urdu meaning.
const W=(k,t,tr,e,u)=>({k,t,tr,e,u,au:'https://audio.qurancdn.com/wbw/'+k.split(':').map((x,i)=>x.padStart(3,'0')).join('_')+'.mp3'});
export const WORDS={
 tanween:[W('94:5:4','يُسْرًا','yusran','ease','آسانی'),W('100:5:3','جَمْعًا','jamʿan','together','اکٹھے'),W('95:6:7','أَجْرٌ','ajrun','a reward','اجر'),W('101:11:1','نَارٌ','nārun','a fire','آگ'),W('103:2:4','خُسْرٍ','khusrin','loss','گھاٹا')],
 sukoon:[W('112:1:1','قُلْ','qul','Say','کہہ دیجیے'),W('93:6:1','أَلَمْ','alam','Did not','کیا نہیں'),W('95:4:1','لَقَدْ','laqad','Indeed','بے شک'),W('94:1:2','نَشْرَحْ','nashraḥ','We expanded','ہم نے کھول دیا'),W('1:1:1','بِسْمِ','bismi','In the name','نام سے'),W('1:5:2','نَعْبُدُ','naʿbudu','we worship','ہم عبادت کرتے ہیں'),W('94:5:3','ٱلْعُسْرِ','al-ʿusri','the hardship','تنگی')],
 shadda:[W('1:2:3','رَبِّ','rabbi','the Lord','رب'),W('1:5:1','إِيَّاكَ','iyyāka','You alone','صرف تجھے'),W('95:5:1','ثُمَّ','thumma','Then','پھر'),W('94:6:1','إِنَّ','inna','Indeed','بے شک'),W('95:6:1','إِلَّا','illā','Except','مگر'),W('1:4:3','ٱلدِّينِ','ad-dīni','the Judgment','جزا'),W('111:1:1','تَبَّتْ','tabbat','Perish','ہلاک ہوں')],
 madd:[W('93:3:1','مَا','mā','Not','نہیں'),W('93:2:2','إِذَا','idhā','when','جب'),W('1:7:8','وَلَا','walā','and not','اور نہ'),W('1:6:1','ٱهْدِنَا','ihdinā','Guide us','ہمیں دکھا'),W('95:2:2','سِينِينَ','sīnīna','Sinai','سینا'),W('95:2:1','وَطُورِ','waṭūri','and the Mount','اور طور کی'),W('113:1:2','أَعُوذُ','aʿūdhu','I seek refuge','میں پناہ مانگتا ہوں')],
 leen:[W('1:4:2','يَوْمِ','yawmi','Day','دن'),W('1:7:4','عَلَيْهِمْ','ʿalayhim','on them','ان پر'),W('106:3:4','ٱلْبَيْتِ','al-bayti','the House','گھر'),W('105:1:3','كَيْفَ','kayfa','how','کیسے'),W('102:3:2','سَوْفَ','sawfa','Soon','عنقریب'),W('102:5:2','لَوْ','law','If','اگر'),W('108:1:3','ٱلْكَوْثَرَ','al-kawthara','Al-Kawthar','کوثر')],
 words:[W('112:1:1','قُلْ','qul','Say','کہہ دیجیے'),W('112:1:2','هُوَ','huwa','He','وہ'),W('93:3:1','مَا','mā','Not','نہیں'),W('102:5:2','لَوْ','law','If','اگر'),W('94:6:1','إِنَّ','inna','Indeed','بے شک'),W('95:5:1','ثُمَّ','thumma','Then','پھر'),W('93:6:1','أَلَمْ','alam','Did not','کیا نہیں'),W('95:4:1','لَقَدْ','laqad','Indeed','بے شک'),W('1:5:2','نَعْبُدُ','naʿbudu','we worship','ہم عبادت کرتے ہیں'),W('1:2:3','رَبِّ','rabbi','the Lord','رب'),W('1:4:2','يَوْمِ','yawmi','Day','دن'),W('105:1:3','كَيْفَ','kayfa','how','کیسے')]};

/** Lesson list, in teaching order. kind: what the screen shows. */
export const LESSONS=[
 {id:'huroof',n:1,kind:'letters',en:'Letters (Huroof)',ur:'حروفِ تہجی',sub:['The 29 Arabic letters, in order','عربی کے 29 حروف، ترتیب سے']},
 {id:'harakat',n:2,kind:'marks',keys:['a','i','u'],en:'Harakat: fatḥa, kasra, ḍamma',ur:'حرکات: زبر، زیر، پیش',sub:['Short vowels: a, i, u','چھوٹی آوازیں: ا، اِ، اُ']},
 {id:'tanween',n:3,kind:'marks',keys:['an','in','un'],words:'tanween',en:'Tanween',ur:'تنوین',sub:['Double marks: an, in, un','دو حرکتیں: اَن، اِن، اُن']},
 {id:'sukoon',n:4,kind:'rule',words:'sukoon',mark:'\u0652',en:'Sukoon',ur:'سکون',sub:['A silent letter: stop on it','ساکن حرف: اس پر رک جائیں']},
 {id:'shadda',n:5,kind:'rule',words:'shadda',mark:'\u0651',en:'Shadda',ur:'شد',sub:['A doubled letter','دو بار پڑھا جانے والا حرف']},
 {id:'madd',n:6,kind:'rule',words:'madd',en:'Madd letters',ur:'حروفِ مدّہ',sub:['Long vowels: ا و ي','لمبی آوازیں: ا و ي']},
 {id:'leen',n:7,kind:'rule',words:'leen',en:'Leen letters',ur:'حروفِ لین',sub:['Soft ways: وْ and يْ after fatḥa','نرم حروف: زبر کے بعد وْ اور يْ']},
 {id:'joined',n:8,kind:'joined',en:'Joined letter shapes',ur:'حروف کی جڑی ہوئی شکلیں',sub:['Start, middle and end shapes','شروع، درمیان اور آخر کی شکلیں']},
 {id:'practice',n:9,kind:'practice',words:'words',en:'Practice words',ur:'مشقی الفاظ',sub:['Real Quran words: read them with the tutor','قرآن کے اصل الفاظ: ٹیوٹر کے ساتھ پڑھیں']}];

/** Rule explanations per lesson. Each is [English, Urdu]. */
export const RULES={
 harakat:[['Fatḥa ( َ ) is a small stroke above the letter: it adds “a” (بَ = ba). Kasra ( ِ ) is a small stroke below: it adds “i” (بِ = bi). Ḍamma ( ُ ) is a small waw-like mark above: it adds “u” (بُ = bu).','زبر ( َ ) حرف کے اوپر چھوٹی لکیر ہے، “اَ” کی آواز دیتی ہے (بَ = با)۔ زیر ( ِ ) حرف کے نیچے لکیر ہے، “اِ” کی آواز دیتی ہے (بِ = بِ)۔ پیش ( ُ ) اوپر چھوٹے واؤ جیسا نشان ہے، “اُ” کی آواز دیتی ہے (بُ = بُ)۔']],
 tanween:[['Tanween is a doubled mark at the end of a word: fatḥatān ( ً ) = “an”, kasratān ( ٍ ) = “in”, ḍammatān ( ٌ ) = “un”. It adds an “n” sound and is only ever on the last letter of a word.','تنوین لفظ کے آخر میں دہری حرکت ہے: دو زبر ( ً ) = “اَن”، دو زیر ( ٍ ) = “اِن”، دو پیش ( ٌ ) = “اُن”۔ اس میں “ن” کی آواز آتی ہے اور یہ صرف لفظ کے آخری حرف پر آتی ہے۔']],
 sukoon:[['Sukoon ( ْ ) is a small circle above a letter. The letter has no vowel of its own: say it joined to the sound before it, and stop on it. Example: اَبْ = ab, قُلْ = qul.','سکون ( ْ ) حرف کے اوپر چھوٹا دائرہ ہے۔ اس حرف کی اپنی حرکت نہیں ہوتی: اسے پچھلی آواز کے ساتھ ملا کر پڑھیں اور اس پر رک جائیں۔ مثال: اَبْ، قُلْ۔']],
 shadda:[['Shadda ( ّ ) looks like a small “w” above a letter. It means the letter is said twice: first with no vowel, then with its vowel. Press it a little longer. Example: رَبِّ = rab-bi.','شد ( ّ ) حرف کے اوپر چھوٹے “w” جیسا نشان ہے۔ مطلب حرف دو بار پڑھا جاتا ہے: پہلے ساکن، پھر حرکت کے ساتھ۔ اسے ذرا دبا کر پڑھیں۔ مثال: رَبِّ۔']],
 madd:[['Madd means stretching. A fatḥa before alif (ـَا), a kasra before ya (ـِي) or a ḍamma before waw (ـُو), where the second letter has no vowel, is stretched for about two beats. Example: مَا = maa, سِينِينَ = seeneena, طُورِ = toori.','مدّ کا مطلب کھینچنا ہے۔ الف سے پہلے زبر (ـَا)، ی سے پہلے زیر (ـِي) یا واؤ سے پہلے پیش (ـُو)، جب دوسرے حرف پر حرکت نہ ہو، تو آواز تقریباً دو حرکت کے برابر کھینچی جاتی ہے۔ مثال: مَا، سِينِينَ، طُورِ۔']],
 leen:[['Leen means soft. A waw or ya with sukoon after a fatḥa (ـَوْ, ـَيْ) is said gently, like “aw” in “now” and “ay” in “day”, without stretching. Example: يَوْمِ = yawmi, كَيْفَ = kayfa.','لین کا مطلب نرم ہے۔ زبر کے بعد ساکن واؤ یا ی (ـَوْ، ـَيْ) نرمی سے پڑھے جاتے ہیں، بغیر کھینچے۔ مثال: يَوْمِ، كَيْفَ۔']],
 joined:[['Arabic letters change shape depending on where they sit in a word. Six letters (ا د ذ ر ز و) never join to the letter after them, so the next letter starts fresh.','عربی حروف لفظ میں جگہ کے مطابق شکل بدلتے ہیں۔ چھ حروف (ا د ذ ر ز و) اپنے بعد والے حرف سے نہیں جڑتے، اس لیے اگلا حرف نئے سرے سے شروع ہوتا ہے۔']],
 practice:[['Read each word out loud with the tutor. The tutor checks the consonants you say. It does not check vowels or tajweed, so also listen to the model audio.','ہر لفظ ٹیوٹر کے ساتھ بلند آواز سے پڑھیں۔ ٹیوٹر آپ کے حروف جانچتا ہے۔ حرکات اور تجوید نہیں جانچتا، اس لیے نمونے کی آواز بھی سنیں۔']]};
