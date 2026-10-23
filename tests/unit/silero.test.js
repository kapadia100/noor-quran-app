import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import {Silero,parseWeights} from '../../src/silero.js';
import {reading} from './audio-fixtures.js';
describe('voice model (JS port)',()=>{
 it('reproduces the reference ONNX model frame by frame (max error < 1e-3)',()=>{
  const b=fs.readFileSync(new URL('../../public/vad/silero16k.bin',import.meta.url));const s=new Silero(parseWeights(b.buffer.slice(b.byteOffset,b.byteOffset+b.length)));
  const ref=JSON.parse(fs.readFileSync(new URL('../fixtures/silero-ref.json',import.meta.url),'utf8'));const x=reading(3,{gain:0.3});let worst=0;
  for(let k=0;k<ref.length;k++)worst=Math.max(worst,Math.abs(s.step(x.subarray(k*512,k*512+512))-ref[k]));
  expect(worst).toBeLessThan(1e-3);expect(Math.max(...ref)).toBeGreaterThan(0.9)});
});
