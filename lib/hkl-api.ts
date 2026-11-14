import { z } from "zod";

// Public, non-secret setting. Set before building the frontend on Render.
export const apiBase = (process.env.NEXT_PUBLIC_HKL_API_URL || "").replace(/\/$/, "");
export const backendEnabled = Boolean(apiBase);
const recordSchema = z.object({
  id: z.number(), kind: z.string(), slug: z.string(), title: z.string(), summary: z.string(),
  body: z.string(), image_url: z.string(), video_url: z.string(), publish_at: z.string(),
  sort_order: z.number(), episode: z.number().nullable(),
});
const pageSchema = z.object({ results: z.array(recordSchema), next: z.string().nullable() });

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

export async function fetchEditorial(kind: "practice" | "talk", signal?: AbortSignal, slug?: string): Promise<Editorial[]> {
  if (!backendEnabled) throw new Error("The content service is not configured.");
  const base = new URL(apiBase);
  if (base.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(base.hostname)) throw new Error("The content service requires HTTPS.");
  let next: URL | null = new URL(`${apiBase}/api/v1/content/`);
  next.searchParams.set("kind", kind);
  if (slug) next.searchParams.set("slug", slug);
  const result: Editorial[] = [];
  const visited = new Set<string>();
  while (next) {
    if (visited.has(next.href) || visited.size >= 100 || next.origin !== base.origin || next.pathname !== `${base.pathname.replace(/\/$/, "")}/api/v1/content/`) throw new Error("Invalid content pagination.");
    visited.add(next.href);
    const response = await fetch(next, { signal, cache: "no-store" });
    if (!response.ok) throw new Error("Content is temporarily unavailable. Please try again.");
    const page = pageSchema.parse(await response.json());
    result.push(...page.results.filter(item => item.kind === kind).map(toEditorial));
    next = page.next ? new URL(page.next, base) : null;
  }
  return result;
}

export async function submitEnquiry(kind: "contact" | "volunteer", payload: Record<string, unknown>) {
  const response = await fetch(`${apiBase}/api/v1/${kind}/`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });
  if (response.status === 429) throw new Error("Too many requests. Please try again later or email info@hkl.org.");
  if (!response.ok) throw new Error(response.status === 400 ? "Please check your details and consent, then try again." : "Your message could not be sent. Please try again or email info@hkl.org.");
}
