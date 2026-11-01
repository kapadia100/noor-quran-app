import {describe,it,expect,vi,beforeEach} from 'vitest';
import {readFileSync,readdirSync} from 'node:fs';
import * as G from '../../src/tts-guard.js';
import * as H from '../../src/hadith-tts.js';

describe('tts-guard: device voice never speaks Arabic script',()=>{
 it('blocks Arabic-script languages, allows others',()=>{
  for(const l of ['ar','ar-SA','ara','ur','ur-PK','urd','fa-IR','ps','sd','ug'])expect(G.ttsLangOk(l)).toBe(false);
  for(const l of ['en','en-US','eng','fr','tr-TR','id','bn','ru','ta'])expect(G.ttsLangOk(l)).toBe(true);
  expect(G.ttsLangOk('')).toBe(false);
 });
 it('strips Arabic script from English text',()=>{
  const t='The Prophet ﷺ said (إنما الأعمال بالنيات): deeds are by intentions. بِسْمِ ٱللَّهِ';
  const s=G.stripArabic(t);expect(G.hasArabic(s)).toBe(false);expect(s).toContain('deeds are by intentions');
  expect(G.hasArabic(t)).toBe(true);expect(G.hasArabic('plain')).toBe(false);
 });
 it('utteranceOk rejects Arabic text, Arabic/Urdu lang or voice',()=>{
  expect(G.utteranceOk({text:'hello',lang:'en-US',voice:{lang:'en-US'}})).toBe(true);
  expect(G.utteranceOk({text:'قال',lang:'en-US'})).toBe(false);
  expect(G.utteranceOk({text:'hello',lang:'ar-SA'})).toBe(false);
  expect(G.utteranceOk({text:'hello',lang:'en-US',voice:{lang:'ur-PK'}})).toBe(false);
  expect(G.utteranceOk({text:'  '})).toBe(false);
 });
 it('install() wraps speechSynthesis.speak globally',()=>{
  const spoke=[];const g={speechSynthesis:{speak:u=>spoke.push(u.text)}};G.install(g);
  g.speechSynthesis.speak({text:'إنما الأعمال',lang:'ar'});g.speechSynthesis.speak({text:'Hello',lang:'ur-PK'});
  const err=vi.fn();g.speechSynthesis.speak({text:'اردو',lang:'en',onerror:err});
  g.speechSynthesis.speak({text:'Hello',lang:'en-GB'});
  expect(spoke).toEqual(['Hello']);expect(err).toHaveBeenCalled();expect(g.__ttsBlocked).toBe(3);
 });
});

describe('hadith-tts: Arabic never to TTS, Urdu recorded only',()=>{
 let spoke;
 beforeEach(()=>{spoke=[];H.stop();
  globalThis.SpeechSynthesisUtterance=class{constructor(t){this.text=t}};
  globalThis.speechSynthesis={speak:u=>spoke.push({text:u.text,lang:u.lang}),cancel(){},getVoices:()=>[]};
 });
 const V={ar:{lang:'ar-SA',name:'Majed',localService:true},ur:{lang:'ur-PK',name:'Urdu',localService:true},en:{lang:'en-US',name:'Samantha',localService:true}};
 it('pickVoice never returns an Arabic or Urdu voice',()=>{
  expect(H.pickVoice(Object.values(V),'ara')).toBe(null);expect(H.pickVoice(Object.values(V),'urd')).toBe(null);
  expect(H.pickVoice(Object.values(V),'eng')?.name).toBe('Samantha');
 });
 it('play() refuses Arabic and Urdu without a recording even with a voice passed in',()=>{
  expect(H.play({id:'a',text:'إنما الأعمال بالنيات',lang:'ara',voice:V.ar})).toBe(false);
  expect(H.play({id:'u',text:'اعمال کا دارومدار نیتوں پر ہے',lang:'urd',voice:V.ur})).toBe(false);
  expect(H.play({id:'x',text:'إنما الأعمال',lang:'eng',voice:V.ar})).toBe(false);
  expect(spoke).toEqual([]);
 });
 it('English is spoken with Arabic script stripped; pure-Arabic chunks are skipped',()=>{
  expect(H.play({id:'e',text:'The Prophet said: إنما الأعمال بالنيات. Deeds are by intentions.',lang:'eng',voice:V.en})).toBe(true);
  expect(spoke.length).toBe(1);expect(G.hasArabic(spoke[0].text)).toBe(false);expect(spoke[0].text).toContain('The Prophet said');
 });
});

describe('only hadith-tts.js touches speechSynthesis; main.js installs the guard first',()=>{
 it('source scan',()=>{
  const dir=new URL('../../src/',import.meta.url);const bad=[];
  for(const f of readdirSync(dir,{recursive:true})){if(!/\.(js|mjs|ts)$/.test(f))continue;const s=readFileSync(new URL(f,dir),'utf8');
   if(/speechSynthesis|SpeechSynthesisUtterance/.test(s)&&!['hadith-tts.js','tts-guard.js'].includes(String(f)))bad.push(f)}
  expect(bad).toEqual([]);
  expect(readFileSync(new URL('main.js',dir),'utf8').trimStart().startsWith("import './tts-guard.js'")).toBe(true);
  expect(readFileSync(new URL('hadith-tts.js',dir),'utf8')).toMatch(/tts-guard\.js/);
 });
});
