import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { PageShell, JourneyCTA } from "../../../components/PageShell";
import { VideoPlayer } from "../../../components/InnerInteractions";
import { practices } from "../../../lib/hkl-content";
import { getSourcePage } from "../../../lib/hkl-source";
import { SourceBlocks } from "../../../components/SourceContent";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params; const practice = practices.find(p => p.slug === slug);
  return { title: practice ? `${practice.title} | HKL Practices` : "Practice not found | HKL", description: practice?.summary };
}
export default async function PracticeDetail({ params }: Props) {
  const { slug } = await params; const practice = practices.find(p => p.slug === slug);
  if (!practice) notFound();
  const source=getSourcePage(practice.sourcePath);
  const start=source?.blocks.findIndex(b=>b.kind==="embed") ?? -1;
  return <PageShell><article className="article-page"><header className="container article-heading"><nav className="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><ChevronRight size={11}/><a href="/practices">Weekly practices</a><ChevronRight size={11}/><span aria-current="page">{practice.date}</span></nav><span className="eyebrow">A WEEKLY PRACTICE FROM HKL</span><h1>{practice.title}</h1><p>{practice.summary}</p><time dateTime={practice.isoDate}>{practice.date}</time></header>{practice.video && <div className="container article-video"><VideoPlayer id={practice.video} title={practice.title} image={practice.image}/></div>}<div className="container practice-article prose"><span className="eyebrow">THE COMPLETE WEEKLY PRACTICE</span><h2>Make a little <em>space.</em></h2><SourceBlocks blocks={source?.blocks.slice(start+1) || []} sourceUrl={practice.source} omitHeading={practice.title}/><nav className="practice-next" aria-label="More weekly practices">{practices.filter(p => p.slug !== slug).slice(0,2).map(p => <a href={`/practices/${p.slug}`} key={p.slug}><span className="eyebrow">{p.date}</span><h3>{p.title}</h3><ArrowUpRight size={18}/></a>)}</nav><a className="text-link" href="/practices">Back to all practices <ArrowUpRight size={17}/></a></div></article><JourneyCTA/></PageShell>;
}
