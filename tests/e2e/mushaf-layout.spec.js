import{test,expect}from'@playwright/test';
for(const p of[1,2,604])test('mushaf page '+p+': text inside .mt, top-aligned, roomy lines',async({page})=>{await page.goto('./#/mushaf/'+p);await page.waitForSelector('.mt .mv');
 const r=await page.evaluate(()=>{const m=document.querySelector('.mushaf'),t=m.querySelector('.mt'),f=t.firstElementChild;const fs=parseFloat(getComputedStyle(t).fontSize),lh=parseFloat(getComputedStyle(t).lineHeight);
  return{out:m.querySelectorAll(':scope > .mv, :scope > .sh').length,inMt:t.querySelectorAll('.mv').length,gap:f.getBoundingClientRect().top-m.getBoundingClientRect().top,ratio:lh/fs,w:t.scrollWidth-t.clientWidth}});
 expect(r.out).toBe(0);expect(r.inMt).toBeGreaterThan(0);expect(r.gap).toBeLessThan(90);expect(r.ratio).toBeGreaterThanOrEqual(2.2);expect(r.w).toBeLessThanOrEqual(1)});
