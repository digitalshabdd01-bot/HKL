import { test, after } from "node:test";
import assert from "node:assert/strict";

process.env.NEXT_PUBLIC_HKL_API_URL = "https://api.example.com";
const { fetchEditorial, fetchContent, fetchSiteSettings, safeLink, submitEnquiry, videoId } = await import("../lib/hkl-api");
const originalFetch = globalThis.fetch;
after(() => { globalThis.fetch = originalFetch; });
const item = { id: 1, kind: "practice", slug: "a-new-practice", title: "New practice", summary: "Summary", body: "First paragraph\n\nSecond paragraph", image_url: "", video_url: "https://youtu.be/mMpDtD3G2Xw", publish_at: "2026-11-14T00:00:00Z", sort_order: 0, episode: null };

test("loads every page and adapts new backend records for existing cards", async () => {
  const requested: string[] = [];
  globalThis.fetch = async input => {
    requested.push(String(input));
    return Response.json(requested.length === 1 ? { results: [item], next: "https://api.example.com/api/v1/content/?kind=practice&page=2" } : { results: [{ ...item, id: 2, slug: "second" }], next: null });
  };
  const records = await fetchEditorial("practice");
  assert.equal(records.length, 2);
  assert.equal(records[0].video, "mMpDtD3G2Xw");
  assert.deepEqual(records[0].paragraphs, ["First paragraph", "Second paragraph"]);
  assert.equal(records[0].image, "/images/meditation.webp");
});

test("an empty published library stays empty", async () => {
  globalThis.fetch = async () => Response.json({ results: [], next: null });
  assert.deepEqual(await fetchEditorial("talk"), []);
});

test("unavailable content does not silently restore unpublished JSON records", async () => {
  globalThis.fetch = async () => new Response("Unavailable", { status: 503 });
  await assert.rejects(fetchEditorial("practice"), /temporarily unavailable/);
});

test("refuses cross-origin pagination and malformed payloads", async () => {
  globalThis.fetch = async () => Response.json({ results: [], next: "https://untrusted.example/internal" });
  await assert.rejects(fetchEditorial("practice"), /Invalid content pagination/);
  globalThis.fetch = async () => Response.json({ results: [{ title: "Incomplete" }], next: null });
  await assert.rejects(fetchEditorial("practice"));
});

test("submission successes and failures are handled accurately", async () => {
  globalThis.fetch = async (_input, options) => {
    assert.equal(options?.method, "POST");
    assert.equal(JSON.parse(String(options?.body)).consent, true);
    return Response.json({ message: "Received" }, { status: 201 });
  };
  await submitEnquiry("contact", { name: "Example", consent: true });
  globalThis.fetch = async () => new Response("", { status: 429 });
  await assert.rejects(submitEnquiry("volunteer", {}), /Too many requests/);
  globalThis.fetch = async () => new Response("", { status: 400 });
  await assert.rejects(submitEnquiry("contact", {}), /check your details/);
});

test("only supported YouTube URLs become embed IDs", () => {
  assert.equal(videoId("https://www.youtube.com/watch?v=mMpDtD3G2Xw"), "mMpDtD3G2Xw");
  assert.equal(videoId("https://untrusted.example/watch?v=mMpDtD3G2Xw"), "");
  assert.equal(videoId("javascript:alert(1)"), "");
});

test("loads event collections with date/type filters and related speakers", async () => {
  globalThis.fetch = async input => {
    const url = new URL(String(input));
    assert.equal(url.searchParams.get("kind"), "event");
    assert.equal(url.searchParams.get("event_window"), "upcoming");
    assert.equal(url.searchParams.get("event_type"), "walk");
    return Response.json({ results: [{ ...item, kind: "event", event_type: "walk", speakers: [{ id: 7, slug: "speaker", title: "Speaker" }] }], next: null });
  };
  const items = await fetchContent("event", undefined, { event_window: "upcoming", event_type: "walk" });
  assert.equal(items[0].speakers[0].id, 7);
});

test("absent settings keep existing branding, and published settings are parsed", async () => {
  globalThis.fetch = async () => new Response("", { status: 404 });
  assert.equal(await fetchSiteSettings(), null);
  globalThis.fetch = async () => Response.json({ homepage_title: "New headline", homepage_intro: "Intro", hero_image_url: "", contact_email: "info@example.com", footer_text: "Footer", instagram_url: "", youtube_url: "" });
  assert.equal((await fetchSiteSettings())?.homepage_title, "New headline");
});

test("external resource links reject executable and unsupported URL schemes", () => {
  assert.equal(safeLink("javascript:alert(1)"), undefined);
  assert.equal(safeLink("data:text/html,bad"), undefined);
  assert.equal(safeLink("https://covver.com/magazine/hkl"), "https://covver.com/magazine/hkl");
});
