import {describe,it,expect,beforeEach} from 'vitest';
import * as PR from '../../src/prayer.js';
// Reference times for 4 Nov 2026. Dubai: IACAD official timetable. Others: the national method's published/reference values (Aladhan API, same method).
const REF=[
 ['Dubai (IACAD)',25.2048,55.2708,'Asia/Dubai','05:09 06:25 12:05 15:14 17:40 18:55'],
 ['Karachi',24.8607,67.0011,'Asia/Karachi','05:23 06:41 12:16 16:14 17:50 19:08'],
 ['Makkah',21.4225,39.8262,'Asia/Riyadh','05:07 06:25 12:04 15:19 17:43 19:13'],
 ['Cairo',30.0444,31.2357,'Africa/Cairo','04:43 06:11 11:39 14:44 17:06 18:25'],
 ['Istanbul',41.0082,28.9784,'Europe/Istanbul','06:05 07:31 12:53 15:38 18:04 19:25'],
 ['London',51.5074,-0.1278,'Europe/London','05:05 06:59 11:44 14:03 16:28 18:16'],
 ['New York',40.7128,-74.006,'America/New_York','05:13 06:30 11:40 14:26 16:49 18:06'],
 ['Kuala Lumpur',3.139,101.6869,'Asia/Kuala_Lumpur','05:37 06:57 12:57 16:19 18:57 20:08'],
 ['Jakarta',-6.2088,106.8456,'Asia/Jakarta','04:05 05:26 11:36 14:54 17:47 18:59'],
 ['Doha',25.2854,51.531,'Asia/Qatar','04:25 05:43 11:17 14:29 16:51 18:21'],
 ['Kuwait City',29.3759,47.9774,'Asia/Kuwait','04:42 06:03 11:32 14:38 17:00 18:18'],
];
const K=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
const mins=s=>{const [h,m]=s.split(':');return h*60+ +m};
describe('prayer times match official/reference timetables (±2 min, Dubai ±1)',()=>{
 beforeEach(()=>{delete PR.P.methodUser;delete PR.P.madhabUser;PR.P.autoV2=1;delete PR.P.adj;delete PR.P.hlr});
 for(const [n,lat,lng,tz,ref] of REF)it(n,()=>{Object.assign(PR.P,{lat,lng,tz});PR.autoMethod();
  const t=PR.times(new Date('2026-11-04T09:00:00Z')),r=ref.split(' ');
  K.forEach((k,i)=>{const got=mins(PR.fmt(t[k]));expect(Math.abs(got-mins(r[i])),`${n} ${k} ${PR.fmt(t[k])} vs ${r[i]}`).toBeLessThanOrEqual(n.startsWith('Dubai')?1:2)})});
 it('country defaults',()=>{expect(PR.defaultsFor('Asia/Karachi')).toEqual({method:'Karachi',madhab:'Hanafi'});expect(PR.defaultsFor('Asia/Dubai').method).toBe('Dubai');expect(PR.defaultsFor('Asia/Riyadh').method).toBe('UmmAlQura');expect(PR.defaultsFor('Europe/Paris').method).toBe('MuslimWorldLeague')});
 it('user choice is kept',()=>{Object.assign(PR.P,{tz:'Asia/Dubai',method:'Karachi',methodUser:true,madhab:'Hanafi',madhabUser:true});PR.autoMethod();expect(PR.P.method).toBe('Karachi');expect(PR.P.madhab).toBe('Hanafi')});
});
