// Guards flashcard / quiz content: exact Quran text, word position, audio and meaning all point at the same word.
import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import * as K from '../../src/dict-core.js';
const J=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));
const D=J('../../public/offline/x/dict.json'),REF=J('../fixtures/dict-word-ref.json'),N=J('../../public/offline/x/names.json');
const AR={},ayah=(s,a)=>{AR[s]??=J(`../../public/offline/s/ar/${s}.json`);let t=AR[s][a-1];if(a===1&&s!==1&&s!==9)t=t.split(' ').slice(4).join(' ');return t};
const sk=t=>t.normalize('NFC').replace(/\p{Mn}|\u0640|[\u06D6-\u06ED]/gu,'').replace(/\u0671|\u0623|\u0625|\u0622/g,'ا').replace(/\u0649/g,'ي').replace(/[\u0621\u0624\u0626\s]/g,'');
const words=t=>t.split(' ').filter(x=>x&&!K.isMark(x));
const S=D.words.flatMap(w=>w.s.map(s=>[w,s]));
describe('dictionary flashcards',()=>{
 it('has 500 words and 1000 samples',()=>{expect(D.words.length).toBe(500);expect(S.length).toBe(1000)});
 it('sample ayah text is exactly the reader Quran text (pause marks included)',()=>{const bad=S.filter(([,s])=>s[3]!==ayah(s[0],s[1])).map(([,s])=>`${s[0]}:${s[1]}`);expect(bad).toEqual([])});
 it('highlighted word position, audio file and reference word line up',()=>{const bad=[];
  for(const [w,s] of S){const k=`${s[0]}:${s[1]}:${s[2]}`,tok=words(s[3])[s[2]-1];
   const [rt,au]=REF[k]; // reference word + its recitation file (the file number counts pause marks, the word number does not)
   if(!tok||sk(tok)!==sk(rt)||s[6]!==au)bad.push(`${w.r} ${k} ${tok} ${rt} ${au} ${s[6]}`)}
  expect(bad).toEqual([])});
 it('every word has English and Urdu meaning and both sample translations',()=>{for(const [w,s] of S){expect(w.e&&w.u).toBeTruthy();expect(s[4]&&s[5]).toBeTruthy()}});
 it('quiz options always contain the answer once and never a second word sharing a meaning',()=>{
  for(const lang of ['en','ur'])for(const w of D.words)for(let i=0;i<3;i++){const o=K.options(D.words,w,lang);
   expect(o.filter(x=>x.r===w.r).length).toBe(1);const ts=new Set([...K.senses(w.e),...K.senses(w.u)]);
   for(const x of o)if(x.r!==w.r){expect(x.h).not.toBe(w.h);expect([...K.senses(x.e),...K.senses(x.u)].some(y=>ts.has(y))).toBe(false)}
   expect(new Set(o.map(x=>K.brief(lang==='ur'?x.u:x.e))).size).toBe(o.length)}});
 it('isMark only matches pause marks',()=>{expect(K.isMark('ۚ')).toBe(true);expect(K.isMark('مِن')).toBe(false)});
});
describe('99 Names cards and quiz',()=>{
 it('numbered 1..99 with Arabic, meaning and Urdu',()=>{expect(N.map(n=>n.n)).toEqual(Array.from({length:99},(_,i)=>i+1));for(const n of N)expect(n.ar&&n.en&&n.ur&&n.tr).toBeTruthy()});
 it('meanings and transliterations are unique, so a quiz never has two right answers',()=>{for(const k of ['en','ur','tr','ar'])expect(new Set(N.map(n=>n[k].trim().toLowerCase())).size).toBe(99)});
});
