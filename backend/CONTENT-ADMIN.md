# Content administration — phase 3

The API connection now also supports conferences, walks, publications and speaker/director profiles. They use the same `NEXT_PUBLIC_HKL_API_URL` setting described in `FRONTEND-INTEGRATION.md`.

## Upgrade

Deploy the backend first so its migration and API fields are available before deploying the frontend. Run `python manage.py migrate`, then optionally `python manage.py import_collections`. The importer reads the existing repository content, creates drafts and never overwrites existing records. Re-running it is safe. Review imported text/images/reading links; set event dates and times before publishing. The archived conference import does not guess dates from titles. Upcoming conferences and walks should be added in admin with their real schedule and RSVP URL.

## Editing

* Content → Event: set `event_type` to conference or walk, location/country, start/end (UTC), registration URL and any speaker assignments. Ongoing events remain in upcoming lists until their end time. Events with no end time are classified by their start time. Published events require a start time.
* Content → Publication: set issue number, title, summary, cover URL and `resource_url` to the PDF/reader. Website visitors open reading links externally; no arbitrary iframe HTML is accepted.
* Content → Speaker: set `profile_role` to speaker or board director, biography in plain text and portrait URL. Only published, due speaker records are exposed on event pages.
* Site settings: one settings record controls homepage headline, introductory text, first hero image, footer text, public contact email and Instagram/YouTube links. Turn on `published` to apply it. No settings record, a draft record, or a service error retains the existing branding. Settings are site-wide rather than translated per locale in this phase.

Collection directories link to `/content/event/SLUG`, `/content/publication/SLUG` and `/content/speaker/SLUG`. Admin-created records work without adding frontend source files. The existing imported legacy URLs remain available separately; automatic redirects/aliases from those pages are not implemented yet.

Configured directories use published API records, including an empty collection. The frontend never fills an empty or failed directory with old draft snapshots. Disabling the backend URL restores the original directories and embedded publication/calendar content.

## Remaining work

Media currently uses durable external URLs; file uploads and object storage still need implementation. Homepage promotional story/event cards, original source documents, signup campaigns, daily polls, payments, email notifications, translated content management and community accounts remain separate tasks. The existing homepage carousel remains automatic; changing the first photo does not replace its other slides.

Run backend tests (`DJANGO_DEBUG=true python manage.py test`), API tests (`node --import tsx --test tests/hkl-api.test.ts` from repository root), TypeScript checks and the frontend production build before deployment. A live PostgreSQL-backed Render service and frontend API configuration are still required to activate this functionality.
