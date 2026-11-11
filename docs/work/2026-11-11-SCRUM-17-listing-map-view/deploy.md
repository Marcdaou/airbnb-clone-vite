# Deploy: SCRUM-17 — Interactive map view for listing search results

- PR: https://github.com/Marcdaou/airbnb-clone-vite/pull/1
- Preview URL: https://airbnb-clone-supabase-ht9cbjybm-marc-daous-projects.vercel.app  (shareable, expires 2026-11-12: https://airbnb-clone-supabase-ht9cbjybm-marc-daous-projects.vercel.app/?_vercel_share=ltMtP9aQzOJ5T4P2N8aXeVdExoNtUSYX)
- Deployment id: dpl_r2RNcRYNE28sXsGTexmU6cfNk8hV · state READY · target preview · via CLI (`npx vercel deploy`, no --prod)
- Commit: b96f550 on feature/SCRUM-17-listing-map-view (CLI upload of the worktree at that commit)
- Deployed at: 2026-11-11T16:50:39Z   <- Maintain watches from here

Git integration builds `main` but produced no preview for the feature branch after ~5 minutes, so the CLI fallback was used. Worth checking the project's Git settings (preview deployments / ignored build step).

## Env check (preview)
| Variable | Read by code | Present for Preview |
|----------|--------------|---------|
| VITE_SUPABASE_URL | yes | NO (production only) |
| VITE_SUPABASE_ANON_KEY | yes | NO (production only) |
| VITE_STRIPE_PUBLISHABLE_KEY | not via import.meta.env in src | NO (production only) |

Confirmed in the built bundle: no Supabase project URL is embedded, so the Supabase client will throw "supabaseUrl is required" on load. The preview serves HTTP 200 but the app will not render data until the human adds these to the Preview environment and redeploys. Values were not read or copied.

## Smoke check
| URL | Status |
|-----|--------|
| / (direct) | 302 (Vercel deployment protection) |
| / via share link | 200 |
| /rooms/1 (deep link, with share cookie) | 200 (vercel.json SPA rewrite works) |
| App runtime | expected to fail: missing preview env vars (see above) |

## Self-review notes
- No secrets, .env files or Stripe secret keys in the diff; no Supabase query/RLS changes (spec: Supabase none changed).
- `dangerouslySetInnerHTML` appears only in `src/test/mocks.tsx` (test-only react-leaflet mock), not shipped.
- Leaflet `divIcon` html interpolates `price_per_night` (a number from the DB) into HTML in `src/components/ListingMap.tsx`. Safe while the column is numeric; if it ever becomes text, escape it.
- OSM tiles loaded from tile.openstreetmap.org: fine for a demo, but OSM's tile usage policy discourages heavy production traffic.
- Nothing was fixed in this stage.
