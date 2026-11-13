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

export function imageSrc(value: string) { return value.startsWith("/") || value.startsWith("http") ? value : `/images/${value}`; }
