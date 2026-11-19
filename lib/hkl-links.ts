export const languages = [
  { code: "en", prefix: "", label: "English", short: "EN" },
  { code: "es-BO", prefix: "es", label: "Español", short: "ES" },
  { code: "de-DE", prefix: "de", label: "Deutsch", short: "DE" },
  { code: "it-IT", prefix: "it", label: "Italiano", short: "IT" },
  { code: "pa-Guru-IN", prefix: "pa", label: "ਪੰਜਾਬੀ", short: "PA" },
  { code: "ru-RU", prefix: "ru", label: "Русский", short: "RU" },
  { code: "uk-UA", prefix: "ukra", label: "Українська", short: "UK" },
];

const originalAliases: Record<string, string> = {
  "/about": "/", "/movement": "/", "/values": "/", "/practices": "/join", "/contact": "/contact-us", "/resources": "/", "/gatherings": "/", "/speakers": "/italy2025speakers",
};
export function originalPath(path: string) {
  let clean = decodeURIComponent(path).replace(/\/$/, "") || "/";
  const prefix = clean.split("/")[1];
  if (languages.some(l => l.prefix && l.prefix === prefix)) clean = clean.slice(prefix.length + 1) || "/";
  if (clean.startsWith("/practices/")) return clean.replace("/practices/", "/weekly-practice/");
  if (clean.startsWith("/stories/") && !clean.endsWith("-of-our-lives")) return clean + "-of-our-lives";
  return originalAliases[clean] || clean;
}

export function localHref(href: string) {
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return href;
  let url: URL;
  try { url = new URL(href, "https://hkl.org"); } catch { return "#"; }
  if (url.hostname !== "hkl.org" && url.hostname !== "www.hkl.org") return href;
  let path = decodeURIComponent(url.pathname).replace(/\/$/, "") || "/";
  // This published conference still links to an unavailable speaker profile.
  // Keep the original speaker information reachable at its conference entry.
  if(path.endsWith("/canada-speakers/sam-demma")) return path.replace("/canada-speakers/sam-demma","/abbotsford-canada-2025")+"#sam-demma";
  if (/^\/(?:es\/|de\/|it\/|pa\/|ru\/|ukra\/)?the-hkl-time(?:\/|$)/.test(path)) return "/edmonton";
  const translated = languages.some(l => l.prefix && path.split("/")[1] === l.prefix);
  if (!translated) {
    if (path === "/join") path = "/practices";
    if (path === "/contact-us") path = "/contact";
    if (path.startsWith("/weekly-practice/")) path = path.replace("/weekly-practice/", "/practices/");
    if (path.startsWith("/stories/")) path = path.replace(/-of-our-lives$/, "");
  }
  const hash = !translated && url.hash === "#join" && url.pathname === "/join" ? "#join-journey" : url.hash === "#practice" ? "#practice-library" : !translated && url.pathname === "/walks" && url.hash === "#upcoming-walks" ? "#walk-calendar" : url.hash;
  return path + url.search + hash;
}

export function imageSrc(value: string) {
  if (/^(?:https?:)?\/\//i.test(value) || value.startsWith("data:")) return value;
  // Files inside public are served at the URL root, on Windows and Linux.
  const clean = value.replace(/\\/g, "/").replace(/^\/?public\//, "").replace(/\/{2,}/g, "/");
  if (clean.startsWith("/")) return clean;
  return clean.startsWith("images/") ? `/${clean}` : `/images/${clean}`;
}

export function mapForImage(value: string) {
  let source: URL;
  try { source = new URL(value); } catch { return null; }
  if (source.hostname !== "api.mapbox.com") return null;
  const pin = /\/static\/[^/]*\((-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\)/.exec(source.pathname);
  if (!pin) return null;
  const longitude = Number(pin[1]), latitude = Number(pin[2]);
  if (Math.abs(longitude) > 180 || Math.abs(latitude) > 85) return null;
  const embed = new URL("https://www.openstreetmap.org/export/embed.html");
  embed.searchParams.set("bbox", [Math.max(-180, longitude - 0.03), Math.max(-85, latitude - 0.02), Math.min(180, longitude + 0.03), Math.min(85, latitude + 0.02)].map(n => n.toFixed(7)).join(","));
  embed.searchParams.set("layer", "mapnik");
  embed.searchParams.set("marker", `${latitude},${longitude}`);
  return { embed: embed.href, href: `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=13/${latitude}/${longitude}` };
}
