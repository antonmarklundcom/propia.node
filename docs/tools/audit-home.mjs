import { chromium } from 'playwright';
const b = await chromium.launch();
for (const [name, url] of [['inm','https://inmobiliaria.com.py/'],['reip','https://realestateinparaguay.com/']]) {
  for (const [vp,w,h] of [['desk',1440,900],['mob',390,844]]) {
    const p = await b.newPage({ viewport:{width:w,height:h}});
    const errs=[]; p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
    p.on('response', r=>{ if(r.status()>=400) errs.push(`HTTP ${r.status()} ${r.url()}`); });
    const t0=Date.now(); await p.goto(url,{waitUntil:'networkidle',timeout:60000});
    await p.evaluate(async()=>{ for(let y=0;y<document.body.scrollHeight;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,120));} window.scrollTo(0,0); });
    await p.screenshot({path:`${name}-${vp}.png`, fullPage:true});
    const info = await p.evaluate(()=>({title:document.title, h1:[...document.querySelectorAll('h1')].map(e=>e.textContent.trim()), lang:document.documentElement.lang, canonical:document.querySelector('link[rel=canonical]')?.href, desc:document.querySelector('meta[name=description]')?.content, hreflang:[...document.querySelectorAll('link[rel=alternate]')].map(l=>l.hreflang+':'+l.href), imgsNoAlt:[...document.querySelectorAll('img')].filter(i=>!i.alt).length, imgs:document.querySelectorAll('img').length, scrollW:document.documentElement.scrollWidth, height:document.body.scrollHeight}));
    console.log(name,vp,JSON.stringify(info,null,1), 'load ms',Date.now()-t0, 'errors:',errs.slice(0,15));
    await p.close();
  }
}
await b.close();
