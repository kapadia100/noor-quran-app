// Madani Qaida: a second course for the same Qaida engine (qaida.js). 22 lessons from single letters to the prayer.
// Quran words/phrases come from madani-words.js (generated from the app's own Quran text and word-by-word data, then checked by tests).
// Letter and vowel audio reuses the Qaida recordings in qaida-data.js; Quranic items carry their word recordings.
import * as D from './qaida-data.js';
import {WL} from './madani-words.js';

export const COURSE='m';
export const WORDS={...WL,m13:D.WORDS.shadda};

/** Rule tags shown as small chips on the word tiles. [English, Urdu] */
export const TAGS={
 dag:['vertical fatḥa','کھڑی زبر'],vk:['small ya (long ī)','چھوٹی ی (لمبی ی)'],vu:['small waw (long ū)','چھوٹی و (لمبی و)'],
 sk:['sukūn','سکون'],qq:['qalqalah','قلقلہ'],
 izn:['iẓhār: nūn sākin','اظہار: نون ساکن'],izt:['iẓhār: tanween','اظہار: تنوین'],izw:['iẓhār: inside a word','اظہار: لفظ کے اندر'],
 ikn:['ikhfāʾ: nūn sākin','اخفاء: نون ساکن'],ikt:['ikhfāʾ: tanween','اخفاء: تنوین'],ikw:['ikhfāʾ: inside a word','اخفاء: لفظ کے اندر'],
 ig:['idghām with ghunna','ادغام مع غنّہ'],ign:['idghām without ghunna','ادغام بلا غنّہ'],iq:['iqlāb','اقلاب'],
 mi:['mīm into mīm','میم کا میم میں ادغام'],mk:['mīm hidden before ب','میم کا ب سے پہلے اخفاء'],mz:['mīm clear','میم کا اظہار'],
 allk:['lām of Allāh: thick','لامِ اللہ: موٹا'],allr:['lām of Allāh: thin','لامِ اللہ: باریک'],rthick:['rā: thick','را: موٹا'],rthin:['rā: thin','را: باریک'],
 muttasil:['madd muttaṣil','مدِّ متصل'],munfasil:['madd munfaṣil','مدِّ منفصل'],lazim:['madd lāzim','مدِّ لازم'],arid:['madd ʿāriḍ (at a stop)','مدِّ عارض (وقف پر)'],larid:['madd līn ʿāriḍ (at a stop)','مدِّ لین عارض (وقف پر)'],
 mutlaq:['iẓhār muṭlaq','اظہارِ مطلق'],imala:['imālah','امالہ'],
};

/** The word of lesson `id` with key `k`: rule text quotes real data words so the Arabic can never drift from the data. */
const T=(id,k)=>{const w=WORDS[id].find(x=>x.k===k);if(!w)throw new Error('madani word '+id+' '+k);return w.t};

/** Stop (waqf) form of a Quran word: tanween and final vowels drop, fatḥatān becomes a fatḥa + alif, ة becomes ه, the last letter takes a sukūn. */
export function stopForm(t){
 let s=t.replace(/[\u06E2\u06ED]/g,'');
 s=s.replace(/\u064B\u0627$/,'\u064E\u0627');
 s=s.replace(/\u0629[\u064B-\u0650]?$/,'\u0647\u0652');
 s=s.replace(/[\u064B-\u064D]$/,'');
 s=s.replace(/[\u064E\u064F\u0650]\u0651$/,'\u0651').replace(/\u0651[\u064E\u064F\u0650]$/,'\u0651');
 s=s.replace(/[\u064E\u064F\u0650]$/,'\u0652');
 if(/[\u0621-\u0626\u0628-\u0648\u064A]$/.test(s))s+='\u0652';
 return s;
}

/** Waqf signs (as printed on the Madani mushaf) with what each one asks for. */
export const SIGNS=[
 ['\u06D8','must stop','وقفِ لازم: ضرور رکیں'],['\u06D9','do not stop','وقف نہ کریں'],['\u06DA','may stop or go on','رکنا اور ملانا دونوں جائز'],
 ['\u06D7','stopping is better','رکنا بہتر ہے'],['\u06D6','going on is better','ملانا بہتر ہے'],['\u06DB','stop at one of the two places marked','دو جگہوں میں سے ایک پر رکیں'],
];

/** Prayer recitations (lesson 22). Typed as standard texts: they have no audio and no live check. The Quran parts open in the tutor. */
export const SALAH=[
 {id:'takbir',ar:'ٱللَّهُ أَكْبَرُ',tr:'Allāhu akbar',e:'Allah is the Greatest (opening takbīr)',u:'اللہ سب سے بڑا ہے (تکبیرِ تحریمہ)'},
 {id:'thana',ar:'سُبْحَانَكَ ٱللَّهُمَّ وَبِحَمْدِكَ وَتَبَارَكَ ٱسْمُكَ وَتَعَالَىٰ جَدُّكَ وَلَا إِلَٰهَ غَيْرُكَ',tr:'Subḥānaka llāhumma wa-biḥamdika wa-tabāraka smuka wa-taʿālā jadduka wa-lā ilāha ghayruk',e:'Opening praise (thanāʾ)',u:'ثناء'},
 {id:'taawwudh',ar:'أَعُوذُ بِٱللَّهِ مِنَ ٱلشَّيْطَٰنِ ٱلرَّجِيمِ',tr:'Aʿūdhu billāhi mina l-shayṭāni l-rajīm',e:'I seek refuge in Allah from the cursed Shaytan',u:'میں شیطانِ مردود سے اللہ کی پناہ مانگتا ہوں'},
 {id:'ruku',ar:'سُبْحَانَ رَبِّيَ ٱلْعَظِيمِ',tr:'Subḥāna rabbiya l-ʿaẓīm',e:'In bowing (rukūʿ)',u:'رکوع میں'},
 {id:'tasmi',ar:'سَمِعَ ٱللَّهُ لِمَنْ حَمِدَهُ',tr:'Samiʿa llāhu liman ḥamidah',e:'Rising from rukūʿ',u:'رکوع سے اٹھتے ہوئے'},
 {id:'tahmid',ar:'رَبَّنَا وَلَكَ ٱلْحَمْدُ',tr:'Rabbanā wa-laka l-ḥamd',e:'Standing after rukūʿ',u:'قومہ میں'},
 {id:'sajda',ar:'سُبْحَانَ رَبِّيَ ٱلْأَعْلَىٰ',tr:'Subḥāna rabbiya l-aʿlā',e:'In prostration (sajdah)',u:'سجدے میں'},
 {id:'tashahhud',ar:'ٱلتَّحِيَّاتُ لِلَّهِ وَٱلصَّلَوَاتُ وَٱلطَّيِّبَاتُ ٱلسَّلَامُ عَلَيْكَ أَيُّهَا ٱلنَّبِيُّ وَرَحْمَةُ ٱللَّهِ وَبَرَكَاتُهُ ٱلسَّلَامُ عَلَيْنَا وَعَلَىٰ عِبَادِ ٱللَّهِ ٱلصَّٰلِحِينَ أَشْهَدُ أَنْ لَّا إِلَٰهَ إِلَّا ٱللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',tr:'At-taḥiyyātu lillāhi wa-l-ṣalawātu wa-l-ṭayyibāt, al-salāmu ʿalayka ayyuha l-nabiyyu wa-raḥmatu llāhi wa-barakātuh, al-salāmu ʿalaynā wa-ʿalā ʿibādi llāhi l-ṣāliḥīn, ashhadu an lā ilāha illa llāh wa-ashhadu anna Muḥammadan ʿabduhu wa-rasūluh',e:'Sitting (tashahhud)',u:'قعدے میں (تشہد)'},
 {id:'durood',ar:'ٱللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَىٰ إِبْرَاهِيمَ وَعَلَىٰ آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَّجِيدٌ ٱللَّهُمَّ بَارِكْ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَىٰ إِبْرَاهِيمَ وَعَلَىٰ آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَّجِيدٌ',tr:'Allāhumma ṣalli ʿalā Muḥammadin wa-ʿalā āli Muḥammad, kamā ṣallayta ʿalā Ibrāhīma wa-ʿalā āli Ibrāhīm, innaka ḥamīdun majīd. Allāhumma bārik ʿalā Muḥammadin wa-ʿalā āli Muḥammad, kamā bārakta ʿalā Ibrāhīma wa-ʿalā āli Ibrāhīm, innaka ḥamīdun majīd',e:'Blessings on the Prophet (durūd)',u:'درودِ ابراہیمی'},
 {id:'salam',ar:'ٱلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ ٱللَّهِ',tr:'Al-salāmu ʿalaykum wa-raḥmatu llāh',e:'Ending the prayer (salām)',u:'سلام پھیرتے ہوئے'},
];
/** Quran parts of the prayer: they open in the live tutor, which checks them word by word. */
export const SALAH_SURAHS=[[1,'Al-Fatiha','الفاتحہ'],[112,'Al-Ikhlas','الاخلاص'],[108,'Al-Kawthar','الکوثر'],[103,'Al-Asr','العصر'],[110,'An-Nasr','النصر']];

// ---- fluent-reading drill (lesson 4): look-alike sounds with the three vowels, then mixed rows ----
const ALIKE=[[3,11,13],[5,26],[8,10,16],[2,15],[17,0],[20,21],[7,14],[18,6]];
export function drillRows(){
 const rows=[],mk=(sub,idxs,keys)=>({idxs,keys,sub});
 ALIKE.forEach(g=>['a','i','u'].forEach(k=>rows.push(mk('alike',g,g.map(()=>k)))));
 const R=D.ROW_IDX;for(let r=0;r*3<R.length;r++){const g=R.slice(r*3,r*3+3);rows.push(mk('mixed',g,g.map((_,j)=>['a','i','u'][(j+r)%3])))}
 return rows.map((o,n)=>({key:'d'+n,sub:o.sub,cells:o.idxs.map((i,j)=>({i,k:o.keys[j],c:D.rowLetter(i,o.keys[j])+D.MARKS[o.keys[j]].m,u:D.clipOf(i,o.keys[j]),s:D.sound(D.LETTERS[i],o.keys[j])}))}));
}

export const LESSONS=[
 {id:'m1',n:1,kind:'letters',en:'Individual letters (Ḥurūf mufradāt)',ur:'حروفِ مفردات',sub:['The 29 letters with their clean Arabic sounds','29 حروف، صاف عربی آواز کے ساتھ']},
 {id:'m2',n:2,kind:'joined',en:'Joined letters (Ḥurūf murakkabāt)',ur:'حروفِ مرکبات',sub:['How letters change shape inside a word','لفظ میں حروف کی بدلتی شکلیں']},
 {id:'m3',n:3,kind:'marks',keys:['a','i','u'],en:'Short vowels (Ḥarakāt)',ur:'حرکات',sub:['Zabar, zer, pesh: a, i, u','زبر، زیر، پیش']},
 {id:'m4',n:4,kind:'drill',en:'Fluent reading with vowels',ur:'حرکات کی رواں مشق',sub:['Rows of letters and vowels; look-alike sounds apart','حروف اور حرکات کی قطاریں؛ ملتی آوازیں الگ']},
 {id:'m5',n:5,kind:'marks',keys:['an','in','un'],en:'Tanween',ur:'تنوین',sub:['Double zabar, zer, pesh: an, in, un','دو زبر، دو زیر، دو پیش']},
 {id:'m6',n:6,kind:'rule',words:'m6',en:'Words with tanween and vowels',ur:'تنوین اور حرکات والے الفاظ',sub:['Real Quran words, read fluently and by spelling','قرآن کے اصل الفاظ، روانی سے اور ہجے کے ساتھ']},
 {id:'m7',n:7,kind:'rule',words:'m7',en:'Madd letters (Ḥurūf maddah)',ur:'حروفِ مدّہ',sub:['Alif, waw and ya that stretch the vowel','حرکت کو کھینچنے والے ا، و، ی']},
 {id:'m8',n:8,kind:'rule',words:'m8',en:'Vertical vowels (Khaṛī ḥarakāt)',ur:'کھڑی حرکات',sub:['Vertical zabar, zer and pesh','کھڑی زبر، کھڑی زیر، الٹی پیش']},
 {id:'m9',n:9,kind:'rule',words:'m9',en:'Līn letters (Ḥurūf līn)',ur:'حروفِ لین',sub:['Wāw and yā sākin after zabar: soft, no stretch','زبر کے بعد ساکن و اور ی: نرم، کھینچنا نہیں']},
 {id:'m10',n:10,kind:'rule',words:'m10',en:'Review of lessons 3–9',ur:'اسباق 3 تا 9 کی دہرائی',sub:['Mixed words from the lessons so far','اب تک کے اسباق کے ملے جلے الفاظ']},
 {id:'m11',n:11,kind:'rule',words:'m11',en:'Sukūn (Jazm) and Qalqalah',ur:'سکون (جزم) اور قلقلہ',sub:['A silent-vowel letter; the echo letters','ساکن حرف؛ قلقلہ کے حروف']},
 {id:'m12',n:12,kind:'rule',words:'m12',en:'Nūn sākin and tanween: iẓhār, ikhfāʾ',ur:'نون ساکن اور تنوین: اظہار، اخفاء',sub:['Clear before throat letters, hidden before 15 letters','حلق کے حروف سے پہلے صاف، 15 حروف سے پہلے چھپا ہوا']},
 {id:'m13',n:13,kind:'rule',words:'m13',en:'Tashdīd (Shadda)',ur:'تشدید',sub:['A doubled letter; ghunna on ن and م','دو بار پڑھا جانے والا حرف؛ ن اور م پر غنّہ']},
 {id:'m14',n:14,kind:'rule',words:'m14',en:'Nūn sākin and tanween: idghām, iqlāb',ur:'نون ساکن اور تنوین: ادغام، اقلاب',sub:['Merging into ي ر م ل و ن; turning into م before ب','ي ر م ل و ن میں ملنا؛ ب سے پہلے م بن جانا']},
 {id:'m15',n:15,kind:'rule',words:'m15',en:'Mīm sākin',ur:'میم ساکن',sub:['Merge, hide before ب, or say clearly','ملانا، ب سے پہلے چھپانا، یا صاف پڑھنا']},
 {id:'m16',n:16,kind:'rule',words:'m16',en:'Thick and thin letters (Tafkhīm, Tarqīq)',ur:'تفخیم و ترقیق',sub:['Heavy letters, rā, and the lām of Allāh','موٹے حروف، را، اور لامِ اللہ']},
 {id:'m17',n:17,kind:'rule',words:'m17',en:'Types of madd (Maddāt)',ur:'مدّات',sub:['Why and how long a madd is held','مد کیوں اور کتنی دیر کھینچا جاتا ہے']},
 {id:'m18',n:18,kind:'rule',words:'m18',live:'along',en:'Opening letters of surahs (Muqaṭṭaʿāt)',ur:'حروفِ مقطعات',sub:['Reading the letter names that open some surahs','بعض سورتوں کے شروع کے حروف کے نام پڑھنا']},
 {id:'m19',n:19,kind:'rule',words:'m19',en:'Extra alif (Zāʾid alif)',ur:'زائد الف',sub:['A letter with a small circle is not read','چھوٹے دائرے والا حرف پڑھا نہیں جاتا']},
 {id:'m20',n:20,kind:'rule',words:'m20',en:'Special rules',ur:'خاص احکام',sub:['Iẓhār muṭlaq and imālah','اظہارِ مطلق اور امالہ']},
 {id:'m21',n:21,kind:'rule',words:'m21',stop:true,signs:true,en:'Stopping (Waqf)',ur:'وقف',sub:['How to stop on a word, and the stop signs','لفظ پر رکنے کا طریقہ اور وقف کی علامات']},
 {id:'m22',n:22,kind:'salah',en:'Ṣalāh (the prayer)',ur:'نماز',sub:['Reading the recitations of the prayer','نماز کی تلاوت اور اذکار پڑھنا']},
];
for(const l of LESSONS)l.course=COURSE;

export const TUTOR={
 m6:[112,'Al-Ikhlas','الاخلاص'],m7:[113,'Al-Falaq','الفلق'],m8:[1,'Al-Fatiha','الفاتحہ'],m9:[105,'Al-Fil','الفیل'],m10:[107,'Al-Maun','الماعون'],m11:[112,'Al-Ikhlas','الاخلاص'],
 m12:[106,'Quraysh','قریش'],m13:[1,'Al-Fatiha','الفاتحہ'],m14:[111,'Al-Masad','المسد'],m15:[104,'Al-Humazah','الہمزہ'],m16:[110,'An-Nasr','النصر'],m17:[108,'Al-Kawthar','الکوثر'],
 m19:[103,'Al-Asr','العصر'],m21:[114,'An-Nas','الناس'],
};

/** One rule card per lesson: [English, Urdu]. Arabic examples are taken from the lesson's own words. */
export const RULES={
 m1:[['The Arabic alphabet has 29 letters. Say each one with its clean Arabic sound, not with an Urdu name like “tay” or “say”. Seven letters are heavy (the mouth is full): خ ص ض ط ظ غ ق. Four letters are made with the lips: ب ف م و.','عربی کے 29 حروف ہیں۔ ہر حرف کو صاف عربی آواز سے پڑھیں، اردو نام (جیسے “تے”، “سے”) سے نہیں۔ سات حروف موٹے (پُر) ہیں، منہ بھر کر پڑھیں: خ ص ض ط ظ غ ق۔ چار حروف ہونٹوں سے ادا ہوتے ہیں: ب ف م و۔']],
 m2:[['A letter changes shape depending on where it sits in a word: alone, at the start, in the middle or at the end. Tell look-alike shapes apart by their dots (ب ت ث ن ي). Six letters (ا د ذ ر ز و) never join to the letter after them.','حرف لفظ میں جگہ کے مطابق شکل بدلتا ہے: اکیلا، شروع میں، درمیان میں یا آخر میں۔ ملتی جلتی شکلوں کو نقطوں سے پہچانیں (ب ت ث ن ي)۔ چھ حروف (ا د ذ ر ز و) اپنے بعد والے حرف سے نہیں جڑتے۔']],
 m3:[['Zabar (fatḥa) is a small stroke above the letter: it adds “a” (بَ). Zer (kasra) is a small stroke below: it adds “i” (بِ). Pesh (ḍamma) is a small waw-like mark above: it adds “u” (بُ). A vowel on alif is read as a hamza: أَ إِ أُ. Open the mouth for zabar, keep it narrow for zer, round the lips for pesh.','زبر حرف کے اوپر چھوٹی لکیر ہے: “a” کی آواز (بَ)۔ زیر نیچے چھوٹی لکیر ہے: “i” کی آواز (بِ)۔ پیش اوپر چھوٹی “و” جیسا نشان ہے: “u” کی آواز (بُ)۔ الف پر حرکت ہو تو وہ ہمزہ پڑھا جاتا ہے: أَ إِ أُ۔ زبر پر منہ کھلا، زیر پر تنگ، پیش پر ہونٹ گول رکھیں۔']],
 m4:[['Read each row smoothly, without spelling the letters out. The first rows put letters that sound alike side by side: ث س ص، ح ه، ذ ز ظ، ت ط، ع أ، ق ك، د ض، غ خ. Keep every one distinct: the heavy letters ص ض ط ظ ق خ غ are said with a full mouth. The last rows mix all letters and vowels.','ہر قطار کو ہجے کیے بغیر روانی سے پڑھیں۔ پہلی قطاروں میں ملتی آواز والے حروف ساتھ ساتھ ہیں: ث س ص، ح ه، ذ ز ظ، ت ط، ع أ، ق ك، د ض، غ خ۔ ہر ایک کو الگ رکھیں: موٹے حروف ص ض ط ظ ق خ غ منہ بھر کر پڑھیں۔ آخری قطاروں میں تمام حروف اور حرکات ملے ہوئے ہیں۔']],
 m5:[['Tanween is a doubled mark on the last letter of a word. Double zabar ( ً ) = “an”, double zer ( ٍ ) = “in”, double pesh ( ٌ ) = “un”. After a double zabar an alif is written (ـًا) but it is not spelled out: say “an”. A word ending in ة has no alif.','تنوین لفظ کے آخری حرف پر دہری حرکت ہے۔ دو زبر ( ً ) = “an”، دو زیر ( ٍ ) = “in”، دو پیش ( ٌ ) = “un”۔ دو زبر کے بعد الف لکھا جاتا ہے (ـًا) مگر اس کے ہجے نہیں ہوتے: “an” پڑھیں۔ ة پر ختم ہونے والے لفظ میں الف نہیں ہوتا۔']],
 m6:[[`Read each word twice: once fluently, then by spelling it letter by letter with its vowel (hijja). Tanween is only on the last letter: ${T('m6','113:3:3')}, ${T('m6','94:5:4')}, ${T('m6','101:11:1')}.`,`ہر لفظ دو بار پڑھیں: ایک بار روانی سے، پھر حرف بہ حرف حرکت کے ساتھ ہجے کر کے۔ تنوین صرف آخری حرف پر ہوتی ہے: ${T('m6','113:3:3')}، ${T('m6','94:5:4')}، ${T('m6','101:11:1')}۔`]],
 m7:[[`A madd letter stretches the vowel before it by about two counts: alif after zabar (ـَا), waw sākin after pesh (ـُو), ya sākin after zer (ـِي). Examples: ${T('m7','93:3:1')}, ${T('m7','95:2:1')}, ${T('m7','95:2:2')}. Do not stretch more or less than needed.`,`حرفِ مدّہ اپنے سے پہلی حرکت کو تقریباً دو الف کے برابر کھینچتا ہے: زبر کے بعد الف (ـَا)، پیش کے بعد ساکن واو (ـُو)، زیر کے بعد ساکن یاء (ـِي)۔ مثالیں: ${T('m7','93:3:1')}، ${T('m7','95:2:1')}، ${T('m7','95:2:2')}۔ ضرورت سے کم یا زیادہ نہ کھینچیں۔`]],
 m8:[[`Vertical vowels are written as small marks and are read as long as a madd letter. A vertical zabar (ـٰ) gives a long “aa”: ${T('m8','1:1:3')}. In this script the long “ee” after ه is a small ya (ـِۦ): ${T('m8','100:4:2')}, and the long “oo” after ه is a small waw (ـُۥ): ${T('m8','112:4:3')}. (Some prints show these as a vertical zer and an inverted pesh.)`,`کھڑی حرکات چھوٹے نشانوں کی صورت میں لکھی جاتی ہیں اور حرفِ مدّہ کے برابر کھینچی جاتی ہیں۔ کھڑی زبر (ـٰ) لمبی “آ” دیتی ہے: ${T('m8','1:1:3')}۔ اس رسم الخط میں ہ کے بعد لمبی “ی” چھوٹی یاء (ـِۦ) سے لکھی جاتی ہے: ${T('m8','100:4:2')}، اور لمبی “و” چھوٹی واو (ـُۥ) سے: ${T('m8','112:4:3')}۔ (بعض مطبوعہ نسخوں میں انہیں کھڑی زیر اور الٹی پیش سے لکھتے ہیں۔)`]],
 m9:[[`A waw or ya with sukūn after a zabar is said softly, without stretching: ${T('m9','1:4:2')} (“yaw”), ${T('m9','105:1:3')} (“kay”). The tongue relaxes; the sound is a glide, not a long vowel.`,`زبر کے بعد ساکن واو یا یاء نرمی سے پڑھی جاتی ہے، کھینچی نہیں جاتی: ${T('m9','1:4:2')} (“yaw”)، ${T('m9','105:1:3')} (“kay”)۔ زبان نرم رہتی ہے؛ یہ سرکتی ہوئی آواز ہے، لمبی حرکت نہیں۔`]],
 m10:[['Read these mixed words fluently, then by spelling. They use vowels, tanween, madd, vertical vowels, līn, sukūn and tashdīd together. If you stumble on one, go back to its lesson.','یہ ملے جلے الفاظ روانی سے پڑھیں، پھر ہجے کے ساتھ۔ ان میں حرکات، تنوین، مد، کھڑی حرکات، لین، سکون اور تشدید سب شامل ہیں۔ کسی لفظ پر اٹکیں تو اس کے سبق پر واپس جائیں۔']],
 m11:[[`Sukūn ( ْ ) means the letter has no vowel: join it to the vowel before it and stop on it: ${T('m11','112:1:1')}, ${T('m11','94:1:2')}. Qalqalah: when ق ط ب ج د carry a sukūn (or you stop on them), the sound bounces lightly, like an echo: ${T('m11','100:1:2')}, ${T('m11','112:3:2')}, ${T('m11','96:19:4')}. The five letters are remembered as قُطْبُ جَدٍّ.`,`سکون ( ْ ) کا مطلب ہے حرف پر حرکت نہیں: اسے پچھلی حرکت سے ملا کر پڑھیں اور اس پر رک جائیں: ${T('m11','112:1:1')}، ${T('m11','94:1:2')}۔ قلقلہ: جب ق ط ب ج د ساکن ہوں (یا ان پر وقف ہو) تو آواز ہلکی سی اچھلتی ہے، گویا گونج: ${T('m11','100:1:2')}، ${T('m11','112:3:2')}، ${T('m11','96:19:4')}۔ ان پانچ حروف کو قُطْبُ جَدٍّ سے یاد رکھا جاتا ہے۔`]],
 m12:[[`When a nūn sākin or tanween is followed by a throat letter (ء ه ع ح غ خ) it is said clearly (iẓhār): ${T('m12','1:7:3')}. When it is followed by one of the 15 letters ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك it is hidden with a nasal sound (ikhfāʾ): ${T('m12','109:3:2')}. In this script a nūn sākin keeps its sūkun for iẓhār and loses it for ikhfāʾ.`,`جب نون ساکن یا تنوین کے بعد حلق کا کوئی حرف (ء ه ع ح غ خ) آئے تو وہ صاف پڑھا جاتا ہے (اظہار): ${T('m12','1:7:3')}۔ جب 15 حروف ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك میں سے کوئی آئے تو وہ ناک کی آواز کے ساتھ چھپا کر پڑھا جاتا ہے (اخفاء): ${T('m12','109:3:2')}۔ اس رسم الخط میں نون ساکن اظہار میں سکون رکھتا ہے اور اخفاء میں نہیں۔`]],
 m13:[[`Shadda ( ّ ) means the letter is doubled: said once at the end of the vowel before it, then again with its own vowel. On ن and م with shadda keep a nasal sound (ghunna) for about two counts: ${T('m13','94:6:1')}, ${T('m13','95:5:1')}.`,`شد ( ّ ) کا مطلب حرف دو بار ہے: پہلی بار پچھلی حرکت کے آخر پر، دوسری بار اپنی حرکت کے ساتھ۔ ن اور م پر شد ہو تو ناک کی آواز (غنّہ) تقریباً دو الف کے برابر رکھیں: ${T('m13','94:6:1')}، ${T('m13','95:5:1')}۔`]],
 m14:[[`Before ي ن م و the nūn sākin or tanween merges into the next letter with ghunna: ${T('m14','99:7:1+99:7:2')}. Before ل and ر it merges without ghunna: ${T('m14','93:4:2+93:4:3')}. These letters are remembered as يَرْمَلُونَ. Before ب it turns into a hidden م (iqlāb); a small meem ( ۢ ) is written on it: ${T('m14','92:8:2+92:8:3')}. Inside one word this does not happen: see lesson 20.`,`ي ن م و سے پہلے نون ساکن یا تنوین اگلے حرف میں غنّہ کے ساتھ مل جاتی ہے: ${T('m14','99:7:1+99:7:2')}۔ ل اور ر سے پہلے غنّہ کے بغیر مل جاتی ہے: ${T('m14','93:4:2+93:4:3')}۔ ان حروف کو يَرْمَلُونَ سے یاد رکھا جاتا ہے۔ ب سے پہلے وہ چھپی ہوئی م بن جاتی ہے (اقلاب)، اس پر چھوٹی میم ( ۢ ) لکھی ہوتی ہے: ${T('m14','92:8:2+92:8:3')}۔ ایک ہی لفظ کے اندر یہ نہیں ہوتا: سبق 20 دیکھیں۔`]],
 m15:[[`A mīm sākin has three cases. Before م it merges (idghām): ${T('m15','106:4:2+106:4:3')}. Before ب it is hidden with a nasal sound (ikhfāʾ): the lips stay closed, lightly. Before every other letter it is said clearly (iẓhār); take special care before و and ف, so the mīm is not hidden.`,`میم ساکن کے تین حکم ہیں۔ م سے پہلے وہ مل جاتی ہے (ادغام): ${T('m15','106:4:2+106:4:3')}۔ ب سے پہلے ناک کی آواز کے ساتھ چھپتی ہے (اخفاء): ہونٹ ہلکے سے بند رہتے ہیں۔ باقی ہر حرف سے پہلے صاف پڑھی جاتی ہے (اظہار)؛ و اور ف سے پہلے خاص خیال رکھیں تاکہ میم چھپ نہ جائے۔`]],
 m16:[[`The heavy letters خ ص ض ط ظ غ ق are always said with a full mouth. The rā is thick with zabar or pesh (${T('m16','1:2:3')}, ${T('m16','110:1:3')}) and thin with zer (${T('m16','106:2:2')}). A rā sākin follows the vowel before it. The lām of Allāh is thick after zabar or pesh and thin after zer.`,`موٹے حروف خ ص ض ط ظ غ ق ہمیشہ منہ بھر کر پڑھے جاتے ہیں۔ را زبر یا پیش پر موٹی (${T('m16','1:2:3')}، ${T('m16','110:1:3')}) اور زیر پر باریک (${T('m16','106:2:2')}) پڑھی جاتی ہے۔ ساکن را پچھلی حرکت کے تابع ہوتی ہے۔ لفظِ اللہ کا لام زبر یا پیش کے بعد موٹا اور زیر کے بعد باریک پڑھا جاتا ہے۔`]],
 m17:[['A madd is longer when a hamza or a sukūn comes after the madd letter. Madd muttaṣil (hamza in the same word) and madd munfaṣil (hamza at the start of the next word) are held for 4 or 5 counts. Madd lāzim (a sukūn or shadda in the same word) is held for 6 counts. Madd ʿāriḍ and madd līn ʿāriḍ appear only when you stop on the word: 2, 4 or 6 counts.','مد لمبا ہوتا ہے جب حرفِ مد کے بعد ہمزہ یا سکون آئے۔ مدِ متصل (ہمزہ اسی لفظ میں) اور مدِ منفصل (ہمزہ اگلے لفظ کے شروع میں) 4 یا 5 الف تک کھینچے جاتے ہیں۔ مدِ لازم (اسی لفظ میں سکون یا شد) 6 الف تک۔ مدِ عارض اور مدِ لین عارض صرف لفظ پر وقف کرتے وقت آتے ہیں: 2، 4 یا 6 الف۔']],
 m18:[['Some surahs open with letters that are read by their names, one by one (for example alif, lām, mīm). A madd sign ( ٓ ) over a letter means stretch it (6 counts). A letter without the sign, such as ر or ح, is held for two counts only. The name of ʿayn is held 4 or 6 counts.','بعض سورتیں ایسے حروف سے شروع ہوتی ہیں جو ان کے ناموں سے ایک ایک کر کے پڑھے جاتے ہیں (جیسے الف، لام، میم)۔ حرف پر مد کا نشان ( ٓ ) ہو تو اسے 6 الف تک کھینچیں۔ نشان کے بغیر حرف، جیسے ر یا ح، صرف دو الف کھینچا جاتا ہے۔ عین کا نام 4 یا 6 الف تک کھینچا جاتا ہے۔']],
 m19:[[`A letter with a small circle above it ( ۟ ) is written but never read, whether you go on or stop: ${T('m19','103:3:3')}, ${T('m19','98:1:4')}. It is usually an extra alif after the plural waw. The same sign is on the waw of ${T('m19','98:6:13')}, which is read “ulāʾika”.`,`جس حرف کے اوپر چھوٹا دائرہ ( ۟ ) ہو وہ لکھا جاتا ہے مگر پڑھا نہیں جاتا، چاہے ملا کر پڑھیں یا وقف کریں: ${T('m19','103:3:3')}، ${T('m19','98:1:4')}۔ عموماً یہ جمع کی واو کے بعد زائد الف ہوتا ہے۔ یہی نشان ${T('m19','98:6:13')} کی واو پر ہے، جو “اُولٰئِكَ” پڑھا جاتا ہے۔`]],
 m20:[[`Iẓhār muṭlaq: when a nūn sākin is followed by و or ي in the same word it is always said clearly: ${T('m20','79:38:3')}, ${T('m20','61:4:10')}, ${T('m20','13:4:10')}, ${T('m20','6:99:23')}. Imālah: the word ${T('m20','11:41:6')} is read with its “ā” leaning toward “ē” (majrēhā). It is the only word with this reading.`,`اظہارِ مطلق: ایک ہی لفظ میں نون ساکن کے بعد و یا ي آئے تو وہ ہمیشہ صاف پڑھی جاتی ہے: ${T('m20','79:38:3')}، ${T('m20','61:4:10')}، ${T('m20','13:4:10')}، ${T('m20','6:99:23')}۔ امالہ: لفظ ${T('m20','11:41:6')} میں “ا” کا جھکاؤ “ے” کی طرف ہوتا ہے ۔ یہی واحد لفظ ہے جس میں یہ قراءت ہے۔`]],
 m21:[['To stop on a word, drop its last vowel and say the last letter with a sukūn. Tanween falls away; a double zabar becomes a long “ā”; a final ة is said as ه. Each tile shows the stopping form under the word. The signs above the words tell you where you may stop: ◌ۘ must stop, ◌ۙ do not stop, ◌ۚ either, ◌ۗ stopping is better, ◌ۖ going on is better, ◌ۛ stop at one of the two places. After a stop, take a breath and begin again from the word you stopped on.','لفظ پر رکنے کے لیے آخری حرکت چھوڑ دیں اور آخری حرف کو ساکن پڑھیں۔ تنوین ختم ہو جاتی ہے؛ دو زبر لمبی “آ” بن جاتی ہے؛ آخری ة کو ه پڑھا جاتا ہے۔ ہر لفظ کے نیچے رکنے کی صورت دکھائی گئی ہے۔ الفاظ کے اوپر کی علامات بتاتی ہیں کہ کہاں رک سکتے ہیں: ◌ۘ ضرور رکیں، ◌ۙ نہ رکیں، ◌ۚ دونوں جائز، ◌ۗ رکنا بہتر، ◌ۖ ملانا بہتر، ◌ۛ دو جگہوں میں سے ایک پر رکیں۔ وقف کے بعد سانس لیں اور اسی لفظ سے دوبارہ شروع کریں۔']],
 m22:[['In the prayer a changed letter or vowel can change the meaning, so read slowly and keep every rule of this course: heavy and thin letters, madd, ghunna and stopping. The Quran parts open in the live tutor, which checks them word by word. The other recitations below are shown with their meaning only: they have no recording and no live check here, so learn them with a teacher.','نماز میں حرف یا حرکت بدلنے سے معنی بدل سکتے ہیں، اس لیے آہستہ پڑھیں اور اس کورس کے تمام احکام کا خیال رکھیں: موٹے اور باریک حروف، مد، غنّہ اور وقف۔ قرآنی حصے لائیو ٹیوٹر میں کھلتے ہیں جو لفظ بہ لفظ جانچتا ہے۔ نیچے کے باقی اذکار صرف معنی کے ساتھ دکھائے گئے ہیں: یہاں ان کی ریکارڈنگ اور لائیو جانچ نہیں، انہیں استاد سے سیکھیں۔']],
};
