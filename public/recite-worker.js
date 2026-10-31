// Live tutor: on-device Quran speech model (16M-parameter CTC Conformer, int8, ~19 MB) in a Web Worker.
// Audio never leaves the device; only the model/runtime are downloaded once and cached.
let sess=null,ort=null,core=null,loading=null;const TOTAL=18850806;
async function getModel(url,onp){try{return await getModel1(url,onp)}catch(e){// one retry: a dropped connection mid-download on mobile
 await new Promise(r=>setTimeout(r,800));return getModel1(url,onp,e)}}
async function getModel1(url,onp,prev){let c=null;try{c=await caches.open('qs-asr-model')}catch{/* no Cache API here: download each session */}let r=c?await c.match(url).catch(()=>null):null;
 if(!r){const res=await fetch(url,{cache:prev?'reload':'default'});if(!res.ok)throw new Error('HTTP '+res.status+' for '+url.split('/').slice(-2).join('/'));const total=+res.headers.get('content-length')||TOTAL;const rd=res.body.getReader(),parts=[];let got=0;
  for(;;){const {done,value}=await rd.read();if(done)break;parts.push(value);got+=value.length;onp(got,total)}
  r=new Response(new Blob(parts),{headers:{'content-type':'application/octet-stream'}});try{await c?.put(url,r.clone())}catch{/* quota: still works this session */}}
 return new Uint8Array(await r.arrayBuffer())}
let stage='start';
const env_=()=>({coi:self.crossOriginIsolated===true,sab:typeof SharedArrayBuffer!=='undefined',wasm:typeof WebAssembly==='object',caches:typeof caches!=='undefined',ua:navigator.userAgent});
async function load(base){stage='core';core=await import('./ctc-core.js');stage='runtime';ort=await import(base+'rt/ort.wasm.min.mjs');
 const env=ort.env;env.wasm.numThreads=1;env.wasm.proxy=false;env.wasm.wasmPaths={mjs:base+'rt/ort-wasm-simd-threaded.mjs',wasm:base+'rt/ort-wasm-simd-threaded.wasm'};
 stage='model';const bytes=await getModel(base+'qs-ctc/model.int8.onnx',(l,t)=>postMessage({type:'progress',loaded:l,total:t}));
 stage='session';sess=await ort.InferenceSession.create(bytes,{executionProviders:['wasm'],graphOptimizationLevel:'all'})}
self.onmessage=async e=>{const m=e.data;
 if(m.type==='load'){try{loading??=load(m.base);await loading;postMessage({type:'ready'})}catch(err){loading=null;postMessage({type:'error',stage,message:String(err?.message||err),name:err?.name||'',stack:String(err?.stack||'').slice(0,800),env:env_()})}return}
 if(m.type==='run'){const t0=performance.now();let words=[],lpOut=null,T=0;
  try{if(m.audio.length>=6400){const fb=core.fbank(m.audio);
   const o=await sess.run({x:new ort.Tensor('float32',fb.data,[1,fb.T,80]),x_lens:new ort.Tensor('int64',BigInt64Array.from([BigInt(fb.T)]),[1])});
   const lp=o.log_probs;words=core.heardWords(core.greedy(lp.data,lp.dims[1]).chars).map(x=>({s:x.s,t0:x.t0,t1:x.t1}));lpOut=new Float32Array(lp.data);T=lp.dims[1]}}catch(err){postMessage({type:'error',message:String(err?.message||err)});words=[]}
  postMessage({type:'run',id:m.id,words,lp:lpOut,T,ms:Math.round(performance.now()-t0)},lpOut?[lpOut.buffer]:[])}};
