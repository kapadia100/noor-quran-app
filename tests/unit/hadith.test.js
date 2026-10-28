import {describe,it,expect} from 'vitest';
import {parseHadithRef,hadithIntl} from '../../src/lib.js';
describe('hadith references',()=>{
 it('parses English, Urdu and sunnah.com style refs',()=>{
  expect(parseHadithRef('Bukhari 1')).toEqual({book:'bukhari',n:'1'});expect(parseHadithRef('Sahih Muslim 2564')).toEqual({book:'muslim',n:'2564'});
  expect(parseHadithRef('muslim:2564b')).toEqual({book:'muslim',n:'2564b'});expect(parseHadithRef('Tirmidhi 2516')).toEqual({book:'tirmidhi',n:'2516'});
  expect(parseHadithRef('ترمذی ۲۵۱۶')).toEqual({book:'tirmidhi',n:'2516'});expect(parseHadithRef('صحیح بخاری 1')).toEqual({book:'bukhari',n:'1'});
  expect(parseHadithRef('Abu Dawood 4031')).toEqual({book:'abudawud',n:'4031'});expect(parseHadithRef("Nasa'i 1")).toEqual({book:'nasai',n:'1'});
  expect(parseHadithRef('ibn majah 224')).toEqual({book:'ibnmajah',n:'224'});expect(parseHadithRef('Malik 3/22')).toBeNull();expect(parseHadithRef('nawawi 5')).toBeNull();
  expect(parseHadithRef('patience')).toBeNull();expect(parseHadithRef('mercy 5')).toBeNull()});
 it('international numbers',()=>{expect(hadithIntl('muslim',{hadithnumber:6541,arabicnumber:'2564.01'})).toBe('2564');expect(hadithIntl('muslim',{hadithnumber:6542,arabicnumber:'2564.02'})).toBe('2564b');
  expect(hadithIntl('bukhari',{hadithnumber:1})).toBe('1');expect(hadithIntl('bukhari',{hadithnumber:402.2})).toBe('402')});
});
