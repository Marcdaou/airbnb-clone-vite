# Status: SCRUM-17 — Interactive map view for listing search results

- Jira key: SCRUM-17
- Jira URL: https://marc7182.atlassian.net/browse/SCRUM-17
- Figma URL: https://www.figma.com/design/WpmTPLUutvzyJBnin11ifK
- Worktree path: /Users/marcdaou/Desktop/Projects/CLAUDE CODE COURSE/Airbnb Clone Exercise-SCRUM-17
- Branch: feature/SCRUM-17-listing-map-view
- PR URL: https://github.com/Marcdaou/airbnb-clone-vite/pull/1
- Preview URL: https://airbnb-clone-supabase-ht9cbjybm-marc-daous-projects.vercel.app

- plan: done 2026-11-11 — intent.md written
- plan: approved 2026-11-11 by human — decisions: Leaflet + free OpenStreetMap tiles (no key); "Search as I move the map" OFF by default; mobile list/map toggle below Tailwind md (768px); SC rewrites accepted as written.
- design: done 2026-11-11 — spec.md (R1-R10) + Figma https://www.figma.com/design/WpmTPLUutvzyJBnin11ifK (8 frames)
- design: approved 2026-11-11 by human — decisions: listings without coords hidden while map-search is on (E4 as specced); search-as-I-move checkbox also on mobile map view; client-side viewport filtering accepted for now.
- build(plan): done 2026-11-11 — plan.md written (8 steps, R1-R10 covered)
- build(plan): approved 2026-11-11 by human
- gates: human granted auto-approval 2026-11-11 for build(implement), test, deploy, maintain (production gate unchanged; failures still stop the loop)
- build(implement): done 2026-11-11 — 10 commits on feature/SCRUM-17-listing-map-view (lint 0 errors/11 pre-existing warnings, build OK; deviations listed in stage report)
- build(implement): approved 2026-11-11 (auto-approval granted by human; gates line written by orchestrator at the human's request)
- test: done 2026-11-11 — 37/37 tests pass, test-report.md
- test: approved 2026-11-11 (auto-approval) — 37/37 pass, lint 0 errors, build ok
- deploy: done 2026-11-11 — PR https://github.com/Marcdaou/airbnb-clone-vite/pull/1, preview https://airbnb-clone-supabase-ht9cbjybm-marc-daous-projects.vercel.app (CLI; preview env vars missing — app will not load data)
