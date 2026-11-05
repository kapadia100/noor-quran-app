import {describe,it,expect} from 'vitest';
import {norm,parseChoice,searchAyahs,dictLookup} from '../../src/voice-core.js';
describe('voice search normalisation',()=>{
 it('drops harakat and unifies alef/hamza/ya/ta-marbuta',()=>{
  expect(norm('ٱلرَّحْمَٰنِ')).toBe(norm('الرحمن'));expect(norm('إِيَّاكَ')).toBe(norm('اياك'));
  expect(norm('رَحْمَةٌ')).toBe(norm('رحمه'));expect(norm('هُدًى')).toBe(norm('هدي'));expect(norm('آمَنُوا۟')).toBe(norm('امنوا'));
  expect(norm('صبر')).toBe(norm('صبر'));expect(norm('کتاب')).toBe(norm('كتاب'));expect(norm('رحمۃ')).toBe(norm('رحمة'));
  expect(norm('Patience!')).toBe('patience');expect(norm('٣٦')).toBe('36');expect(norm('mā')).toBe('ma');});
 it('parses Quran / Hadith answers in en, ur, ar, hi',()=>{
  for(const s of ['Quran','quran please','قرآن','القرآن','क़ुरान'])expect(parseChoice(s)).toBe('quran');
  for(const s of ['Hadith','hadees','حدیث','حديث','हदीस'])expect(parseChoice(s)).toBe('hadith');
  expect(parseChoice('hello')).toBe(null);expect(parseChoice('quran hadith')).toBe(null);});
});
describe('ayah search',()=>{
 const ed={ar:[['بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ','ٱلْحَمْدُ لِلَّهِ'],['وَٱصْبِرْ وَمَا صَبْرُكَ']],tr:[['In the name of Allah, the Most Merciful','Praise be to Allah'],['And be patient']]};
 it('Arabic ignores harakat',()=>{expect(searchAyahs('الرحمن',ed,'ar').hits).toEqual([{s:1,a:1}]);expect(searchAyahs('الحمد',ed,'ar').hits).toEqual([{s:1,a:2}]);});
 it('translation matches whole words',()=>{expect(searchAyahs('patient',ed,'tr').hits).toEqual([{s:2,a:1}]);expect(searchAyahs('all',ed,'tr').count).toBe(0);expect(searchAyahs('',ed,'tr').count).toBe(0);});
});
describe('dictionary lookup',()=>{
 const W=[{r:1,h:'مِن',l:'من',t:'min',e:'from; of',u:'سے؛ میں سے'},{r:2,h:'صَبْر',t:'ṣabr',e:'patience',u:'صبر'}];
 it('finds by Arabic, roman, English, Urdu',()=>{expect(dictLookup('من',W).r).toBe(1);expect(dictLookup('sabr',W).r).toBe(2);expect(dictLookup('patience',W).r).toBe(2);expect(dictLookup('سے',W).r).toBe(1);expect(dictLookup('two words',W)).toBe(null);});
});
