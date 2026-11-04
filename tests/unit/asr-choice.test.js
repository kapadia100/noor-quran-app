const m={};globalThis.localStorage??={getItem:k=>m[k]??null,setItem:(k,v)=>{m[k]=String(v)},removeItem:k=>{delete m[k]}};
import {describe,it,expect,beforeEach} from 'vitest';
import * as PR from '../../src/prayer.js';
const P=PR.P;
beforeEach(()=>{for(const k of ['madhabUser','methodUser','autoV2'])delete P[k];Object.assign(P,{method:'Karachi',madhab:'Hanafi',tz:'Asia/Karachi'})});
describe('Asr school choice is never overridden',()=>{
 it('migration: stored Hanafi stays Hanafi after moving to Dubai',()=>{PR.migrate({madhab:'Hanafi',method:'Karachi'});Object.assign(P,{tz:'Asia/Dubai'});PR.autoMethod();expect(P.madhab).toBe('Hanafi');expect(P.method).toBe('Karachi')});
 it('migration: stored Shafi stays Shafi in Pakistan',()=>{P.madhab='Shafi';PR.migrate({madhab:'Shafi'});PR.setCity('Lahore');expect(P.madhab).toBe('Shafi');expect(P.method).toBe('Karachi')});
 it('no stored value: gets the country default once, then it is locked',()=>{PR.migrate({});P.tz='Asia/Dubai';PR.autoMethod();expect(P.madhab).toBe('Shafi');expect(P.method).toBe('Dubai');PR.setCity('Karachi');expect(P.madhab).toBe('Shafi')});
 it('choosing cities never changes a set Asr school',()=>{PR.migrate({});P.madhab='Hanafi';P.madhabUser=true;for(const c of PR.CITIES.map(c=>c[0]))PR.setCity(c);expect(P.madhab).toBe('Hanafi')});
 it('Hanafi is applied worldwide (later Asr than Shafi in Dubai)',()=>{Object.assign(P,{lat:25.2048,lng:55.2708,tz:'Asia/Dubai',method:'Dubai'});const d=new Date('2026-11-04T09:00:00Z');P.madhab='Hanafi';const h=PR.times(d).asr;P.madhab='Shafi';const s=PR.times(d).asr;expect(h-s).toBeGreaterThan(30*60e3)});
 it('migrate runs only once',()=>{PR.migrate({});PR.migrate({madhab:'Hanafi'});expect(P.madhabUser).toBeUndefined()});
});
