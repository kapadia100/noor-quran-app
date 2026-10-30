import {describe,it,expect} from 'vitest';
import {headerState,MAKROOH} from '../../src/prayer.js';
const D=(h,m)=>new Date(2026,9,30,h,m);
const pt={fajr:D(5,21),sunrise:D(6,38),dhuhr:D(12,17),asr:D(16,17),maghrib:D(17,53),isha:D(19,10)};
const nxt=now=>{for(const k of ['fajr','dhuhr','asr','maghrib','isha'])if(pt[k]>now)return{key:k,time:pt[k]};return{key:'fajr',time:new Date(+pt.fajr+864e5)}};
const S=(h,m)=>headerState(pt,D(h,m),nxt(D(h,m)));
describe('home header state',()=>{
 it('constants',()=>expect(MAKROOH).toEqual({afterSunrise:20,beforeDhuhr:10,beforeMaghrib:15}));
 it('Fajr → sunrise: current Fajr, countdown to sunrise',()=>{const s=S(6,0);expect(s.mode).toBe('current');expect(s.key).toBe('fajr');expect(+s.time).toBe(+pt.sunrise);expect(S(5,21).mode).toBe('current')});
 it('sunrise +20 min is makrooh',()=>{const s=S(6,38);expect(s.mode).toBe('makrooh');expect(s.kind).toBe('sunrise');expect(+s.until).toBe(+D(6,58));expect(S(6,57).mode).toBe('makrooh');expect(S(6,58).mode).toBe('next')});
 it('zawal: 10 min before Dhuhr',()=>{expect(S(12,6).mode).toBe('next');const s=S(12,7);expect(s.mode).toBe('makrooh');expect(s.kind).toBe('zawal');expect(+s.until).toBe(+pt.dhuhr);expect(S(12,17).mode).toBe('next')});
 it('15 min before Maghrib',()=>{expect(S(17,37).mode).toBe('next');const s=S(17,38);expect(s.kind).toBe('sunset');expect(+s.until).toBe(+pt.maghrib);expect(S(17,53).mode).toBe('next')});
 it('otherwise next prayer, incl. Isha → Fajr',()=>{const s=S(22,0);expect(s.mode).toBe('next');expect(s.key).toBe('fajr');expect(S(9,0).key).toBe('dhuhr');expect(S(2,0).key).toBe('fajr')});
});
