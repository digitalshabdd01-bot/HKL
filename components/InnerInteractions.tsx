"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, CalendarDays, Check, Clock3, MapPin, Pause, Play, RotateCcw, Search, X } from "lucide-react";
import { gatherings, talks } from "../lib/hkl-content";
import EnquiryForm from "./EnquiryForm";
import useEditorial from "./useEditorial";
import type { Editorial } from "../lib/hkl-api";
import { imageSrc } from "../lib/hkl-links";

export function VideoPlayer({ id, title, image }: { id: string; title: string; image: string }) {
  const [playing, setPlaying] = useState(false);
  return <div className="inline-player" id="watch">{playing ? <iframe title={title} src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen/> : <button aria-label={`Play ${title}`} onClick={() => setPlaying(true)}><img src={imageSrc(image)} alt={`${title} video artwork`}/><span className="large-play"><Play size={28} fill="currentColor"/></span><span className="player-caption">WATCH THE EPISODE</span></button>}<a className="player-fallback" href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noreferrer">Watch on YouTube <ArrowUpRight size={12}/></a></div>;
}

export function TalksLibrary() {
  const { items: sourceTalks, loading, error, retry } = useEditorial("talk", talks);
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState("newest");
  const [video, setVideo] = useState<(typeof talks)[number] | Editorial | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!video) return;
    trigger.current = document.activeElement as HTMLElement;
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; trigger.current?.focus(); };
  }, [video]);
  function close() { dialog.current?.close(); setVideo(null); }
  const results = sourceTalks.filter(t => `${t.title} ${t.summary} ${t.episode}`.toLowerCase().includes(search.toLowerCase().trim())).sort((a,b) => order === "newest" ? b.isoDate.localeCompare(a.isoDate) : a.isoDate.localeCompare(b.isoDate));
  if (loading) return <p role="status">Loading stories…</p>;
  if (error) return <div role="alert"><p>{error}</p><button onClick={retry}>Try again</button></div>;
  return <><div className="library-toolbar"><label className="search-field"><Search size={17}/><span className="sr-only">Search stories</span><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Find a story or a moment of inspiration"/></label><label className="sort-field">Sort by<select aria-label="Sort stories" value={order} onChange={e => setOrder(e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label></div><p className="results-count" aria-live="polite">{results.length} {results.length === 1 ? "episode" : "episodes"} to explore</p><div className="story-list inner-story-list">{results.map(t => <article className="story-row" key={t.slug}><span className="story-row-avatar" role="img" aria-label="Baba Ji at an HKL gathering"/><div className="story-row-copy"><span className="story-row-series">THE STORY OF OUR LIVES · EPISODE {t.episode}</span><h3><a href={`/stories/${t.slug}`}>{t.title}</a></h3><time className="story-row-date" dateTime={t.isoDate}>{t.date}</time><p>{t.summary}</p><div className="story-row-actions"><a className="button button-green" href={`/stories/${t.slug}`} aria-label={`Read more about ${t.title}`}>Read more<ArrowUpRight size={16}/></a></div></div><button className="story-row-media" aria-label={`Watch ${t.title}`} onClick={() => setVideo(t)}><img src={imageSrc(t.image)} alt={`${t.title} episode artwork`} loading="lazy"/><span className="story-row-play"><Play size={21} fill="currentColor"/></span><span className="story-row-watch">WATCH EPISODE <ArrowUpRight size={12}/></span></button></article>)}</div>{results.length === 0 && <div className="empty-results"><Search size={27}/><h3>No stories found.</h3><p>Try “love,” “courage,” or an episode number.</p><button className="text-link" onClick={() => setSearch("")}>Show all episodes <RotateCcw size={15}/></button></div>}<dialog ref={dialog} className="modal video-modal" aria-labelledby="library-video-title" onCancel={e => { e.preventDefault(); close(); }} onClick={e => { if(e.target === e.currentTarget) close(); }}><div className="modal-inner"><button className="modal-close" aria-label="Close video" onClick={close}><X size={22}/></button>{video && <><span className="eyebrow">THE STORY OF OUR LIVES · EPISODE {video.episode}</span><h2 id="library-video-title">{video.title}</h2><div className="video-frame"><iframe title={video.title} src={`https://www.youtube-nocookie.com/embed/${video.video}?autoplay=1&rel=0`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen/></div><p className="video-note">Prefer another player? <a href={`https://www.youtube.com/watch?v=${video.video}`} target="_blank" rel="noreferrer">Watch on YouTube ↗</a>.</p></>}</div></dialog></>;
}

export function ReflectionMinute() {
  const [seconds, setSeconds] = useState(60);
  const [running, setRunning] = useState(false);
  useEffect(() => { if (!running || seconds === 0) return; const timer = window.setInterval(() => setSeconds(s => Math.max(s - 1, 0)), 1000); return () => window.clearInterval(timer); }, [running, seconds]);
  return <div className="minute-card" id="mindful-minute"><span className="eyebrow">A SMALL MOMENT, JUST FOR YOU</span><h3>{seconds === 0 ? "Carry this stillness with you." : "Simply be here."}</h3><p>{seconds === 0 ? "Notice how you feel. Let this gentle attention accompany the rest of your day." : "Soften your shoulders. Breathe naturally. Let your attention rest in this moment."}</p><div className={`breathing-circle ${running && seconds > 0 ? "breathing" : ""}`}><div>{seconds === 0 ? <Check size={36}/> : <><span>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2,"0")}</span><small>{running ? "BREATHE AT YOUR OWN PACE" : "A MOMENT OF STILLNESS"}</small></>}</div></div><span className="sr-only" role="status">{seconds === 0 ? "Your reflection is complete." : running ? "Reflection running." : "Reflection paused."}</span><div className="reflection-controls">{seconds > 0 && <button className="button button-green" onClick={() => setRunning(r => !r)}>{running ? <Pause size={16}/> : <Play size={16}/>} {running ? "Pause" : seconds === 60 ? "Begin your minute" : "Continue"}</button>}<button className="reset-timer" aria-label="Restart reflection" onClick={() => {setRunning(false); setSeconds(60);}}><RotateCcw size={18}/></button></div><small>A simple reflection inspired by HKL’s values.</small></div>;
}

export function GatheringList() {
  const [country, setCountry] = useState("All locations");
  return <><div className="gathering-toolbar"><h2>A place to <em>come together.</em></h2><label className="sort-field"><MapPin size={15}/><span className="sr-only">Filter gatherings by location</span><select aria-label="Filter gatherings by location" value={country} onChange={e => setCountry(e.target.value)}><option>All locations</option><option>India</option><option>Malaysia</option></select></label></div><div className="gathering-cards" aria-live="polite">{gatherings.filter(g => country === "All locations" || country === g.country).map(g => <article className="gathering-card" id={g.id} key={g.id}><div className="gathering-card-image"><img src={`/images/${g.image}`} alt={`HKL community gathering in ${g.country}`} loading="lazy"/><span className="date-stamp"><small>{g.month}</small><strong>{g.day}</strong><small>{g.year}</small></span></div><div className="gathering-card-copy"><span className="eyebrow">UPCOMING CONFERENCE · {g.country.toUpperCase()}</span><h3>{g.title}</h3><p>{g.description}</p><ul className="event-facts"><li><CalendarDays size={17}/>{g.date}</li><li><Clock3 size={17}/>{g.time}</li><li><MapPin size={17}/><span>{g.venue}<br/>{g.location}</span></li></ul><a className="button button-green" href={g.id === "bulandpuri" ? "/punjab-india-2026" : "/malaysia-conference-2027"}>Conference details & registration <ArrowUpRight size={16}/></a><small className="handoff-note">Explore the programme and continue to HKL’s registration service.</small></div></article>)}</div></>;
}

export function ContactComposer() {
  return <EnquiryForm/>;
}
