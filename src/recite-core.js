// Recitation checker core (pure, no DOM). Precision-first: a word is flagged only when the evidence is clear.
const TASHKEEL=/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08FF\u0640]/g;
export function norm(w){return String(w).replace(TASHKEEL,'').replace(/[ٱأإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/[^\u0621-\u064A]/g,'')}
const skel=w=>w.replace(/[اويء]/g,'');
function lev(a,b){if(a===b)return 0;const m=a.length,n=b.length;if(!m||!n)return m||n;let p=Array.from({length:n+1},(_,j)=>j);
 for(let i=1;i<=m;i++){const c=[i];for(let j=1;j<=n;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c}return p[n]}
const r=(a,b)=>{const L=Math.max(a.length,b.length);return L?1-lev(a,b)/L:1};
/** Similarity 0..1 of two normalized words (spelling-variant tolerant). */
export function sim(a,b){if(a===b)return 1;const s=r(a,b),k=r(skel(a),skel(b));return Math.max(s,skel(a).length>=2?k*0.97:0)}
export const words=t=>String(t).split(/\s+/).map(norm).filter(Boolean);
// ---------- connected (wasl) recitation ----------
// The written text is not always what is pronounced when words are read together. These rules produce the other spellings a correct
// reciter may legitimately produce, so the matcher never treats correct connected reading as a mistake. All forms are on NORMALISED letters.
const SHAMS=new Set('تثدذرزسشصضطظلن'),IDGH=new Set('يرملون'),LONG=new Set('اوي');
const PAIRS=['تد','دت','طت','تط','ثذ','ذث','ذظ','ظذ','لر','رل','بم','مب'];
/** Spellings of a single word w that may be heard in connected speech (prev = previous expected word or '', next = following or ''). */
export function wordForms(w,prev='',next=''){const f=new Set([w]);
 if(w.length>=4&&w.endsWith('ه')){f.add(w.slice(0,-1)+'ت')}// ta marbuta: -h at a pause, -t when joined
 if(w.startsWith('ال')&&w.length>=4){f.add(w.slice(1));// hamzat al-wasl dropped: (...)l-
  if(SHAMS.has(w[2]))f.add('ا'+w.slice(2)),f.add(w.slice(2));// lam shamsiyya assimilates: ar-Rahman -> ar-rahman
  else f.add(w.slice(2))}
 else if(prev&&w.length>=4&&w[0]==='ا')f.add(w.slice(1));// other hamzat al-wasl (ibn, ism, ithnan, ...)
 if(w.length>=2&&w.endsWith('ن')&&next&&(IDGH.has(next[0])||next[0]==='ب')){if(next[0]==='ب')f.add(w.slice(0,-1)+'م');else f.add(w.slice(0,-1)),f.add(w.slice(0,-1)+next[0])}// idgham / iqlab: the nun is absorbed or becomes a meem
 if(next&&next.startsWith('ال')&&w.length>=3&&LONG.has(w[w.length-1]))f.add(w.slice(0,-1));// long vowel shortens before a wasl word
 return [...f]}
/** Spellings of the junction of two or three consecutive expected words read together (what one recognised "word" may look like). */
export function mergeForms(ws,prev='',next=''){let outs=[{t:'',n:0}];
 // at most ONE component may use a non-written variant: two altered words could swallow a whole skipped word
 for(let k=0;k<ws.length;k++){const w=ws[k],pv=k?ws[k-1]:prev,nx=k+1<ws.length?ws[k+1]:next;const fs=wordForms(w,pv,nx);const o=[];
  for(const a of outs)for(const b of fs){if(a.t!==''&&!b)continue;const n=a.n+(b===w?0:1);if(n<=1)o.push({t:a.t+b,n})}
  // same / near letters meeting: assimilation drops one of them
  if(k>0){for(const a of outs){const x=a.t.slice(-1),y=w[0];if(x&&y&&(x===y||PAIRS.includes(x+y))&&w.length>=2){o.push({t:a.t.slice(0,-1)+w,n:a.n});o.push({t:a.t+w.slice(1),n:a.n})}}}
  const seen=new Set();outs=o.filter(x=>!seen.has(x.t)&&seen.add(x.t)).slice(0,40)}
 return outs.map(x=>x.t)}
const bestSim=(forms,h)=>{let b=0;for(const f of forms){const v=sim(f,h);if(v>b)b=v}return b};
/**
 * Align hypothesis words H to expected words E (both normalized).
 * Returns per-expected-word {j: hyp index or -1, s: similarity} plus extra hyp words.
 * Allows ASR merges/splits (2 expected <-> 1 hyp and 1 expected <-> 2 hyp).
 */
export function align(E,H,opt={}){const n=E.length,m=H.length,INF=1e9,D=[],B=[];const conn=opt.connected!==false;
 // context-aware scores: single word given its neighbours, and 2- or 3-word junctions (connected recitation)
 const S1=E.map((w,i)=>conn?wordForms(w,E[i-1]||'',E[i+1]||''):[w]),cacheM={};const sM=(i,len,h)=>{const k=i+':'+len;const f=cacheM[k]??=mergeForms(E.slice(i,i+len),E[i-1]||'',E[i+len]||'');return bestSim(f,h)};
 for(let i=0;i<=n;i++){D.push(new Array(m+1).fill(INF));B.push(new Array(m+1).fill(null))}D[0][0]=0;
 // INS_JUNK: a one-letter fragment is decoder noise, cheap to ignore so it is not paired with a real word.
 // MERGE: a real merge decodes both words (>=0.85); a looser match is just a skipped short word.
 const DEL=0.85,INS=0.7,INS_JUNK=0.3,MERGE=0.85;
 for(let i=0;i<=n;i++)for(let j=0;j<=m;j++){const d=D[i][j];if(d>=INF)continue;
  const up=(ii,jj,c,op)=>{if(d+c<D[ii][jj]){D[ii][jj]=d+c;B[ii][jj]=[i,j,op]}};
  if(i<n&&j<m)up(i+1,j+1,1-bestSim(S1[i],H[j]),'m');
  if(i<n)up(i+1,j,DEL,'d');if(j<m)up(i,j+1,H[j].length<=1?INS_JUNK:INS,'i');
  if(i+1<n&&j<m){const s=conn?sM(i,2,H[j]):sim(E[i]+E[i+1],H[j]);if(s>MERGE)up(i+2,j+1,2*(1-s),'m2')}
  if(conn&&i+2<n&&j<m){const s=sM(i,3,H[j]);if(s>MERGE+0.03)up(i+3,j+1,3*(1-s),'m3')}
  if(i<n&&j+1<m){const s=bestSim(S1[i],H[j]+H[j+1]);if(s>0.75)up(i+1,j+2,(1-s)+0.05,'s2')}}
 // allow trailing expected words to be unmatched for free (not yet recited)
 let bi=n,best=D[n][m];for(let i=0;i<n;i++)if(D[i][m]<best-1e-9){best=D[i][m];bi=i}// trailing expected words (not yet recited) cost nothing
 const res=E.map(()=>({j:-1,s:0}));let i=bi,j=m;
 while(i>0||j>0){const b=B[i][j];if(!b)break;const [pi,pj,op]=b;
  if(op==='m')res[pi]={j:pj,s:bestSim(S1[pi],H[pj])};else if(op==='m2'){const s=conn?sM(pi,2,H[pj]):sim(E[pi]+E[pi+1],H[pj]);res[pi]={j:pj,s};res[pi+1]={j:pj,s}}else if(op==='m3'){const s=sM(pi,3,H[pj]);res[pi]={j:pj,s};res[pi+1]={j:pj,s};res[pi+2]={j:pj,s}}else if(op==='s2')res[pi]={j:pj,s:bestSim(S1[pi],H[pj]+H[pj+1])};
  i=pi;j=pj}
 return res}
/**
 * Judge one committed segment. E = expected normalized words (window starting at the reciter's position),
 * H = recognized words. Returns {done: number of expected words consumed, marks:[{k,st:'ok'|'wrong'|'skip'|'unclear',heard}]}.
 * Precision rules: 'wrong' / 'skip' only when the word is enclosed by strong matches on both sides and the
 * evidence is unambiguous; anything doubtful is 'unclear' (never shown in red).
 */
/** Recognizer loops ("hallucination") look like heavy repetition; never trust such output for red flags. */
export function degenerate(H){if(H.length<6)return false;const c={};let mx=0;for(const w of H){c[w]=(c[w]||0)+1;if(c[w]>mx)mx=c[w]}if(mx>=4&&mx/H.length>0.3)return true;
 const bg={};for(let i=0;i+1<H.length;i++){const k=H[i]+' '+H[i+1];bg[k]=(bg[k]||0)+1;if(bg[k]>=3)return true}return false}
export function judge(E,H,opt={}){const OK=opt.ok??0.6,STRONG=opt.strong??0.75,WRONG=opt.wrong??0.34;
 const a=align(E,H,opt);let last=-1;a.forEach((x,k)=>{if(x.j>=0&&x.s>=OK)last=k});
 const done=last+1;const marks=[];const noRed=degenerate(H);
 for(let k=0;k<done;k++){const x=a[k];
  if(x.j>=0&&x.s>=OK){marks.push({k,st:'ok',j:x.j,s:x.s});continue}
  let l=k,r=k;if(x.j<0){while(l>0&&a[l-1].j<0&&k-l<2)l--;while(r+1<done&&a[r+1].j<0&&r-k<2)r++}// run of up to 3 missing words
  const runOk=x.j>=0||(!(l>0&&a[l-1].j<0)&&!(r+1<done&&a[r+1].j<0));
  const strongL=l>0?a[l-1].j>=0&&a[l-1].s>=STRONG:!!opt.anchored,strongR=r+1<done&&a[r+1].j>=0&&a[r+1].s>=STRONG;
  const enclosed=strongL&&strongR&&(l>=1||opt.anchored)&&runOk&&!noRed;
  if(x.j<0){const shortW=E[k].length<=3;marks.push({k,st:enclosed&&!shortW?'skip':'unclear'})}
  else marks.push({k,j:x.j,st:enclosed&&x.s<WRONG&&H[x.j].length>=2&&E[k].length>=4?'wrong':'unclear',heard:H[x.j]})}
 return {done,marks,tail:done>0&&a[done-1].j>=0&&a[done-1].s>=STRONG}}
