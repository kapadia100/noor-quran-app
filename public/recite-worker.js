// Practice help: on-device speech recognition worker. Audio stays on the device; only the model/runtime are downloaded once and cached.
let asr=null,loading=null;
async function load(base,model){const T=await import(base+'rt/tjs.js');const {env,pipeline}=T;
 env.allowLocalModels=false;env.remoteHost=base;env.remotePathTemplate='{model}/';env.useBrowserCache=true;
 try{env.backends.onnx.wasm.numThreads=1;env.backends.onnx.wasm.wasmPaths={mjs:base+'rt/ort-wasm-simd-threaded.mjs',wasm:base+'rt/ort-wasm-simd-threaded.wasm'}}catch{/* ignore */}
 const files={};
 asr=await pipeline('automatic-speech-recognition',model,{dtype:'q8',device:'wasm',progress_callback:p=>{
  if(p.status==='progress'&&p.file){files[p.file]=[p.loaded||0,p.total||0];let l=0,t=0;for(const [a,b] of Object.values(files)){l+=a;t+=b}postMessage({type:'progress',loaded:l,total:t})}}});
 return asr}
self.onmessage=async e=>{const m=e.data;
 if(m.type==='load'){try{loading??=load(m.base,m.model);await loading;postMessage({type:'ready'})}catch(err){loading=null;postMessage({type:'error',message:String(err?.message||err)})}return}
 if(m.type==='tx'){const t0=performance.now();let text='';try{if(m.audio.length>1600){let a=m.audio;const o={language:'arabic',task:'transcribe'};if(m.second){a=new Float32Array(m.audio.length+6400);a.set(m.audio,3200);o.num_beams=4}text=(await asr(a,o)).text||''}}catch{text=''}
  postMessage({type:'tx',id:m.id,text,ms:Math.round(performance.now()-t0)})}};
