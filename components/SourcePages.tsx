import ManagedCollection from "./ManagedCollection";
import { backendEnabled } from "../lib/hkl-api";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { JourneyCTA, PageHero, PageShell } from "./PageShell";
import { SourceBlocks } from "./SourceContent";
import { ResourceDirectory } from "./ResourceDirectory";
import { conferenceSummaries, getSourcePage, profileSummaries, resourceSummaries, sourceCategory, sourceImage, type SourcePage } from "../lib/hkl-source";

export function AllResourcesPage() {
  return <PageShell><PageHero eyebrow="ALL HKL RESOURCES" title="Every part of" emphasis="the journey." description="Explore the movement, complete stories and practices, our people, conferences, publications, and ways to take part." image="community.webp" alt="The global HKL community coming together"/><section className="section-pad"><div className="container"><ResourceDirectory resources={resourceSummaries}/></div></section><JourneyCTA/></PageShell>;
}

export function PeopleDirectory({ boardOnly=false }: { boardOnly?: boolean }) {
  if (backendEnabled) return <ManagedCollection kind="speaker" boardOnly={boardOnly}/>;
  const people=profileSummaries.filter(p=>!boardOnly || p.path.startsWith("/board-of-directors/"));
  const board=getSourcePage("/board-of-directors");
  return <div className="people-grid">{people.map(person=>{
    const texts=board?.blocks.filter(b=>b.kind==="p").map(b=>b.text) || [];
    const position=texts.indexOf(person.title);
    const country=boardOnly && position>=0 ? texts[position+1] : "";
    return <a className="person-card" key={person.path} href={person.path}>{person.image && <img src={sourceImage(person.image)} alt={person.title} loading="lazy"/>}<div><span className="eyebrow">{boardOnly ? "BOARD OF DIRECTORS" : person.path.includes("canada-speakers") ? "CONFERENCE SPEAKER" : "BOARD OF DIRECTORS"}</span><h3>{person.title}</h3>{country && <p className="person-country">{country}</p>}<p>{person.description}</p><span className="resource-open">View profile <ArrowUpRight size={17}/></span></div></a>;
  })}</div>;
}

export function SpeakersPage() {
  return <PageShell><PageHero eyebrow="PEOPLE OF THE MOVEMENT" title="Many perspectives." emphasis="A shared humanity." description="Meet the people sharing their experience, wisdom, and commitment to Humility, Kindness & Love." image="connection.webp" alt="A moment of connection at an HKL gathering"/><section className="section-pad"><div className="container"><div className="section-heading"><div><span className="eyebrow">VOICES FROM OUR CONFERENCES</span><h2>Meet the <em>speakers.</em></h2></div><a className="text-link" href="/italy2025speakers">Parma conference speakers <ArrowUpRight size={17}/></a></div><PeopleDirectory/></div></section><JourneyCTA/></PageShell>;
}

export function ConferenceArchive() {
  return <section className="section-pad conference-archive" id="conference-archive"><div className="container"><div className="section-heading"><div><span className="eyebrow">THE HKL JOURNEY AROUND THE WORLD</span><h2>Conferences.<br/><em>Connections that continue.</em></h2></div><a className="text-link" href="/speakers">Meet the speakers <ArrowUpRight size={17}/></a></div>{backendEnabled ? <ManagedCollection kind="event" eventWindow="past"/> : <div className="conference-grid">{conferenceSummaries.map(c=><a className="conference-card" key={c.path} href={c.path}>{c.image ? <img src={sourceImage(c.image)} alt={c.title} loading="lazy"/> : <div className="conference-symbol" aria-hidden="true">✷</div>}<div><span className="eyebrow">INTERNATIONAL HKL CONFERENCE</span><h3>{c.title}</h3><p>{c.description}</p><span className="resource-open">Explore the conference <ArrowUpRight size={17}/></span></div></a>)}</div>}</div></section>;
}

export function FullMovementPage({ page }: { page: SourcePage }) {
  const sections=page.sections?.filter(s=>s.blocks.length>0) || [];
  const names:Record<string,string>={"section-0":"An invitation to HKL","section-1":"Upcoming conferences","section-2":"What is the HKL movement?","section-3":"The weekly practices","section-4":"A global movement & voices of connection","section-5":"Why we look within","section-6":"A path back to ourselves","section-7":"Come home to yourself","section-8":"Humility, Kindness & Love","section-9":"The Story of Our Lives","section-10":"Keep the practice close","section-11":"Stories of impact","section-12":"Join the global movement","section-13":"Follow HKL","section-14":"A recap of the HKL journey","section-15":"Our board of directors","section-16":"Questions about HKL"};
  const signature=(b:typeof page.blocks[number])=>b.kind+":"+(b.text || b.url || "");
  const inChapters=new Set(sections.flatMap(s=>s.blocks.map(signature)));
  const remaining=page.blocks.filter(b=>!inChapters.has(signature(b)));
  return <PageShell><PageHero eyebrow="THE HKL GLOBAL MOVEMENT" title="Coming home to" emphasis="Humility, Kindness & Love." description="The message, people, practices, and shared journey at the heart of the movement." image="connection.webp" alt="A shared moment of connection in the HKL movement"/><section className="section-pad"><div className="container source-reading">{sections.length>0 ? <><div className="source-toc"><span className="eyebrow">EXPLORE THE MOVEMENT</span><nav aria-label="Movement chapters">{sections.map((s,i)=><a key={s.id} href={`#chapter-${i}`}>{names[s.id] || s.name}<ArrowUpRight size={12}/></a>)}</nav></div>{sections.map((s,i)=><details className="movement-chapter" id={`chapter-${i}`} key={s.id} open={s.id==="section-2"}><summary>{names[s.id] || s.name}<span>Explore this chapter</span></summary><SourceBlocks blocks={s.blocks} sourceUrl={page.url} omitHeading={page.heading}/></details>)}{remaining.length>0 && <SourceBlocks blocks={remaining} sourceUrl={page.url} omitHeading={page.heading}/>}</> : <SourceBlocks blocks={page.blocks} sourceUrl={page.url} omitHeading={page.heading}/>}</div></section><JourneyCTA/></PageShell>;
}

export function SourceDocumentPage({ page }: { page: SourcePage }) {
  const profile=page.canonicalPath.startsWith("/board-of-directors/") || page.canonicalPath.startsWith("/canada-speakers/");
  const portrait=profile ? page.blocks.find(b=>b.kind==="image") : null;
  const board=page.canonicalPath==="/board-of-directors" && page.locale==="en";
  const title=page.displayTitle || page.heading;
  return <PageShell><article className={`source-page ${profile ? "profile-page" : ""}`} lang={page.locale.split("-")[0]}><header className="container source-page-heading"><nav className="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><ChevronRight size={11}/><a href="/resources">All resources</a><ChevronRight size={11}/><span aria-current="page">{title}</span></nav><span className="eyebrow">{sourceCategory(page.canonicalPath)}</span><h1>{title}</h1>{resourceSummaries.find(r=>r.path===page.canonicalPath)?.description && <p>{resourceSummaries.find(r=>r.path===page.canonicalPath)?.description}</p>}</header><div className={`container ${profile ? "source-profile-layout" : "source-reading"}`}>{portrait && <div className="source-portrait"><img src={sourceImage(portrait.url!)} alt={title}/></div>}<div>{page.registrationUrl && <div className="source-registration"><h2>Continue your registration with HKL.</h2><p>Bookings are managed through HKL’s event service.</p><a className="button button-green" href={page.registrationUrl} target="_blank" rel="noreferrer">Open HKL’s event page <ArrowUpRight size={17}/></a></div>}{board ? <PeopleDirectory boardOnly/> : page.externalRedirect ? <div className="source-registration"><h2>Continue with HKL.</h2><p>Visit the event page for the conference information and registration.</p><a className="button button-green" href={page.finalUrl} target="_blank" rel="noreferrer">Open the event page <ArrowUpRight size={17}/></a></div> : <SourceBlocks blocks={portrait ? page.blocks.filter(b=>b!==portrait) : page.blocks} sourceUrl={page.url} omitHeading={title===page.heading ? page.heading : undefined} formTitle={page.canonicalPath==="/volunteer" ? "Become an HKL volunteer" : sourceCategory(page.canonicalPath)==="Conferences" ? "Conference enquiry" : undefined}/>}</div></div><div className="container source-page-return"><a className="text-link" href={profile ? page.canonicalPath.startsWith("/board-of-directors") ? "/board-of-directors" : "/speakers" : "/resources"}>{profile ? "Meet more people from HKL" : "Explore all HKL resources"}<ArrowUpRight size={17}/></a></div></article><JourneyCTA/></PageShell>;
}
