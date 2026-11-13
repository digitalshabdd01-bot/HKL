import { ArrowUpRight, ChevronRight } from "lucide-react";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

export function PageShell({ children }: { children: React.ReactNode }) {
  return <><span id="top"/><a className="skip-link" href="#main">Skip to content</a><SiteHeader/><main id="main" className="inner-page">{children}</main><SiteFooter/></>;
}

export function PageHero({ eyebrow, title, emphasis, description, image, alt }: { eyebrow: string; title: string; emphasis: string; description: string; image: string; alt: string }) {
  return <section className="page-hero"><img src={`/images/${image}`} alt={alt} fetchPriority="high"/><div className="page-hero-shade"/><div className="container"><nav className="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><ChevronRight size={11}/><span aria-current="page">{eyebrow}</span></nav><span className="eyebrow">{eyebrow}</span><h1>{title}<br/><em>{emphasis}</em></h1><p>{description}</p></div><span className="page-hero-flower" aria-hidden="true">✷</span></section>;
}

export function JourneyCTA() {
  return <section className="newsletter"><div className="container newsletter-inner"><span className="flower" aria-hidden="true">✷</span><div><span className="eyebrow">A GENTLE REMINDER TO RETURN WITHIN</span><h2>Keep the practice <em>close.</em></h2><p>Receive HKL’s weekly practices, and make a little space for yourself.</p></div><a href="/newsletter" className="button button-green">Receive weekly practices <ArrowUpRight size={18}/></a></div></section>;
}

export function ArrowLink({ href, children }: { href: string; children: React.ReactNode }) { return <a className="text-link" href={href}>{children}<ArrowUpRight size={17}/></a>; }
