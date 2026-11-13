import catalogJson from "../content/hkl-source-en.json";
import assetJson from "../content/hkl-assets.json";
import libraryJson from "../content/hkl-libraries.json";
import { localHref } from "./hkl-links";

export type SourceField = { name: string; label: string; type: string; required: boolean; options: string[]; value?: string };
export type SourceBlock = { kind: string; text?: string; html?: string; url?: string; alt?: string; fields?: SourceField[]; intro?: SourceBlock[] };
export type SourceSection = { id: string; name: string; blocks: SourceBlock[] };
export type SourcePage = { path: string; canonicalPath: string; locale: string; url: string; finalUrl: string; status: number; title: string; heading: string; displayTitle?: string; description?: string; blocks: SourceBlock[]; sections?: SourceSection[]; links: { url: string; text: string }[]; externalRedirect?: boolean; registrationUrl?: string; fallbackOf?: string };
const catalog = catalogJson as unknown as { checkedAt: string; pages: SourcePage[]; failures: unknown[] };
const assets = assetJson as Record<string, string>;
export const resourceSummaries = libraryJson.resources;
export const profileSummaries = libraryJson.profiles;
export const conferenceSummaries = libraryJson.conferences;
export const sourcePages = catalog.pages;
export const contentCheckedAt = catalog.checkedAt;

export function getSourcePage(path: string): SourcePage | undefined {
  let key: string;
  try { key = decodeURIComponent(path).replace(/\/$/, "") || "/"; } catch { return undefined; }
  return sourcePages.find(p => p.path === key);
}
export async function loadSourcePage(path: string): Promise<SourcePage | undefined> {
  let key: string;
  try { key=decodeURIComponent(path).replace(/\/$/,"") || "/"; } catch { return undefined; }
  const prefix=key.split("/")[1];
  let data: unknown;
  switch(prefix){
    case "es": data=await import("../content/hkl-source-es-BO.json"); break;
    case "de": data=await import("../content/hkl-source-de-DE.json"); break;
    case "it": data=await import("../content/hkl-source-it-IT.json"); break;
    case "pa": data=await import("../content/hkl-source-pa-Guru-IN.json"); break;
    case "ru": data=await import("../content/hkl-source-ru-RU.json"); break;
    case "ukra": data=await import("../content/hkl-source-uk-UA.json"); break;
    default: return getSourcePage(key);
  }
  const module=data as {default:{pages:SourcePage[]}};
  return module.default.pages.find(p=>p.path===key);
}
export function sourceImage(url: string) {
  if (url.startsWith("/")) return url;
  const clean = url.split("?")[0].split("#")[0];
  return assets[clean] || url;
}
export function sourceHtml(html: string) {
  // Importer emits only escaped text and a small inline tag whitelist.
  return html.replace(/\$([^$]+)\/\$/g,"$1").replace(/href="([^"]*)"/g, (_, value: string) => {
    const original = value.replace(/&amp;/g, "&");
    const url = localHref(original).replace(/&/g,"&amp;").replace(/"/g,"&quot;");
    return `href="${url}"`;
  });
}
export function resourceHref(path: string) { return path === "/" ? "/movement" : path === "/join" ? "/practice-journey" : localHref("https://hkl.org" + path); }
export function sourceCategory(path: string) { return resourceSummaries.find(p => p.path === path)?.category || "THE HKL MOVEMENT"; }
