"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import LanguageMenu from "./LanguageMenu";
import { ArrowUpRight, ChevronDown, Menu, Sprout, X } from "lucide-react";

type NavLink = { label: string; href: string; value?: number };
type Feature = { title: string; caption: string; image: string; href: string; value?: number };
type Section = { id: string; label: string; intro: string; links: NavLink[]; features: Feature[] };

const practice: Feature = { title: "A little practice. A lasting change.", caption: "MAKE TIME TO RETURN WITHIN", image: "love.webp", href: "/practices" };
const story: Feature = { title: "The Story of Our Lives", caption: "WATCH, LISTEN & REFLECT", image: "humility.webp", href: "/stories" };
const gathering: Feature = { title: "Find connection, in person.", caption: "COME AS YOU ARE", image: "community.webp", href: "/gatherings" };
const sections: Section[] = [
  { id: "values", label: "Our values", intro: "Three simple qualities. A more beautiful way of being.", links: [{ label: "Discover our values", href: "/values" }, { label: "Humility", href: "/values#humility", value: 0 }, { label: "Kindness", href: "/values#kindness", value: 1 }, { label: "Love", href: "/values#love", value: 2 }, { label: "Begin your HKL journey", href: "/practices" }], features: [
    { title: "Listen with an open heart.", caption: "HUMILITY", image: "humility.webp", href: "/values#humility", value: 0 },
    { title: "Let small gestures ripple out.", caption: "KINDNESS", image: "kindness.webp", href: "/values#kindness", value: 1 },
    { title: "Remember what connects us.", caption: "LOVE", image: "love.webp", href: "/values#love", value: 2 },
  ] },
  { id: "practices", label: "Weekly practices", intro: "Bring a gentle moment of awareness into your everyday life.", links: [{ label: "Start a daily practice", href: "/practices" }, { label: "Take a mindful minute", href: "/practices#mindful-minute" }, { label: "Explore all practices", href: "/practices" }, { label: "The complete practice journey", href: "/practice-journey" }, { label: "Receive practices by email", href: "/newsletter" }], features: [practice, story, gathering] },
  { id: "stories", label: "Stories & talks", intro: "Thoughtful conversations and reflections to carry with you.", links: [{ label: "Explore stories & talks", href: "/stories" }, { label: "The Story of Our Lives", href: "/stories" }, { label: "The Path of Love", href: "/stories/the-path-of-love" }, { label: "The HKL Time", href: "/the-hkl-time" }], features: [story, practice, { title: "Goodness from around the world.", caption: "READ THE HKL TIME", image: "parma.webp", href: "/the-hkl-time" }] },
  { id: "about", label: "About HKL", intro: "A global movement. A personal journey. A place for everyone.", links: [{ label: "Our movement", href: "/about" }, { label: "The complete HKL message", href: "/movement" }, { label: "Board of directors", href: "/board-of-directors" }, { label: "Meet the speakers", href: "/speakers" }, { label: "Our shared values", href: "/values" }, { label: "Our global community", href: "/community" }, { label: "Become a volunteer", href: "/volunteer" }, { label: "Contact us", href: "/contact" }], features: [{ title: "A journey that starts within.", caption: "DISCOVER THE MOVEMENT", image: "connection.webp", href: "/about" }, gathering, { title: "Many cultures. One human family.", caption: "MEET OUR COMMUNITY", image: "parma.webp", href: "/community" }] },
  { id: "gatherings", label: "Gatherings", intro: "Pause, share, and grow with people on the same journey.", links: [{ label: "Upcoming conferences", href: "/gatherings" }, { label: "Conference archive", href: "/gatherings#conference-archive" }, { label: "Bulandpuri, India", href: "/gatherings#bulandpuri" }, { label: "Putrajaya, Malaysia", href: "/gatherings#putrajaya" }, { label: "Discover HKL Walks", href: "/walks" }, { label: "Join the community", href: "https://community.hkl.org/" }], features: [gathering, { title: "Come together in Bulandpuri.", caption: "15–17 NOVEMBER 2026", image: "bulandpuri.webp", href: "/gatherings" }, { title: "Find your HKL community.", caption: "CONTINUE THE CONNECTION", image: "kindness.webp", href: "https://community.hkl.org/" }] },
  { id: "explore", label: "Explore", intro: "Find your next moment of inspiration, connection, or reflection.", links: [{ label: "All HKL resources", href: "/resources" }, { label: "All stories & talks", href: "/stories" }, { label: "WhatsApp channels", href: "/channel" }, { label: "Install the practice app", href: "/practice-app" }, { label: "The HKL Time", href: "/the-hkl-time" }, { label: "HKL Walks", href: "/walks" }, { label: "Weekly practices", href: "/practices" }, { label: "Support the movement", href: "/donate" }], features: [story, practice, gathering] },
];

export default function SiteHeader({ onSelectVirtue }: { onSelectVirtue?: (value: number) => void }) {
  const pathname = usePathname();
  const currentSection = pathname.startsWith("/values") ? "values" : pathname.startsWith("/practices") || pathname === "/newsletter" ? "practices" : pathname.startsWith("/stories") ? "stories" : pathname === "/gatherings" || pathname === "/walks" ? "gatherings" : ["/the-hkl-time","/resources","/channel","/practice-app","/donate"].includes(pathname) ? "explore" : pathname !== "/" ? "about" : "values";
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const active = sections.find(section => section.id === open);

  useEffect(() => {
    if (!open && !mobile) return;
    const dismiss = (e: MouseEvent) => { if (!headerRef.current?.contains(e.target as Node)) { setOpen(null); setMobile(false); } };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const button = document.getElementById(mobile ? "mobile-nav-toggle" : `nav-${open}`);
        setOpen(null); setMobile(false); button?.focus();
      }
    };
    document.addEventListener("click", dismiss); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("click", dismiss); document.removeEventListener("keydown", escape); };
  }, [open, mobile]);

  const navigate = (link: NavLink | Feature) => { if (link.value !== undefined) onSelectVirtue?.(link.value); setOpen(null); setMobile(false); };
  const closeDesktop = () => { const button = document.getElementById(`nav-${open}`); setOpen(null); button?.focus(); };
  const navButton = (section: Section, i: number) => <button
    key={section.id} id={`nav-${section.id}`} className={`primary-nav-button ${open === section.id ? "active" : ""} ${section.id === currentSection && !open ? "nav-featured" : ""}`}
    aria-expanded={open === section.id} aria-controls={`mega-${section.id}`}
    onMouseEnter={() => setOpen(section.id)} onClick={() => setOpen(section.id)}
    onKeyDown={e => { if (e.key === "ArrowDown") { e.preventDefault(); setOpen(section.id); requestAnimationFrame(() => document.querySelector<HTMLAnchorElement>(`#mega-${section.id} a`)?.focus()); } }}
  >{i === 0 && <Sprout size={17} strokeWidth={1.4}/>}<span>{section.label}</span><ChevronDown size={11}/></button>;

  return <header ref={headerRef} className="site-header" onPointerLeave={e => { if (e.pointerType === "mouse" && !mobile) setOpen(null); }}>
    <div className="utility"><div className="container utility-inner"><nav aria-label="Quick links"><a href="/" onClick={() => { setOpen(null); setMobile(false); }}>Home</a><a href="/about">The HKL movement</a><a href="/gatherings">Conferences & gatherings</a></nav><nav aria-label="Connect with HKL"><a href="https://community.hkl.org/">Join the community <ArrowUpRight size={11}/></a><a href="/contact">Contact</a><a href="/newsletter">Weekly practices by email</a><LanguageMenu/></nav></div></div>
    <div className="main-nav-shell container">
      <a className="mobile-join" href="https://community.hkl.org/">Join HKL <ArrowUpRight size={13}/></a>
      <nav className="primary-nav" aria-label="Main navigation">{sections.slice(0,3).map(navButton)}<span className="logo-space" aria-hidden="true"/>{sections.slice(3).map((s,i) => navButton(s,i + 3))}</nav>
      <a className="nav-brand" href="/" aria-label="HKL home" onClick={() => { setOpen(null); setMobile(false); }}><span className="nav-brand-title">HKL<span>✷</span></span><span className="nav-brand-name">HUMILITY, KINDNESS & LOVE</span><span className="nav-brand-subtitle">A GLOBAL MOVEMENT</span></a>
      <button id="mobile-nav-toggle" className="mobile-toggle" aria-label={mobile ? "Close navigation" : "Open navigation"} aria-expanded={mobile} aria-controls="mobile-navigation" onClick={() => { setMobile(!mobile); setOpen(null); }}>{mobile ? <X size={23}/> : <Menu size={23}/>}</button>
    </div>
    {active && !mobile && <div id={`mega-${active.id}`} className="mega-menu" role="region" aria-labelledby={`nav-${active.id}`}><div className="container mega-inner"><div className="mega-links"><span className="eyebrow">EXPLORE HKL</span><h2>{active.label}</h2><p>{active.intro}</p><nav aria-label={`${active.label} links`}>{active.links.map(link => <a key={link.label} href={link.href} onClick={() => navigate(link)}>{link.label}<ArrowUpRight size={14}/></a>)}</nav></div><div className="mega-features">{active.features.map(feature => <a key={feature.title} href={feature.href} className="nav-feature" onClick={() => navigate(feature)}><div className="nav-feature-image"><img src={`/images/${feature.image}`} alt="HKL community and reflection"/><span><ArrowUpRight size={18}/></span></div><span className="nav-feature-caption">{feature.caption}</span><h3>{feature.title}</h3></a>)}</div><button className="mega-close" aria-label="Close navigation menu" onClick={closeDesktop}><X size={18}/></button></div></div>}
    {mobile && <nav id="mobile-navigation" className="mobile-navigation" aria-label="Mobile navigation">{sections.map(section => <div className="mobile-nav-group" key={section.id}><button aria-expanded={open === section.id} aria-controls={`mobile-${section.id}`} onClick={() => setOpen(open === section.id ? null : section.id)}>{section.label}<ChevronDown size={16}/></button>{open === section.id && <div id={`mobile-${section.id}`} className="mobile-submenu">{section.links.map(link => <a key={link.label} href={link.href} onClick={() => navigate(link)}>{link.label}<ArrowUpRight size={14}/></a>)}</div>}</div>)}<a className="button button-green mobile-community" href="https://community.hkl.org/">Join the HKL community <ArrowUpRight size={17}/></a></nav>}
  </header>;
}
