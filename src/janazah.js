// v3.7.11 Namaz-e-Janazah: short method + the duas (Arabic with full harakat, Urdu, English); text only (no audio).
/** Steps: [title en, title ur, how en, how ur, arabic|null] */
export const STEPS=[
 ['Intention & 1st takbeer','نیت اور پہلی تکبیر','Make the intention in the heart, say Allahu Akbar raising the hands, fold them, and read the Thana.','دل میں نیت کریں، ہاتھ اٹھا کر اللہ اکبر کہیں، ہاتھ باندھیں اور ثنا پڑھیں۔',
  'سُبْحَانَكَ اللّٰهُمَّ وَبِحَمْدِكَ، وَتَبَارَكَ اسْمُكَ، وَتَعَالٰى جَدُّكَ، وَجَلَّ ثَنَاؤُكَ، وَلَا إِلٰهَ غَيْرُكَ'],
 ['2nd takbeer','دوسری تکبیر','Say Allahu Akbar (without raising the hands) and read Durood Ibrahimi.','ہاتھ اٹھائے بغیر اللہ اکبر کہیں اور درودِ ابراہیمی پڑھیں۔',
  'اَللّٰهُمَّ صَلِّ عَلٰى مُحَمَّدٍ وَّعَلٰى اٰلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلٰى إِبْرَاهِيْمَ وَعَلٰى اٰلِ إِبْرَاهِيْمَ، إِنَّكَ حَمِيْدٌ مَّجِيْدٌ. اَللّٰهُمَّ بَارِكْ عَلٰى مُحَمَّدٍ وَّعَلٰى اٰلِ مُحَمَّدٍ، كَمَا بَارَكْتَ عَلٰى إِبْرَاهِيْمَ وَعَلٰى اٰلِ إِبْرَاهِيْمَ، إِنَّكَ حَمِيْدٌ مَّجِيْدٌ'],
 ['3rd takbeer','تیسری تکبیر','Say Allahu Akbar and read the dua for the deceased (below: adult, boy or girl).','اللہ اکبر کہیں اور میت کے لیے دعا پڑھیں (نیچے: بالغ، لڑکا یا لڑکی)۔',null],
 ['4th takbeer & salam','چوتھی تکبیر اور سلام','Say Allahu Akbar, then turn to the right and then to the left saying the salam.','اللہ اکبر کہیں، پھر دائیں اور بائیں سلام پھیریں۔',
  'اَلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللّٰهِ']];
/** Duas for the deceased: [title en, title ur, arabic, urdu, english] */
export const DUAS=[
 ['Adult (man or woman)','بالغ مرد و عورت',
  'اَللّٰهُمَّ اغْفِرْ لِحَيِّنَا وَمَيِّتِنَا، وَشَاهِدِنَا وَغَائِبِنَا، وَصَغِيْرِنَا وَكَبِيْرِنَا، وَذَكَرِنَا وَأُنْثَانَا. اَللّٰهُمَّ مَنْ أَحْيَيْتَهٗ مِنَّا فَأَحْيِهٖ عَلَى الْإِسْلَامِ، وَمَنْ تَوَفَّيْتَهٗ مِنَّا فَتَوَفَّهٗ عَلَى الْإِيْمَانِ',
  'اے اللہ! ہمارے زندوں اور ہمارے مُردوں کو، ہمارے حاضر اور ہمارے غائب کو، ہمارے چھوٹوں اور ہمارے بڑوں کو، ہمارے مردوں اور ہماری عورتوں کو بخش دے۔ اے اللہ! ہم میں سے جسے تو زندہ رکھے اسے اسلام پر زندہ رکھ، اور جسے تو موت دے اسے ایمان پر موت دے۔',
  'O Allah, forgive our living and our dead, those present and those absent, our young and our old, our males and our females. O Allah, whoever of us You keep alive, keep him alive upon Islam, and whoever of us You take, take him upon faith.'],
 ['Boy (child)','نابالغ لڑکا',
  'اَللّٰهُمَّ اجْعَلْهُ لَنَا فَرَطًا، وَّاجْعَلْهُ لَنَا أَجْرًا وَّذُخْرًا، وَّاجْعَلْهُ لَنَا شَافِعًا وَّمُشَفَّعًا',
  'اے اللہ! اس (بچے) کو ہمارے لیے آگے پہنچ کر سامان کرنے والا بنا، اسے ہمارے لیے اجر اور ذخیرہ بنا، اور اسے ہمارے حق میں سفارش کرنے والا اور جس کی سفارش قبول ہو، بنا۔',
  'O Allah, make him for us one who goes ahead to prepare, make him for us a reward and a treasure, and make him for us an intercessor whose intercession is accepted.'],
 ['Girl (child)','نابالغ لڑکی',
  'اَللّٰهُمَّ اجْعَلْهَا لَنَا فَرَطًا، وَّاجْعَلْهَا لَنَا أَجْرًا وَّذُخْرًا، وَّاجْعَلْهَا لَنَا شَافِعَةً وَّمُشَفَّعَةً',
  'اے اللہ! اس (بچی) کو ہمارے لیے آگے پہنچ کر سامان کرنے والی بنا، اسے ہمارے لیے اجر اور ذخیرہ بنا، اور اسے ہمارے حق میں سفارش کرنے والی اور جس کی سفارش قبول ہو، بنا۔',
  'O Allah, make her for us one who goes ahead to prepare, make her for us a reward and a treasure, and make her for us an intercessor whose intercession is accepted.']];
export const STEPS_TR=['Subḥānakallāhumma wa biḥamdika, wa tabārakasmuka, wa taʿālā jadduka, wa jalla thanā’uka, wa lā ilāha ghayruk', 'Allāhumma ṣalli ʿalā Muḥammadin wa ʿalā āli Muḥammad, kamā ṣallayta ʿalā Ibrāhīma wa ʿalā āli Ibrāhīm, innaka ḥamīdum majīd. Allāhumma bārik ʿalā Muḥammadin wa ʿalā āli Muḥammad, kamā bārakta ʿalā Ibrāhīma wa ʿalā āli Ibrāhīm, innaka ḥamīdum majīd', '', 'As-salāmu ʿalaykum wa raḥmatullāh'];
export const DUAS_TR=['Allāhummaghfir liḥayyinā wa mayyitinā, wa shāhidinā wa ghā’ibinā, wa ṣaghīrinā wa kabīrinā, wa dhakarinā wa unthānā. Allāhumma man aḥyaytahū minnā fa-aḥyihī ʿalal-islām, wa man tawaffaytahū minnā fa-tawaffahū ʿalal-īmān', 'Allāhummajʿalhu lanā faraṭan, wajʿalhu lanā ajran wa dhukhran, wajʿalhu lanā shāfiʿan wa mushaffaʿā', 'Allāhummajʿalhā lanā faraṭan, wajʿalhā lanā ajran wa dhukhran, wajʿalhā lanā shāfiʿatan wa mushaffaʿah'];
import {SHR,bar,wire} from './textview.js';
export function leave(){}
export function page(C,tt,ur){
 C.setTitle(tt('Namaz-e-Janazah','نمازِ جنازہ'));const app=C.app();
 app.innerHTML=`<div class="jz tv" dir="${ur()?'rtl':'ltr'}">${bar(tt)}<div class="card"><p class="muted">${tt('Funeral prayer is said standing, with four takbeers, no ruku or sajda. Below is the order and what to read after each takbeer.','نمازِ جنازہ کھڑے ہو کر چار تکبیروں کے ساتھ پڑھی جاتی ہے، اس میں رکوع اور سجدہ نہیں۔ نیچے ترتیب اور ہر تکبیر کے بعد پڑھی جانے والی چیزیں ہیں۔')}</p></div>
 ${STEPS.map((s,i)=>`<section class="card tv-c jz-step" id="jzS${i}"><div class="tv-h"><span class="tv-n">${i+1}</span><b>${tt(s[0],s[1])}</b>${SHR}</div><p class="tv-how">${tt(s[2],s[3])}</p>${s[4]?`<p class="tv-ar jz-ar" dir="rtl" lang="ar">${s[4]}</p><p class="tv-tr" dir="ltr" lang="en">${STEPS_TR[i]}</p>`:''}</section>`).join('')}
 <h3 class="dhead jz-dh">${tt('Dua for the deceased (3rd takbeer)','میت کے لیے دعا (تیسری تکبیر)')}</h3>
 ${DUAS.map((d,i)=>`<section class="card tv-c jz-dua" id="jzD${i}"><div class="tv-h"><span class="tv-n">${String.fromCharCode(65+i)}</span><b>${tt(d[0],d[1])}</b>${SHR}</div><p class="tv-ar jz-ar" dir="rtl" lang="ar">${d[2]}</p><p class="tv-tr" dir="ltr" lang="en">${DUAS_TR[i]}</p><hr class="tv-hr"><p class="tv-ur jz-ur" dir="rtl" lang="ur">${d[3]}</p><p class="tv-en jz-en" dir="ltr" lang="en">${d[4]}</p></section>`).join('')}</div>`;
 wire(app.querySelector('.tv'));window.__jz=1}
