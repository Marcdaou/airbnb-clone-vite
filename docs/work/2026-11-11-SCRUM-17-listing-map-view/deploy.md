# Deploy: SCRUM-17 — Interactive map view for listing search results

- PR: https://github.com/Marcdaou/airbnb-clone-vite/pull/1
- Preview URL: https://airbnb-clone-supabase-biak475eb-marc-daous-projects.vercel.app  (shareable, expires 2026-11-12 15:52: https://airbnb-clone-supabase-biak475eb-marc-daous-projects.vercel.app/?_vercel_share=yfkOL1ELimsePusYemZ27CiKOjmHYc5y)
- Deployment id: dpl_3rMhajR3mk6nzATnjGCyfuiDWcwt · state READY · target preview · via CLI (`npx vercel deploy`, no --prod)
- Commit: 4db4707 on feature/SCRUM-17-listing-map-view
- Deployed at: 2026-11-11T16:52:00Z   <- Maintain watches from here
- Superseded: dpl_r2RNcRYNE28sXsGTexmU6cfNk8hV (ht9cbjybm, built without preview env vars)

Git integration builds `main` but produced no preview for the feature branch after ~5 minutes, so the CLI fallback was used. Worth checking the project's Git settings (preview deployments / ignored build step).

## Env check (preview)
Env fix 2026-11-11 (approved by human): existing VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_STRIPE_PUBLISHABLE_KEY extended from Production-only to Production + Preview via Vercel MCP edit_project_env (target only; values untouched, never read). No other variables changed.

| Variable | Read by code | Present for Preview |
|----------|--------------|---------|
| VITE_SUPABASE_URL | yes | yes |
| VITE_SUPABASE_ANON_KEY | yes | yes |
| VITE_STRIPE_PUBLISHABLE_KEY | not via import.meta.env in src | yes |

## Smoke check (browser, Playwright, 1440x900, via share link)
| Check | Result |
|-------|--------|
| / loads | 200, listings render (Tulum, Mykonos, Byron Bay, Malibu, ...) |
| Map pins | 20 price-pin markers rendered in the Leaflet map (right pane) |
| Pin click -> mini card | $500 pin opened popup "Mexico City, Mexico · 4.40 · Architect-Designed Concrete House · $500 night" |
| Console errors | 0 |
| Screenshot | preview-desktop.png |

Note: at default zoom several pins overlap (one pin's pill intercepted clicks on another); not a blocker, but clustering could be a follow-up.

## Self-review notes
- No secrets, .env files or Stripe secret keys in the diff; no Supabase query/RLS changes (spec: Supabase none changed).
- `dangerouslySetInnerHTML` appears only in `src/test/mocks.tsx` (test-only react-leaflet mock), not shipped.
- Leaflet `divIcon` html interpolates `price_per_night` (a number from the DB) into HTML in `src/components/ListingMap.tsx`. Safe while the column is numeric; if it ever becomes text, escape it.
- OSM tiles loaded from tile.openstreetmap.org: fine for a demo, but OSM's tile usage policy discourages heavy production traffic.
- Nothing was fixed in this stage.
