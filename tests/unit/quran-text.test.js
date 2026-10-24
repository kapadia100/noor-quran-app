import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import {RULES} from '../../src/tj-rules.js';
import {AYAH_COUNTS,FIX} from '../../src/lib.js';
const rd=p=>JSON.parse(fs.readFileSync(new URL('../../public/offline/'+p,import.meta.url),'utf8'));
const AR=[],TJ=[];for(let n=1;n<=114;n++){AR.push(rd(`s/ar/${n}.json`));TJ.push(rd(`tj/${n}.json`))}
const all=AR.flat();
describe('Quran text integrity (v3.5.1 recheck vs Tanzil Uthmani + King Fahd data)',()=>{
 it('114 surahs, 6236 ayat, per-surah counts',()=>{expect(AR.length).toBe(114);expect(all.length).toBe(6236);AR.forEach((a,i)=>expect(a.length).toBe(AYAH_COUNTS[i]))});
 it('no stray BOM / controls / latin / digits inside ayah text',()=>{for(const t of all){expect(t.length).toBeGreaterThan(3);expect(/[\uFEFF\u200B-\u200F\u202A-\u202E0-9A-Za-z]/.test(t)).toBe(false)}});
 it('small-yeh: 38 words use U+06E7 (corrected from U+06E6), 957 keep U+06E6, as in both references',()=>{const c=re=>all.reduce((n,t)=>n+(t.match(re)||[]).length,0);expect(c(/\u06E7/g)).toBe(38);expect(c(/\u06E6/g)).toBe(957)});
 it('tanween marks present at 2:181, 12:39, 12:41, 13:37',()=>{const m=(n,a,re)=>expect(re.test(AR[n-1][a-1])).toBe(true);m(2,181,/\u064C\u06ED$/);m(12,39,/\u0628\u064C\u06ED /);m(12,41,/\u0631\u064B\u06ED\u0627/);m(13,37,/\u064B\u06ED\u0627/);m(13,37,/\u0649\u0651\u064D\u06E2 /);m(13,37,/\u0642\u064D\u06E2$/)});
 it('FIX overrides equal the bundled text (no divergence)',()=>{for(const k in FIX){const [s,a]=k.split(':').map(Number);expect(FIX[k]).toBe(AR[s-1][a-1])}});
 it('Fatiha: 7 ayat, 1:1 starts at the ba with no BOM, no tatweel before the dagger alef',()=>{expect(AR[0].length).toBe(7);expect(AR[0][0].codePointAt(0)).toBe(0x628);expect(AR[0].join('').includes('\u0640')).toBe(false)});
 it('tajweed data: in range, sorted, valid rule ids; letter-specific rules sit on the right letters',()=>{
  for(let n=0;n<114;n++)TJ[n].length===AR[n].length||expect(TJ[n].length).toBe(AR[n].length);
  const BASE=/[\u0621-\u064A\u0671]/;
  for(let n=0;n<114;n++)for(let i=0;i<AR[n].length;i++){const t=AR[n][i],raw=i===0&&n!==0&&n!==8?null:t,f=TJ[n][i];expect(f.length%3).toBe(0);
   for(let k=0;k<f.length;k+=3){const [r,s,e]=[f[k],f[k+1],f[k+2]];expect(r).toBeGreaterThanOrEqual(0);expect(r).toBeLessThan(RULES.length);expect(s).toBeGreaterThanOrEqual(0);expect(e).toBeGreaterThan(s);
    if(i>0||n===0||n===8){expect(e).toBeLessThanOrEqual(t.length);const seg=t.slice(s,e);if(RULES[r]==='hamzat_wasl')expect(seg).toContain('\u0671');if(RULES[r]==='qalqalah')expect('قطبجد'.includes(seg[0])).toBe(true)}}}});
 it('1:1 tajweed offsets align (first ٱ is a hamzat wasl)',()=>{const f=TJ[0][0];const hw=RULES.indexOf('hamzat_wasl');const segs=[];for(let k=0;k<f.length;k+=3)if(f[k]===hw)segs.push(AR[0][0].slice(f[k+1],f[k+2]));expect(segs.length).toBeGreaterThan(0);segs.forEach(x=>expect(x).toBe('\u0671'))});
 it('qalqalah gaps closed: 12:39, 12:41 السجن and 97:1 القدر',()=>{const q=RULES.indexOf('qalqalah');const has=(n,a,ch)=>{const f=TJ[n-1][a-1],t=AR[n-1][a-1];for(let k=0;k<f.length;k+=3)if(f[k]===q&&t[f[k+1]]===ch)return true;return false};expect(has(12,39,'ج')).toBe(true);expect(has(12,41,'ج')).toBe(true);expect(has(97,1,'د')).toBe(true)});
});
