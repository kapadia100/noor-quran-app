import {describe,it,expect,beforeEach} from 'vitest';
import {plan,P,times,PRAYERS} from '../../src/prayer.js';
const now=new Date('2026-11-03T00:30:00+05:00');
describe('web notification plan (t245u)',()=>{
 beforeEach(()=>{Object.assign(P,{city:'Karachi',lat:24.8607,lng:67.0011,tz:'Asia/Karachi',src:'city',method:'Karachi',madhab:'Hanafi',days:7,endAlert:false,endMin:15,alerts:{fajr:true,dhuhr:true,asr:true,maghrib:true,isha:true,sunrise:false}})});
 it('one start notification per enabled prayer per day, at the computed time, sorted, unique ids',()=>{
  const p=plan(now);expect(p.length).toBe(35);const ids=new Set(p.map(x=>x.id));expect(ids.size).toBe(35);
  for(let i=1;i<p.length;i++)expect(+p[i].at).toBeGreaterThanOrEqual(+p[i-1].at);
  const t=times(now);expect(+p[0].at).toBe(+t.fajr);expect(p[0].title).toContain('Fajr');expect(p[0].url).toBe('./#/prayer');
  expect(p.every(x=>x.at>now)).toBe(true)});
 it('respects per-prayer toggles and sunrise',()=>{P.alerts={fajr:false,dhuhr:false,asr:true,maghrib:false,isha:false,sunrise:true};const p=plan(now);
  expect(p.length).toBe(14);expect(p.filter(x=>/^p-sunrise/.test(x.id)).length).toBe(7);expect(p.find(x=>/^p-sunrise/.test(x.id)).title).toMatch(/Fajr time has ended/)});
 it('ends-soon reminders: 15 min before the next time, not for Isha',()=>{P.endAlert=true;P.alerts={fajr:true,dhuhr:true,asr:true,maghrib:true,isha:true,sunrise:false};const p=plan(now),t=times(now);
  const e=p.filter(x=>x.id.startsWith('e-'));expect(e.length).toBe(28);expect(e.some(x=>x.id.startsWith('e-isha'))).toBe(false);
  const f=e.find(x=>x.id.startsWith('e-fajr'));expect(+f.at).toBe(+t.sunrise-15*6e4);expect(f.grace).toBe(15*6e4)});
 it('Urdu UI gives Urdu, RTL notifications',()=>{const m={settings:JSON.stringify({ui:'ur'})};globalThis.localStorage={getItem:k=>m[k]??null,setItem:(k,v)=>{m[k]=v},removeItem:k=>{delete m[k]}};const p=plan(now);expect(p[0].lang).toBe('ur');expect(p[0].dir).toBe('rtl');expect(p[0].title).toContain('فجر');delete globalThis.localStorage});
 it('never more than 7 days and nothing in the past',()=>{const p=plan(now);expect(Math.max(...p.map(x=>+x.at))-+now).toBeLessThan(7*864e5);expect(PRAYERS.length).toBe(6)});
});
