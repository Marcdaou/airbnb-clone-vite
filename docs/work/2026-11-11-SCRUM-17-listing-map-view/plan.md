# Plan: SCRUM-17 — Interactive map view for listing search results
Spec: ./spec.md · Branch: feature/SCRUM-17-listing-map-view · Worktree: /Users/marcdaou/Desktop/Projects/CLAUDE CODE COURSE/Airbnb Clone Exercise-SCRUM-17

Design-gate decisions applied: listings without coords are hidden while "Search as I move the map" is on (E4); the search-as-move checkbox is also shown on the mobile map view; viewport filtering is client-side over fetched results.

## Files to touch
| File | Change | Why (R-ids) |
|------|--------|-------------|
| `package.json`, `package-lock.json` | add `leaflet`, `react-leaflet` (deps), `@types/leaflet` (devDep) | R2 |
| `src/lib/types.ts` | `lat: number \| null`, `lng: number \| null` | R9 |
| `src/pages/ListingPage.tsx` | guard "Where you'll be" iframe: render only if `hasCoords(listing)`, else city/country text only | R9 (type change fallout, no behaviour change for listings with coords) |
| `src/lib/geo.ts` (new) | `hasCoords` type guard (finite numbers), `inBounds(l, b)` | R7, R9 |
| `src/index.css` | `.price-pin` / `.price-pin.is-active` styles; `.map-pin-popup` overrides for Leaflet popup (no padding/tip chrome, 280px, rounded-xl, shadow-xl) | R3, R5, R6 |
| `src/components/MapPinCard.tsx` (new) | mini card: first photo (20/19), city+country, 1-line title, rating, `$price night`; whole card `Link` to `/rooms/:id`; close X | R6 |
| `src/components/ListingMap.tsx` (new) | `MapContainer` + OSM `TileLayer` with attribution; divIcon price `Marker`s; fit logic keyed by `fitKey`; `moveend` (300ms debounce) -> `onBoundsChange`; "Search as I move the map" checkbox control top-left + "N stays in map area"; Popup with `MapPinCard`; map click / Escape -> `onSelect(null)`; `docked` mode for mobile | R2, R3, R4, R5, R6, R7, E1-E3, E5-E7, E10 |
| `src/components/ViewToggle.tsx` (new) | floating `md:hidden` pill, Map/List with lucide `Map`/`List` icons | R8 |
| `src/components/ListingCard.tsx` | optional `onHover?(id\|null)` on Link mouseenter/leave + focus/blur | R5 |
| `src/pages/Home.tsx` | new state (`hoveredId`, `selectedId`, `searchAsMove`, `bounds`, `mobileView`); derived `visible`; split layout; map column; empty-in-area message; ViewToggle | R1, R3, R4, R7, R8, R10, E2, E4 |

Not touched: Supabase query, routes, Header, CategoryBar, any `.env*`.

## Steps
1. Add deps: `npm i leaflet react-leaflet && npm i -D @types/leaflet`. Confirm `react-leaflet` version supports React 19 (v5); lint + build. — covers R2
   - Tests: build passes; no API key/env var introduced.
2. Type change + geo helpers: make `lat/lng` nullable in `types.ts`; add `src/lib/geo.ts` (`hasCoords` uses `Number.isFinite` on both; `inBounds` = `hasCoords(l) && b.contains([l.lat, l.lng])`); fix `ListingPage.tsx` null fallout by hiding the iframe when coords missing. lint + build. — covers R9, R7
   - Tests: `hasCoords` false for null, NaN, Infinity, true for 0/0; `inBounds` in/out/missing-coords cases; ListingPage without coords renders without the iframe.
3. `ListingCard` `onHover` prop (mouseenter/focus -> id, mouseleave/blur -> null). Optional, so Wishlists etc. unaffected. — covers R5
   - Tests: firing mouseEnter/mouseLeave/focus/blur calls onHover with id / null.
4. Pin + popup CSS in `index.css` and `MapPinCard.tsx` (stop propagation on X so the link doesn't fire; `aria-label="Close"`). — covers R3, R5, R6, E8
   - Tests: MapPinCard renders img, "city, country", truncated title, rating, `$price night`, link `href=/rooms/:id`; X calls onClose without navigation.
5. `ListingMap.tsx` per spec interface, plus optional `docked?: boolean` (mobile: render selected card as an absolutely positioned bottom panel above the toggle instead of a Popup):
   - `MapContainer` default world view (`center [20,0]`, zoom 2), `TileLayer` OSM URL + `&copy; OpenStreetMap contributors` attribution, `keyboard` on.
   - Pins: `listings.filter(hasCoords)` -> `Marker` with memoised `L.divIcon({ className: '', html: '<div class="price-pin [is-active]">$N</div>' })`, `zIndexOffset` 1000 when active (hovered or selected), click -> `onSelect(id)`.
   - `FitController` child (`useMap`): when `fitKey` changes and not loading, `fitBounds(pins, { padding: [48,48], maxZoom: 13 })` or `setView` world if no pins; record a "programmatic move" flag so this fit is never retriggered by search-as-move result changes (fitKey excludes searchAsMove/bounds).
   - `useMapEvents`: `moveend` -> debounced 300ms `onBoundsChange(map.getBounds())`; `click` -> `onSelect(null)`. Document `keydown` Escape -> `onSelect(null)` while selected.
   - Control: absolute top-left white card (z above Leaflet panes, `L.DomEvent.disableClickPropagation` via ref) with checkbox "Search as I move the map"; when checked shows "{resultCount} stays in map area".
   - Wrapper uses `isolate` (own stacking context) so Leaflet z-indexes (400-1000) never cover the sticky Header/CategoryBar or the Header search panel.
   - `import 'leaflet/dist/leaflet.css'`; divIcon only, so no default marker asset path issue.
   lint + build. — covers R2, R3, R4, R5, R6, R7, E1-E3, E5-E7, E9, E10
   - Tests (react-leaflet mocked, pins as buttons): pin count = listings with coords; active class follows hoveredId/selectedId; checkbox unchecked by default and toggles via callback; count line only when checked.
6. `ViewToggle.tsx`: `fixed bottom-6 left-1/2 -translate-x-1/2 md:hidden z-30 rounded-full bg-neutral-900 text-white` pill; "Map"+Map icon in list view, "List"+List icon in map view. — covers R8
   - Tests: label/icon swap and onChange value.
7. Wire `Home.tsx` (query untouched):
   - State and derived values exactly as spec Design; `visible` = searchAsMove && bounds ? `listings.filter(l => inBounds(l, bounds))` : `listings`. Unchecking sets `searchAsMove=false` (bounds kept but unused) -> full set restored.
   - `fitKey = ${category}|${where}|${guests}|${loading}`; clear `selectedId` when the filter set changes or selected listing leaves `visible`.
   - Layout: outer `md:grid md:grid-cols-[minmax(0,1fr)_42%]`; list column keeps padding; grid `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3` (10 skeletons unchanged). Map column `hidden md:block sticky top-[<81 + CategoryBar height>px] h-[calc(100vh-<offset>px)]`; offset measured in the browser and written as a single constant (risk noted).
   - Mobile (<md): `mobileView === 'map'` hides list column and shows the map full-screen below header + category bar (`fixed inset-x-0 bottom-0 top-[offset]`), with the search-as-move control and `docked` mini card; ViewToggle always rendered (md:hidden). Toggle is local state only — no `setParams`.
   - Empty states: filter empty state ("No exact matches" + Clear filters) when `!loading && listings.length === 0`; when `searchAsMove && visible.length === 0 && listings.length > 0` show "No stays in this map area — zoom out or move the map". Map stays rendered in both.
   - `onHover={setHoveredId}` on cards.
   lint + build. — covers R1, R3, R4, R7, R8, R9, R10, E2, E4, E5
   - Tests (per spec test strategy): pin count across filter params; no-coords listing card without pin; hidden when search-as-move on (E4) and restored when off; bounds containing 2 of 4 -> 2 cards + 2 pins; moving with toggle off keeps 4; hover -> pin `is-active`; click pin -> mini card + Escape closes; skeletons while loading; empty state + Clear filters; mobile toggle keeps `location.search`.
8. Manual pass in `npm run dev` at 1440px and 390px against the 8 Figma frames (R1 proportions, R4 fit/maxZoom, sticky offset, popup look, mobile docked card above toggle, Header search panel not covered by map). Final lint + build. — covers R1, R4, R6, R8 visual checks

## R-id coverage
R1: 7, 8 · R2: 1, 5 · R3: 4, 5, 7 · R4: 5, 7, 8 · R5: 3, 4, 5 · R6: 4, 5, 8 · R7: 2, 5, 7 · R8: 6, 7, 8 · R9: 2, 7 · R10: 7

## Data / config changes
None. No Supabase schema/RLS/migration, no env vars, no secrets, no Stripe. Only new npm dependencies (leaflet, react-leaflet, @types/leaflet) and a TS type widening.

## Rollback
Purely client-side: revert the merge commit / branch. No data to undo. Removing the deps comes with the revert of package.json/package-lock.json.

## Risks and assumptions
- `react-leaflet` must be v5.x for React 19 peer compatibility; if npm reports a peer conflict, stop and report rather than force-installing.
- No Vitest in the repo yet; the Test stage sets it up and must mock `react-leaflet` (jsdom has no layout). Steps expose plain props so tests can drive `onBoundsChange` directly.
- Leaflet z-indexes (panes 400, controls 1000) would cover the sticky header/category bar and the Header search panel; mitigated with `isolate` on the map wrapper — verified manually in step 8.
- Sticky/fixed offset is a hard-coded constant (Header 81px + CategoryBar height); drifts if those components change.
- Leaflet needs its container sized at mount; mobile map view is mounted only when shown (or `invalidateSize()` on show) to avoid grey tiles.
- OSM tile usage policy is fine for dev/demo; real production traffic needs a tile provider (flag before launch).
- Client-side area filter cannot surface listings outside the current filtered fetch (accepted at design gate).
- ListingPage fallback for missing coords (hide the map iframe) is a minimal type-safety fix, not a new feature; currently that page would build a `NaN` bbox for null coords.
- Unrelated uncommitted changes in the main checkout (.mcp.json, Header.tsx, index.css) are not carried; the branch is from origin/main. Header.tsx/index.css edits there may conflict later with this branch's index.css edits.
