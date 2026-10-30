import {test,expect} from '@playwright/test';
test('app icon: manifest any+maskable, opaque apple-touch, favicons, install page',async({page})=>{await page.goto('./');
 const m=await (await page.request.get('./manifest.webmanifest')).json();expect(m.icons.map(i=>i.purpose)).toEqual(['any','any','maskable','maskable']);
 for(const i of m.icons)expect((await page.request.get('./'+i.src)).ok()).toBeTruthy();
 for(const f of['apple-touch-icon.png','favicon-32.png','favicon-48.png','favicon.ico'])expect((await page.request.get('./'+f)).ok()).toBeTruthy();
 const op=await page.evaluate(async()=>{const im=new Image();im.src='apple-touch-icon.png';await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);const d=g.getImageData(0,0,c.width,c.height).data;for(let i=3;i<d.length;i+=4)if(d[i]<255)return false;return [im.width,im.height]});expect(op).toEqual([180,180]);
 await page.goto('./install/');await expect(page.locator('img.icon')).toBeVisible();if(process.env.SHOTS)await page.screenshot({path:'/workspace/shots395/install-page.png'})});
test('install banner shows new icon',async({page})=>{await page.goto('./');const b=page.locator('#instBanner img');if(await b.count()){await expect(b).toBeVisible();expect(await b.evaluate(i=>i.naturalWidth)).toBe(192);if(process.env.SHOTS)await page.screenshot({path:'/workspace/shots395/in-app-banner.png'})}});
