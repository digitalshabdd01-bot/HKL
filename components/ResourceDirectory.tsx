"use client";
import { useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { localHref } from "../lib/hkl-links";

type Resource = { path: string; title: string; description: string; category: string; image: string };
export function ResourceDirectory({ resources }: { resources: Resource[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All resources");
  const [limit, setLimit] = useState(18);
  const categories = ["All resources", ...Array.from(new Set(resources.map(r => r.category)))];
  const results = resources.filter(r => (category === "All resources" || category === r.category) && `${r.title} ${r.description} ${r.category}`.toLowerCase().includes(query.toLowerCase().trim()));
  return <><div className="resource-controls"><label className="search-field"><Search size={17}/><span className="sr-only">Search all HKL resources</span><input type="search" placeholder="Search stories, people, conferences, or practices" value={query} onChange={e => {setQuery(e.target.value);setLimit(18);}}/></label><label className="sort-field"><span className="sr-only">Resource category</span><select aria-label="Resource category" value={category} onChange={e => {setCategory(e.target.value);setLimit(18);}}>{categories.map(c => <option key={c}>{c}</option>)}</select></label></div><p className="results-count" role="status">{results.length} resources to explore</p><div className="resource-grid">{results.slice(0,limit).map(r => <a key={r.path} className="resource-card" href={r.path === "/" ? "/movement" : r.path === "/join" ? "/practice-journey" : localHref("https://hkl.org"+r.path)}><span className="eyebrow">{r.category}</span><h3>{r.title}</h3><p>{r.description}</p><span className="resource-open">Explore <ArrowUpRight size={17}/></span></a>)}</div>{results.length===0 && <div className="empty-results"><h3>No resources found.</h3><p>Try another name, place, or topic.</p></div>}{results.length>limit && <div className="load-more"><button className="button button-green" onClick={() => setLimit(n => n+18)}>Explore more resources <ArrowUpRight size={17}/></button></div>}</>;
}
