import {describe,it,expect} from 'vitest';
import {TIPS,trickyIn,hardOf,hasShadda,SHADDA_TIP,PLAIN_TIP} from '../../src/tajweed.js';
import {letters} from '../../src/coach.js';
describe('tajweed tips',()=>{
 it('covers every requested tricky letter with English and Urdu, name, place and how',()=>{
  for(const l of 'عحخغقصضطظثذ'){const t=TIPS[l];expect(t,l).toBeTruthy();for(const k of ['n','p','e']){expect(t[k].length).toBe(2);expect(t[k][0].length).toBeGreaterThan(1);expect(t[k][1].length).toBeGreaterThan(1);expect(/[\u0600-\u06FF]/.test(t[k][1]),l+k).toBe(true)}
   expect(t.e[0].length).toBeLessThan(260);expect(t.e[1].length).toBeLessThan(260)}
  expect(SHADDA_TIP).toHaveLength(2);expect(PLAIN_TIP).toHaveLength(2)});
 it('finds tricky letters in a word with harakat, hard letters first, max 3, hamza/ha last',()=>{
  expect(trickyIn('ٱلرَّحِيمِ')).toEqual(['ح']);
  expect(trickyIn('ٱللَّهِ')).toEqual(['ه']);
  expect(trickyIn('ٱلْمُسْتَقِيمَ')).toEqual(['ق']);
  expect(trickyIn('أَعُوذُ')).toEqual(['ع','ذ','ء']);
  expect(trickyIn('صِرَٰطَ').slice(0,2)).toEqual(['ص','ط']);
  expect(trickyIn('مَالِكِ')).toEqual([]);
  expect(trickyIn('عَظِيمٌ ثَخِينٌ حَقّ',3)).toHaveLength(3)});
 it('hardOf maps a letter+harakat unit and folds hamza forms',()=>{expect(hardOf('عَ')).toBe('ع');expect(hardOf('أُ')).toBe('ء');expect(hardOf('بِ')).toBe('')});
 it('shadda detection and letters split',()=>{expect(hasShadda('ٱلرَّحْمَٰنِ')).toBe(true);expect(hasShadda('مَالِكِ')).toBe(false);
  const l=letters('ٱلرَّحِيمِ');expect(l.length).toBe(6);expect(l.join('')).toBe('ٱلرَّحِيمِ')})});
