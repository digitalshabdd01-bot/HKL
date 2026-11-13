import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { loadSourcePage } from "../../lib/hkl-source";
import { localHref } from "../../lib/hkl-links";
import { FullMovementPage, SourceDocumentPage } from "../../components/SourcePages";

type Props={params:Promise<{sourcePath:string[]}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{const {sourcePath}=await params;const path="/"+sourcePath.join("/");const page=await loadSourcePage(path==="/movement" ? "/" : path==="/practice-journey" ? "/join" : path);return {title:page ? `${page.displayTitle || page.heading} | HKL` : "Page not found | HKL",description:page?.description};}
export default async function OriginalContentPage({params}:Props){const {sourcePath}=await params;const path="/"+sourcePath.join("/");const page=await loadSourcePage(path==="/movement" ? "/" : path==="/practice-journey" ? "/join" : path);if(!page)notFound();const destination=localHref(page.url);if(destination!==path && path!=="/movement" && path!=="/practice-journey")redirect(destination);return path==="/movement" ? <FullMovementPage page={page}/> : <SourceDocumentPage page={page}/>;}
