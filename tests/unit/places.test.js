import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import {nearest} from '../../src/places.js';
const DB=JSON.parse(fs.readFileSync('public/offline/cities.json','utf8'));
describe('offline nearest city',()=>{
 it('Dubai Marina → Dubai',()=>{const c=nearest(25.1127,55.1899,DB);expect(c.en).toMatch(/Dubai/);expect(c.ur).toBeTruthy()});
 it('Karachi → Karachi with Urdu name',()=>{const c=nearest(24.86,67.0,DB);expect(c.en).toBe('Karachi');expect(c.ur).toBe('کراچی')});
 it('London, dateline wrap, empty',()=>{expect(nearest(51.5,-0.12,DB).en).toMatch(/London|Westminster/);expect(nearest(-17.7,178.0,DB)).toBeTruthy();expect(nearest(1,1,[])).toBeNull()});
});
