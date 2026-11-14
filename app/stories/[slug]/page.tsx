import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { PageShell, JourneyCTA } from "../../../components/PageShell";
import { VideoPlayer } from "../../../components/InnerInteractions";
import { loadTalks } from "../../../lib/hkl-editorial-server";
import { getSourcePage } from "../../../lib/hkl-source";
import { imageSrc } from "../../../lib/hkl-links";
import { SourceBlocks } from "../../../components/SourceContent";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params; const talks = await loadTalks(); const talk = talks.find(t => t.slug === slug || t.originalSlug === slug);
  return { title: talk ? `${talk.title} | HKL Stories` : "Story not found | HKL", description: talk?.summary };
}
export default async function StoryDetail({ params }: Props) {
  const { slug } = await params; const talks = await loadTalks(); const talk = talks.find(t => t.slug === slug || t.originalSlug === slug);
  if (!talk) notFound();
  const source="fromBackend" in talk ? undefined : getSourcePage(talk.sourcePath);
  const start=source?.blocks.findIndex(b=>b.kind==="embed") ?? -1;
  const body="fromBackend" in talk ? talk.paragraphs.map(text => ({ kind: "p", text })) : source?.blocks.slice(start+1) || [];
  return <PageShell><article className="article-page"><header className="container article-heading"><nav className="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><ChevronRight size={11}/><a href="/stories">Stories & talks</a><ChevronRight size={11}/><span aria-current="page">Episode {talk.episode}</span></nav><span className="eyebrow">THE STORY OF OUR LIVES · EPISODE {talk.episode}</span><h1>{talk.title}</h1><p>{talk.summary}</p><time dateTime={talk.isoDate}>{talk.date} <span>·</span> A reflection from Baba Ji</time></header>{talk.video && <div className="container article-video"><VideoPlayer id={talk.video} title={talk.title} image={talk.image}/></div>}<div className="container article-body"><div className="prose transcript"><span className="eyebrow">THE COMPLETE REFLECTION</span><h2>A moment to <em>listen within.</em></h2><SourceBlocks blocks={body} sourceUrl={talk.source} omitHeading={talk.title}/><a className="text-link" href="/practices">Make space for a daily practice <ArrowUpRight size={16}/></a></div><aside className="article-aside"><span className="eyebrow">CONTINUE LISTENING</span>{talks.filter(t => t.slug !== talk.slug).slice(0,3).map(t => <a href={`/stories/${t.slug}`} key={t.slug}><img src={imageSrc(t.image)} alt={`${t.title} episode artwork`} loading="lazy"/><span>EPISODE {t.episode}</span><h3>{t.title}</h3><ArrowUpRight size={17}/></a>)}<a className="text-link" href="/stories">Back to all stories <ArrowUpRight size={15}/></a></aside></div></article><JourneyCTA/></PageShell>;
}
