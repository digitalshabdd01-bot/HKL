import assert from "node:assert/strict";
import test from "node:test";
import { isNewNotice, sortNotices, toNotice, type Notice } from "../lib/hkl-notices";
import type { CmsContent } from "../lib/hkl-api";

const now = Date.parse("2026-11-20T12:00:00Z");
const notice = (id: string, date: string): Notice => ({ id, date, title: id, summary: "", href: "/resources", category: "Announcement" });

test("newest publication comes first; invalid dates are omitted without changing the original array", () => {
  const items = [notice("old", "2026-09-01"), notice("new", "2026-11-20"), notice("bad", "invalid"), notice("middle", "2026-10-01")];
  assert.deepEqual(sortNotices(items).map((item) => item.id), ["new", "middle", "old"]);
  assert.equal(items[0].id, "old");
});

test("NEW expires after 30 days and does not label old or scheduled updates", () => {
  assert.equal(isNewNotice(notice("today", "2026-11-20T00:00:00Z"), now), true);
  assert.equal(isNewNotice(notice("old", "2026-10-01T00:00:00Z"), now), false);
  assert.equal(isNewNotice(notice("boundary", "2026-10-21T12:00:00Z"), now), false);
  assert.equal(isNewNotice(notice("future", "2027-01-09T00:00:00Z"), now), false);
});

test("CMS events use publication dates and link to the right detail pages", () => {
  const record = { id: 19, kind: "event", slug: "community-walk", title: "Community walk", summary: "Join us", publish_at: "2026-11-18T09:00:00Z", starts_at: "2027-01-09T10:00:00Z" } as CmsContent;
  assert.equal(toNotice(record).date, record.publish_at);
  assert.equal(toNotice(record).href, "/content/event/community-walk");
  assert.equal(toNotice({ ...record, kind: "notice", slug: "new-update" }).href, "/content/notice/new-update");
});
