import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import * as M from '../../src/madani-data.js';
import * as D from '../../src/qaida-data.js';
import {itemsOf,countOf,COURSES} from '../../src/qaida.js';

const BASE=/[\u0621-\u064A\u0671]/;
const MARK=/[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED\u0640]/;
const skel=x=>x.replace(/[\u0622\u0623\u0625\u0671]/g,'\u0627').replace(/[^\u0621-\u063F\u0641-\u064A]/g,'');
const quran={};
function ayahWords(s,a){
 quran[s]??=JSON.parse(fs.readFileSync(`public/offline/s/ar/${s}.json`,'utf8'));
 let w=quran[s][a-1].split(/\s+/).filter(t=>BASE.test(t));
 if(a===1&&s!==1&&skel(w.slice(0,4).join(''))==='بسماللهالرحمنالرحيم')w=w.slice(4);
 return w}
const ALL=Object.entries(M.WORDS).flatMap(([id,ws])=>ws.map(w=>({id,w})));
const own=ALL.filter(x=>x.id!=='m13'); // m13 reuses the Noorani shadda words

describe('madani course structure',()=>{
 it('has 22 numbered lessons with English, Urdu and a rule each',()=>{
  expect(M.LESSONS.length).toBe(22);
  M.LESSONS.forEach((l,i)=>{expect(l.n).toBe(i+1);expect(l.id).toBe('m'+(i+1));expect(l.course).toBe('m');expect(l.en&&l.ur&&l.sub[0]&&l.sub[1]).toBeTruthy();
   expect(M.RULES[l.id]?.[0]?.[0].length).toBeGreaterThan(20);expect(M.RULES[l.id][0][1].length).toBeGreaterThan(10)});
  expect(new Set(M.LESSONS.map(l=>l.id)).size).toBe(22)});
 it('every word lesson has words, and a tutor surah exists for lessons that link one',()=>{
  for(const l of M.LESSONS)if(l.words)expect(M.WORDS[l.words].length).toBeGreaterThan(2);
  for(const [id,t] of Object.entries(M.TUTOR)){expect(M.LESSONS.some(l=>l.id===id)).toBe(true);expect(t[0]).toBeGreaterThan(0);expect(t[0]).toBeLessThanOrEqual(114)}});
 it('is exposed as its own course next to Noorani, with separate progress keys',()=>{
  expect(COURSES.m.key).not.toBe(COURSES.n.key);expect(COURSES.n.LESSONS).toBe(D.LESSONS);expect(COURSES.m.LESSONS).toBe(M.LESSONS);
  expect(M.LESSONS.reduce((a,l)=>a+countOf(l),0)).toBeGreaterThan(300)});
});

describe('madani Arabic is well formed',()=>{
 const texts=[...ALL.map(x=>x.w.t),...M.SALAH.map(x=>x.ar),...M.drillRows().flatMap(r=>r.cells.map(c=>c.c))];
 it('is stable under Unicode normalisation (no lost or composed marks, no presentation forms)',()=>{for(const t of texts){const srt=x=>[...x].sort().join('');expect(srt(t.normalize('NFD')),t).toBe(srt(t.normalize('NFD').normalize('NFC').normalize('NFD')));expect(t,t).not.toMatch(/[\uFB50-\uFDFF\uFE70-\uFEFF]/)}});
 it('never starts with a mark, has no doubled mark, no Latin/digits and no stray spaces',()=>{
  for(const t of texts){expect(t,t).not.toMatch(/\s{2,}|^\s|\s$/);expect(t,t).not.toMatch(/[A-Za-z0-9]/);
   const cs=[...t];for(let i=0;i<cs.length;i++){if(MARK.test(cs[i])&&cs[i]!=='\u0640'){expect(i,t).toBeGreaterThan(0);expect(cs[i],t).not.toBe(cs[i-1])}}}});
 it('every Quran word and prayer word has a vowel mark (full harakat) except bare long-vowel letters',()=>{
  for(const {id,w} of ALL){if(id==='m18')continue;for(const tok of w.t.split(' ')){expect(/[\u064B-\u0653\u0670]/.test(tok),w.t).toBe(true)}}
  for(const x of M.SALAH)for(const tok of x.ar.split(' '))expect(/[\u064B-\u0653\u0670]/.test(tok),x.ar).toBe(true)});
 it('every letter that is not a long-vowel carrier or silent has a mark in Quran words',()=>{
  for(const {id,w} of ALL){if(id==='m19'||id==='m18')continue;
   for(const tok of w.t.split(' ')){const cs=[...tok];
    cs.forEach((c,i)=>{if(!/[\u0621-\u064A]/.test(c)||'اوىي'.includes(c)||(c==='ل'&&cs[i-1]==='ٱ')||c==='ن'||c==='م')return; // unmarked ن/م = idghām/ikhfāʾ (Uthmani convention); unmarked ل after ٱ = sun letter
     let j=i+1,has=false;while(j<cs.length&&MARK.test(cs[j])){has=true;j++}
     expect(has,w.t+' @'+i).toBe(true)})}}});
});

describe('madani words match the Quran text of the app',()=>{
 it('every item skeleton equals the Quran word(s) it names',()=>{
  let n=0;
  for(const {w} of own){
   const parts=w.k.includes('+')?w.k.split('+'):[w.k];
   const exp=parts.map(k=>{const [s,a,i]=k.split(':').map(Number);return ayahWords(s,a)[i-1]});
   expect(exp.every(Boolean),w.k).toBe(true);
   expect(skel(w.t),w.k).toBe(skel(exp.join('')));n++}
  expect(n).toBeGreaterThan(200)});
 it('audio urls are word recordings in the expected format, one per word of the item',()=>{
  for(const {w} of own){const us=w.au.split('|');expect(us.length,w.k).toBe(w.t.split(' ').length);for(const u of us)expect(u,w.k).toMatch(/^https:\/\/audio\.qurancdn\.com\/wbw\/\d{3}_\d{3}_\d{3}\.mp3$/)}});
});

describe('madani tag predicates agree with the Arabic',()=>{
 const by=g=>ALL.filter(x=>x.w.g===g).map(x=>x.w.t);
 it('vertical fatha / small ya / small waw lessons carry the mark',()=>{
  for(const t of by('dag'))expect(t).toContain('\u0670');
  for(const t of by('vk'))expect(t).toContain('\u06E6');
  for(const t of by('vu'))expect(t).toContain('\u06E5');
  expect(by('dag').length&&by('vk').length&&by('vu').length).toBeTruthy()});
 it('silent-letter words carry the small circle (never read)',()=>{for(const {w} of ALL.filter(x=>x.id==='m19'))expect(w.t).toContain('\u06DF');expect(M.WORDS.m19.length).toBeGreaterThan(2)});
 it('qalqalah words have ق ط ب ج or د with a sukun',()=>{for(const t of by('qq'))expect(t,t).toMatch(/[\u0642\u0637\u0628\u062C\u062F]\u0652/);expect(by('qq').length).toBeGreaterThan(4)});
 it('iqlab words have a nun/tanween followed by ba; idgham and ikhfa sets are non-empty',()=>{for(const g of ['iq','ig','ign','ikn','izn'])expect(by(g).length,g).toBeGreaterThan(0);
  for(const t of by('iq'))expect(t).toMatch(/\u0628/)});
 it('every tag used has a label',()=>{for(const {w} of ALL)if(w.g)expect(M.TAGS[w.g],w.g).toBeTruthy()});
});

describe('madani stop forms',()=>{
 it('turn the last vowel into a sukun, tanween fathatan into an alif, and keep a final shadda',()=>{
  const c={'يُسْرًا':'يُسْرَا','أَحَدٌ':'أَحَدْ','لُّمَزَةٍۢ':'لُّمَزَهْ','وَتَبَّ':'وَتَبّ','ٱلرَّحِيمِ':'ٱلرَّحِيمْ','حَامِيَةٌۢ':'حَامِيَهْ','ٱلْمُسْتَقَرُّ':'ٱلْمُسْتَقَرّ','قُرَيْشٍ':'قُرَيْشْ','ٱلْكَوْثَرَ':'ٱلْكَوْثَرْ','هَٰذَا':'هَٰذَا'};
  for(const [a,b] of Object.entries(c))expect(M.stopForm(a),a).toBe(b)});
});

describe('madani drill (lesson 4)',()=>{
 it('has 34 rows, each cell a letter+vowel from the real recordings',()=>{
  const rows=M.drillRows();expect(rows.length).toBe(34);
  for(const r of rows){expect(r.cells.length).toBeGreaterThanOrEqual(1);for(const c of r.cells){expect(c.c).toMatch(/^[\u0621-\u064A][\u064E\u0650\u064F]$/);expect(c.u).toMatch(/^qaida\/\d+-[a-z]\.mp3$/)}}
  expect(new Set(rows.map(r=>r.key)).size).toBe(34);
  const l4=M.LESSONS.find(l=>l.id==='m4');expect(itemsOf(l4).length).toBe(34)});
});

describe('madani prayer page',()=>{
 it('has the prayer phrases with Arabic, transliteration and meanings, and links real surahs',()=>{
  expect(M.SALAH.length).toBeGreaterThan(5);for(const x of M.SALAH)expect(x.ar&&x.tr&&x.e&&x.u).toBeTruthy();
  expect(M.SALAH_SURAHS.map(s=>s[0])).toEqual(expect.arrayContaining([1,112]))});
});
