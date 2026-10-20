import {describe,it,expect,beforeEach,vi} from 'vitest';
import fs from 'node:fs';
vi.mock('@capacitor/core',()=>({Capacitor:{isNativePlatform:()=>false}}));
vi.mock('@capacitor/local-notifications',()=>({LocalNotifications:{}}));
globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
const L=await import('../../src/lib.js');const PR=await import('../../src/prayer.js');
const AR=JSON.parse(fs.readFileSync(new URL('../../public/offline/ar.json',import.meta.url)));
const EN=JSON.parse(fs.readFileSync(new URL('../../public/offline/en.sahih.json',import.meta.url)));
const UR=JSON.parse(fs.readFileSync(new URL('../../public/offline/ur.jalandhry.json',import.meta.url)));

describe('Quran data + ayah corrections',()=>{
 it('114 surahs / 6236 ayahs matching standard counts',()=>{expect(AR.length).toBe(114);expect(AR.map(s=>s.length)).toEqual(L.AYAH_COUNTS);expect(AR.flat().length).toBe(6236)});
 it('bundled translations are complete and aligned',()=>{for(const d of [EN,UR]){expect(d.ayahs.map(s=>s.length)).toEqual(L.AYAH_COUNTS);expect(d.ayahs.flat().every(x=>x&&x.trim())).toBe(true)}});
 it('basmala stripped from ayah 1 of every surah except 1 and 9 has none',()=>{for(let s=2;s<=114;s++){const t=L.ayahText(s,1,AR[s-1][0]);expect(t.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g,'').startsWith('بسم ٱلله')).toBe(false)}});
 it('Al-Fatiha 1:1 keeps basmala',()=>{expect(L.ayahText(1,1,AR[0][0])).toBe(AR[0][0])});
 it('verified fixes are applied',()=>{for(const k of Object.keys(L.FIX)){const [s,a]=k.split(':').map(Number);expect(L.ayahText(s,a,'x')).toBe(L.FIX[k])}for(const s of [95,97])expect(L.ayahText(s,1,AR[s-1][0])).toBe(AR[s-1][0])});
 it('27:30 mid-surah basmala untouched',()=>{expect(L.ayahText(27,30,AR[26][29])).toBe(AR[26][29])});
});
describe('references + juz',()=>{
 it('parseRef',()=>{expect(L.parseRef('2:255')).toEqual({s:2,a:255});expect(L.parseRef('36')).toEqual({s:36,a:null});expect(L.parseRef('2 255')).toEqual({s:2,a:255});expect(L.parseRef('115')).toBeNull();expect(L.parseRef('1:8')).toBeNull();expect(L.parseRef('0')).toBeNull();expect(L.parseRef('abc')).toBeNull()});
 it('30 juz cover all 6236 ayahs exactly once',()=>{let n=0,seen=new Set;for(let j=1;j<=30;j++)for(const [s,f,t] of L.juzRanges(j))for(let a=f;a<=t;a++){seen.add(s+':'+a);n++}expect(n).toBe(6236);expect(seen.size).toBe(6236)});
 it('juz 30 starts 78:1, juz 2 ends 2:252',()=>{expect(L.juzRanges(30)[0]).toEqual([78,1,40]);expect(L.juzRanges(2)).toEqual([[2,142,252]])});
});
describe('surah filter',()=>{const S=JSON.parse(fs.readFileSync(new URL('../../public/offline/surahs.json',import.meta.url)));const f=q=>S.filter(s=>L.surahMatch(s,q)).map(s=>s.number);
 it('transliteration variants',()=>{expect(f('yasin')).toContain(36);expect(f('Ya-Sin')).toContain(36);expect(f('rahman')).toContain(55);expect(f('kahf')).toContain(18);expect(f('cow')).toEqual([2]);expect(f('36')).toEqual([36]);expect(f('')).toHaveLength(114)})});
describe('audio continuity',()=>{
 it('advances within surah, across surah boundary, stops at end',()=>{expect(L.nextPos(1,0)).toEqual({s:1,i:1});expect(L.nextPos(1,6)).toEqual({s:2,i:0});expect(L.nextPos(2,285)).toEqual({s:3,i:0});expect(L.nextPos(114,5)).toBeNull()});
 it('walks the whole Quran in 6235 steps',()=>{let p={s:1,i:0},n=0;while((p=L.nextPos(p.s,p.i)))n++;expect(n).toBe(6235)});
});
describe('qibla + hijri + prayer',()=>{
 beforeEach(()=>{PR.setCity('Karachi');PR.P.madhab='Hanafi';PR.P.hijriAdj=0});
 it('Karachi qibla ≈ 267.7°',()=>{expect(PR.qibla()).toBeCloseTo(267.7,1)});
 it('London qibla ≈ 119°',()=>{PR.setCity('London');expect(PR.qibla()).toBeCloseTo(118.99,0)});
 it('turn() direction',()=>{expect(L.turn(267.7,267.7)).toBeCloseTo(0);expect(L.turn(10,350)).toBeCloseTo(20);expect(L.turn(350,10)).toBeCloseTo(-20);expect(L.turn(180,0)).toBe(180)});
 it('Karachi times 2026-10-20 match aladhan (±2 min)',()=>{const pt=PR.times(new Date('2026-10-20T07:00:00Z'));const hm=d=>PR.fmt(d);
  // aladhan.com method=1 school=1 Karachi 20-10-2026
  const exp={fajr:'05:16',sunrise:'06:32',dhuhr:'12:17',asr:'16:24',maghrib:'18:01',isha:'19:17'};
  for(const k in exp){const [h,m]=hm(pt[k]).split(':').map(Number),[eh,em]=exp[k].split(':').map(Number);expect(Math.abs(h*60+m-eh*60-em)).toBeLessThanOrEqual(2)}});
 it('order of prayers is monotonic for all cities and methods',()=>{for(const c of PR.CITIES){PR.setCity(c[0]);for(const m of Object.keys(PR.METHODS)){PR.P.method=m;const pt=PR.times(new Date('2026-06-21T12:00:00Z'));const ts=PR.PRAYERS.map(k=>+pt[k]);expect(ts.every(x=>!isNaN(x))).toBe(true);for(let i=1;i<ts.length;i++)expect(ts[i]).toBeGreaterThan(ts[i-1])}}});
 it('times use city day not device day (Sydney)',()=>{PR.setCity('Sydney');const now=new Date('2026-10-20T15:00:00Z');/* = Oct 21 02:00 in Sydney */const pt=PR.times(now);expect(new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Sydney'}).format(pt.dhuhr)).toBe('2026-10-21')});
 it('next() returns future prayer',()=>{const now=new Date('2026-10-20T13:30:00Z');const n=PR.next(now);expect(n.key).toBe('isha');expect(+n.time).toBeGreaterThan(+now)});
 it('unknown method falls back',()=>{PR.P.method='Nope';expect(()=>PR.times()).not.toThrow()});
 it('hijri date + adjustment',()=>{const d=new Date('2026-10-20T07:00:00Z');const a=PR.hijri(d);expect(a).toMatch(/AH|14\d\d/);PR.P.hijriAdj=1;expect(PR.hijri(d)).not.toBe(a);expect(L.clampAdj(5)).toBe(2);expect(L.clampAdj(-9)).toBe(-2)});
 it('highlight escapes HTML',()=>{expect(L.highlight('a<b>Mercy & mercy','mercy')).toBe('a&lt;b&gt;<mark>Mercy</mark> &amp; <mark>mercy</mark>')});
});
