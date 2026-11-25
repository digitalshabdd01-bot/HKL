"use client";

import { useEffect, useState } from "react";
import { backendEnabled, fetchContent } from "../lib/hkl-api";
import { isNewNotice, sortNotices, toNotice, type Notice } from "../lib/hkl-notices";
import defaultNotices from "../content/hkl-notices.json";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
});
const initialNotices = sortNotices(defaultNotices);

export default function NoticeBoard() {
  const [notices, setNotices] = useState<Notice[]>(backendEnabled ? [] : initialNotices);
  const [loading, setLoading] = useState(backendEnabled);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [limit, setLimit] = useState(5);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!backendEnabled) return;
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    setLoading(true);
    setError(false);
    Promise.all([
      fetchContent("notice", controller.signal),
      fetchContent("event", controller.signal),
    ])
      .then(([updates, events]) => {
        if (active) {
          setNotices(sortNotices([...updates, ...events].map(toNotice)));
          setLimit(5);
        }
      })
      .catch(() => { if (active) setError(true); })
      .finally(() => {
        clearTimeout(timeout);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [attempt]);

  const visible = notices.slice(0, limit);
  return (
    <section id="notice-board" className="notice-board section-pad" aria-labelledby="notice-board-title">
      <div className="container notice-board-layout">
        <div className="notice-board-intro">
          <span className="eyebrow">NOTICE BOARD</span>
          <h2 id="notice-board-title">Latest from <em>HKL.</em></h2>
          <p>Announcements, gatherings, and weekly practices.</p>
          <a className="notice-directory-link" href="/gatherings">Explore our gatherings</a>
        </div>
        <div className="notice-board-panel" aria-busy={loading}>
          <div className="notice-board-heading">
            <h3>Latest updates</h3>
            <span>Newest first</span>
          </div>
          {loading ? <p className="notice-board-message" role="status">Loading updates…</p> : error ? (
            <div className="notice-board-message" role="alert">
              <p>Updates are temporarily unavailable.</p>
              <button className="notice-board-more" onClick={() => setAttempt((value) => value + 1)}>Try again</button>
            </div>
          ) : notices.length === 0 ? (
            <p className="notice-board-message">No announcements yet. Check back soon for the latest news.</p>
          ) : <>
            <ol className="notice-board-list" id="notice-board-updates">
              {visible.map((notice, index) => (
                <li key={notice.id} className={index === 0 ? "notice-featured" : undefined}>
                  <a className="notice-board-item" href={notice.href}>
                    <div className="notice-board-meta">
                      <span className="notice-category">{notice.category}</span>
                      <time dateTime={notice.date}>{dateFormat.format(new Date(notice.date))}</time>
                      {now !== null && index < 5 && isNewNotice(notice, now) && <span className="notice-new">NEW</span>}
                    </div>
                    <h4>{notice.title}</h4>
                  </a>
                </li>
              ))}
            </ol>
            <div className="notice-board-footer">
              <span role="status">Showing {visible.length} of {notices.length} updates</span>
              {limit < notices.length ? <button className="notice-board-more" aria-controls="notice-board-updates" onClick={() => setLimit((value) => value + 5)}>Show older updates</button> : notices.length > 5 && <button className="notice-board-more" aria-controls="notice-board-updates" onClick={() => setLimit(5)}>Show fewer updates</button>}
            </div>
          </>}
        </div>
      </div>
    </section>
  );
}
