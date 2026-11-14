"use client";
import { useEffect, useState } from "react";
import { fetchContent, safeLink, type CmsContent } from "../lib/hkl-api";

export type CollectionKind = "event" | "publication" | "speaker";
export default function ManagedCollection({ kind, eventWindow, boardOnly = false, eventType = "conference" }: {
  kind: CollectionKind; eventWindow?: "upcoming" | "past"; boardOnly?: boolean; eventType?: "conference" | "walk";
}) {
  const [records, setRecords] = useState<CmsContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState("");
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const query: Record<string, string> = {};
    if (kind === "event") query.event_type = eventType;
    if (eventWindow) query.event_window = eventWindow;
    if (boardOnly) query.profile_role = "director";
    setLoading(true); setError(false);
    fetchContent(kind, controller.signal, query).then(data => { if (active) setRecords(data); }).catch(() => { if (active) setError(true); }).finally(() => { clearTimeout(timer); if (active) setLoading(false); });
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [kind, eventWindow, boardOnly, eventType, attempt]);
  if (loading) return <p role="status">Loading {kind === "event" ? "events" : kind === "speaker" ? "profiles" : "publications"}…</p>;
  if (error) return <div role="alert"><p>Content is temporarily unavailable.</p><button className="button button-green" onClick={() => setAttempt(value => value + 1)}>Try again</button></div>;
  const visible = records.filter(item => `${item.title} ${item.summary} ${item.country}`.toLowerCase().includes(search.toLowerCase()));
  return <><label className="search-field"><span>Search</span><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by title, name, or country"/></label>
    <div className={kind === "speaker" ? "people-grid" : "conference-grid"}>{visible.map(item => <article className={kind === "speaker" ? "person-card" : "conference-card"} key={item.id}>
      <a href={`/content/${kind}/${item.slug}`}><img src={safeLink(item.image_url) || "/images/community.webp"} alt={item.title} loading="lazy"/></a>
      <div><span className="eyebrow">{kind === "speaker" ? item.profile_role === "director" ? "BOARD OF DIRECTORS" : "HKL SPEAKER" : kind === "publication" ? `THE HKL TIME${item.issue_number ? ` · ISSUE ${item.issue_number}` : ""}` : `${item.event_type === "walk" ? "HKL WALK" : "HKL CONFERENCE"}${item.country ? ` · ${item.country}` : ""}`}</span>
        <h3><a href={`/content/${kind}/${item.slug}`}>{item.title}</a></h3><p>{item.summary}</p>
        {kind === "event" && item.starts_at && <time dateTime={item.starts_at}>{new Date(item.starts_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })}</time>}
        {item.location && <p>{item.location}</p>}<a className="resource-open" href={`/content/${kind}/${item.slug}`}>Explore →</a>
      </div></article>)}</div>
    {!visible.length && <p role="status">No {kind === "event" ? "events" : kind === "speaker" ? "profiles" : "publications"} found.</p>}
  </>;
}
