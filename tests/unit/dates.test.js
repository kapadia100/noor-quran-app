import {describe,it,expect,afterEach,vi} from 'vitest';
import * as D from '../../src/dates.js';
import * as PR from '../../src/prayer.js';
const fakeIntl=(parts,cal='islamic-umalqura')=>vi.stubGlobal('Intl',{...Intl,DateTimeFormat:function(){return {resolvedOptions:()=>({calendar:cal}),formatToParts:()=>parts,format:()=>'14-14, 48 BC'}}});
const P=(y,m,d,era)=>[{type:'month',value:String(m)},{type:'literal',value:'/'},{type:'day',value:String(d)},{type:'year',value:String(y)},...(era?[{type:'era',value:era}]:[])];
afterEach(()=>{vi.unstubAllGlobals();PR.P.hijriAdj=0});
const L=(y,m,d,h=12)=>new Date(y,m-1,d,h,0,0);
describe('gregorian text — exact, local, never BC',()=>{
 it('fixed dates',()=>{expect(D.gregText(L(2026,10,24))).toBe('Saturday, 24 October 2026');expect(D.gregText(L(2026,1,1))).toBe('Thursday, 1 January 2026');expect(D.gregText(L(2024,2,29))).toBe('Thursday, 29 February 2024');expect(D.gregText(L(2026,12,31,23))).toBe('Thursday, 31 December 2026')});
 it('urdu + short',()=>{expect(D.gregText(L(2026,10,24),'ur')).toBe('ہفتہ، 24 اکتوبر 2026');expect(D.gregText(L(2026,10,24),'en',{weekday:'short',day:true,month:'short'})).toBe('Sat, 24 Oct');expect(D.gregText(L(2026,3,5),'en',{month:'long',year:true})).toBe('March 2026')});
 it('invalid date -> empty',()=>{expect(D.gregText(new Date('x'))).toBe('');expect(D.stampText(NaN)).toBe('')});
 it('stamp is local time',()=>{expect(D.stampText(new Date(2026,9,24,7,5).getTime())).toBe('24 Oct 2026, 07:05')});
});
describe('midnight + day key',()=>{
 it('dateKey local',()=>{expect(D.dateKey(L(2026,10,24,0))).toBe('2026-10-24');expect(D.dateKey(new Date(2026,9,24,23,59,59))).toBe('2026-10-24')});
 it('ms to midnight',()=>{expect(D.msToMidnight(new Date(2026,9,24,23,0,0))).toBe(36e5);expect(D.msToMidnight(new Date(2026,9,24,0,0,0))).toBe(864e5)});
});
describe('Kuwaiti fallback',()=>{
 it('known conversions (±1 day of Umm al-Qura)',()=>{
  const cases=[[2026,2,18,1447,9],[2025,3,1,1446,9],[2026,10,24,1448,5],[2024,7,7,1446,1],[2030,1,1,1451,8]];
  for(const [y,m,d,hy,hm] of cases){const k=D.kuwaiti(y,m,d);expect(k.y).toBe(hy);expect(k.m).toBe(hm)}
  expect(D.kuwaiti(2026,10,24).d).toBeGreaterThanOrEqual(13);expect(D.kuwaiti(2026,10,24).d).toBeLessThanOrEqual(15)});
});
describe('hijri: Intl guards',()=>{
 it('normal engine: Umm al-Qura, AH, in range',()=>{const h=D.hijriParts(L(2026,10,24));expect(h).toMatchObject({y:1448,m:5,d:13,src:'intl'});expect(D.hijriText(L(2026,10,24))).toBe('13 Jumada al-Ula 1448 AH');expect(D.hijriText(L(2026,2,18))).toBe('1 Ramadan 1447 AH');expect(D.hijriText(L(2026,10,24),'ur')).toContain('جمادی الاول');expect(D.hijriText(L(2026,10,24),'ur')).toContain('1448')});
 it('Android bug shape: BC era / tiny year -> falls back, never BC',()=>{fakeIntl(P(48,14,14,'BC'));const t=D.hijriText(L(2026,10,24));expect(t).toMatch(/^1[34] Jumada al-Ula 1448 AH$/);expect(t).not.toMatch(/BC/);expect(D.hijriParts(L(2026,10,24)).src).toBe('calc')});
 it('wrong calendar (gregory) -> fallback',()=>{fakeIntl(P(2026,10,24,'AD'),'gregory');expect(D.hijriParts(L(2026,10,24)).src).toBe('calc')});
 it('year without era but out of range -> fallback',()=>{fakeIntl(P(48,5,13));expect(D.hijriParts(L(2026,10,24)).y).toBe(1448)});
 it('plausible-looking but far from calculation -> fallback',()=>{fakeIntl(P(1440,1,1,'AH'));expect(D.hijriParts(L(2026,10,24)).src).toBe('calc')});
 it('Intl throws -> fallback',()=>{vi.stubGlobal('Intl',{...Intl,DateTimeFormat:function(){throw new Error('no icu')}});expect(D.hijriText(L(2026,10,24))).toMatch(/1448 AH$/)});
 it('out of range or invalid date -> hidden',()=>{expect(D.hijriText(L(1900,1,1))).toBe('');expect(D.hijriText(L(2300,1,1))).toBe('');expect(D.hijriText(new Date('x'))).toBe('');expect(D.hijriParts(new Date('x'))).toBeNull()});
 it('adjustment shifts one day',()=>{const a=D.hijriParts(L(2026,10,24),0),b=D.hijriParts(L(2026,10,24),1);expect(b.d===a.d+1||b.d===1).toBe(true);expect(D.hijriText(L(2026,10,24),'en',-1)).toMatch(/^12 /)});
 it('prayer.js wrappers use the shared module',()=>{expect(PR.hijri(L(2026,10,24))).toBe('13 Jumada al-Ula 1448 AH');expect(PR.greg(L(2026,10,24))).toBe('Saturday, 24 October 2026');PR.P.hijriAdj=1;expect(PR.hijri(L(2026,10,24))).toMatch(/^14 /)});
});
