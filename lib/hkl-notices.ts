import type { CmsContent } from "./hkl-api";

export type Notice = {
  id: string;
  title: string;
  summary: string;
  date: string;
  category: string;
  href: string;
};

export function sortNotices(notices: Notice[]): Notice[] {
  return notices
    .filter((notice) => Number.isFinite(Date.parse(notice.date)))
    .slice()
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date) || a.id.localeCompare(b.id));
}

export function isNewNotice(notice: Notice, now: number): boolean {
  const age = now - Date.parse(notice.date);
  return age >= 0 && age < 30 * 24 * 60 * 60 * 1000;
}

export function toNotice(record: CmsContent): Notice {
  return {
    id: `${record.kind}-${record.id}`,
    title: record.title,
    summary: record.summary,
    date: record.publish_at,
    category: record.kind === "event" ? "Gathering" : "Announcement",
    href: `/content/${record.kind}/${encodeURIComponent(record.slug)}`,
  };
}
