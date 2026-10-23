// Recitation progress: sessions, streaks, per-surah accuracy, mistake history and weak-letter analytics.
// Stored only on the phone (localStorage 'qsProg'). Pure functions over a plain object so they are unit-testable.
export const KEY='qsProg',MAX_SESS=400,MAX_MIS=300;
export const blank=()=>({v:1,sess:[],mis:[],let:{}});
export function load(ls=globalThis.localStorage){try{const p=JSON.parse(ls.getItem(KEY));return p&&p.v===1?{...blank(),...p}:blank()}catch{return blank()}}
export function save(P,ls=globalThis.localStorage){try{ls.setItem(KEY,JSON.stringify(P))}catch{/* storage full: ignore */}}
const pad=n=>String(n).padStart(2,'0');
/** Local calendar day key, e.g. 2026-10-23. */
export const dayKey=ts=>{const d=new Date(ts);return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
/** accuracy of a session = correct / (correct+to-check+unclear); null when nothing was attempted. */
export const accuracy=s=>{const n=(s.ok||0)+(s.bad||0)+(s.unc||0);return n?s.ok/n:null};
/** Record a finished (or stopped) practice session. Sessions with fewer than 3 words are ignored. */
export function logSession(P,s){const n=(s.ok||0)+(s.bad||0)+(s.unc||0);if(n<3)return false;P.sess.push({ts:s.ts,sn:s.sn,from:s.from,to:s.to,mode:s.mode||'follow',ok:s.ok||0,bad:s.bad||0,unc:s.unc||0,hints:s.hints||0,sec:Math.round(s.sec||0)});
 if(P.sess.length>MAX_SESS)P.sess.splice(0,P.sess.length-MAX_SESS);return true}
/** Letters of a normalised word as a list. */
const chars=w=>[...w];
/** Which letters of `exp` were not matched in `heard` (LCS based). Returns the unmatched expected letters. */
export function missedLetters(exp,heard){const a=chars(exp),b=chars(heard||'');const m=a.length,n=b.length;const d=Array.from({length:m+1},()=>new Uint16Array(n+1));
 for(let i=m-1;i>=0;i--)for(let j=n-1;j>=0;j--)d[i][j]=a[i]===b[j]?d[i+1][j+1]+1:Math.max(d[i+1][j],d[i][j+1]);
 const miss=[];let i=0,j=0;while(i<m){if(j<n&&a[i]===b[j]){i++;j++}else if(j<n&&d[i][j+1]>=d[i+1][j])j++;else{miss.push(a[i]);i++}}return miss}
/** Log a mistake. type: 'skip' (word left out), 'wrong' (a different word was heard), 'close' (nearly right but a letter is off). */
export function addMistake(P,m){P.mis.push({ts:m.ts,sn:m.sn,a:m.a,t:m.t,nw:m.nw,type:m.type,heard:m.heard||''});if(P.mis.length>MAX_MIS)P.mis.splice(0,P.mis.length-MAX_MIS);
 if(m.type!=='skip'&&m.heard){for(const c of missedLetters(m.nw,m.heard)){const e=P.let[c]||(P.let[c]=[0,0]);e[1]++}}}
/** Count the letters of words that were recited fine / attempted (denominator for the weak-letter rate). */
export function addSeen(P,words){for(const w of words)for(const c of chars(w)){const e=P.let[c]||(P.let[c]=[0,0]);e[0]++}}
/** Letters with the highest miss rate (at least 2 misses and 6 sightings so one slip does not label a letter weak). */
export function weakLetters(P,n=6){return Object.entries(P.let).map(([ch,[seen,miss]])=>({ch,seen,miss,rate:seen?miss/seen:0})).filter(x=>x.miss>=2&&x.seen>=6).sort((a,b)=>b.rate-a.rate||b.miss-a.miss).slice(0,n)}
/** Consecutive-day streak ending today (or yesterday: today still has time). */
export function streak(P,now=Date.now()){const days=new Set(P.sess.map(s=>dayKey(s.ts)));let cur=0,d=now;
 if(!days.has(dayKey(d)))d-=864e5;while(days.has(dayKey(d))){cur++;d-=864e5}
 const all=[...days].sort();let best=0,run=0,prev=null;for(const k of all){const t=new Date(k+'T12:00:00').getTime();run=prev!==null&&Math.round((t-prev)/864e5)===1?run+1:1;best=Math.max(best,run);prev=t}
 return {cur,best:Math.max(best,cur),today:days.has(dayKey(now)),days:days.size}}
/** Per-surah summary, most recently practised first. acc = word-weighted accuracy over the last 5 sessions. */
export function bySurah(P){const m={};for(const s of P.sess){(m[s.sn]||(m[s.sn]=[])).push(s)}
 return Object.entries(m).map(([sn,a])=>{const last=a.slice(-5);const ok=last.reduce((x,s)=>x+s.ok,0),n=last.reduce((x,s)=>x+s.ok+s.bad+s.unc,0);const all=a.reduce((x,s)=>x+s.ok+s.bad+s.unc,0);
  return {sn:+sn,sessions:a.length,words:all,acc:n?ok/n:null,lastTs:a[a.length-1].ts,best:Math.max(...a.map(s=>accuracy(s)??0))}}).sort((x,y)=>y.lastTs-x.lastTs)}
/** Words recited correctly per day for the last `n` days (oldest first). */
export function lastDays(P,n=7,now=Date.now()){const out=[];for(let i=n-1;i>=0;i--){const k=dayKey(now-i*864e5);out.push({k,ok:P.sess.filter(s=>dayKey(s.ts)===k).reduce((x,s)=>x+s.ok,0)})}return out}
export const recent=(P,n=15)=>P.mis.slice(-n).reverse();
