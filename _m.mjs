import {chromium} from 'playwright';
const br=await chromium.launch({executablePath:process.env.CHROME});const ctx=await br.newContext({viewport:{width:390,height:844}});
await ctx.addInitScript(()=>{localStorage.setItem('instBanner','1')});const pg=await ctx.newPage();await pg.goto('http://127.0.0.1:4173/');await pg.waitForSelector('.pcard');await pg.waitForTimeout(800);
console.log(await pg.evaluate(()=>{const r=e=>{const b=e.getBoundingClientRect();return Math.round(b.top)+'+'+Math.round(b.height)};const p=document.querySelector('.pcard');return [...p.children].map(c=>c.className+' '+r(c)+' '+[...c.children].map(x=>x.className+':'+r(x)).join(' | ')).concat('pcard '+r(p))}));await br.close()
