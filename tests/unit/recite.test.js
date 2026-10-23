import {describe,it,expect} from 'vitest';
import {norm,words,judge,sim} from '../../src/recite-core.js';
const E=words('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ');
const F=words('ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ مَٰلِكِ يَوْمِ ٱلدِّينِ');
describe('recite-core',()=>{
 it('normalizes diacritics and letter variants',()=>{expect(norm('ٱلرَّحْمَٰنِ')).toBe('الرحمن');expect(norm('إِيَّاكَ')).toBe(norm('اياك'));expect(sim(norm('الصلوة'),norm('الصلاة'))).toBeGreaterThan(0.6)});
 it('correct recitation is all green',()=>{const j=judge(E,words('بسم الله الرحمن الرحيم'));expect(j.done).toBe(4);expect(j.marks.every(m=>m.st==='ok')).toBe(true)});
 it('spelling variants from the recognizer are not flagged',()=>{const j=judge(F,words('الحمد لله رب العالمين الرحمان الرحيم ملك يوم الدين'));expect(j.marks.filter(m=>m.st!=='ok')).toEqual([])});
 it('partial segment: unrecited words are not flagged',()=>{const j=judge(F,words('الحمد لله رب'));expect(j.done).toBe(3);expect(j.marks.every(m=>m.st==='ok')).toBe(true)});
 it('a skipped word in the middle is flagged',()=>{const j=judge(F,words('الحمد لله رب العالمين الرحيم ملك يوم الدين'));expect(j.marks.find(m=>m.k===4).st).toBe('skip')});
 it('a clearly wrong word in the middle is flagged',()=>{const j=judge(F,words('الحمد لله رب العالمين الرحمن كتاب ملك يوم الدين'));expect(j.marks.find(m=>m.k===5).st).toBe('wrong')});
 it('doubtful evidence is unclear, never red',()=>{const j=judge(F,words('الحمد لله ربي'));expect(j.marks.some(m=>m.st==='wrong'||m.st==='skip')).toBe(false);
  const k=judge(F,words('الحمد لله رب العالمين الرحمن الرحيم'));expect(k.marks.every(m=>m.st==='ok')).toBe(true)});
 it('a phrase that repeats later in the window does not hijack the match',()=>{const E2=words('بسم الله الرحمن الرحيم الحمد لله رب العالمين الرحمن الرحيم ملك يوم الدين');const j=judge(E2,words('بسم الله الرحمن الرحيم'));expect(j.done).toBe(4);expect(j.marks.every(m=>m.st==='ok')).toBe(true)});
 it('noise / empty transcript commits nothing',()=>{expect(judge(F,[]).done).toBe(0);expect(judge(F,words('موسيقى')).done).toBe(0)});
});
