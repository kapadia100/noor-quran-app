import {chromium} from 'playwright';
const [,, tag='base', modes='light,dark', only=''] = process.argv;
const B='http://127.0.0.1:4173/';
const SC={home:['#/','.pcard'],quran:['#/quran','#sl li'],reader:['#/surah/1','.ayah'],readerTj:['#/surah/1?tj','.ayah'],live:['#/recite/1/1','.ayah'],hifztest:['#/hifztest','main *'],qaida:['#/qaida','main *'],lesson:['#/qaida/huroof','main *'],hadith:['#/hadith','main *'],hbook:['#/hadith/bukhari','main *'],dict:['#/dict','main *'],dictcards:['#/dict/quiz/cards','main *'],more:['#/more','main *'],faq:['#/help','main *'],settings:['#/settings','main *'],ibadat:['#/ibadat','main *'],prayer:['#/prayer','.ptimes li'],tasbeeh:['#/tasbeeh','main *'],mushaf:['#/mushaf/1','main *'],recitepick:['#/recite','main *']};
const br=await chromium.launch({executablePath:process.env.CHROME||undefined});
for(const mode of modes.split(',')){
 const ctx=await br.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,timezoneId:'Asia/Karachi',geolocation:{latitude:24.8607,longitude:67.0011},permissions:['geolocation']});
 await ctx.addInitScript(([d])=>{if(!sessionStorage.getItem('qsS')){sessionStorage.setItem('qsS','1');localStorage.setItem('instBanner','1');localStorage.setItem('settings',JSON.stringify({dark:d}));localStorage.setItem('lastRead',JSON.stringify({s:1,a:1,name:'Al-Fatiha'}))}},[mode==='dark']);
 const pg=await ctx.newPage();pg.on('pageerror',e=>console.log('ERR',e.message));
 for(const [n,[h,w]] of Object.entries(SC)){ if(only&&!only.split(',').includes(n))continue;
  await pg.goto(B+h.replace('?tj',''));await pg.waitForSelector(w,{timeout:20000}).catch(()=>{});await pg.waitForTimeout(1200);
  if(n==='readerTj'){await pg.evaluate(()=>localStorage.setItem('qsTjR','1'));await pg.reload();await pg.waitForTimeout(1500)}

  const bad=await pg.evaluate(()=>{const P=c=>{const m=c.match(/rgba?\(([^)]+)\)/);if(!m)return null;const a=m[1].split(/[ ,\/]+/).map(Number);return {r:a[0],g:a[1],b:a[2],a:a.length>3?a[3]:1}};
   const lin=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};const L=c=>.2126*lin(c.r)+.7152*lin(c.g)+.0722*lin(c.b);
   const cr=(x,y)=>{const a=L(x),b=L(y);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
   const over=(f,b)=>({r:f.r*f.a+b.r*(1-f.a),g:f.g*f.a+b.g*(1-f.a),b:f.b*f.a+b.b*(1-f.a),a:1});
   const bgOf=el=>{const st=[];for(let e=el;e;e=e.parentElement){const cs=getComputedStyle(e);if(cs.backgroundImage&&cs.backgroundImage!=='none'&&/gradient/.test(cs.backgroundImage)){const cols=[...cs.backgroundImage.matchAll(/rgba?\([^)]+\)/g)].map(m=>P(m[0])).filter(c=>c&&c.a>.5);if(cols.length){st.push(cols[Math.floor(cols.length/2)]);break}}const c=P(cs.backgroundColor);if(c&&c.a>0){st.push(c);if(c.a>=1)break}}
    let b={r:246,g:240,b:226,a:1};if(document.documentElement.dataset.theme==='dark')b={r:27,g:33,b:24,a:1};for(const c of st.reverse())b=over(c,b);return b};
   const out=[];const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){if(!n.nodeValue.trim())continue;const el=n.parentElement;if(!el||el.closest('svg,script,style'))continue;const r=el.getBoundingClientRect();if(r.width<2||r.height<2||r.bottom<0||r.top>innerHeight)continue;const cs=getComputedStyle(el);if(cs.visibility==='hidden'||+cs.opacity===0||cs.display==='none')continue;
    let op=1;for(let e=el;e;e=e.parentElement)op*=+getComputedStyle(e).opacity;const fg=P(cs.color);if(!fg)continue;const bg=bgOf(el);const f=over({...fg,a:fg.a*op},bg);const c=cr(f,bg);const big=parseFloat(cs.fontSize)>=24||(parseFloat(cs.fontSize)>=18.6&&+cs.fontWeight>=700);if(c<(big?3:4.5))out.push(c.toFixed(2)+' '+(el.className||el.tagName)+' "'+n.nodeValue.trim().slice(0,28)+'"')}
   return [...new Set(out)].slice(0,12)});
  if(bad.length)console.log('LOW',mode,n,JSON.stringify(bad));
  await pg.screenshot({path:`/tmp/au-${mode}-${n}.png`});}
 await ctx.close()}
await br.close();
