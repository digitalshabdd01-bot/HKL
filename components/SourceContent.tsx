import { ArrowUpRight } from "lucide-react";
import type { SourceBlock } from "../lib/hkl-source";
import { getSourcePage, sourceHtml, sourceImage } from "../lib/hkl-source";
import { localHref, mapForImage } from "../lib/hkl-links";
import SourceForm from "./SourceForm";

function Embed({ block }: { block: SourceBlock }) {
  const url=block.url || "";
  const youtube=/youtube(?:-nocookie)?\.com\/embed\/([^?&/]+)/.exec(url);
  const safe=youtube ? `https://www.youtube-nocookie.com/embed/${youtube[1]}?rel=0` : url;
  if (url.includes("covver.com")) return null;
  const signup=url.includes("sibforms.com");
  const calendar=url.includes("luma.com");
  const poll=url.includes("voting-poll");
  const donation=url.includes("stripe-donation");
  const title=block.text && block.text!=="Youtube Video" ? block.text.replace(/\s*[—–-]\s*test form/i,"") : youtube ? "HKL talk and reflection" : signup ? "Receive weekly practices by email" : calendar ? "Upcoming HKL Walks" : poll ? "HKL daily practice check-in" : "HKL community resource";
  return <div className={`source-embed ${youtube ? "youtube" : signup ? "signup" : donation ? "donation" : ""}`}><iframe title={title} src={safe} loading="lazy" allow={youtube ? "encrypted-media; picture-in-picture; fullscreen" : undefined} allowFullScreen={!!youtube}/><a href={youtube ? `https://www.youtube.com/watch?v=${youtube[1]}` : url} target="_blank" rel="noreferrer">{youtube ? "Watch on YouTube" : "Open this resource"} <ArrowUpRight size={12}/></a></div>;
}

function MediaGroup({ blocks, imageSet }: { blocks: SourceBlock[]; imageSet?: string[] }) {
  return <div className={`source-gallery ${blocks.length===1 ? "single" : ""}`}>{blocks.map((b,i) => {
    // Imported Mapbox static images require an access token. Preserve the venue
    // coordinates in an attributed public map rather than requesting a broken image.
    const map = mapForImage(b.url || "");
    return <figure key={`${b.url}-${i}`}>{map ? <><iframe title={b.alt || "HKL venue location"} src={map.embed} loading="lazy" style={{ width: "100%", height: "auto", aspectRatio: "8 / 5", border: 0, display: "block" }}/><figcaption><a href={map.href} target="_blank" rel="noreferrer">View location on OpenStreetMap ↗</a></figcaption></> : <a href={sourceImage(b.url!)} target="_blank" rel="noreferrer" aria-label={`View ${b.alt || "HKL photograph"}`}><img src={sourceImage(b.url!)} alt={b.alt && !/placeholder|editable/i.test(b.alt) ? b.alt : "A photograph from the HKL movement"} loading="lazy"/></a>}</figure>;
  })}</div>;
}

export function SourceBlocks({ blocks, sourceUrl, omitHeading, formTitle, imageSet, imageOffset = 0 }: { blocks: SourceBlock[]; sourceUrl: string; omitHeading?: string; formTitle?: string; imageSet?: string[]; imageOffset?: number }) {
  const output: React.ReactNode[]=[];
  let imageIndex = 0;
  for(let i=0;i<blocks.length;i++) {
    const b=blocks[i];
    if(b.text && ["|","0","0 Mil","0 K","0,000,000 +","Loading globe data…","Read more","Install"].includes(b.text)) continue;
    if(b.text===omitHeading && /^(h1|h2|p)$/.test(b.kind)) continue;
    if(b.kind==="image") {
      if(b.url?.includes("i.ytimg.com") && blocks[i+1]?.kind==="embed" && blocks[i+1]?.url?.includes("youtube")) continue;
      const images=[b];while(blocks[i+1]?.kind==="image")images.push(blocks[++i]);
      const displayImages=imageSet?.length ? images.map((img,index)=>{
        const directReference=/person|people|speaker|conference|attendee|board|foundation|minister|mayor|baba|annie|dr\.|auntie|company|organization/i.test(img.alt || "");
        return directReference ? img : {...img,url:imageSet[(imageOffset + imageIndex + index) % imageSet.length]};
      }) : images;
      imageIndex += images.length;
      if(images.length>8)output.push(<details className="source-gallery-expand" key={i}><summary>Explore the photographs <span>{images.length} images</span></summary><MediaGroup blocks={displayImages}/></details>);
      else output.push(<MediaGroup key={i} blocks={displayImages}/>);
    } else if(b.kind==="country") {
      const countries=[b];while(blocks[i+1]?.kind==="country")countries.push(blocks[++i]);
      output.push(<details className="source-countries" key={i}><summary>Around the world <span>{countries.length} countries & territories</span></summary><div>{countries.map(c=><span key={c.text}><img src={c.url} alt="" loading="lazy"/>{c.text}</span>)}</div></details>);
    } else if(b.kind==="embed") output.push(<Embed key={i} block={b}/>);
    else if(b.kind==="video") output.push(<video key={i} className="source-video" controls preload="none" src={b.url}>Your browser does not support this video. <a href={b.url}>Open the video</a></video>);
    else if(b.kind==="link") output.push(<a key={i} className="source-action" href={localHref(b.url!)} {...(b.url?.startsWith("https://") && !b.url.includes("hkl.org") ? {target:"_blank",rel:"noreferrer"} : {})}>{b.text}<ArrowUpRight size={15}/></a>);
    else if(b.kind==="form") output.push(<div key={i}>{b.intro?.length ? <SourceBlocks blocks={b.intro} sourceUrl={sourceUrl} imageSet={imageSet} imageOffset={imageOffset}/> : null}<SourceForm fields={b.fields || []} sourceUrl={sourceUrl} title={formTitle || "Share your experience"}/></div>);
    else if((b.kind==="h1" || b.kind==="h2") && (b.text?.length || 0)>145) output.push(<p className="source-lead" key={i}>{b.text}</p>);
    else if(b.kind==="h1" || b.kind==="h2") output.push(<h2 className="source-heading" key={i} id={`content-${i}`}>{b.text}</h2>);
    else if(b.kind==="h3" || b.kind==="h4") output.push(<h3 className="source-subheading" key={i} id={`content-${i}`}>{b.text}</h3>);
    else if(b.kind==="blockquote") output.push(<blockquote key={i} dangerouslySetInnerHTML={{__html:sourceHtml(b.html || b.text || "")}}/>);
    else if(b.kind==="li") output.push(<div className="source-list-item" key={i} dangerouslySetInnerHTML={{__html:sourceHtml(b.html || b.text || "")}}/>);
    else if(b.kind==="p") output.push(<p key={i} id={b.text==="Sam Demma" ? "sam-demma" : undefined} dangerouslySetInnerHTML={{__html:sourceHtml(b.html || (b.text || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"))}}/>);
  }
  return <div className="source-content">{output}</div>;
}

export function SourceSection({ path, title, formTitle }: { path: string; title?: string; formTitle?: string }) {
  const page=getSourcePage(path);
  if(!page || !page.blocks.length) return null;
  return <section className="section-pad source-section"><div className="container source-reading">{title && <><span className="eyebrow">EXPLORE HKL</span><h2>{title}</h2></>}<SourceBlocks blocks={page.blocks} sourceUrl={page.url} omitHeading={title===page.heading ? page.heading : undefined} formTitle={formTitle}/></div></section>;
}
