// Live reading for the Qaida. Two honest modes, never mixed up on screen:
//  "along"  follow-along: each spoken burst (letter, syllable or word) moves the highlight to the next item. Driven by the pace follower
//           (qaida-pace.js) from the microphone level only. It does NOT know what you said. No download needed.
//  "check"  checked reading for real words: every burst is also scored by the on-device speech model against the words of the row (closed set: did it sound
//           like the expected word rather than the other words of the row?). Result per word: confirmed, or not confirmed (never red: isolated words are only recognised
//           about half of the time, so a miss is not evidence of a mistake).
// Audio never leaves the phone. The engine is DOM-free: the screen listens to callbacks.
import {Pace} from './qaida-pace.js';
import {gradeClosed} from './qaida-grade.js';
import {Resampler,Conditioner} from './audio-front.js';
const SR=16000,MODEL_BASE='https://kapadia100.github.io/noor-quran-app/models/';
let worker=null,ready=false,loadP=null;const pending=new Map();let jobId=0;
const base=()=>import.meta.env.BASE_URL||'/';
export const modelCached=()=>{try{return localStorage.getItem('qsCtc')==='1'}catch{return false}};
function getWorker(){if(worker)return worker;
 worker=new Worker(base()+'recite-worker.js',{type:'module'});
 worker.onmessage=e=>{const m=e.data;
  if(m.type==='progress')loadP?.onp?.(m.total?Math.min(99,Math.round(100*m.loaded/m.total)):0);
  else if(m.type==='ready'){ready=true;try{localStorage.setItem('qsCtc','1')}catch{/* optional */}loadP?.res();}
  else if(m.type==='error'){if(!ready)loadP?.rej(new Error(m.message));else{for(const [,p] of pending)p(null);pending.clear()}}
  else if(m.type==='run'){const p=pending.get(m.id);if(p){pending.delete(m.id);p(m.lp&&m.T?{lp:m.lp,T:m.T}:null)}}};
 return worker}
/** Loads (and on first use downloads) the model; progress 0..99. */
export function ensureModel(onp){if(ready)return Promise.resolve();
 if(loadP)return loadP.p;let res,rej;const p=new Promise((a,b)=>{res=a;rej=b});loadP={p,res,rej,onp};
 p.catch(()=>{try{worker?.terminate()}catch{/* ignore */}worker=null;loadP=null});
 getWorker().postMessage({type:'load',base:(typeof localStorage!=='undefined'&&localStorage.getItem('qsAsrBase'))||MODEL_BASE});return p}
export function releaseModel(){try{worker?.terminate()}catch{/* ignore */}worker=null;ready=false;loadP=null;for(const [,p] of pending)p(null);pending.clear()}
const decode=audio=>new Promise(res=>{const id=++jobId;pending.set(id,res);getWorker().postMessage({type:'run',id,audio},[audio.buffer])});

/**
 * o: {mode:'along'|'check', n:number of slots, words:[expected word per slot] (check), onPos(n), onGrade(i,'ok'|'nc'), onStatus(kind), onLevel(v), onDone()}
 * Returns a controller. pos = number of slots followed so far (the next expected slot index).
 */
export function createLive(o){
 const check=o.mode==='check';
 const S={pace:new Pace({hangFrames:check?20:14}),offset:0,pos:0,end:0,chunks:[],bursts:[],grades:{},open:0,stopped:false,mic:null,hearing:false,t:0,done:false,hold:false,maxDb:-120};
 const total=()=>S.offset+S.pace.items;
 const setPos=()=>{const n=Math.max(0,Math.min(o.n,total()));if(n!==S.pos){S.pos=n;o.onPos?.(n)}};
 const slice=(t0,t1)=>{const s0=Math.max(0,Math.floor(t0*SR)),s1=Math.min(S.end,Math.floor(t1*SR));const out=new Float32Array(Math.max(0,s1-s0));
  for(const c of S.chunks){const a=Math.max(c.s,s0),b=Math.min(c.s+c.a.length,s1);if(b>a)out.set(c.a.subarray(a-c.s,b-c.s),a-s0)}return out};
 const finishIfDone=()=>{if(S.done||S.stopped)return;if(S.pos>=o.n&&S.open===0&&(!check||S.grades[o.n-1]!==undefined)){S.done=true;o.onDone?.()}};
 async function grade(slot,t0,t1){if(!check||slot<0||slot>=o.n)return;const a=slice(t0-0.3,t1+0.25);if(a.length<6400){return}
  S.open++;let h;try{h=await decode(a)}catch{h=null}S.open--;if(S.stopped)return;
  if(h){const g=gradeClosed(h.lp,h.T,o.words,slot,{margin:2,gap:14});S.grades[slot]=g.ok?'ok':'nc';o.onGrade?.(slot,g.ok?'ok':'nc')}else{S.grades[slot]='nc';o.onGrade?.(slot,'nc')}
  finishIfDone()}
 const onEvents=ev=>{for(const e of ev){
  if(e.type==='on'){S.bursts[e.i]={t0:e.t};setPos()}
  else if(e.type==='revoke'){S.bursts.length=Math.max(0,S.pace.items);setPos()}
  else if(e.type==='end'){const b=S.bursts[e.i]||(S.bursts[e.i]={t0:e.t-e.dur});b.t1=e.t;grade(S.offset+e.i,b.t0,b.t1);}}
  finishIfDone()};
 /** Feed 16 kHz mono samples (raw, no AGC) for pace + the conditioned copy for the model. */
 const ingest=(raw,cond)=>{if(S.stopped)return;
  if(S.hold){raw=new Float32Array(raw.length);if(cond)cond=new Float32Array(cond.length)}
  if(check){S.chunks.push({s:S.end,a:cond});const keep=S.end/SR-25;while(S.chunks.length>1&&(S.chunks[0].s+S.chunks[0].a.length)/SR<keep)S.chunks.shift()}
  S.end+=raw.length;S.t=S.end/SR;
  onEvents(S.pace.push(raw));
  const db=S.pace.lastDb;S.maxDb=Math.max(S.maxDb,db);o.onLevel?.(Math.max(0,Math.min(1,(db+80)/60)),{db,floor:S.pace.nf,trig:S.pace.trigger,items:S.pace.items,pos:S.pos});
  if(!S.hold&&S.pace.items===0&&S.offset===0&&!S.warned2&&S.t>=S.pace.c.warm*S.pace.c.frame/SR+5){S.warned2=true;o.onStatus?.(S.maxDb<-80?'dead':'quiet')}
  const hearing=S.pace.state===1;if(hearing!==S.hearing){S.hearing=hearing;o.onStatus?.(hearing?'hear':'listen')}
  const wt=S.pace.c.warm*S.pace.c.frame/SR;if(S.t<wt&&!S.warned){o.onStatus?.('warm')}else if(!S.warned){S.warned=true;o.onStatus?.('listen')}};
 const api={
  get pos(){return S.pos},get grades(){return S.grades},get listening(){return !!S.mic||!!S.fake},
  /** Learner tapped slot i: "I am here". The next burst belongs to slot i. */
  jump(i){S.offset=i-S.pace.items;setPos()},
  /** Mute the microphone feed while the app plays a reference sound (so it never hears itself). */
  hold(on){S.hold=!!on},
  get level(){return{db:S.pace.lastDb,floor:S.pace.nf,trig:S.pace.trigger}},
  /** Test / non-mic feed. */
  feed(raw){const cond=check?new Float32Array(raw):raw;ingest(raw,cond)},
  async start(){
   if(typeof window!=='undefined'&&window.__qFake){S.fake=true;o.onStatus?.('listen');return{ok:true}}
   if(!navigator.mediaDevices?.getUserMedia)return{ok:false,err:'nomic'};
   // iOS Safari only unlocks audio inside the tap: create + resume the AudioContext first, before any await (model download, permission prompt).
   const AC=window.AudioContext||window.webkitAudioContext;const ac=new AC();ac.resume?.().catch(()=>{});
   const fail=err=>{try{ac.close()}catch{/* ignore */}return{ok:false,err}};
   if(check)try{await ensureModel(o.onProgress)}catch{return fail('model')}
   let stream;const gum=a=>navigator.mediaDevices.getUserMedia({audio:a});
   try{try{stream=await gum({echoCancellation:true,noiseSuppression:true,autoGainControl:true,channelCount:1})}catch(e){if(e&&e.name==='OverconstrainedError')stream=await gum(true);else throw e}}
   catch(e){const n=e&&e.name;return fail(n==='NotFoundError'||n==='DevicesNotFoundError'?'nomic':n==='NotReadableError'||n==='TrackStartError'?'busy':'denied')}
   await ac.resume().catch(()=>{});
   if(ac.state!=='running'){stream.getTracks().forEach(t=>t.stop());return fail('suspended')}
   const src=ac.createMediaStreamSource(stream),proc=ac.createScriptProcessor(4096,1,1);const rs=new Resampler(ac.sampleRate,SR),hp=new Conditioner({agc:false}),cond=new Conditioner();
   S.mic={stream,ac,src,proc};
   ac.onstatechange=()=>{if(S.mic&&S.mic.ac===ac&&ac.state!=='running'&&!S.stopped){api.stop();o.onStatus?.('interrupted')}};
   proc.onaudioprocess=e=>{if(S.stopped)return;const r=rs.push(e.inputBuffer.getChannelData(0));if(!r.length)return;ingest(hp.process(r),check?cond.process(r):null)};
   src.connect(proc);proc.connect(ac.destination);o.onStatus?.('warm');
   try{navigator.wakeLock?.request('screen').then(l=>{if(S.stopped)l.release();else S.wl=l}).catch(()=>{})}catch{/* optional */}
   return{ok:true}},
  stop(){if(S.stopped)return;S.stopped=true;try{S.wl?.release()}catch{/* ignore */}
   if(S.mic){try{S.mic.proc.disconnect();S.mic.src.disconnect();S.mic.stream.getTracks().forEach(t=>t.stop());S.mic.ac.close()}catch{/* ignore */}S.mic=null}S.fake=false;o.onStatus?.('stopped')},
  /** Test hooks (webdriver): simulate one spoken burst / one decoded result without audio. */
  _burst(){if(!S.fake)return;S.pace.cnt++;S.bursts.push({t0:S.t});setPos();finishIfDone()},
  _grade(i,ok){if(!S.fake)return;S.grades[i]=ok?'ok':'nc';o.onGrade?.(i,ok?'ok':'nc');finishIfDone()}
 };
 return api}
