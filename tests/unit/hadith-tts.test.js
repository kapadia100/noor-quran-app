import {describe,it,expect,beforeEach,afterEach,vi} from 'vitest';
import * as H from '../../src/hadith-tts.js';
const V=(name,lang,o={})=>({name,lang,localService:true,default:false,...o});
describe('splitText',()=>{
 it('splits at sentence ends and keeps chunks short',()=>{const t='Actions are judged by intentions. Every person gets what they intended! Is it clear? Yes.';const c=H.splitText(t,40);expect(c.length).toBeGreaterThan(1);expect(c.join(' ')).toBe(t);for(const x of c)expect(x.length).toBeLessThanOrEqual(40)});
 it('splits very long sentences at words and handles Arabic/Urdu stops',()=>{const w=Array(200).fill('word').join(' ');const c=H.splitText(w,100);for(const x of c)expect(x.length).toBeLessThanOrEqual(100);expect(c.join(' ')).toBe(w);expect(H.splitText('یہ پہلا ہے۔ یہ دوسرا ہے۔',12).length).toBe(2);expect(H.splitText('   ')).toEqual([])});
});
describe('pickVoice',()=>{
 const vs=[V('Compact','en-GB',{localService:true}),V('Samantha Enhanced','en_US',{localService:true}),V('Google US English','en-US',{localService:false}),V('Bad News','en-US'),V('Majed','ar-SA'),V('Plain Arabic','ar-EG'),V('Imran','ur-PK'),V('Android','eng-USA')];
 it('prefers offline, higher-quality voices and ignores novelty voices',()=>{expect(H.pickVoice(vs,'eng').name).toBe('Samantha Enhanced');expect(H.pickVoice(vs,'urd').name).toBe('Imran')});
 it('returns null when no voice exists for the language',()=>{expect(H.pickVoice(vs,'tam')).toBeNull();expect(H.pickVoice([],'eng')).toBeNull();expect(H.pickVoice(vs,'nope')).toBeNull()});
 it('matches three-letter and underscore tags',()=>{expect(H.pickVoice([V('x','eng-USA')],'eng')).toBeTruthy();expect(H.pickVoice([V('x','in_ID')],'ind')).toBeTruthy()});
 it('Arabic only with a clearly good voice',()=>{expect(H.arabicVoice(vs).name).toBe('Majed');expect(H.arabicVoice([V('Plain Arabic','ar-EG')])).toBeNull();expect(H.arabicVoice([])).toBeNull()});
});
function mockSynth(){const s={spoken:[],cancels:0,voices:[],handlers:{},autoStart:true,cur:null,
 getVoices(){return s.voices},addEventListener(t,f){(s.handlers[t]??=[]).push(f)},removeEventListener(t,f){s.handlers[t]=(s.handlers[t]||[]).filter(x=>x!==f)},
 cancel(){s.cancels++;const u=s.cur;s.cur=null;if(u)queueMicrotask(()=>u.onerror?.({error:'canceled'}))},
 speak(u){s.spoken.push(u);s.cur=u;if(s.autoStart)queueMicrotask(()=>u.onstart?.())},
 finish(){const u=s.cur;s.cur=null;u?.onend?.()}};return s}
class Utt{constructor(t){this.text=t}}
describe('player (mocked speechSynthesis)',()=>{
 let s;const tick=()=>new Promise(r=>setTimeout(r,0));
 beforeEach(()=>{s=mockSynth();globalThis.speechSynthesis=s;globalThis.SpeechSynthesisUtterance=Utt});
 afterEach(()=>{H.stop();delete globalThis.speechSynthesis;delete globalThis.SpeechSynthesisUtterance;vi.useRealTimers()});
 const voice=V('Samantha','en-US');
 it('is playing only after the device starts speaking',async()=>{s.autoStart=false;H.play({id:'a',text:'Hello there.',lang:'eng',voice});expect(H.info().state).toBe('starting');s.cur.onstart();expect(H.info().state).toBe('playing')});
 it('reports an error and does not claim playing when the device stays silent',async()=>{vi.useFakeTimers();s.autoStart=false;globalThis.window={__hdWd:300};const errs=[];const off=H.onError(w=>errs.push(w));H.play({id:'a',text:'Hello.',lang:'eng',voice});vi.advanceTimersByTime(400);expect(errs).toEqual(['silent']);expect(H.info().state).toBe('idle');off();delete globalThis.window});
 it('speaks chunks in order, then calls onEnd once',async()=>{const end=vi.fn(),sents=['A'.repeat(100)+'.','B'.repeat(100)+'.','C'.repeat(100)+'.'];H.play({id:'a',text:sents.join(' '),lang:'eng',voice,rate:1.2,onEnd:end});await tick();expect(s.spoken.length).toBe(1);for(let i=0;i<3;i++){s.finish();await tick()}
  expect(s.spoken.map(u=>u.text[0])).toEqual(['A','B','C']);expect(end).toHaveBeenCalledTimes(1);expect(H.info().state).toBe('idle');expect(s.spoken[0].rate).toBe(1.2);expect(s.spoken[0].voice).toBe(voice)});
 it('pause cancels, resume continues from the same chunk',async()=>{const t=Array(30).fill('A fairly long sentence goes here.').join(' ');H.play({id:'a',text:t,lang:'eng',voice});await tick();const n=s.spoken.length;H.pause();expect(H.info().state).toBe('paused');H.resume();await tick();expect(s.spoken.length).toBe(n+1);expect(s.spoken.at(-1).text).toBe(s.spoken[n-1].text);expect(H.info().state).toBe('playing')});
 it('stop clears state; a late event from an old utterance is ignored',async()=>{const end=vi.fn();H.play({id:'a',text:'Hi.',lang:'eng',voice,onEnd:end});await tick();const u=s.spoken[0];H.stop();expect(H.info().id).toBeNull();u.onend?.();expect(end).not.toHaveBeenCalled()});
 it('voicesReady waits for voiceschanged',async()=>{const p=H.voicesReady(2000);setTimeout(()=>{s.voices=[voice];(s.handlers.voiceschanged||[]).forEach(f=>f())},50);expect((await p).length).toBe(1)});
 it('voicesReady resolves empty after the timeout when the device has no voices',async()=>{expect(await H.voicesReady(200)).toEqual([])});
 it('unsupported when speechSynthesis is missing',()=>{delete globalThis.speechSynthesis;expect(H.supported()).toBe(false);expect(H.play({id:'a',text:'x',lang:'eng',voice})).toBe(false)});
});
