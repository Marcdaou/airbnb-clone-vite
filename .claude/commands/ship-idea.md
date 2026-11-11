---
description: Come up with an app idea and build it end-to-end — React + Tailwind, Supabase (DB + auth), Unsplash images, Stripe payments, Vercel deploy — using parallel subagents
argument-hint: "[optional theme or idea, e.g. 'pet sitting marketplace']"
---

# /ship-idea

You are going to invent a small but complete web product and ship it end-to-end, the same way the Airbnb clone in this repo was built. Theme hint from the user (may be empty): **$ARGUMENTS**

Work in phases. Parallelize with subagents wherever pieces are independent. Keep the user informed with short status lines.

## Phase 0 — Idea (ask once, then go)
1. If `$ARGUMENTS` is empty, propose **3 product ideas**. Each must be a consumer app with listings or items that people browse and **pay for**, so Stripe is meaningful (for example rentals, bookings, classes, a marketplace). Use `AskUserQuestion` to let the user pick, and mark your recommended idea.
2. Derive a slug (`kebab-case`, for example `pawstay`). The project folder will be `../<slug>` (a sibling of this repo), unless the user is in an empty folder.
3. Write a one-screen spec to `<project>/SPEC.md` covering:
   - pages
   - tables
   - what gets paid for
   - seed categories

## Phase 1 — Foundation (you, sequentially, fast)
1. **Supabase project:**
   - `mcp__supabase__list_organizations`. If there is more than one org, ask which to use.
   - `get_cost`, then tell the user the cost. If it is $0 you may proceed; otherwise get an explicit yes first.
   - `confirm_cost`, then `create_project` (region `us-east-1` unless told otherwise), then poll `get_project` until `ACTIVE_HEALTHY`.
   - `get_project_url` and `get_publishable_keys` (prefer the `sb_publishable_…` key).
2. **Scaffold:**
   - `npm create vite@latest <slug> -- --template react-ts`, then install `@supabase/supabase-js @stripe/stripe-js react-router-dom date-fns lucide-react`, plus dev deps `tailwindcss @tailwindcss/vite`.
   - Add the Tailwind plugin to `vite.config.ts` and use `@import "tailwindcss"` with a `@theme` brand color in `src/index.css`.
3. **Shared contracts, which the agents will rely on:**
   - `src/lib/supabase.ts` (client)
   - `src/lib/types.ts` (row types plus a CATEGORIES const)
   - `src/lib/auth.tsx` (AuthProvider exposing `user`, `session`, `loading`, `authOpen`, `openAuth`, `closeAuth`, `signOut`)
   - `src/App.tsx` with all routes
   - a stub component file for every page and component the agents will fill in

   `npm run build` must pass before you continue.
4. **Env files:**
   - `.env.local` (git-ignored) with Supabase URL and key filled in, and empty `VITE_STRIPE_PUBLISHABLE_KEY=` and `STRIPE_SECRET_KEY=`.
   - `.env.example` with the same keys and no values.
   - Add `.env*.local`, `.vercel` and `supabase/.temp` to `.gitignore`.
   - Add `vercel.json` with an SPA rewrite.
   - Then `git init`.
5. **Ask the user for the Stripe test keys now** so it runs in parallel with the build. Tell them to paste both into `.env.local`. Then tell them to add `STRIPE_SECRET_KEY` under Supabase Dashboard → Edge Functions → Secrets, or to run `! supabase login` so you can push it with `supabase secrets set --env-file <file-with-only-that-line> --project-ref <ref>`. **Never** print or echo secret key values, and never put the secret key in the frontend or in Vercel.

## Phase 2 — Build in parallel (subagents, one message, 4 agents)
Spawn these with the `Agent` tool (`general-purpose`), each with a `name`. Every brief must include:
- the absolute project path and the Supabase project ref
- the instruction to read the shared contract files first
- the **exact list of files it may create or edit**, with no other files allowed
- an instruction to finish with `npm run build` passing and a 3–5 line report

The agents:
- **db-agent:**
  - Supabase MCP `apply_migration`, with SQL also saved to `supabase/migrations/0001_init.sql`.
  - Tables:
    - `profiles`, filled by an auth trigger that is security definer with `set search_path = ''` and execute revoked from public, anon and authenticated
    - the domain tables
    - `orders`/`bookings` with status `pending|paid|cancelled` and `stripe_session_id`
    - `favorites`
  - RLS on everything:
    - public read on catalog tables
    - owner-only on user tables
    - **no client UPDATE on order status**, and client INSERT only allowed with `status='pending'`
  - Seed about 40 catalog rows across about 8 categories, plus reviews if relevant.
  - **Images from Unsplash:** `https://images.unsplash.com/photo-<id>?w=1200&q=80&auto=format&fit=crop`. Every URL MUST be verified with `curl -s -o /dev/null -w '%{http_code}'` (scripts go in the scratchpad), and any URL that doesn't return 200 gets replaced.
  - Finish with `get_advisors` (security) and fix the warnings.
- **ui-shell-agent:** header with search, category bar, card component with image carousel and favorite button, `useFavorites` hook, home/browse page with filters, loading skeletons and an empty state, and a footer. Use original branding: its own name and logo, never a real company's.
- **detail-agent:**
  - auth modal (login and sign up, inline errors, ESC to close)
  - item detail page (gallery, info, reviews, map if location-based)
  - purchase/booking card that calls `supabase.functions.invoke('create-checkout-session', …)` and redirects to the returned `url`
  - `src/lib/pricing.ts`, whose exact formula you specify in the brief
- **payments-agent:**
  - Edge Functions:
    - `create-checkout-session`:
      - check the user's JWT and validate the input
      - **recompute the price server-side** with the same formula
      - insert a pending order with the service role
      - create a Stripe Checkout Session (mode `payment`, `metadata.order_id`, success URL `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`)
      - return `{ url }`
      - if `STRIPE_SECRET_KEY` is missing, return a clear error before inserting anything
    - `verify-checkout`: retrieve the session and mark the user's order `paid` when `payment_status === 'paid'`
  - **No webhooks.** Deploy both with `mcp__supabase__deploy_edge_function` (`verify_jwt: true`).
  - Pages: checkout success, which waits for auth and then calls verify; checkout cancel; My orders/trips; Favorites; 404.

**While they run (you):**
- `vercel whoami`, then check `vercel project ls` for an existing project with the same name. **If the name is taken, pick a new unique name.** Never link to or deploy into an existing project.
- `vercel project add <name>`, then `vercel link --yes --project <name>`.
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with `vercel env add … production`, piping the values from `.env.local`.
- `vercel deploy --prod --yes` the skeleton so the URL exists early.

## Phase 3 — Integrate and ship (you)
1. Once all the agents have reported, run `npm run build` and fix any integration issues, such as unwired buttons or mismatched column names.
2. Once the user confirms the Stripe keys are in `.env.local`, pipe `VITE_STRIPE_PUBLISHABLE_KEY` into `vercel env add` without printing it. Redeploy with `vercel deploy --prod --yes`.
3. Optional Stripe MCP touch: if `mcp__stripe__*` tools are available, confirm that the connected account is in **test mode** and mention its name. Do not create live-mode objects.
4. **Test account:** create a pre-confirmed user via `execute_sql`:
   - insert into `auth.users` with `email_confirmed_at = now()` and a bcrypt password via `extensions.crypt(..., extensions.gen_salt('bf'))`, plus a matching `auth.identities` row with provider `email`
   - email `test@<slug>.dev`, password `TestPass123!`
   - record both in `.env.example` as comments

   Verify it by calling `POST /auth/v1/token?grant_type=password` with curl and confirming that an `access_token` comes back.
5. **Server-side smoke test:** with that token, call `create-checkout-session` with curl and expect `{ url: "https://checkout.stripe.com/…" }`. Then delete the pending order the test created.

## Phase 4 — Verify in the browser
Ask the user whether **they** want to test it or want you to drive Chrome. If you drive it, load the `claude-in-chrome` tools in one ToolSearch call and open your own tab, then:
1. browse and filter
2. open the detail page
3. log in with the test user
4. buy with card `4242 4242 4242 4242`, any future expiry date, any CVC
5. land on the success page and check that the order shows **paid** in My orders
6. toggle a favorite

Report:
- what passed and what failed, with evidence
- the live URL
- the test credentials
- any remaining manual steps, such as setting the Supabase Auth Site URL to the Vercel URL

## Rules
- Confirm before anything that costs money, and before touching any existing project (Supabase or Vercel).
- Never echo secret keys. Never place `STRIPE_SECRET_KEY` anywhere except Supabase Edge Function secrets and the git-ignored `.env.local`.
- Original names and branding only. You may build a product "like" X but never copy its logo or trademarked name.
- Report honestly: say what was verified and what was not.
