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
