import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=name=>JSON.parse(fs.readFileSync(path.join(root,"content",name),"utf8"));
const catalog=read("hkl-source.json"), inventory=read("hkl-source-inventory.json"), assets=read("hkl-assets.json"), libraries=read("hkl-libraries.json");
const {localHref}=await import(new URL("../lib/hkl-links.ts",import.meta.url));
const normalize=value=>decodeURIComponent(new URL(value,"https://hkl.org").pathname).replace(/\/$/,"") || "/";
const paths=new Set(catalog.pages.map(p=>p.path));
const expected=new Set(inventory.expectedUrls.map(normalize));
const known=new Set(["/","/about","/values","/practices","/stories","/gatherings","/community","/walks","/the-hkl-time","/volunteer","/contact","/newsletter","/resources","/speakers","/movement","/practice-journey",...libraries.talks.map(t=>"/stories/"+t.slug),...libraries.practices.map(p=>"/practices/"+p.slug)]);
const missingPages=[...expected].filter(p=>!paths.has(p));
const emptyPages=catalog.pages.filter(p=>!p.blocks?.length && !p.externalRedirect).map(p=>p.path);
const brokenInternal=[];const missingImages=new Set();let textBlocks=0,embeds=0,forms=0;
for(const p of catalog.pages){
  for(const link of p.links || []){
    let url;try{url=new URL(link.url);}catch{continue;}
    if(!["hkl.org","www.hkl.org"].includes(url.hostname))continue;
    const mapped=normalize(localHref(link.url));
    if(!paths.has(mapped) && !known.has(mapped))brokenInternal.push({from:p.path,to:mapped});
  }
  for(const b of p.blocks || []){
    if(["p","h1","h2","h3","h4","li","blockquote"].includes(b.kind))textBlocks++;
    if(b.kind==="embed")embeds++;
    if(b.kind==="form")forms++;
    if(b.kind==="image"){
      const key=b.url.split("?")[0].split("#")[0];const local=assets[key];
      if(!local || !fs.existsSync(path.join(root,"public",local)))missingImages.add(key);
    }
  }
}
const locales=Object.fromEntries([...new Set(catalog.pages.map(p=>p.locale))].map(l=>[l,catalog.pages.filter(p=>p.locale===l).length]));
const english=catalog.pages.filter(p=>p.locale==="en");
const publication=english.find(p=>p.path==="/the-hkl-time");
const issueNumbers=new Set(publication.blocks.map(b=>/Issue\s*#?\s*(\d+)/i.exec(b.text || "")?.[1]).filter(Boolean));
const report={source:"https://hkl.org",checkedAt:catalog.checkedAt,expectedPages:expected.size,importedPages:paths.size,locales,englishPages:english.length,stories:libraries.talks.length,weeklyPractices:libraries.practices.length,boardProfiles:english.filter(p=>p.path.startsWith("/board-of-directors/")).length,speakerProfiles:english.filter(p=>p.path.startsWith("/canada-speakers/")).length,conferencePages:libraries.conferences.length,publicationIssues:issueNumbers.size,textBlocks,embeds,forms,localImages:Object.keys(assets).length,missingPages,emptyPages,brokenInternalLinks:[...new Map(brokenInternal.map(x=>[x.from+":"+x.to,x])).values()],imageFallbacks:[...missingImages],fetchFailures:catalog.failures};
fs.writeFileSync(path.join(root,"content","hkl-audit.json"),JSON.stringify(report,null,2));
const errors=[];
if(missingPages.length)errors.push("Missing sitemap pages");
if(emptyPages.length)errors.push("Empty content pages");
if(report.fetchFailures.length)errors.push("Failed source reads");
if(report.brokenInternalLinks.length)errors.push("Unresolved internal content links");
if(report.stories!==18 || report.weeklyPractices!==25 || report.boardProfiles!==7 || report.speakerProfiles!==12 || report.publicationIssues!==18)errors.push("Incomplete content library");
console.log(JSON.stringify({...report,brokenInternalLinks:report.brokenInternalLinks.slice(0,25),imageFallbacks:report.imageFallbacks.slice(0,8)},null,2));
if(errors.length){console.error(errors.join("; "));process.exitCode=1;}
