import {describe,it,expect} from 'vitest';
import {chapterId,parseTimings,ayahIndex,verse,segsByAyah} from '../../src/flow.js';
describe('continuous surah timings',()=>{
 it('maps the reciters that publish one file per surah, and leaves the others on clips',()=>{
  expect(chapterId('ar.alafasy')).toBe(7);expect(chapterId('ar.husary')).toBe(6);expect(chapterId('ar.abdurrahmaansudais')).toBe(3);
  expect(chapterId('ar.shaatree')).toBe(4);expect(chapterId('ar.saoodshuraym')).toBe(10);expect(chapterId('ar.abdulsamad')).toBe(2);
  expect(chapterId('ar.hudhaify')).toBe(0);expect(chapterId('ar.husarymujawwad')).toBe(0);expect(chapterId('ar.ahmedajamy')).toBe(0)});
 it('keeps ayah ranges and drops timings with no start and end',()=>{
  const verses=parseTimings({audio_url:'https://download.quranicaudio.com/qdc/mishari_al_afasy/murattal/1.mp3',timestamps:[
   {verse_key:'1:1',timestamp_from:0,timestamp_to:6090,segments:[[1,0,580],[2,580,1409],[1]]},
   {verse_key:'1:2',timestamp_from:6090,timestamp_to:11680,segments:[[1,6025,7025],[2,7025,7885]]},
   {verse_key:'1:3',timestamp_from:11680,timestamp_to:11680,segments:[]}
  ]});
  expect(verses.map(v=>v.a)).toEqual([1,2]);
  expect(verses[0].segs).toEqual([[1,0,580],[2,580,1409]]);
  expect(ayahIndex(verses,0)).toBe(0);expect(ayahIndex(verses,6070)).toBe(0);expect(ayahIndex(verses,6075)).toBe(1);expect(ayahIndex(verses,9000)).toBe(1);
  const flow={by:new Map(verses.map(v=>[v.a,v]))};
  expect(verse(flow,1).from).toBe(6090);expect(segsByAyah(verses)[2][0]).toEqual([1,6025,7025])});
 it('returns nothing when the response has no chapter file',()=>{expect(parseTimings(null)).toEqual([]);expect(parseTimings({})).toEqual([]);expect(verse(null,0)).toBe(null)});
});
import {tidy,parseMp3q,mp3qOf,mp3qUrl} from '../../src/flow.js';
describe('surah timing checks',()=>{
 it('uses mp3quran timings for the reciters that have them, with the intro folded into ayah 1',()=>{
  expect(mp3qOf('ar.ahmedajamy')[0]).toBe(5);expect(mp3qOf('ar.husarymujawwad')[0]).toBe(119);expect(mp3qOf('ar.hudhaify')).toBe(null);expect(mp3qOf('ar.mahermuaiqly')).toBe(null);
  expect(mp3qUrl('ahmad-ajmi/r1',2)).toBe('https://cdn.mp3quran.net/audio/ahmad-ajmi/r1/002.mp3');
  const v=parseMp3q([{ayah:0,start_time:0,end_time:5587},{ayah:2,start_time:12658,end_time:19150},{ayah:1,start_time:5587,end_time:12658}]);
  expect(v.map(x=>[x.a,x.from,x.to])).toEqual([[1,0,12658],[2,12658,19150]]);expect(v[0].introMs).toBe(5587)});
 it('accepts a surah only with every ayah once and in time order; holes and overlaps close at the next ayah',()=>{
  const V=(...r)=>r.map(([a,from,to])=>({a,from,to,segs:[]}));
  expect(tidy(V([1,0,10],[2,10,20],[3,26,40]),3).map(x=>x.to)).toEqual([10,26,40]);
  expect(tidy(V([1,0,30],[2,20,40]),2).map(x=>x.to)).toEqual([20,40]);
  expect(tidy(V([1,0,10],[2,10,20]),3)).toBe(null);// last ayah missing
  expect(tidy(V([1,0,10],[2,30,40],[3,10,30]),3)).toBe(null);// out of order
  expect(tidy(V([1,0,10],[2,10,10]),2)).toBe(null);// empty span
  // a surah file with no Bismillah before ayah 1 is not used (except Al-Fatiha and At-Tawbah)
  const a=V([1,0,2000],[2,2000,4000]);a[0].introMs=110;expect(tidy(a,2,{s:112,needIntro:true})).toBe(null);expect(tidy(a,2,{s:9,needIntro:true})).not.toBe(null);
  a[0].introMs=4000;expect(tidy(a,2,{s:112,needIntro:true})).not.toBe(null)});
});
