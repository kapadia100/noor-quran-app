import {describe,it,expect,beforeEach,vi} from 'vitest';

const mem=vi.hoisted(()=>({native:true,perm:{display:'granted'},notifications:[],cancelled:[],scheduled:[]}));
vi.mock('@capacitor/core',()=>({Capacitor:{isNativePlatform:()=>mem.native}}));
vi.mock('@capacitor/local-notifications',()=>({LocalNotifications:{
 requestPermissions:async()=>mem.perm,
 createChannel:async()=>{},
 getPending:async()=>({notifications:mem.notifications.map(n=>({...n}))}),
 cancel:async({notifications})=>{mem.cancelled.push(...notifications);const ids=new Set(notifications.map(n=>n.id));mem.notifications=mem.notifications.filter(n=>!ids.has(n.id))},
 schedule:async({notifications})=>{mem.scheduled.push(...notifications);mem.notifications.push(...notifications.map(n=>({id:n.id,title:n.title,body:n.body})))},
}}));

import {schedule,setReminders,cancelAll,plan,P,alertPlace,fitPending,partitionPending,isPrayerNotifId,isCoordLabel,IOS_PENDING_LIMIT,reminderRange} from '../../src/prayer.js';

const resetP=()=>Object.assign(P,{city:'Karachi',lat:24.8607,lng:67.0011,tz:'Asia/Karachi',src:'city',method:'Karachi',madhab:'Hanafi',days:7,endAlert:false,endMin:15,adhan:true,alerts:{fajr:true,dhuhr:true,asr:true,maghrib:true,isha:true,sunrise:false},near:null,place:'',placeAt:''});

describe('native notification scheduling',()=>{
 beforeEach(()=>{mem.native=true;mem.perm={display:'granted'};mem.notifications=[];mem.cancelled=[];mem.scheduled=[];resetP()});
 it('refreshing prayer alerts cancels only prayer ids and keeps khatam, ayah, events and Ramadan',async()=>{
  mem.notifications=[{id:1000,body:'old fajr'},{id:1003},{id:5000,body:'khatam'},{id:5201,body:'ayah'},{id:5404,body:'event'},{id:5602,body:'ramadan'}];
  const r=await schedule();
  expect(r.ok).toBe(true);expect(r.mode).toBe('native');
  expect(mem.cancelled.every(n=>isPrayerNotifId(n.id))).toBe(true);
  const ids=mem.notifications.map(n=>n.id);
  expect(ids).toEqual(expect.arrayContaining([5000,5201,5404,5602]));
  expect(ids.filter(isPrayerNotifId).length).toBe(r.count);
  expect(ids.length).toBeLessThanOrEqual(IOS_PENDING_LIMIT);
  expect(mem.scheduled.every(n=>isPrayerNotifId(n.id)&&!/GPS|\d{1,3}\.\d{4}/.test(n.body))).toBe(true);
  expect(mem.scheduled[0].body).toContain('Karachi')});
 it('does not schedule more than iOS will keep when other reminders are already pending',async()=>{
  mem.notifications=Array.from({length:50},(_,i)=>({id:5000+i}));
  const r=await schedule();
  const prayers=mem.notifications.filter(n=>isPrayerNotifId(n.id));
  const kept=mem.notifications.filter(n=>n.id>=5000);
  expect(kept).toHaveLength(50);
  expect(prayers).toHaveLength(IOS_PENDING_LIMIT-50);
  expect(r.count).toBe(IOS_PENDING_LIMIT-50);
  expect(mem.notifications).toHaveLength(IOS_PENDING_LIMIT)});
 it('a reminder update leaves prayer alerts in place and still respects the cap',async()=>{
  await schedule();
  const prayersBefore=mem.notifications.filter(n=>isPrayerNotifId(n.id)).length;
  const soon=Array.from({length:20},(_,i)=>({at:new Date(Date.now()+864e5*(i+1)),title:'Event',body:'eid'}));
  const r=await setReminders('events',soon);
  const events=mem.notifications.filter(n=>{const g=reminderRange('events');return n.id>=g.base&&n.id<g.end});
  expect(mem.notifications.filter(n=>isPrayerNotifId(n.id))).toHaveLength(prayersBefore);
  expect(events.length).toBe(r.count);
  expect(mem.notifications.length).toBeLessThanOrEqual(IOS_PENDING_LIMIT);
  expect(events.length).toBe(Math.min(20,IOS_PENDING_LIMIT-prayersBefore))});
 it('concurrent prayer and khatam schedules cannot exceed 64 or wipe each other',async()=>{
  const at=new Date(Date.now()+36e5);
  const [a,b]=await Promise.all([schedule(),setReminders('khatam',[{at,title:'Khatam',body:'pages'}])]);
  expect(a.ok&&b.ok).toBe(true);
  expect(mem.notifications.length).toBeLessThanOrEqual(IOS_PENDING_LIMIT);
  expect(mem.notifications.some(n=>isPrayerNotifId(n.id))).toBe(true);
  expect(mem.notifications.some(n=>n.id>=5000&&n.id<5200)).toBe(true)});
 it('turning prayer alerts off does not cancel other reminders',async()=>{
  mem.notifications=[{id:1000},{id:1008},{id:5200},{id:5400}];
  await cancelAll();
  expect(mem.notifications.map(n=>n.id).sort((x,y)=>x-y)).toEqual([5200,5400])});
 it('uses the cached city name when the stored label is still a GPS string',async()=>{
  Object.assign(P,{src:'gps',city:'GPS 24.8607, 67.0011',lat:24.8607,lng:67.0011,near:{at:'24.8607,67.0011',en:'Karachi',ur:'کراچی',km:1}});
  const r=await schedule();
  expect(r.count).toBeGreaterThan(0);
  for(const n of mem.scheduled){expect(n.body).toContain('Karachi');expect(n.body).not.toMatch(/GPS|24\.8607|67\.0011/)}
  const web=plan(new Date('2026-11-03T00:30:00+05:00'));
  expect(web[0].body).toContain('Karachi');expect(web[0].body).not.toMatch(/GPS|24\.8607/)});
 it('omits the place rather than showing coordinates before a city is known',async()=>{
  Object.assign(P,{src:'gps',city:'GPS 1.0000, 2.0000',lat:1,lng:2,near:null,place:'1.0000, 2.0000',placeAt:'1,2'});
  await schedule();
  expect(mem.scheduled.length).toBeGreaterThan(0);
  for(const n of mem.scheduled)expect(n.body).not.toMatch(/GPS|1\.0000|2\.0000/)});
});

describe('alert place and the 64 cap (pure)',()=>{
 it('city names, near labels, and coordinate strings',()=>{
  expect(isCoordLabel('GPS 24.8607, 67.0011')).toBe(true);
  expect(isCoordLabel('24.8607, 67.0011')).toBe(true);
  expect(isCoordLabel('Karachi')).toBe(false);
  expect(alertPlace({src:'city',city:'Hyderabad (PK)'})).toBe('Hyderabad (PK)');
  expect(alertPlace({src:'gps',lat:25.2,lng:55.27,city:'GPS 25.2000, 55.2700',near:{at:'25.2,55.27',en:'Dubai',ur:'دبئی',km:3}})).toBe('Dubai');
  expect(alertPlace({src:'gps',lat:25.2,lng:55.27,city:'GPS 25.2000, 55.2700',near:{at:'25.2,55.27',en:'Dubai',ur:'دبئی',km:80}},true)).toBe('دبئی کے قریب');
  expect(alertPlace({src:'gps',lat:1,lng:2,city:'GPS 1.0000, 2.0000'})).toBe('');
  expect(alertPlace({src:'gps',lat:1,lng:2,place:'1.0000, 2.0000',placeAt:'1,2'})).toBe('')});
 it('fit and partition never plan more than 64 together',()=>{
  const pending=[{id:1000},{id:1001},{id:5000},{id:5400},{id:5600}];
  const {mine,keep}=partitionPending(pending,isPrayerNotifId);
  expect(mine.map(n=>n.id)).toEqual([1000,1001]);
  expect(keep.map(n=>n.id)).toEqual([5000,5400,5600]);
  expect(fitPending(Array.from({length:80},(_,i)=>i),keep.length)).toHaveLength(IOS_PENDING_LIMIT-3);
  expect(fitPending([1,2],64)).toEqual([]);
  expect(reminderRange('aotd')).toEqual({base:5200,end:5400});
  expect(reminderRange('nope')).toBeNull()});
});
