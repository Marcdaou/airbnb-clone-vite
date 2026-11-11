# Test report: SCRUM-17 — Interactive map view for listing search results
Spec: ./spec.md · Plan: ./plan.md · Branch: feature/SCRUM-17-listing-map-view

Mocks (module boundary): `react-leaflet` (fake MapContainer/TileLayer/Marker/Popup, `useMap`/`useMapEvents` return a spy map), `src/lib/supabase.ts` (in-memory query builder applying eq/gte/or), `src/lib/auth` (signed out). Real `leaflet` is used only for its pure `LatLngBounds` math and `divIcon` options. No network.

## Traceability
| Req | Test (file › name) | Result |
|-----|--------------------|--------|
| R1 | src/pages/Home.test.tsx › R1: at md and up renders the list column and a sticky map column side by side | pass |
| R2 | src/pages/Home.test.tsx › R2: uses OpenStreetMap tiles with the OSM attribution and no API key | pass |
| R3 | src/pages/Home.test.tsx › R3: renders one price pin per listing with coords, showing $price | pass |
| R3 | src/pages/Home.test.tsx › R3: pins follow the same filtered results as the grid (category / guests / where, 4 cases) | pass |
| R3 | src/pages/Home.test.tsx › R3: pins update when a category is clicked | pass |
| R4 | src/pages/Home.test.tsx › R4: on load fits bounds to all pins with padding 48 and maxZoom 13 | pass |
| R4 | src/pages/Home.test.tsx › R4: refits after a filter change | pass |
| R4 | src/pages/Home.test.tsx › R4: does not refit when results change because of search-as-move | pass |
| R4/E3 | src/pages/Home.test.tsx › R4/E3: with no pins (all listings lack coords) shows default world view, cards still listed | pass |
| R5 | src/pages/Home.test.tsx › R5: hovering a card highlights its pin and leaving clears it | pass |
| R5/E10 | src/pages/Home.test.tsx › R5/E10: keyboard focus on a card highlights its pin; blur clears it | pass |
| R6 | src/pages/Home.test.tsx › R6: clicking a pin opens a mini card linking to /rooms/:id with photo, place, title, rating, price | pass |
| R6 | src/pages/Home.test.tsx › R6: the close button closes the mini card | pass |
| R6/E10 | src/pages/Home.test.tsx › R6/E10: Escape closes the mini card | pass |
| R6 | src/pages/Home.test.tsx › R6: a map click closes the mini card | pass |
| R6/E9 | src/pages/Home.test.tsx › R6/E9: on mobile the mini card docks at the bottom of the map instead of a popup | pass |
| R6/E8 | src/components/MapPinCard.test.tsx › R6/E8: long titles truncate…, 5-digit price renders | pass |
| R6 | src/components/MapPinCard.test.tsx › R6: close button calls onClose without following the link | pass |
| R7 | src/lib/geo.test.ts › R7: inBounds is true only for listings inside the bounds | pass |
| R7 | src/pages/Home.test.tsx › R7: "Search as I move the map" is unchecked by default and moving the map does not change results | pass |
| R7 | src/pages/Home.test.tsx › R7: when checked, list and pins are limited to the map area after a debounced moveend, with a count line | pass |
| R7/E4 | src/pages/Home.test.tsx › R7/E4: unchecking restores the full filtered set, including listings without coords | pass |
| R7/E4 | src/pages/Home.test.tsx › R7/E4: no stays in the area shows the map-area message, not the filter empty state | pass |
| R7 | src/pages/Home.test.tsx › R7: search-as-move control is also available on the mobile map view | pass |
| R8 | src/pages/Home.test.tsx › R8: defaults to list view with a "Map" toggle and no map (matchMedia 390px) | pass |
| R8 | src/pages/Home.test.tsx › R8: toggling switches to a full-screen map and back, without changing URL params or refetching | pass |
| R8 | src/components/MapPinCard.test.tsx › R8: shows "Map" in list view and "List" in map view, hidden at md+ | pass |
| R9 | src/lib/geo.test.ts › R9: hasCoords accepts finite lat/lng and rejects null, NaN and Infinity | pass |
| R9/E4 | src/lib/geo.test.ts › R9/E4: inBounds excludes listings without coords even with world bounds | pass |
| R9 | src/pages/Home.test.tsx › R9: a listing without coords appears in the grid but gets no pin (and is excluded from fitBounds) | pass |
| R10/E1 | src/pages/Home.test.tsx › R10: shows 10 loading skeletons and no pins while loading (E1) | pass |
| R10 | src/pages/Home.test.tsx › R10: list grid uses 1/2/3 columns in split view | pass |
| R10/E2 | src/pages/Home.test.tsx › R10/E2: empty results show "No exact matches" + Clear filters, map visible without pins; Clear resets params | pass |
| R10 | src/pages/Home.test.tsx › R10: still issues the single listings query with the filters | pass |

Mutation sanity check: removing the `searchAsMove` guard in Home fails 9 tests; removing hover from pin activation fails 2. Both reverted.

## Commands run
| Command | Result |
|---------|--------|
| npm test | 37 passed, 0 failed (3 files) |
| npm run lint | exit 0, 0 errors, 11 warnings (all pre-existing / non-test; same count as Build stage) |
| npm run build | ok |

## Coverage gaps
- R1 visual layout (58/42 split, sticky height under header + category bar): only class names asserted; real layout needs a browser check against Figma.
- R2/R4 real Leaflet behaviour (tile rendering, actual fitBounds zoom result, `moveend` firing from real panning): react-leaflet is mocked; we assert the calls/props, not the rendered map.
- R5/R6 pin styling (neutral-900 fill, scale 1.1) and popup placement above the pin: CSS in `index.css`, not evaluated by jsdom; we assert the `is-active` class and `zIndexOffset=1000`.
- R8 resize between breakpoints at runtime (matchMedia change events) not exercised; each test fixes the viewport.
- E5 (filter change while toggle ON re-applies bounds after the refit's moveend) relies on real Leaflet emitting moveend after fitBounds; not provable with the mock.
- E6 tile failure/offline and E7 overlapping pins: browser-only.
- E10 pins focusable via Leaflet `keyboard`: Leaflet internals, not tested.

## Bugs found and fixed
None. Two test-authoring errors were corrected (not the code): the mobile docked-card test first matched the hidden list card's link instead of the docked card's; the R4 refit test first asserted on an intermediate fit call before results loaded.

Observation (not a spec violation, not fixed): on a filter change `FitController` runs one transient fit with the previous results (fitKey changes before `loading` flips to true), then refits correctly once results arrive. Final state meets R4; may show as a brief extra map move.
