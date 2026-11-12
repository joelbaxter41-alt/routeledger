# RouteLedger visual identity and interface

The Simplify job application tracker page supplied by the user was inspected as a reference for visual hierarchy, airy layout, a product-first hero, status grouping and alternating feature sections. RouteLedger keeps its own copy, green palette, service-business workflows and financial definitions. No Simplify brand assets, testimonials or customer claims were reused.

## Identity

- Forest green `#163F32`, ivory `#F8F7F3`, soft sage surfaces and restrained borders.
- A geometric R app mark with an open rectangular counter and diagonal leg; supplied as a path-based SVG in `public/brand/routeledger-mark.svg` and as the favicon.
- Geist interface typography with editorial Georgia headings on the marketing site. Financial figures use Geist Mono.
- The live wordmark is composed in `src/components/brand.tsx`; the standalone editable SVG wordmark is in `public/brand/routeledger-wordmark.svg`.

## Changes

- Marketing hero with interactive sample job-board/profit tabs, clear sample-data labeling and exact sample financial totals.
- Alternating scheduling and profitability feature stories, mobile layouts, readable contrast and accessible keyboard tab controls.
- Light workspace sidebar, sage active navigation, compact workspace breadcrumb, account initials and quieter tables/cards.
- Persisted-data jobs board with Draft, Scheduled, In progress and Completed columns. List and board views retain search/status filters. Canceled jobs remain accessible in the list.
- Authentication pages, navigation and footer share the same mark and wordmark.

## Validation limits

Production build, lint, type checks and the financial/database unit suites were run after implementation. Desktop/mobile browser checks cover the public site, interactive preview, calculator, navigation, responsive overflow, keyboard skip navigation and axe accessibility. Authenticated workspace rendering and workflow checks still require completed Supabase configuration; the preview does not impersonate a connected customer workspace.
