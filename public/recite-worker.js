// Live tutor: on-device Quran speech model (16M-parameter CTC Conformer, int8, ~19 MB) in a Web Worker.
// Audio never leaves the device; only the model/runtime are downloaded once and cached.
let sess=null,ort=null,core=null,loading=null;const TOTAL=18850806;
async function getModel(url,onp){const c=await caches.open('qs-asr-model');let r=await c.match(url);
 if(!r){const res=await fetch(url);if(!res.ok)throw new Error('HTTP '+res.status);const total=+res.headers.get('content-length')||TOTAL;const rd=res.body.getReader(),parts=[];let got=0;
  for(;;){const {done,value}=await rd.read();if(done)break;parts.push(value);got+=value.length;onp(got,total)}
  r=new Response(new Blob(parts),{headers:{'content-type':'application/octet-stream'}});try{await c.put(url,r.clone())}catch{/* quota: still works this session */}}
 return new Uint8Array(await r.arrayBuffer())}
async function load(base){core=await import('./ctc-core.js');ort=await import(base+'rt/ort.wasm.min.mjs');
 const env=ort.env;env.wasm.numThreads=1;env.wasm.proxy=false;env.wasm.wasmPaths={mjs:base+'rt/ort-wasm-simd-threaded.mjs',wasm:base+'rt/ort-wasm-simd-threaded.wasm'};
 const bytes=await getModel(base+'qs-ctc/model.int8.onnx',(l,t)=>postMessage({type:'progress',loaded:l,total:t}));
 sess=await ort.InferenceSession.create(bytes,{executionProviders:['wasm'],graphOptimizationLevel:'all'})}
self.onmessage=async e=>{const m=e.data;
 if(m.type==='load'){try{loading??=load(m.base);await loading;postMessage({type:'ready'})}catch(err){loading=null;postMessage({type:'error',message:String(err?.message||err)})}return}
 if(m.type==='run'){const t0=performance.now();let words=[];
  try{if(m.audio.length>=6400){const fb=core.fbank(m.audio);
   const o=await sess.run({x:new ort.Tensor('float32',fb.data,[1,fb.T,80]),x_lens:new ort.Tensor('int64',BigInt64Array.from([BigInt(fb.T)]),[1])});
   const lp=o.log_probs;words=core.heardWords(core.greedy(lp.data,lp.dims[1]).chars).map(x=>({s:x.s,t0:x.t0,t1:x.t1}))}}catch(err){postMessage({type:'error',message:String(err?.message||err)});words=[]}
  postMessage({type:'run',id:m.id,words,ms:Math.round(performance.now()-t0)})}};
