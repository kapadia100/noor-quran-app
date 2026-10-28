import {describe,it,expect} from 'vitest';
import {transLangs,langOfEdition,translators,defaultTranslator,keepTranslation,reciters,reciterLabel,langOptions,translatorOptions,reciterOptions} from '../../src/pickers.js';

const E=(identifier,language,englishName,name=englishName)=>({identifier,language,englishName,name});
const TR=[E('az.m','az','Mammadaliyev'),E('ur.jalandhry','ur','Fateh Muhammad Jalandhry'),E('fr.hamidullah','fr','Hamidullah'),E('en.yusufali','en','Yusuf Ali'),E('en.asad','en','Muhammad Asad'),E('ar.x','ar','Arabic Simple'),E('en.sahih','en','Saheeh International'),E('ur.ahmedali','ur','Ahmed Ali'),E('de.bubenheim','de','Bubenheim'),E('bn.bengali','bn','Muhiuddin Khan')];
const RC=[E('ar.husary','ar','Mahmoud Khalil Al-Husary','محمود خليل الحصري'),E('ar.alafasy','ar','Mishary Alafasy','مشاري العفاسي'),E('ar.abdulbasitmurattal','ar','Abdul Basit Abdul Samad','عبد الباسط عبد الصمد'),E('ur.khan','ur','Shamshad Ali Khan','Shamshad Ali Khan'),E('en.walk','en','Ibrahim Walk','Ibrahim Walk')];

describe('translation language list',()=>{
 it('English, Urdu, Arabic first, then the rest A–Z by English name',()=>{expect(transLangs(TR)).toEqual(['en','ur','ar','az','bn','fr','de'])});
 it('has each language once',()=>{const l=transLangs(TR);expect(new Set(l).size).toBe(l.length)});
 it('finds the language of the stored translation id, even if it is not in the list',()=>{expect(langOfEdition(TR,'ur.ahmedali')).toBe('ur');expect(langOfEdition([],'fr.hamidullah')).toBe('fr');expect(langOfEdition([],'')).toBe('en')});
});
describe('translators within a language',()=>{
 it('only that language, A–Z, with the well-known default first',()=>{expect(translators(TR,'en').map(e=>e.identifier)).toEqual(['en.sahih','en.asad','en.yusufali']);expect(translators(TR,'ur').map(e=>e.identifier)).toEqual(['ur.jalandhry','ur.ahmedali'])});
 it('a language without a preferred default is just A–Z',()=>{expect(translators([E('x.b','xx','B'),E('x.a','xx','A')],'xx').map(e=>e.identifier)).toEqual(['x.a','x.b'])});
 it('switching language picks the default translator; unknown language gives nothing',()=>{expect(defaultTranslator(TR,'en')).toBe('en.sahih');expect(defaultTranslator(TR,'ur')).toBe('ur.jalandhry');expect(defaultTranslator(TR,'zz')).toBeUndefined()});
 it('does not mutate the input list',()=>{const c=JSON.stringify(TR);translators(TR,'en');transLangs(TR);expect(JSON.stringify(TR)).toBe(c)});
 it('keeps the stored choice (migration: nothing is lost); only a vanished one falls back',()=>{expect(keepTranslation(TR,'ur.ahmedali')).toBe('ur.ahmedali');expect(keepTranslation(TR,'gone.x')).toBe('en.sahih')});
 it('options: selected one is marked and labels never start with a raw code',()=>{const h=translatorOptions(TR,'ur','ur.ahmedali');expect(h).toMatch(/value="ur.ahmedali" selected/);expect(h).not.toMatch(/value="ur.jalandhry" selected/);expect(h).not.toMatch(/>(UR|EN) ·/)});
 it('language options use proper names, in the UI language',()=>{const en=langOptions(['en','ur','ar','fr'],'ur','en');expect(en).toContain('>English<');expect(en).toContain('>Urdu (اردو)<');expect(en).toContain('Arabic (العربية)');expect(en).toMatch(/value="ur" selected/);expect(langOptions(['ur'],'ur','ur')).toContain('اردو')});
});
describe('reciters',()=>{
 it('are their own list: Arabic reciters only, the default first, then A–Z',()=>{expect(reciters(RC,'ar.alafasy').map(e=>e.identifier)).toEqual(['ar.alafasy','ar.abdulbasitmurattal','ar.husary'])});
 it('keeps a stored non-Arabic selection so nobody loses it',()=>{expect(reciters(RC,'en.walk').map(e=>e.identifier)).toContain('en.walk')});
 it('full English name plus the Arabic name; Urdu UI puts Arabic first; no duplicate when same',()=>{expect(reciterLabel(RC[1])).toBe('Mishary Alafasy — مشاري العفاسي');expect(reciterLabel(RC[1],'ur')).toBe('مشاري العفاسي — Mishary Alafasy');expect(reciterLabel(RC[4])).toBe('Ibrahim Walk')});
 it('options carry the English name for the media notification and mark the selection',()=>{const h=reciterOptions(RC,'ar.husary','en');expect(h).toMatch(/value="ar.husary" data-en="Mahmoud Khalil Al-Husary" selected/);expect(h.indexOf('ar.alafasy')).toBeLessThan(h.indexOf('ar.husary'))});
 it('escapes markup in names',()=>{expect(reciterOptions([E('ar.q','ar','A<b>"x')],'ar.q','en')).not.toContain('<b>')});
});
