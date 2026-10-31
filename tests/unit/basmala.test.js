import {describe,it,expect} from 'vitest';
import {ayahClips,basmalaClip,globalAyah,AYAH_COUNTS} from '../../src/lib.js';
const U=(s,a)=>`https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalAyah(s,a)}.mp3`;
describe('Bismillah before ayah 1 (v79)',()=>{
 it('all 114 surahs × all audio modes: reciter 1:1 first in Arabic and Arabic+translation, except 1 and 9; translation-only stays Arabic-free; never on other ayahs',()=>{
  for(let s=1;s<=114;s++)for(const m of ['ar','tr','both']){const c=ayahClips(m,U(s,1),'ur',s,1);const bas=c.filter(x=>x.bas);
   if(s===1||s===9||m==='tr')expect(bas.length).toBe(0);else{expect(c[0]).toEqual({u:'https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3',bas:true});expect(bas.length).toBe(1)}
   if(AYAH_COUNTS[s-1]>1)expect(ayahClips(m,U(s,2),'ur',s,2).some(x=>x.bas)).toBe(false)}});
 it('Al-Mulk ayah 1 = Bismillah then 67:1; Al-Fatiha not doubled; At-Tawbah none',()=>{
  expect(ayahClips('ar',U(67,1),'ur',67,1).map(x=>x.u)).toEqual([U(1,1),U(67,1)]);
  expect(ayahClips('ar',U(1,1),'ur',1,1).map(x=>x.u)).toEqual([U(1,1)]);
  expect(ayahClips('ar',U(9,1),'ur',9,1).map(x=>x.u)).toEqual([U(9,1)]);
  expect(basmalaClip(undefined,67,1)).toBeNull()});
});
