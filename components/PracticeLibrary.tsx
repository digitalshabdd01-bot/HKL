"use client";
import { useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { practices } from "../lib/hkl-content";
import { imageSrc } from "../lib/hkl-links";

export default function PracticeLibrary() {
  const [query,setQuery]=useState("");
  const [limit,setLimit]=useState(9);
  const results=practices.filter(p=>`${p.title} ${p.date} ${p.summary}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <><label className="search-field practice-search"><Search size={17}/><span className="sr-only">Search weekly practices</span><input type="search" value={query} onChange={e=>{setQuery(e.target.value);setLimit(9);}} placeholder="Search by practice, date, or reflection"/></label><p className="results-count" role="status">{results.length} weekly practices</p><div className="practice-library">{results.slice(0,limit).map((p,i)=><a className="practice-preview" href={`/practices/${p.slug}`} key={p.slug}><div><img src={imageSrc(p.image)} alt={`${p.title} practice video`} loading="lazy"/><span>{p.order===0 ? "CURRENT WEEKLY PRACTICE" : "FROM THE PRACTICE ARCHIVE"}</span></div><time dateTime={p.isoDate || undefined}>{p.date}</time><h3>{p.title}</h3><p>{p.summary}</p><span className="practice-preview-link">Read the complete practice <ArrowUpRight size={17}/></span></a>)}</div>{results.length>limit && <div className="load-more"><button className="button button-green" onClick={()=>setLimit(n=>n+9)}>More weekly practices <ArrowUpRight size={17}/></button></div>}{results.length===0 && <div className="empty-results"><h3>No practices found.</h3><p>Try another word or date.</p></div>}</>;
}
