"use client";
import { usePathname } from "next/navigation";
import { Globe2 } from "lucide-react";
import { languages, localHref, originalPath } from "../lib/hkl-links";

export default function LanguageMenu() {
  const pathname = usePathname();
  const selected = languages.find(l => l.prefix && pathname.split("/")[1] === l.prefix)?.code || "en";
  return <label className="language-menu"><Globe2 size={11}/><span className="sr-only">Website language</span><select aria-label="Website language" value={selected} onChange={e => {
    const language = languages.find(l => l.code === e.target.value)!;
    const original = originalPath(pathname);
    const destination = language.prefix ? `/${language.prefix}${original === "/" ? "" : original}` : original === "/" ? "/movement" : localHref("https://hkl.org" + original);
    window.location.href = destination;
  }}>{languages.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}</select></label>;
}
