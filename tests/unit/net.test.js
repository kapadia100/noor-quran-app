import {describe,it,expect} from 'vitest';
import {nextState,isRemote} from '../../src/net.js';
describe('automatic offline mode',()=>{
 it('offline and online events',()=>{
  expect(nextState({offline:false,fails:[],onLine:true},'offline').offline).toBe(true);
  expect(nextState({offline:true,fails:[1],onLine:true},'online')).toEqual({offline:false,fails:[]})});
 it('one failed remote fetch is not enough while the browser still says online; two are',()=>{
  const a=nextState({offline:false,fails:[],onLine:true},'fail',1000);
  expect(a.offline).toBe(false);expect(a.fails).toEqual([1000]);
  const b=nextState({...a,onLine:true},'fail',5000);
  expect(b.offline).toBe(true);expect(b.fails).toEqual([1000,5000])});
 it('a failure while the browser says offline switches immediately',()=>{
  expect(nextState({offline:false,fails:[],onLine:false},'fail',1).offline).toBe(true)});
 it('a success clears offline only when the browser is online',()=>{
  expect(nextState({offline:true,fails:[1,2],onLine:true},'ok').offline).toBe(false);
  expect(nextState({offline:true,fails:[1],onLine:false},'ok').offline).toBe(true)});
 it('old failures age out of the window',()=>{
  const s=nextState({offline:false,fails:[0],onLine:true},'fail',30000);
  expect(s.fails).toEqual([30000]);expect(s.offline).toBe(false)});
 it('only content hosts count as a remote fetch',()=>{
  expect(isRemote('https://api.alquran.cloud/v1/search/x/all/en.sahih')).toBe(true);
  expect(isRemote('https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3')).toBe(true);
  expect(isRemote('https://download.quranicaudio.com/qdc/mishari_al_afasy/murattal/1.mp3')).toBe(true);
  expect(isRemote('https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions.json')).toBe(true);
  expect(isRemote('./offline/s/ar/1.json')).toBe(false);
  expect(isRemote('https://quransafar.goatcounter.com/count')).toBe(false)});
});
