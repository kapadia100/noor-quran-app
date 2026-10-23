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
/**
 * Align hypothesis words H to expected words E (both normalized).
 * Returns per-expected-word {j: hyp index or -1, s: similarity} plus extra hyp words.
 * Allows ASR merges/splits (2 expected <-> 1 hyp and 1 expected <-> 2 hyp).
 */
export function align(E,H){const n=E.length,m=H.length,INF=1e9,D=[],B=[];
 for(let i=0;i<=n;i++){D.push(new Array(m+1).fill(INF));B.push(new Array(m+1).fill(null))}D[0][0]=0;
 const DEL=0.85,INS=0.7;
 for(let i=0;i<=n;i++)for(let j=0;j<=m;j++){const d=D[i][j];if(d>=INF)continue;
  const up=(ii,jj,c,op)=>{if(d+c<D[ii][jj]){D[ii][jj]=d+c;B[ii][jj]=[i,j,op]}};
  if(i<n&&j<m)up(i+1,j+1,1-sim(E[i],H[j]),'m');
  if(i<n)up(i+1,j,DEL,'d');if(j<m)up(i,j+1,INS,'i');
  if(i+1<n&&j<m){const s=sim(E[i]+E[i+1],H[j]);if(s>0.75)up(i+2,j+1,2*(1-s),'m2')}
  if(i<n&&j+1<m){const s=sim(E[i],H[j]+H[j+1]);if(s>0.75)up(i+1,j+2,(1-s)+0.05,'s2')}}
 // allow trailing expected words to be unmatched for free (not yet recited)
 let bi=n,best=D[n][m];for(let i=0;i<n;i++)if(D[i][m]<best-1e-9){best=D[i][m];bi=i}// trailing expected words (not yet recited) cost nothing
 const res=E.map(()=>({j:-1,s:0}));let i=bi,j=m;
 while(i>0||j>0){const b=B[i][j];if(!b)break;const [pi,pj,op]=b;
  if(op==='m')res[pi]={j:pj,s:sim(E[pi],H[pj])};else if(op==='m2'){const s=sim(E[pi]+E[pi+1],H[pj]);res[pi]={j:pj,s};res[pi+1]={j:pj,s}}else if(op==='s2')res[pi]={j:pj,s:sim(E[pi],H[pj]+H[pj+1])};
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
 const a=align(E,H);let last=-1;a.forEach((x,k)=>{if(x.j>=0&&x.s>=OK)last=k});
 const done=last+1;const marks=[];const noRed=degenerate(H);
 for(let k=0;k<done;k++){const x=a[k];
  if(x.j>=0&&x.s>=OK){marks.push({k,st:'ok'});continue}
  let l=k,r=k;if(x.j<0){while(l>0&&a[l-1].j<0&&k-l<2)l--;while(r+1<done&&a[r+1].j<0&&r-k<2)r++}// run of up to 3 missing words
  const runOk=x.j>=0||(!(l>0&&a[l-1].j<0)&&!(r+1<done&&a[r+1].j<0));
  const strongL=l>0?a[l-1].j>=0&&a[l-1].s>=STRONG:!!opt.anchored,strongR=r+1<done&&a[r+1].j>=0&&a[r+1].s>=STRONG;
  const enclosed=strongL&&strongR&&(l>=1||opt.anchored)&&runOk&&!noRed;
  if(x.j<0){const shortW=E[k].length<=3;marks.push({k,st:enclosed&&!shortW?'skip':'unclear'})}
  else marks.push({k,st:enclosed&&x.s<WRONG&&H[x.j].length>=2&&E[k].length>=4?'wrong':'unclear',heard:H[x.j]})}
 return {done,marks,tail:done>0&&a[done-1].j>=0&&a[done-1].s>=STRONG}}
