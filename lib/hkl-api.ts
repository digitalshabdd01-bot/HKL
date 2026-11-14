import { z } from "zod";

// Public, non-secret setting. Set before building the frontend on Render.
export const apiBase = (process.env.NEXT_PUBLIC_HKL_API_URL || "").replace(/\/$/, "");
export const backendEnabled = Boolean(apiBase);
const recordSchema = z.object({
  id: z.number(), kind: z.string(), slug: z.string(), title: z.string(), summary: z.string(),
  body: z.string(), image_url: z.string(), video_url: z.string(), publish_at: z.string(),
  sort_order: z.number(), episode: z.number().nullable(),
  resource_url: z.string().default(""), registration_url: z.string().default(""),
  starts_at: z.string().nullable().default(null), ends_at: z.string().nullable().default(null),
  country: z.string().default(""), location: z.string().default(""),
  issue_number: z.number().nullable().default(null), event_type: z.string().default("conference"),
  profile_role: z.string().default("speaker"),
  speakers: z.array(z.object({ id: z.number(), slug: z.string(), title: z.string() })).default([]),
});
const pageSchema = z.object({ results: z.array(recordSchema), next: z.string().nullable() });
export type CmsContent = z.infer<typeof recordSchema>;
export type ContentKind = "practice" | "talk" | "event" | "publication" | "speaker" | "page";

export function safeLink(value: string) {
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.href : undefined; }
  catch { return undefined; }
}

export function videoId(value: string) {
  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be") return /^[\w-]{11}$/.test(url.pathname.slice(1)) ? url.pathname.slice(1) : "";
    if (!["youtube.com", "www.youtube.com", "www.youtube-nocookie.com"].includes(url.hostname)) return "";
    const id = url.searchParams.get("v") || url.pathname.split("/embed/")[1] || "";
    return /^[\w-]{11}$/.test(id) ? id : "";
  } catch { return ""; }
}

export function toEditorial(record: z.infer<typeof recordSchema>) {
  const isoDate = record.publish_at.slice(0, 10);
  return {
    slug: record.slug, originalSlug: record.slug, title: record.title, summary: record.summary,
    isoDate, date: new Date(record.publish_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }),
    image: record.image_url || "/images/meditation.webp", video: videoId(record.video_url),
    order: record.sort_order, episode: record.episode || 0, paragraphs: record.body.split(/\n\s*\n/).filter(Boolean),
    source: "", sourcePath: "", fromBackend: true,
  };
}
export type Editorial = ReturnType<typeof toEditorial>;

export async function fetchContent(kind: ContentKind, signal?: AbortSignal, query: Record<string, string> = {}): Promise<CmsContent[]> {
  if (!backendEnabled) throw new Error("The content service is not configured.");
  const base = new URL(apiBase);
  if (base.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(base.hostname)) throw new Error("The content service requires HTTPS.");
  let next: URL | null = new URL(`${apiBase}/api/v1/content/`);
  next.searchParams.set("kind", kind);
  for (const [key, value] of Object.entries(query)) next.searchParams.set(key, value);
  const result: CmsContent[] = [];
  const visited = new Set<string>();
  while (next) {
    if (visited.has(next.href) || visited.size >= 100 || next.origin !== base.origin || next.pathname !== `${base.pathname.replace(/\/$/, "")}/api/v1/content/`) throw new Error("Invalid content pagination.");
    visited.add(next.href);
    const response = await fetch(next, { signal, cache: "no-store" });
    if (!response.ok) throw new Error("Content is temporarily unavailable. Please try again.");
    const page = pageSchema.parse(await response.json());
    result.push(...page.results.filter(item => item.kind === kind));
    next = page.next ? new URL(page.next, base) : null;
  }
  return result;
}

export async function fetchEditorial(kind: "practice" | "talk", signal?: AbortSignal, slug?: string): Promise<Editorial[]> {
  return (await fetchContent(kind, signal, slug ? { slug } : {})).map(toEditorial);
}

const settingsSchema = z.object({
  homepage_title: z.string(), homepage_intro: z.string(), hero_image_url: z.string(),
  contact_email: z.string().email(), footer_text: z.string(), instagram_url: z.string(), youtube_url: z.string(),
});
export type SiteSettings = z.infer<typeof settingsSchema>;
export async function fetchSiteSettings(signal?: AbortSignal): Promise<SiteSettings | null> {
  if (!backendEnabled) return null;
  const response = await fetch(`${apiBase}/api/v1/settings/`, { signal, cache: "no-store" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Site settings unavailable.");
  return settingsSchema.parse(await response.json());
}

export async function submitEnquiry(kind: "contact" | "volunteer", payload: Record<string, unknown>) {
  const response = await fetch(`${apiBase}/api/v1/${kind}/`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });
  if (response.status === 429) throw new Error("Too many requests. Please try again later or email info@hkl.org.");
  if (!response.ok) throw new Error(response.status === 400 ? "Please check your details and consent, then try again." : "Your message could not be sent. Please try again or email info@hkl.org.");
}
