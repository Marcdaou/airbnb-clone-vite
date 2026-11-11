# Intent: SCRUM-17 — Interactive map view for listing search results

**Source:** https://marc7182.atlassian.net/browse/SCRUM-17 · priority Medium · sprint SCRUM Sprint 0 · reporter product owner

## Problem
Guests browsing search results on the Home page see only a grid of cards. There is no way to judge where a listing is relative to other listings or to an area they care about, so choosing a stay by location means opening listings one by one.

## Who is affected
Guests — every search/browse session on the Home page (the main entry point of the app), on desktop and mobile.

## Success criteria (measurable)
- [ ] SC1: On desktop widths, the Home page shows the listing results and a map side by side; every listing in the current results that has coordinates appears on the map as a pin labelled with its nightly price.
- [ ] SC2: The set of pins always matches the set of listings in the results (same count, same listings) after any change to the existing filters (category, where, guests).
- [ ] SC3: Hovering a listing card visibly highlights that listing's pin; moving the pointer away removes the highlight.
- [ ] SC4: Clicking a pin opens a mini listing card (at least photo, title, price) that links to that listing's page.
- [ ] SC5: A "Search as I move the map" option exists; when on, panning or zooming updates the results to only listings inside the visible map area; when off, moving the map does not change results.
- [ ] SC6: On mobile widths, a toggle switches between list view and map view, and the toggle keeps the current results/filters.
- [ ] SC7: Listings with missing coordinates do not break the page: they still appear in the list and are simply absent from the map.
- [ ] SC8: Existing Home page behaviour (filters, loading skeletons, empty state with "Clear filters") continues to work.

## Constraints
- Listings already store `lat`/`lng`: typed as non-null `number` in `src/lib/types.ts` (lines 19-20) but nullable `double precision` in `supabase/migrations/0001_init_schema.sql` (lines 46-47) — hence SC7.
- Story names Leaflet or MapLibre as the map library (Jira description); no map library is in `package.json` today.
- Results are queried from the Supabase `listings` table in `src/pages/Home.tsx`, filtered by `category`, `where`, `guests` URL params.
- Stack: Vite + React 19 + Tailwind 4 + react-router 7.
- Sprint ends 2026-11-24.

## Non-goals
- No geocoding, address search or "search by place on map" beyond the visible-area filter.
- No changes to listing data or schema (no backfill of coordinates).
- No map on the listing detail page, wishlists or trips pages.
- No clustering/heatmaps unless needed for SC1 to stay usable.
- No other new filters (covered by SCRUM-19).

## Open questions
1. Tile provider: is a free OSM-based tile source acceptable, or is a keyed provider (and its API key/env var) required? Determines whether a new env var is needed.
2. "Search as I move the map": should it default to on or off? (SC5 is written as off-by-default-safe; please confirm.)
3. Visible-area filtering: done client-side over the already-fetched results, or as a new server query by bounds? Affects whether listings outside the initial result set can appear. (Left to Design, but confirm expectation.)
4. Rewritten criteria — please confirm meaning kept: "split view" → SC1 (desktop only, with mobile handled by SC6); "price pin for each listing" → SC1+SC2+SC7 (listings without coordinates are excluded from the map); "mini listing card" → SC4 (assumed contents photo/title/price and link to listing page).
5. Which breakpoint defines "mobile" (e.g. Tailwind `md`)?
