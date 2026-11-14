import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { backendEnabled, fetchContent, safeLink, type ContentKind } from "../../../../lib/hkl-api";
import { PageShell, JourneyCTA } from "../../../../components/PageShell";

type Props = { params: Promise<{ kind: string; slug: string }> };
async function record(params: Props["params"]) {
  const { kind, slug } = await params;
  if (!backendEnabled || !["event", "publication", "speaker"].includes(kind)) notFound();
  const items = await fetchContent(kind as ContentKind, AbortSignal.timeout(15000), { slug });
  if (!items[0]) notFound();
  return items[0];
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await record(params);
  return { title: `${item.title} | HKL`, description: item.summary };
}
export default async function ManagedDetail({ params }: Props) {
  const item = await record(params);
  const back = item.kind === "speaker" ? "/speakers" : item.kind === "publication" ? "/the-hkl-time" : item.event_type === "walk" ? "/walks" : "/gatherings";
  const registration = safeLink(item.registration_url);
  const resource = safeLink(item.resource_url);
  return <PageShell><article className="container source-reading section-pad"><a className="text-link" href={back}>← Back to {item.kind === "speaker" ? "people" : item.kind === "publication" ? "publications" : "gatherings"}</a>
    <h1>{item.title}</h1><p className="source-lead">{item.summary}</p>
    {safeLink(item.image_url) && <img src={item.image_url} alt={item.title} style={{ maxWidth: "100%", maxHeight: 520, objectFit: "contain" }}/>}
    {item.starts_at && <p><time dateTime={item.starts_at}>{new Date(item.starts_at).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short", timeZone: "UTC" })} UTC</time>{item.ends_at && <> – <time dateTime={item.ends_at}>{new Date(item.ends_at).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short", timeZone: "UTC" })} UTC</time></>}</p>}
    {(item.location || item.country) && <p>{[item.location, item.country].filter(Boolean).join(" · ")}</p>}
    <div className="prose">{item.body.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
    {item.speakers.length > 0 && <section><h2>Speakers</h2>{item.speakers.map(person => <p key={person.id}><a href={`/content/speaker/${person.slug}`}>{person.title}</a></p>)}</section>}
    {registration && <p><a className="button button-green" href={registration} target="_blank" rel="noreferrer">Registration & RSVP ↗</a></p>}
    {resource && <p><a className="button button-green" href={resource} target="_blank" rel="noreferrer">{item.kind === "publication" ? "Read this issue" : "Open related resource"} ↗</a></p>}
  </article><JourneyCTA/></PageShell>;
}
