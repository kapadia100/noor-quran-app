import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import {reciters,reciterOptions,canonReciter,uniqReciters} from '../../src/pickers.js';
import {langName} from '../../src/hadith-lang.js';
const ED=JSON.parse(fs.readFileSync(new URL('../fixtures/editions-2026-11.json',import.meta.url),'utf8'));
describe('reciter list from the real API (which lists ar.husary and ar.husary-2 etc.)',()=>{
 it('has each reciter once, by stable id, base id kept',()=>{const l=reciters(ED.audio,'ar.alafasy'),ids=l.map(e=>e.identifier),names=l.map(e=>e.englishName);
  expect(new Set(ids).size).toBe(ids.length);expect(new Set(names).size).toBe(names.length);expect(ids.some(i=>/-\d+$/.test(i))).toBe(false);expect(ids).toContain('ar.husary')});
 it('rendering twice gives identical, unique options (idempotent)',()=>{const a=reciterOptions(ED.audio,'ar.husary','en'),b=reciterOptions(ED.audio,'ar.husary','en');expect(a).toBe(b);
  const v=[...a.matchAll(/value="([^"]+)"/g)].map(m=>m[1]);expect(new Set(v).size).toBe(v.length);expect((a.match(/selected/g)||[]).length).toBe(1)});
 it('a saved mirror id migrates to its base; unknown or base ids are kept',()=>{expect(canonReciter(ED.audio,'ar.husary-2')).toBe('ar.husary');expect(canonReciter(ED.audio,'ar.alafasy')).toBe('ar.alafasy');
  expect(canonReciter(ED.audio,'ru.kuliev-audio-2')).toBe('ru.kuliev-audio-2');expect(canonReciter([{identifier:'ar.x-2'}],'ar.x-2')).toBe('ar.x-2')});
 it('a selected mirror id is never dropped when its base is missing',()=>{expect(uniqReciters([{identifier:'ar.x-2',language:'ar',englishName:'X'}],'ar.x-2').map(e=>e.identifier)).toEqual(['ar.x-2'])});
 it('every translation language has a real name in EN and UR',()=>{for(const c of new Set(ED.translation.map(e=>e.language))){expect(langName(c,'en'),c).not.toBe('Other language');expect(langName(c,'ur'),c).not.toBe('دوسری زبان')}});
});
