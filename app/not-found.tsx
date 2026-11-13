import { ArrowUpRight } from "lucide-react";
import { PageShell } from "../components/PageShell";
export default function NotFound() {
  return <PageShell><section className="section-pad"><div className="container community-note"><span className="eyebrow">404 · A LITTLE DETOUR</span><h1>This path takes<br/>a different <em>turn.</em></h1><p>We couldn’t find that page. Begin again from the home page, or explore the stories and practices.</p><a href="/" className="button button-green">Return home <ArrowUpRight size={18}/></a></div></section></PageShell>;
}
