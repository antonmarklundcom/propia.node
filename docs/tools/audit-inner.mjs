import { chromium } from 'playwright';
const b = await chromium.launch();
const paths=['/venta','/alquiler','/venta/asuncion','/nosotros','/contacto','/precios','/proyectos','/agentes','/guias','/publicar','/vender','/tasacion'];
const out=[];
for (const host of ['https://inmobiliaria.com.py','https://realestateinparaguay.com']) {
  const ctx = await b.newContext({viewport:{width:1440,height:900}});
  const p = await ctx.newPage();
  let slug=null;
  for (const path of [...paths,'__detail']) {
    let url = host+path;
    if(path==='__detail'){ if(!slug) continue; url=host+slug; }
    const errs=[]; p.on('response', r=>{ if(r.status()>=400) errs.push(`${r.status()} ${r.url().replace(host,'')}`); });
    try{
      const r = await p.goto(url,{waitUntil:'networkidle',timeout:60000});
      const info = await p.evaluate(()=>({title:document.title, h1:[...document.querySelectorAll('h1')].map(e=>e.textContent.trim()).join(' | ').slice(0,80), h2:[...document.querySelectorAll('h2')].slice(0,4).map(e=>e.textContent.trim().slice(0,30)).join(' | '), sw:document.documentElement.scrollWidth, emoji:(document.body.innerText.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu)||[]).length, firstListing:document.querySelector('a[href^="/propiedad/"]')?.getAttribute('href')}));
      if(!slug && info.firstListing) slug=info.firstListing;
      out.push([host.replace('https://',''),path,r.status(),info.sw,info.emoji,info.title.slice(0,60),info.h1,info.h2,errs.slice(0,3).join('; ')]);
    }catch(e){ out.push([host,path,'ERR',e.message.slice(0,60)]); }
    p.removeAllListeners('response');
  }
  // mobile check
  await p.setViewportSize({width:390,height:844});
  for (const path of ['/venta','/venta/asuncion', slug].filter(Boolean)) { await p.goto(host+path,{waitUntil:'networkidle',timeout:60000}); const sw=await p.evaluate(()=>document.documentElement.scrollWidth); out.push([host.replace('https://',''),path+' @390','-',sw]); }
  await p.screenshot({path:`${host.includes('inmob')?'inm':'reip'}-detail-mob.png`,fullPage:true});
  await p.setViewportSize({width:1440,height:900});
  await p.goto(host+'/venta/asuncion',{waitUntil:'networkidle'}); await p.screenshot({path:`${host.includes('inmob')?'inm':'reip'}-cat.png`,fullPage:true});
  if(slug){ await p.goto(host+slug,{waitUntil:'networkidle'}); await p.screenshot({path:`${host.includes('inmob')?'inm':'reip'}-detail.png`,fullPage:true}); }
  await ctx.close();
}
for(const r of out) console.log(r.join(' || '));
await b.close();
