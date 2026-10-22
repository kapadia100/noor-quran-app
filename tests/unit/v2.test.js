import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import * as L from '../../src/lib.js';
const J=f=>JSON.parse(fs.readFileSync(new URL('../../public/offline/'+f,import.meta.url)));
const PAGES=J('x/pages.json');
describe('mushaf pages',()=>{
 it('604 pages cover all 6236 ayahs exactly once, in order',()=>{expect(PAGES.length).toBe(604);let n=0,prev=0;for(let p=1;p<=604;p++){const a=L.pageAyahs(PAGES,p);expect(a.length).toBeGreaterThan(0);for(const [s,x] of a){const k=s*1000+x;expect(k).toBeGreaterThan(prev);prev=k;n++}}expect(n).toBe(6236)});
 it('known pages',()=>{expect(L.pageOf(PAGES,1,1)).toBe(1);expect(L.pageOf(PAGES,2,1)).toBe(2);expect(L.pageOf(PAGES,2,255)).toBe(42);expect(L.pageOf(PAGES,18,1)).toBe(293);expect(L.pageOf(PAGES,36,1)).toBe(440);expect(L.pageOf(PAGES,67,1)).toBe(562);expect(L.pageOf(PAGES,114,6)).toBe(604);expect(L.pageAyahs(PAGES,1)).toHaveLength(7)});
});
describe('hijri calendar + events',()=>{
 it('hijriParts + adjustment',()=>{const d=new Date('2026-10-20T12:00:00');const h=L.hijriParts(d);expect(h.y).toBe(1448);const h2=L.hijriParts(d,1);expect(h2.d===h.d+1||h2.d===1).toBe(true)});
 it('upcoming events in order, Ramadan + both Eids within a year',()=>{const ev=L.upcomingEvents(new Date('2026-10-20T12:00:00'),400);const n=ev.map(e=>e.en);expect(n).toContain('Ramadan begins');expect(n).toContain('Eid al-Fitr');expect(n).toContain('Eid al-Adha');for(let i=1;i<ev.length;i++)expect(ev[i].inDays).toBeGreaterThan(ev[i-1].inDays);
  const r=ev.find(e=>e.en==='Ramadan begins'),f=ev.find(e=>e.en==='Eid al-Fitr');const len=(f.date-r.date)/864e5;expect(len===29||len===30).toBe(true)});
 it('nextRamadan has 29-30 consecutive days',()=>{const R=L.nextRamadan(new Date('2026-10-20T12:00:00'));expect([29,30]).toContain(R.days.length);R.days.forEach((d,i)=>expect(d.hd).toBe(i+1))});
});
describe('zakat',()=>{
 it('silver nisab default, 2.5%',()=>{const r=L.zakat({cash:200000,silverPrice:250});expect(r.nisab).toBeCloseTo(153090);expect(r.due).toBe(5000)});
 it('below nisab => 0; debts deducted; gold basis',()=>{expect(L.zakat({cash:100000,silverPrice:250}).due).toBe(0);expect(L.zakat({cash:300000,debts:100000,silverPrice:250}).due).toBe(5000);const g=L.zakat({cash:3e6,goldPrice:30000,basis:'gold'});expect(g.nisab).toBeCloseTo(2624400);expect(g.due).toBe(75000)});
 it('gold/silver holdings valued; negatives ignored',()=>{expect(L.zakat({gold_g:100,goldPrice:30000,silverPrice:250,cash:-5}).due).toBe(75000);expect(L.zakat({}).due).toBe(0)});
});
describe('khatam / streak / ayah of day / hifz',()=>{
 it('khatam plan',()=>{const p=L.khatamPlan({current:0,end:'2026-11-18',today:new Date('2026-10-20T10:00')});expect(p.daysLeft).toBe(30);expect(p.perDay).toBe(21);expect(L.khatamPlan({current:604,end:'2026-11-18'}).done).toBe(true);expect(L.khatamPlan({current:600,end:'2020-01-01'}).perDay).toBe(4)});
 it('streak',()=>{const t=new Date('2026-10-20T10:00');expect(L.streak(['2026-10-18','2026-10-19','2026-10-20'],t)).toBe(3);expect(L.streak(['2026-10-18','2026-10-19'],t)).toBe(2);expect(L.streak(['2026-10-17'],t)).toBe(0);expect(L.streak([],t)).toBe(0)});
 it('ayah of the day deterministic + valid',()=>{const a=L.ayahOfDay(new Date('2026-10-20T08:00')),b=L.ayahOfDay(new Date('2026-10-20T22:00'));expect(a).toEqual(b);const seen=new Set;for(let i=0;i<60;i++){const x=L.ayahOfDay(new Date(2026,0,1+i));expect(x.a).toBeLessThanOrEqual(L.AYAH_COUNTS[x.s-1]);seen.add(x.s+':'+x.a)}expect(seen.size).toBeGreaterThan(55)});
 it('hifz engine: each × range',()=>{const cfg={from:1,to:2,each:2,range:2};let p={a:1,c:0,r:0};const seq=[1];while((p=L.hifzNext(cfg,p)))seq.push(p.a);expect(seq).toEqual([1,1,2,2,1,1,2,2])});
 it('distance + wrap',()=>{expect(L.distM(24.86,67.0,24.87,67.0)).toBeCloseTo(1112,-1);expect(L.wrapText('a b c d',3,s=>s.length)).toEqual(['a b','c d'])});
});
describe('bundled v2 data',()=>{
 it('duas, hisn, names complete',()=>{const d=J('x/duas.json');expect(d['morning-dhikr'].length).toBe(19);expect(d['evening-dhikr'].length).toBe(19);for(const v of Object.values(d))for(const x of v){expect(x.ar).toBeTruthy();expect(x.en).toBeTruthy();expect(x.n).toBeGreaterThan(0)}
  const h=J('x/hisn.json');expect(h.length).toBe(132);expect(h.reduce((a,c)=>a+c.items.length,0)).toBe(267);expect(h.every(c=>c.au.startsWith('https://')));
  const n=J('x/names.json');expect(n.length).toBe(99);expect(n.every(x=>x.ar&&x.en&&x.ur&&x.tr)).toBe(true)});
});
