# HKL — a more beautiful world begins within

A responsive website for the Humility, Kindness & Love global movement, with original forest green, terracotta and pale sage styling. The public Site is https://hkl-a-more-beautiful-world.primlatte16.chatgpt.site. The existing hkl.org site is not modified by this repository.

## Development

Use Node.js 22.13 or later. The project retains the Vinext / React starter and Cloudflare Worker integration. In the Sites environment, use the supplied dependency, preview, build and deployment helpers.

```sh
npm ci
npm run dev
npx tsc --noEmit
node --experimental-strip-types scripts/check-hkl-migration.mjs
```

## Content coverage

The 12 November 2026 snapshot includes all 92 URLs in each of hkl.org's seven published sitemaps: English, Spanish, German, Italian, Punjabi, Russian and Ukrainian (644 URLs). The English collection contains 18 story episodes, 25 weekly practices, seven board profiles, 12 Canada speaker profiles, nine conference archives and 18 HKL Time issues. The original source publishes episodes 1–17 and 19; no episode 18 has been invented.

`/resources` provides searchable, categorized access to the complete English collection. `/movement` contains the original homepage content organized into expandable chapters. `/practice-journey` retains the complete original join-page material alongside the redesigned practice library. Story and practice detail pages include their full source text and media. Original English paths resolve to local equivalents, and the language selector opens the corresponding imported language route.

The collection also includes conference recaps and galleries, Parma speakers, A Beautiful Garden, community, walks, volunteer information, newsletter, WhatsApp channels, practice-app instructions, support, donations, privacy and event media policies. There are 408 source images stored locally under `public/images/hkl` with an original-URL mapping in `content/hkl-assets.json`.

The runtime imports the English catalog and loads other language catalogs on demand. The complete source snapshot remains in `content/hkl-source.json`; independent sitemap inventory and coverage results are recorded in `content/hkl-source-inventory.json` and `content/hkl-audit.json`.

## Design and interactions

- Two-level navigation, centered HKL logo, image-led mega menus and mobile accordions.
- Full-width photographic homepage hero, 520px on desktop, advancing every five seconds with pause/play and arrow controls. Autoplay respects reduced-motion preferences and pauses in background tabs or while a dialog is open.
- Pale sage geometric repeating background across the shared navigation and light content areas, with dark green sections and solid reading surfaces.
- Stacked story rows with overlapping portraits, dates, summaries and large playable thumbnails.
- Searchable story, practice and resource libraries; conference location filters; board and speaker directories; related content links.
- One-minute reflection timer, accessible dialogs, keyboard focus states and reduced-motion styling.

## Existing HKL services

Original public Brevo newsletter forms, publication readers, practice check-ins, Walks calendar and donation widget remain embedded with direct fallback links. Videos use privacy-enhanced YouTube embeds where possible. Event bookings and community accounts continue through HKL's existing services.

Contact, volunteer and other rebuilt text forms validate their fields and prepare an email draft to the verified public address `info@hkl.org`. Visitors review and send it in their email app, or follow the original online-form link. The application does not claim to store or send these submissions. Private membership content, account data, payment processing and external service backends are not copied.

## Snapshot maintenance and validation

The Python importers require Beautiful Soup and Pillow. Keep raw source HTML in a disposable cache outside the repository.

```sh
python scripts/import-hkl-content.py --cache /absolute/path/to/cache --locales en,es-BO,de-DE,it-IT,pa-Guru-IN,ru-RU,uk-UA --workers 4
python scripts/enrich-hkl-catalog.py --cache /absolute/path/to/cache
python scripts/import-hkl-assets.py
python scripts/prepare-hkl-catalog.py
node --experimental-strip-types scripts/check-hkl-migration.mjs
```

Review source repairs when refreshing the snapshot: the original Issue 18 reader target was corrected to the actual issue already embedded by HKL; unavailable Sam Demma profile links resolve to his preserved Abbotsford conference entry; six empty localized `/ca` source pages use the available English event information; Punjab and Toronto registration redirects retain their official booking destinations. Preserve these repairs before preparing runtime catalogs again.

The coverage check verifies all sitemap routes, nonempty content, internal-link destinations, local image availability and expected library counts. Browser verification covers the expanded directories and representative detail pages, language routing, embeds, mobile overflow, navigation, search and retained homepage styling. External subscription, donation and registration transactions are not submitted during QA.

## Sources and assets

Content and original photographs: https://hkl.org/ and its published language pages and linked official event services, reviewed 12 November 2026. https://sos.org/ was a structural reference only. The selected background is `public/images/sage-geometric-background.webp`; its design is retained while compressed for delivery. Event photographs depict the original HKL gatherings. Static event details should be kept current by an editor.
