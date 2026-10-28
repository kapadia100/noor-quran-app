import {describe,it,expect} from 'vitest';
import {PALETTE,paletteCss,legend,colorOf,info,hex,ayahSegs,RULES} from '../../src/tj-rules.js';
const lum=h=>{const c=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=.03928?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2]};
const cr=(a,b)=>{const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p);return (x+.05)/(y+.05)};
describe('tajweed palette (single source of truth)',()=>{
 it('has exactly the seven agreed groups and colours',()=>{expect(Object.keys(PALETTE)).toEqual(['madd','ghunnah','idgham','ikhfa','iqlab','qalqalah','silent']);
  const css=paletteCss();expect(css).toContain('--tjc-madd:#975125');expect(css).toContain('--tjc-ghunnah:#3a6e34');expect(css).toContain('--tjc-idgham:#216d74');expect(css).toContain('--tjc-ikhfa:#375ebf');expect(css).toContain('--tjc-iqlab:#7d4abd');expect(css).toContain('--tjc-qalqalah:#ad3a66');expect(css).toContain('--tjc-silent:#616656')});
 it('legend, letter colours and tip card all come from the same variables',()=>{const lg=legend(false);expect(lg.map(g=>g.k)).toEqual(Object.keys(PALETTE));
  RULES.forEach((_,i)=>{const r=info(i,false);expect(r.color).toBe(colorOf(i));expect(r.color).toBe(lg.find(g=>g.k===r.group).color);expect(r.color).toBe(`var(--tjc-${r.group})`)});
  expect(legend(true).map(g=>g.color)).toEqual(lg.map(g=>g.color))});
 it('contrast: every colour ≥ 4.5:1 on its page and card background (light and dark)',()=>{const L=['#f6f0e2','#fffbf2','#ede6d3','#e4ead6'],D=['#1b2118','#242c20','#2d3628','#33402d'];
  for(const k of Object.keys(PALETTE)){for(const b of L)expect(cr(hex(k,false),b),k+' light '+b).toBeGreaterThanOrEqual(4.5);for(const b of D)expect(cr(hex(k,true),b),k+' dark '+b).toBeGreaterThanOrEqual(4.5)}});
 it('colours are pairwise distinguishable (hue/lightness not identical)',()=>{const v=Object.values(PALETTE).map(x=>x[0]);expect(new Set(v).size).toBe(v.length)});
 it('ayahSegs shifts offsets when the Bismillah prefix is hidden and refuses mismatches',()=>{const raw='AAA BBB CCC';expect(ayahSegs(raw,'BBB CCC',[1,4,7]).map(s=>s.s).join('')).toBe('BBB CCC');expect(ayahSegs(raw,'XXX',[1,4,7])).toBeNull();expect(ayahSegs(raw,'BBB CCC',[])).toBeNull()});
});
