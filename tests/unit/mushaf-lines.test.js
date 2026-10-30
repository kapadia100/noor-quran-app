import{describe,it,expect}from'vitest';
import{buildLines}from'../../src/mushaf.js';
const W=(s,a,pos,line,t,end=false,page=604)=>({position:pos,line_number:line,page_number:page,char_type_name:end?'end':'word',text_uthmani:t,text_indopak:t});
describe('buildLines',()=>{
 it('infers surah name + bismillah from empty lines before ayah 1',()=>{const vs=[{verse_key:'2:1',words:[W(2,1,1,3,'الٓمٓ'),W(2,1,2,3,'',true)]}];
  const r=buildLines(vs,604,'m15');expect(r.map(x=>x.k)).toEqual(['name','bism','ayah']);expect(r[0].s).toBe(2)});
 it('no bismillah for surah 9',()=>{const vs=[{verse_key:'9:1',words:[W(9,1,1,3,'بَرَآءَةٌ')]}];expect(buildLines(vs,604,'m15').map(x=>x.k)).toEqual(['name','ayah'])});
 it('skips words from other pages and keeps exact text',()=>{const vs=[{verse_key:'1:1',words:[W(1,1,1,1,'بِسْمِ'),W(1,1,2,1,'x',false,603)]}];const r=buildLines(vs,604,'m15');expect(r.at(-1).ws.map(w=>w.t)).toEqual(['بِسْمِ'])});
 it('strips private-use font glyphs only',()=>{const vs=[{verse_key:'3:41',words:[W(3,41,1,1,'وَالۡاِبۡكَارِ\uE022\u200F')]}];expect(buildLines(vs,604,'ip16')[0].ws[0].t).toBe('وَالۡاِبۡكَارِ')});
});
it('adds next surah header from trailing empty lines',()=>{const vs=[{verse_key:'1:7',words:[{position:1,line_number:7,page_number:1,char_type_name:'word',text_uthmani:'ٱلضَّآلِّينَ'}]}];expect(buildLines(vs,1,'m15').map(x=>x.k)).toEqual(['ayah','name','bism'])});
