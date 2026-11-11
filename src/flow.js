// One continuous recording per surah (Quran.com chapter audio) plus the ayah
// and word times inside that same file. Playing this file never stops between ayahs.
export const CHAPTER={
 'ar.alafasy':7,
 'ar.husary':6,
 'ar.abdurrahmaansudais':3,
 'ar.shaatree':4,
 'ar.hanirifai':5,
 'ar.saoodshuraym':10,
 'ar.abdulsamad':2,
 'ar.abdulbasitmurattal':2,
 'ar.minshawi':9,
 'ar.minshawimujawwad':8
};
export const chapterId=reciter=>CHAPTER[reciter]||0;
/** Timestamps from a chapter_recitations response → [{a, from, to, segs:[[word, startMs, endMs]]}] */
export function parseTimings(audioFile){const raw=audioFile?.timestamps||audioFile?.verse_timings||[];const out=[];
 for(const t of raw){const a=+String(t.verse_key||'').split(':')[1];const from=+t.timestamp_from,to=+t.timestamp_to;
  if(!a||!isFinite(from)||!isFinite(to)||to<=from)continue;
  const segs=(t.segments||[]).filter(g=>g&&g.length>=3&&isFinite(+g[1])&&isFinite(+g[2])&&+g[2]>+g[1]).map(g=>[+g[0],+g[1],+g[2]]);
  out.push({a,from,to,segs})}
 out.sort((x,y)=>x.a-y.a);return out}
export function verse(flow,index){if(!flow)return null;return flow.by.get(index+1)||null}
/** Ayah index (0-based) sounding at timeMs inside the continuous file. */
export function ayahIndex(verses,ms){let i=0;for(let k=0;k<verses.length;k++){if(ms+15>=verses[k].from)i=k;else break}return i}
export function segsByAyah(verses){const m={};for(const v of verses)m[v.a]=v.segs;return m}
// Reciters whose one-file-per-surah recording comes with ayah times from the mp3quran ayat_timing data instead.
// [timing read id, folder]. Each surah is checked before use (all ayahs, in order, Bismillah present); a surah that fails
// plays from the joined per-ayah clips instead (see stitch.js), so it is still continuous.
export const MP3Q={
 'ar.ahmedajamy':[5,'ahmad-ajmi/r1'],
 'ar.muhammadayyoub':[109,'muhammad-ayyub/r1'],
 'ar.abdullahbasfar':[60,'abdullah-basfar/r1'],
 'ar.ibrahimakhbar':[1,'ibrahim-akhdar/r1'],
 'ar.husarymujawwad':[119,'mahmoud-husary/r2']
};
export const mp3qOf=reciter=>MP3Q[reciter]||null;
export const mp3qUrl=(folder,s)=>`https://cdn.mp3quran.net/audio/${folder}/${String(s).padStart(3,'0')}.mp3`;
/** mp3quran ayat_timing rows → verses. Row 0 (isti'adha / Bismillah intro) is folded into ayah 1 so playing from the start keeps it. */
export function parseMp3q(rows){if(!Array.isArray(rows))return [];const out=[];let intro=null;
 for(const r of rows){const a=+r.ayah,from=+r.start_time,to=+r.end_time;if(!isFinite(from)||!isFinite(to))continue;if(a===0){intro={from,to};continue}if(a>0)out.push({a,from,to,segs:[]})}
 out.sort((x,y)=>x.a-y.a);if(out[0]&&out[0].a===1){out[0].introMs=Math.max(intro?intro.to:0,out[0].from);out[0].from=0}return out}
/** A surah's timings are only used when every ayah 1..n is there once, in time order, each with a length.
 *  Then each ayah runs until the next one starts (some data leaves a hole or an overlap there). Otherwise null. */
export function tidy(verses,n,{s=0,needIntro=false}={}){if(!Array.isArray(verses)||verses.length!==n)return null;
 for(let k=0;k<n;k++){const v=verses[k];if(v.a!==k+1||!(v.to>v.from))return null;if(k&&!(v.from>verses[k-1].from))return null}
 if(needIntro&&s!==1&&s!==9&&!((verses[0].introMs??1e9)>=1500))return null;
 return verses.map((v,k)=>({...v,to:k+1<n?verses[k+1].from:v.to}))}
