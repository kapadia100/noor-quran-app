import {describe,it,expect} from 'vitest';
import {bearing,distKm,declination,diff} from '../../src/qibla.js';
describe('qibla',()=>{
 it('great-circle bearing from true north matches reference to 0.1°',()=>{
  expect(bearing(24.8722,67.1623)).toBeCloseTo(267.80,1);   // Karachi (GPS)
  expect(bearing(24.8607,67.0011)).toBeCloseTo(267.74,1);   // Karachi city
  expect(bearing(51.5074,-0.1278)).toBeCloseTo(118.99,1);   // London
  expect(bearing(40.7128,-74.006)).toBeCloseTo(58.48,1);    // New York
 });
 it('distance to Makkah',()=>{expect(Math.round(distKm(24.8722,67.1623))).toBe(2816)});
 it('declination grid near WMM2025',()=>{expect(Math.abs(declination(24.8722,67.1623)-1.32)).toBeLessThan(0.3)});
 it('signed turn',()=>{expect(diff(10,350)).toBe(20);expect(diff(350,10)).toBe(-20);expect(diff(267.8,267.8)).toBe(0)});
});

import {markerAngle,trueHeading,diff as qdiff} from '../../src/qibla.js';
describe('v3.7.12 marker vs turn text',()=>{
 it('marker angle on screen equals qibla - heading, and turn text matches it',()=>{
  const q=267.8;for(const h of [0,45,90,180,248.8,267.8,300,359]){const m=markerAngle(q,h),d=qdiff(q,h);
   expect(m).toBeCloseTo(((q-h)%360+360)%360,6);expect(((d%360)+360)%360).toBeCloseTo(m,6);expect(Math.abs(d)).toBeLessThanOrEqual(180)}});
 it('declination applied once; screen orientation added',()=>{expect(trueHeading(266.4,1.4,0)).toBeCloseTo(267.8,6);expect(trueHeading(350,1.4,90)).toBeCloseTo(81.4,6);expect(trueHeading(359,1.4,0)).toBeCloseTo(0.4,6)});
});
