# Spec: SCRUM-17 — Interactive map view for listing search results
Intent: ./intent.md · Figma: https://www.figma.com/design/WpmTPLUutvzyJBnin11ifK

## Requirements
| ID | Requirement | Traces to |
|----|-------------|-----------|
| R1 | At `md` (>=768px) and up, Home renders a split view: listing grid on the left (~58%), sticky map on the right (~42%, full viewport height below the header + category bar). | SC1 |
| R2 | Map uses Leaflet (`leaflet` + `react-leaflet`) with free OpenStreetMap tiles (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`) and the required OSM attribution. No API key, no new env var. | SC1 |
| R3 | Each listing in the current results with finite `lat` and `lng` renders one price pin (white pill, `$<price_per_night>`, semibold). Pins are derived from the same `listings` array as the grid, so they update with category/where/guests changes. | SC1, SC2 |
| R4 | On first load and after each filter change, the map fits bounds to all pins (padding 48px, max zoom 13). If no pins, map shows a default world view. Fit is NOT re-run when results change because of "Search as I move the map". | SC1, SC2 |
| R5 | Hovering (mouse enter/leave, and keyboard focus/blur) a ListingCard sets/clears `hoveredId`; the matching pin switches to the highlighted style (dark fill `neutral-900`, white text, scale 1.1, raised z-index). The dark outline on the hovered card in Figma only marks which card is hovered; the card itself is unchanged. | SC3 |
| R6 | Clicking a pin sets `selectedId` and opens a mini card anchored above the pin: first photo (aspect 20/19), city + country, title (1 line truncate), rating, `$price night`. The whole card links to `/rooms/:id`. A close (X) button, a map click or Escape closes it. Selected pin uses the highlighted style. Below md the mini card docks full-width at the bottom of the map, above the List toggle, so it never covers the selected pin. | SC4 |
| R7 | A "Search as I move the map" checkbox control sits top-left on the map, unchecked by default (not persisted). When checked, after `moveend` (debounced 300ms) the visible list and pins are limited to fetched listings inside `map.getBounds()`; a result-count line reads "N stays in map area". When unchecked, moving the map never changes results, and unchecking restores the full filtered set. | SC5 |
| R8 | Below `md` (<768px) Home shows list view by default and a floating pill toggle (bottom-centre, `neutral-900`, white text): "Map" with map icon in list view, "List" with list icon in map view. The map view is full-screen below header + category bar. The view is stored in local state only, so URL params (filters) and fetched results are unchanged when toggling. | SC6 |
| R9 | Listings with null/non-finite `lat` or `lng` are rendered in the grid but get no pin and are excluded from fitBounds and from the in-bounds filter (see Edge case E4). `Listing.lat`/`lng` types become `number \| null`. | SC7 |
| R10 | Existing behaviour stays: filters, 10-card loading skeletons (grid becomes 2-3 columns in split view), and the "No exact matches" empty state with "Clear filters" (shown in the list column; map still visible with no pins). | SC8 |

## Design
- New deps: `leaflet`, `react-leaflet`, `@types/leaflet`. Import `leaflet/dist/leaflet.css` in `ListingMap`.
- `Home.tsx` keeps the single Supabase query (unchanged). New state: `hoveredId`, `selectedId`, `searchAsMove` (false), `bounds` (LatLngBounds | null), `mobileView` ('list' | 'map').
- Derived: `mapped = listings.filter(hasCoords)`; `visible = searchAsMove && bounds ? listings.filter(l => hasCoords(l) && bounds.contains([l.lat,l.lng])) : listings`. Grid and pins both render from `visible` (pins = `visible.filter(hasCoords)`), so SC2 holds by construction.
- Visible-area filter is client-side over already-fetched results (intent open question 3): no new query, no RPC. Listings outside the initial filtered set cannot appear — acceptable for the current dataset size.
- Layout: `md:grid md:grid-cols-[minmax(0,1fr)_42%]`; list column scrolls with page; map column `sticky top-[<header+categorybar>] h-[calc(100vh-<offset>)]`. Grid inside list: `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3`.
- Pins: Leaflet `divIcon` with HTML `<div class="price-pin">$180</div>`; styled in `index.css` (rounded-full, bg white, shadow, text-sm font-semibold; `.is-active` = bg neutral-900 text white scale-110).
- Mini card: react-leaflet `Popup` (custom className, no default tip padding), width 280, rounded-xl, shadow-xl.

## Interfaces
- `src/lib/geo.ts`: `hasCoords(l: Listing): l is Listing & {lat:number; lng:number}`; `inBounds(l, b: LatLngBounds): boolean`.
- `src/components/ListingMap.tsx`: `props { listings: Listing[]; hoveredId: string|null; selectedId: string|null; onSelect(id: string|null): void; searchAsMove: boolean; onSearchAsMoveChange(v: boolean): void; onBoundsChange(b: LatLngBounds): void; fitKey: string; resultCount: number }`. `fitKey` = `${category}|${where}|${guests}|${loading}` — fit runs when it changes.
- `src/components/MapPinCard.tsx`: `props { listing: Listing; onClose(): void }`.
- `ListingCard`: add optional `onHover?(id: string|null): void` (mouse enter/leave + focus/blur on the Link). Backwards compatible.
- `src/components/ViewToggle.tsx` (mobile): `props { view: 'list'|'map'; onChange(v): void }`, `md:hidden`.
- Routes: none changed. Supabase: none changed.

## Data changes
None (no schema, no RLS, no backfill). Type-only change: `lat: number | null`, `lng: number | null` in `src/lib/types.ts`; any existing consumer (ListingPage) checked for null.

## Screens
| Frame (Figma) | Route / component | Requirements |
|---------------|-------------------|--------------|
| Desktop – Split view (default) | `/` Home + ListingMap | R1, R2, R3, R4, R10 |
| Desktop – Pin hover highlight | ListingCard hover + pin `.is-active` | R5 |
| Desktop – Pin selected + mini card | MapPinCard popup | R6 |
| Desktop – Search as I move the map (on) | ListingMap control + filtered list | R7 |
| Desktop – Loading | Home skeletons + map | R10 |
| Desktop – Empty results | Home empty state + map without pins | R10, R9 |
| Mobile – List view | `/` <768px + ViewToggle | R8 |
| Mobile – Map view | `/` <768px map + ViewToggle + mini card | R8, R6 |

## Edge cases
- E1 Loading: skeletons in list column; map shows tiles with no pins and no fit until results arrive.
- E2 Empty results: empty state in list column, map at last/default view without pins; "Clear filters" resets params (fit re-runs).
- E3 All listings lack coords: list shows all, map shows default world view, no pins, no error.
- E4 Search-as-move ON + listing without coords: it is excluded from the list (it cannot be "inside the map area"). Toggling OFF restores it. Search-as-move ON + no listings in area: list shows "No stays in this map area — zoom out or move the map" (not the filter empty state).
- E5 Filter change while toggle ON: new results are fetched, map refits to them, bounds filter re-applies after the refit's moveend.
- E6 Tile load failure / offline: list still works; map grey with attribution; no blocking error.
- E7 Many overlapping pins: no clustering (non-goal); active pin is raised via z-index so hover/selected remains visible.
- E8 Long titles in mini card truncate to one line; prices up to 5 digits fit the pill.
- E9 Mobile: hover not applicable; tapping a pin opens the mini card above the floating toggle.
- E10 Keyboard: card focus highlights pin; pins are focusable buttons (Leaflet `keyboard`), Escape closes the mini card.

## Risks
- Leaflet needs `window`; fine in Vite SPA, but tests (jsdom) need `react-leaflet` mocked or Leaflet set up with a container size.
- OSM tile usage policy: fine for dev/demo traffic; heavy production use would need a provider — flag before real launch.
- Sticky offset depends on Header (80px) + CategoryBar height; hard-coded offset may drift if those change.
- Leaflet default marker icon asset paths break under Vite — avoided by using `divIcon` only.

## Test strategy (Vitest + Testing Library)
- `geo.test.ts`: `hasCoords` rejects null/NaN (R9); `inBounds` (R7).
- `Home.test.tsx` with Supabase and `react-leaflet` mocked (mock renders pins as buttons with price text): pin count equals listings-with-coords for several filter param sets (R3, R2/SC2); listing without coords shows card but no pin (R9); empty state + Clear filters still rendered (R10); skeleton during loading (R10).
- Hover: `mouseEnter` on card gives the matching pin `is-active`; `mouseLeave` removes it (R5).
- Click pin shows mini card with image, title, price and link `href=/rooms/:id`; Escape closes (R6).
- Search-as-move: checkbox unchecked by default; simulate `onBoundsChange` with bounds containing 2 of 4 → 2 cards and 2 pins; unchecked → simulated move leaves 4 (R7).
- Mobile: with `matchMedia` <768 mocked, toggle switches list/map and `location.search` unchanged (R8).
- R1/R4 layout and fitBounds: manual check on the preview against Figma.
