// Quran Dictionary: pure helpers (search, spaced repetition, coverage, quiz options). No DOM, so they are unit-tested.
export const DAY=864e5,INTERVALS=[0,1,3,7,14,30],KNOWN_BOX=3;
const MARKS=/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;
/** Arabic skeleton for matching: no harakat/marks, alef/yeh/kaf/heh variants unified (Arabic, Persian and Urdu keyboards). */
export const skel=s=>String(s||'').replace(MARKS,'').replace(/[\u0671\u0622\u0623\u0625]/g,'\u0627').replace(/[\u0649\u06CC\u06D2]/g,'\u064A').replace(/\u06A9/g,'\u0643').replace(/[\u06C1\u06BE\u0629]/g,'\u0647').replace(/\s+/g,' ').trim();
const hasAr=s=>/[\u0600-\u06FF]/.test(s);
/** Latin normaliser: strips diacritics and ʿ ʾ ' - so "alim" finds ʿalima. */
export const lat=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[\u02bf\u02be'\u2019\u2018`\-\s]/g,'').toLowerCase();
const urN=s=>String(s||'').replace(MARKS,'').replace(/\u064A/g,'\u06CC').replace(/\u0643/g,'\u06A9').replace(/\u0647/g,'\u06C1').replace(/\u0649/g,'\u06CC').replace(/[\u0623\u0625\u0622\u0671]/g,'\u0627');
/** Search index: built once per word. */
export function indexOf(w){return {sk:skel(w.h),sl:skel(w.l),rt:skel((w.rt||'').replace(/ /g,'')),tr:lat(w.t),en:String(w.e).toLowerCase(),ur:urN(w.u)}}
/** Words matching q (Arabic with/without harakat, English, Urdu, transliteration, or a rank number), original frequency order, exact matches first. */
export function search(words,idx,q){
 q=String(q||'').trim();if(!q)return words.map((_,i)=>i);
 const out=[],ex=[];
 if(/^\d+$/.test(q)){const i=+q-1;return words[i]?[i]:[]}
 if(hasAr(q)){
  const a=skel(q),u=urN(q);
  for(let i=0;i<words.length;i++){const x=idx[i];
   const m=x.sk===a||x.sl===a||x.rt===a.replace(/ /g,'');
   if(m){ex.push(i);continue}
   if(x.sk.includes(a)||x.sl.includes(a)||x.ur.includes(u))out.push(i)}
  return [...ex,...out.filter(i=>!ex.includes(i))];
 }
 const ql=q.toLowerCase(),lq=lat(q);
 for(let i=0;i<words.length;i++){const x=idx[i];
  const toks=x.en.split(/[^a-z']+/);
  if(toks.includes(ql)||x.tr===lq){ex.push(i);continue}
  if(x.en.includes(ql)||(lq.length>1&&x.tr.includes(lq)))out.push(i)}
 return [...ex,...out];
}
/** Spaced-repetition state per rank: {b:box 0..5, d:due ms, c:right, w:wrong, k:marked known, s:practice list}. */
export const isKnown=e=>!!e&&(e.k===true||(e.b||0)>=KNOWN_BOX);
export function grade(e,ok,now=Date.now()){
 const o={b:0,c:0,w:0,...e};
 if(ok){o.b=Math.min(INTERVALS.length-1,o.b+1);o.c++;o.d=now+INTERVALS[o.b]*DAY}
 else{o.b=Math.max(0,o.b-2);o.w++;o.d=now+6e5;if(o.k)o.k=false}
 o.l=now;return o}
export function markKnown(e,known,now=Date.now()){
 const o={b:0,c:0,w:0,...e};
 if(known){o.k=true;o.b=Math.max(o.b,KNOWN_BOX);o.d=now+INTERVALS[o.b]*DAY}else{o.k=false;o.b=Math.min(o.b,KNOWN_BOX-1);o.d=now}
 return o}
export const dueCount=(state,now=Date.now())=>Object.values(state).filter(e=>e&&e.l&&(e.d||0)<=now).length;
/** Words you know, counted by every occurrence in the Quran: share of all 77,429 word-occurrences you can already recognise. */
export function coverage(words,state,total){let n=0,k=0;words.forEach(w=>{if(isKnown(state[w.r])){n+=w.n;k++}});return {words:k,tokens:n,pct:total?Math.round(1000*n/total)/10:0}}
/** Session: due cards first (oldest due first), then practice-list words, then new words in frequency order. */
export function buildSession(words,state,now=Date.now(),size=10,only=null){
 const pool=only?words.filter(w=>only.has(w.r)):words;
 const due=pool.filter(w=>state[w.r]?.l&&(state[w.r].d||0)<=now).sort((a,b)=>state[a.r].d-state[b.r].d);
 const star=pool.filter(w=>state[w.r]?.s&&!state[w.r]?.l&&!isKnown(state[w.r]));
 const fresh=pool.filter(w=>!state[w.r]?.l&&!state[w.r]?.s&&!isKnown(state[w.r]));
 return [...due,...star,...fresh].slice(0,size).map(w=>w.r)}
/** Shortest useful meaning for a multiple-choice option (first sense). */
export const brief=s=>String(s).split(/[;(]/)[0].trim()||String(s);
/** n-1 distractors: other parts of speech excluded when possible, similar frequency preferred, never an equal meaning. */
export function options(words,target,lang='en',n=4,rnd=Math.random){
 const key=w=>brief(lang==='ur'?w.u:w.e).toLowerCase(),tk=key(target);
 let pool=words.filter(w=>w.r!==target.r&&key(w)!==tk&&w.h!==target.h);
 const same=pool.filter(w=>w.p===target.p&&Math.abs(w.r-target.r)<=120);
 const near=pool.filter(w=>Math.abs(w.r-target.r)<=150);
 const src=same.length>=n-1?same:near.length>=n-1?near:pool;
 const pick=[],seen=new Set([tk]);
 for(const w of [...src].sort(()=>rnd()-.5)){const k=key(w);if(seen.has(k))continue;seen.add(k);pick.push(w);if(pick.length===n-1)break}
 const all=[...pick,target];for(let i=all.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[all[i],all[j]]=[all[j],all[i]]}
 return all}
export const LEVELS=[[1,50],[51,100],[101,150],[151,200],[201,300],[301,400],[401,500]];
export const POS_UR={'Noun':'اسم','Verb':'فعل','Particle':'حرف','Pronoun':'ضمیر','Proper noun':'اسمِ معرفہ','Relative pronoun':'اسمِ موصول','Demonstrative':'اسمِ اشارہ','Negation':'حرفِ نفی','Conditional':'حرفِ شرط','Interrogative':'حرفِ استفہام','Conjunction':'حرفِ عطف','Adverb of place':'ظرفِ مکان','Adverb of time':'ظرفِ زمان','Subordinating word':'حرفِ ربط','Restrictive particle':'حرفِ استثنا','Particle of certainty':'حرفِ تحقیق','Prohibition':'حرفِ نہی','Active participle':'اسمِ فاعل','Passive participle':'اسمِ مفعول','Verbal noun':'مصدر','Adjective':'صفت'};
export const posLabel=(p,ur)=>{if(!ur)return p;const m=/^Verb \(form (\w+)\)$/.exec(p);if(m)return `فعل (باب ${m[1]})`;return POS_UR[p]||p};
