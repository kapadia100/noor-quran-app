// Tajweed colouring: rule names, colours and short explanations (English / Urdu) + helpers that turn the compact
// per-ayah annotation list (public/offline/tj/<surah>.json: [rule,start,end, ...]) into coloured text segments.
// Annotation data: quran-tajweed by Ahmed Fairuz (CC BY 4.0), projected onto this app's own text by scripts/build-tajweed.py.
// IMPORTANT: this only COLOURS the text by the standard rules. The tutor cannot hear or grade tajweed.
export const RULES=['madd_2','madd_246','madd_muttasil','madd_munfasil','madd_6','ghunnah','idghaam_ghunnah','idghaam_no_ghunnah','idghaam_shafawi','idghaam_mutajanisayn','idghaam_mutaqaribayn','ikhfa','ikhfa_shafawi','iqlab','qalqalah','hamzat_wasl','lam_shamsiyyah','silent'];
/** ONE palette for every screen (tutor panel, surah reader, legend, tip card). Light/dark hexes; exposed as CSS variables --tjc-<group>. */
export const PALETTE={madd:['#c2410c','#fb923c'],ghunnah:['#15803d','#4ade80'],idgham:['#0e7490','#22d3ee'],ikhfa:['#1d4ed8','#60a5fa'],iqlab:['#6d28d9','#a78bfa'],qalqalah:['#be185d','#f472b6'],silent:['#5b6270','#9ca3af']};
export const hex=(k,dark)=>PALETTE[k][dark?1:0];
export const paletteCss=()=>`:root{${Object.entries(PALETTE).map(([k,v])=>`--tjc-${k}:${v[0]}`).join(';')}}[data-theme=dark]{${Object.entries(PALETTE).map(([k,v])=>`--tjc-${k}:${v[1]}`).join(';')}}`;
export function installPalette(){if(typeof document==='undefined'||document.getElementById('tjpal'))return;const st=document.createElement('style');st.id='tjpal';st.textContent=paletteCss();document.head.append(st)}
installPalette();
const V=k=>`var(--tjc-${k})`;
const G={madd:['Madd — stretch','مد — کھینچیں',V('madd')],ghunnah:['Ghunnah — nasal sound','غنہ — ناک کی آواز',V('ghunnah')],idgham:['Idghām — merge','ادغام — ملا کر پڑھیں',V('idgham')],ikhfa:['Ikhfāʾ — hide the nūn','اخفاء — نون کو چھپائیں',V('ikhfa')],iqlab:['Iqlāb — nūn becomes mīm','اقلاب — نون میم بن جاتا ہے',V('iqlab')],qalqalah:['Qalqalah — echo','قلقلہ — گونج',V('qalqalah')],silent:['Silent letter','نہ پڑھا جانے والا حرف',V('silent')]};
const R=[ // [group, en name, ur name, en explanation, ur explanation]
 ['madd','Natural madd (2 counts)','مد طبعی (2 حرکت)','A long vowel (ا و ي): hold it for 2 counts, no more and no less.','حرفِ مد (ا و ي): اسے 2 حرکت تک کھینچیں، نہ کم نہ زیادہ۔'],
 ['madd','Madd of 2, 4 or 6 counts','مد (2، 4 یا 6 حرکت)','A long vowel before a stop or a soft letter. When you stop here you may hold it 2, 4 or 6 counts. Keep the same length each time.','وقف کے وقت یا لین کے بعد کا مد۔ یہاں رکیں تو 2، 4 یا 6 حرکت کھینچ سکتے ہیں۔ ہر بار ایک ہی مقدار رکھیں۔'],
 ['madd','Connected madd (4–5 counts)','مد متصل (4–5 حرکت)','A madd letter followed by a hamza in the same word: hold 4–5 counts.','مد کے حرف کے بعد اسی لفظ میں ہمزہ ہو: 4–5 حرکت کھینچیں۔'],
 ['madd','Separated madd (4–5 counts)','مد منفصل (4–5 حرکت)','A madd letter at the end of a word, hamza at the start of the next: hold 4–5 counts.','ایک لفظ کے آخر میں مد کا حرف اور اگلے لفظ کے شروع میں ہمزہ: 4–5 حرکت کھینچیں۔'],
 ['madd','Required madd (6 counts)','مد لازم (6 حرکت)','A madd letter followed by a sukoon or shadda in the same word: always hold 6 counts.','مد کے حرف کے بعد سکون یا شد ہو: ہمیشہ 6 حرکت کھینچیں۔'],
 ['ghunnah','Ghunnah (2 counts)','غنہ (2 حرکت)','A shadda on ن or م: keep a nasal sound in the nose for about 2 counts.','ن یا م پر شد ہو: ناک سے تقریباً 2 حرکت غنہ کریں۔'],
 ['idgham','Idghām with ghunnah','ادغام بغنہ','A nūn sākinah or tanween before ي ن م و: merge into the next letter and keep the nasal sound.','نون ساکن یا تنوین کے بعد ي ن م و: اگلے حرف میں ملا دیں اور غنہ رکھیں۔'],
 ['idgham','Idghām without ghunnah','ادغام بلا غنہ','A nūn sākinah or tanween before ل or ر: merge completely into the next letter, with no nasal sound.','نون ساکن یا تنوین کے بعد ل یا ر: پورا ملا دیں، غنہ نہ کریں۔'],
 ['idgham','Idghām of mīm (shafawī)','ادغام شفوی','A mīm sākinah followed by م: merge the two mīms into one doubled mīm with ghunnah.','میم ساکن کے بعد میم: دونوں کو ملا کر ایک مشدد میم غنہ کے ساتھ پڑھیں۔'],
 ['idgham','Idghām of similar letters','ادغام متجانسین','Two letters made in the same place but with different qualities: the first merges into the second.','ایک ہی مخرج کے دو حرف: پہلا دوسرے میں مل جاتا ہے۔'],
 ['idgham','Idghām of close letters','ادغام متقاربین','Two letters with close places: the first merges into the second.','قریب المخرج دو حرف: پہلا دوسرے میں مل جاتا ہے۔'],
 ['ikhfa','Ikhfāʾ (hiding)','اخفاء','A nūn sākinah or tanween before one of 15 letters: say the nūn lightly through the nose, without pressing the tongue.','نون ساکن یا تنوین کے بعد 15 حروف میں سے کوئی: نون کو ناک سے ہلکا سا، زبان دبائے بغیر پڑھیں۔'],
 ['ikhfa','Ikhfāʾ of mīm (shafawī)','اخفاء شفوی','A mīm sākinah before ب: hide the mīm lightly with the lips barely touching, with ghunnah.','میم ساکن کے بعد ب: ہونٹ ہلکے سے ملا کر غنہ کے ساتھ میم کو چھپائیں۔'],
 ['iqlab','Iqlāb','اقلاب','A nūn sākinah or tanween before ب: change it into a mīm sound with ghunnah (lips close lightly).','نون ساکن یا تنوین کے بعد ب: اسے میم کی آواز میں بدلیں، غنہ کے ساتھ۔'],
 ['qalqalah','Qalqalah','قلقلہ','ق ط ب ج د with a sukoon (or at a stop): release the letter with a small echo, like a light bounce.','ق ط ب ج د ساکن ہوں (یا وقف پر): حرف کو ہلکی سی گونج کے ساتھ ادا کریں۔'],
 ['silent','Hamzat al-waṣl','ہمزۂ وصلی','A connecting alif: pronounced when you START there, dropped when you join it to the previous word.','وصل والا الف: شروع کریں تو پڑھا جاتا ہے، پچھلے لفظ سے ملا کر پڑھیں تو گر جاتا ہے۔'],
 ['silent','Silent lām (sun letter)','لام شمسی','The ل of ال before a “sun letter” is not pronounced; the next letter is doubled instead.','حروفِ شمسی سے پہلے ال کا لام نہیں پڑھا جاتا؛ اگلا حرف مشدد ہو جاتا ہے۔'],
 ['silent','Silent letter','غیر ملفوظ حرف','Written but not pronounced.','لکھا جاتا ہے مگر پڑھا نہیں جاتا۔']];
export const info=(i,ur)=>{const r=R[i];if(!r)return null;const g=G[r[0]];return {id:RULES[i],group:r[0],color:g[2],name:ur?r[2]:r[1],text:ur?r[4]:r[3],gname:ur?g[1]:g[0]}};
export const colorOf=i=>G[R[i]?.[0]]?.[2]||'';
export const legend=ur=>Object.entries(G).map(([k,v])=>({k,name:ur?v[1]:v[0],color:v[2]}));
/** Split `text` into [{s, r}] segments (r = rule index or -1) from a flat [rule,start,end,...] list. Overlaps keep the earliest rule. */
export function segments(text,flat,from=0,to=text.length){const a=[];for(let i=0;i+2<flat.length;i+=3)a.push([flat[i],flat[i+1],flat[i+2]]);a.sort((x,y)=>x[1]-y[1]);
 const out=[];let p=from;for(const [r,s,e] of a){const s2=Math.max(s,p),e2=Math.min(e,to);if(e2<=s2||s2>=to||e2<=from)continue;if(s2>p)out.push({s:text.slice(p,s2),r:-1});out.push({s:text.slice(s2,e2),r});p=e2}
 if(p<to)out.push({s:text.slice(p,to),r:-1});return out}
/** Split an ayah into whitespace-separated tokens with character offsets. */
export function tokens(text){const o=[];const re=/\S+/g;let m;while((m=re.exec(text)))o.push({t:m[0],from:m.index,to:m.index+m[0].length});return o}
/** Align the raw ayah text (as the annotations index it) with the tutor's word list. Returns one segment list per tutor word, or null when they differ. */
export function align(raw,flat,wn,norm){const tk=tokens(raw).filter(t=>norm(t.t));const off=tk.length-wn.length;if(off<0||off>8)return null;const use=tk.slice(off);
 for(let i=0;i<use.length;i++)if(norm(use[i].t)!==wn[i])return null;return use.map(t=>segments(raw,flat,t.from,t.to))}

/** Segments for the whole displayed ayah (the reader hides the Bismillah prefix of raw ayah 1, so offsets shift). null when the raw text does not end with the shown text. */
export function ayahSegs(raw,txt,flat){if(!flat||!flat.length)return null;const off=raw.length-txt.length;if(off<0||raw.slice(off)!==txt)return null;return segments(raw,flat,off,raw.length)}
/** HTML for coloured segments. */
export const segHtml=(sg,esc)=>sg.map(g=>g.r<0?esc(g.s):`<span class="tj" data-r="${g.r}" style="--tj:${colorOf(g.r)}">${esc(g.s)}</span>`).join('');
