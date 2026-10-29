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
