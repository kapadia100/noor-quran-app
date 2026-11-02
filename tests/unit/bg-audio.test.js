import {describe,it,expect,beforeEach} from 'vitest';
describe('background audio session',()=>{
 let BG;
 beforeEach(async()=>{globalThis.navigator.audioSession={type:'auto'};BG=await import('../../src/bg-audio.js')});
 it('playback type unless the mic is held',()=>{
  BG.forPlayback();expect(navigator.audioSession.type).toBe('playback');
  BG.micOn();expect(navigator.audioSession.type).toBe('play-and-record');
  BG.forPlayback();expect(navigator.audioSession.type).toBe('play-and-record');
  BG.micOff(1);expect(navigator.audioSession.type).toBe('playback');
 });
 it('silence WAV has the exact length',()=>{
  const b=BG.silence(500),v=new DataView(b);
  expect(String.fromCharCode(...new Uint8Array(b,0,4))).toBe('RIFF');
  expect(String.fromCharCode(...new Uint8Array(b,8,4))).toBe('WAVE');
  expect(v.getUint32(24,true)).toBe(8000);
  expect(b.byteLength-44).toBe(4000);
 });
});
