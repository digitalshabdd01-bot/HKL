"use client";
import useEditorial from "./useEditorial";
import { useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { practices } from "../lib/hkl-content";
import { imageSrc } from "../lib/hkl-links";

const practiceImages: Record<string, string> = {
  "oct-20-2026": "practices/practice-divine-grace.png",
  "oct-10-2026": "practices/practice-unity.png",
  "sep-30-2026": "practices/practice-peacefulness.png",
  "face-of-love": "practices/practice-face-of-love.png",
  "experience-love-humility-through-breath": "practices/practice-breathe.png",
  "bring-mind-back-to-body-present-moment": "practices/practice-present.png",
  "lower-your-head-let-chin-touch-body-feel-presence": "practices/practice-bow.png",
  "july-29-2026": "practices/practice-awake-eating.png",
  "18-july-2026": "practices/practice-everlasting.png",
};

export default function PracticeLibrary() {
  const { items: sourcePractices, loading, error, retry } = useEditorial("practice", practices);
  const [query,setQuery]=useState("");
  const [limit,setLimit]=useState(9);
  const results=sourcePractices.filter(p=>`${p.title} ${p.date} ${p.summary}`.toLowerCase().includes(query.trim().toLowerCase()));
  if (loading) return <p role="status">Loading weekly practices…</p>;
  if (error) return <div role="alert"><p>{error}</p><button onClick={retry}>Try again</button></div>;
  return <><label className="search-field practice-search"><Search size={17}/><span className="sr-only">Search weekly practices</span><input type="search" value={query} onChange={e=>{setQuery(e.target.value);setLimit(9);}} placeholder="Search by practice, date, or reflection"/></label><p className="results-count" role="status">{results.length} weekly practices</p><div className="practice-library">{results.slice(0,limit).map((p,i)=><a className="practice-preview" href={`/practices/${p.slug}`} key={p.slug}><div><img src={imageSrc(practiceImages[p.slug] || p.image)} alt={`${p.title} practice video`} loading="lazy"/><span>{p.order===0 ? "CURRENT WEEKLY PRACTICE" : "FROM THE PRACTICE ARCHIVE"}</span></div><time dateTime={p.isoDate || undefined}>{p.date}</time><h3>{p.title}</h3><p>{p.summary}</p><span className="practice-preview-link">Read the complete practice <ArrowUpRight size={17}/></span></a>)}</div>{results.length>limit && <div className="load-more"><button className="button button-green" onClick={()=>setLimit(n=>n+9)}>More weekly practices <ArrowUpRight size={17}/></button></div>}{results.length===0 && <div className="empty-results"><h3>No practices found.</h3><p>Try another word or date.</p></div>}</>;
}
