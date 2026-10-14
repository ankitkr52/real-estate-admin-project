# memory.md — Project State

This is the running state of the build. `CLAUDE.md` describes how the project works and never changes much. This file describes where the project **is** right now, and changes constantly.

## How to use this file

**At the start of every session:** read this file before reading any code. It tells you the current phase, what the last session finished, and anything that would otherwise have to be rediscovered.

**After completing a phase:** update this file before doing anything else. A phase is not complete until it is recorded here.

1. Move "Current phase" to the next phase.
2. Move the finished phase into "Last completed phase", with the date and a one-line summary.
3. Append any decisions to the Decisions log. Never edit or delete an existing entry — the log is append-only, because the reasoning behind a past decision matters even after it is superseded. To reverse a decision, add a new entry that says so and references the old one.
4. Append anything the next session needs to "Things to remember".
5. Move anything you had to guess into "Open questions for user".

**Mid-phase:** if you make a non-obvious decision, log it immediately. Do not wait for the end of the phase.

### Entry formats

```
Decisions log:
### YYYY-MM-DD — <short decision title>
- Decision: <what was decided>
- Reason: <why, including what was rejected and why>
- Affects: <files, phases, or docs>

Things to remember:
- [YYYY-MM-DD] <fact the next session would otherwise have to rediscover>

Open questions:
- [YYYY-MM-DD] <question> — Assumption made: <what was assumed so work could continue>
```

---

## Current phase

**Phase 4 — User Features. Not started.**

Next step: read `docs/DEVELOPMENT-PLAN.md`, Phase 4, and `docs/API.md` sections 4 and 6. Phase 3 shipped the two public property endpoints, the home / listing / detail pages, the shared empty/error primitives, and the footer. The favorite heart renders on the card and detail page but is NOT wired — guest tap redirects to `/login?next=…`; Phase 4 wires the mutation. The reviews slot on the detail page is a bordered log-in prompt; Phase 5 fills it.

---

## Last completed phase

### Phase 3 — Public Browsing (2026-10-14)

Two public property API endpoints (`GET /api/properties`, `GET /api/properties/:id`) following the uniform `connectDB → safeParse → work → ok | handleError` shape with the frozen contract in `docs/API.md §5`. Filters schema in `lib/validations/property.ts` (coerced numbers, enum constraints on city/type/furnishing, dual range `.refine` for price and area). The listing route forces `status: "published"` server-side (never overridable), supports all 8 filters + 3 sorts, paginates with a real `countDocuments`, caps `limit` at 48 to prevent whole-collection fetches, and returns a card payload stripped of description/address/contact/viewCount. The detail route validates `ObjectId` (400 on invalid), combines the published-only read + atomic `$inc` on viewCount into one `findOneAndUpdate`, and computes `isFavorited` only when a session exists. `components/property/*` ships card + skeleton (equal dimensions, no CLS), grid, horizontal/sheet dual filter bar with applied-count badge, filter chips with individual removal + clear-all, sort select, prev/numbered/next pagination that preserves all other params, and the carousel gallery. `hooks/use-property-filters.ts` makes the URL query string the sole source of truth (debounced 400ms for numeric inputs; `resetSignal` increments on chip-remove and clear-all so uncontrolled number inputs can be remounted via `key` without being wiped mid-typing). The listing page wraps `useSearchParams` in `<Suspense>` for Next 16 cacheComponents; the detail page wraps `use(params)` the same way; both found during `npm run build`. The home page composes a framed-stillness hero (custom, no Aceternity), the §3.4 asymmetric city bento (6/3/3 at `lg`, degrades to 2+2×2 at `md`, stacks at base, per-city count via `useQueries` on 8 `limit=1` fetches), the newest-6 grid, a city-pick CTA banner, and the four-column footer. `<Toaster/>` mounted in `app/providers.tsx` (missing from Phase 2 — surfaced when the share-copy toast test came back empty). `SORT_OPTIONS` in `lib/constants.ts` was flipped from `price-asc`/`price-desc` to `price_asc`/`price_desc` to match the frozen API spec. End-to-end verified via Playwright: draft id → 404 page (identical to not-found, existence never leaked), filter URL round-trip identical after reload, URL chips reflect state, viewCount increments by exactly 1 per API hit (confirmed against MongoDB), Plot detail page has zero "BHK" text in the DOM, furnishing row omitted when unset (not "N/A"), WhatsApp link = `wa.me/91<10digits>?text=<encoded title + url>`, tel link = `tel:+91<10digits>`, guest heart tap pushes `/login?next=/properties` with zero API calls, grid is 1/2/3 cols at 375/768/1440, Sheet-trigger filter appears at base width, Share-copy toast reads "Link copied". `npx tsc --noEmit`, `npm run lint`, and `npm run build` all clean; zero raw hex outside `app/globals.css`; zero `any` in domain code.

---

### Phase 2 — Authentication (2026-10-14)

Seven auth API routes (register, verify-email, login, logout, forgot-password, reset-password, me) following the uniform `connectDB → safeParse → work → ok | handleError` shape with `lib/response.ts` helpers (`ok`, `fail`, `HttpError`, `handleError`). Stateless action tokens via `lib/token.ts` with mandatory `purpose` claim check (verify-email 24h, reset-password 1h); session via HttpOnly JWT cookie (`session`, 7d, SameSite=lax, Secure in prod only) managed in `lib/auth.ts` with `getSession`/`requireUser`/`requireAdmin` guards. Shared Zod schemas in `lib/validations/auth.ts` consumed by both routes and five RHF forms. In-memory LRU rate limiter in `lib/rate-limit.ts` (5/15min/IP) wired on login, register, forgot-password. `middleware.ts` on nodejs runtime guards `/favorites`, `/profile`, `/admin/*` with `?next=` redirect. TanStack Query provider at `app/providers.tsx`, `hooks/use-auth.ts` wraps GET /api/auth/me plus a logout mutation, `components/layout/nav.tsx` is the auth-aware pill nav mounted via `app/(public)/layout.tsx` (home moved from `app/page.tsx` to `app/(public)/page.tsx`), `app/(public)/profile/page.tsx` is the Phase-2 stub using Suspense around the cookie-reading subtree so Next 16's cacheComponents build passes. End-to-end verified: Resend delivered both verification and reset emails to `ankit72p@gmail.com` (last_event `delivered` returned from the Resend REST API with the new key), clicking the emailed verify URL flipped `isEmailVerified`, login set the HttpOnly cookie (unreadable from `document.cookie`), unverified-vs-wrong-password messages are distinct, unknown-email and wrong-password are identical, `forgot-password` responds the same for known+unknown addresses, a `verify-email` token POSTed to `/reset-password` is rejected `INVALID_TOKEN`, middleware redirects unauth `/profile` to `/login?next=%2Fprofile`, rate limiter trips at the 6th login attempt. `npx tsc --noEmit`, `npm run lint`, `npm run build` all clean; zero `any` in domain code.

---

### Phase 1 — Database Layer (2026-10-14)

Three Mongoose models (`User`, `Property`, `Review`) with the frozen fields, enums, defaults, and index set from `docs/DATABASE.md`. Cached serverless connection in `lib/db.ts` with `globalThis` conn + promise cache and `dbName: "realestate"` forced on the connect call. `lib/rating.ts` with `recalcPropertyRating` and the empty-aggregation guard. Idempotent `scripts/seed.ts` creating one admin + six sample properties (4 published / 2 draft) with Cloudinary-generated images. Verified: `npm run seed` runs twice with 0 duplicates, 11000 enforced on `{property,user}`, recalc stays 0/0 on empty-review properties and computes correctly when populated, admin password hashed `$2b$10$`. `npx tsc --noEmit` and `npm run lint` clean.

---

### Phase 0 — Project Initialization (2026-10-14)

Scaffolded Next.js 16.4 (App Router, TypeScript, Tailwind v4, ESLint, Turbopack), shadcn/ui initialized with the base-nova preset, 17 baseline shadcn components in `components/ui/`, Fraunces + Inter fonts wired via `next/font`, UI-UX-SPEC color + radius tokens defined in `app/globals.css` via `@theme inline`, folder structure created with `.gitkeep` markers, `lib/constants.ts` with `CITIES` / `PROPERTY_TYPES` / `FURNISHING` / `SORT_OPTIONS`, `.env.example` with all 12 variables from CLAUDE.md §6. `npx tsc --noEmit`, `npm run lint`, and `npm run build` all clean.

---

## Decisions log

### 2026-10-14 — Home hero is custom (framed stillness), no Aceternity, no framer-motion
- Decision: `components/home/hero.tsx` is a hand-rolled framed hero: one full-bleed Cloudinary architectural photo (from the seed set) inside a `rounded-[32px]` container, dark gradient scrim bottom-to-top, Fraunces display headline, Inter subhead, one amber CTA to `/properties`, three stat badges (Properties count via `/api/properties?limit=1`, `CITIES.length`, "Verified listings 100%"). Motion is `tw-animate-css` fade+slide-in-up on headline/CTA/stats, disabled by `motion-reduce:`.
- Reason: Aceternity's hero blocks are motion-first (sparkles, aurora, beams) and read SaaS not real-estate. For a frame-with-one-still-image hero, pulling Aceternity means a dependency + copied files we'd edit to taste anyway. Ponytail call. `framer-motion` also skipped — `tw-animate-css` is already installed and covers the whole motion budget.
- Affects: `components/home/hero.tsx`, `app/(public)/page.tsx`. No `package.json` change.

### 2026-10-14 — SORT_OPTIONS values aligned to frozen API spec (underscores)
- Decision: `lib/constants.ts` `SORT_OPTIONS` values flipped from `price-asc`/`price-desc` (dashes, from Phase 0) to `price_asc`/`price_desc` (underscores, matching `docs/API.md §5`). Zod enum on the API route uses the underscore values.
- Reason: `docs/` is frozen. Phase 0 wrote the constant with dashes; the frozen API contract uses underscores. The API spec wins; Phase 3 aligns the constant.
- Affects: `lib/constants.ts`, `components/property/property-sort.tsx`, `lib/validations/property.ts`.

### 2026-10-14 — Favorite heart on guest = router.push(/login?next=…), not a modal
- Decision: Card + detail-page favorite button, when the user is not logged in, pushes to `/login?next=<current-path>` instead of opening a modal. Phase 4 will wire the mutation for logged-in users.
- Reason: Lazy — one less piece of state, meets the acceptance criterion ("tapping as a guest opens the login prompt"). The existing `/login` already handles `?next=` from Phase 2 middleware.
- Affects: `components/property/property-card.tsx`, `app/(public)/properties/[id]/page.tsx`.

### 2026-10-14 — Per-city bento counts via 8 `limit=1` fetches, not an aggregate endpoint
- Decision: `components/home/city-bento.tsx` uses TanStack `useQueries` to issue one `GET /api/properties?city=<X>&limit=1` per city, reading `pagination.total`. Tiles show `—` on loading or error; never crash.
- Reason: The frozen API has no `GET /api/cities/counts` endpoint and the FUTURE list forbids adding one. Eight cheap requests cached 5 min on the client is the simplest shape within scope. Load impact: 8 countDocuments against indexed status+city, each returning a single doc.
- Affects: `components/home/city-bento.tsx`.

### 2026-10-14 — Property detail route combines published-only read + $inc into one findOneAndUpdate
- Decision: `app/api/properties/[id]/route.ts` calls `Property.findOneAndUpdate({ _id, status: "published" }, { $inc: { viewCount: 1 } }, { new: true, lean: true, projection: … })`. On no-match (draft or missing) → 404. The returned doc already reflects the incremented count.
- Reason: Satisfies "404 if draft or missing" (via filter) and BR-10 "atomic $inc" in one DB round-trip. Avoids a read-then-write that could race.
- Affects: `app/api/properties/[id]/route.ts`.

### 2026-10-14 — Uncontrolled range filter inputs + resetSignal for external resets
- Decision: Price-min/max and Area-min/max inputs are uncontrolled (`defaultValue={filters.X ?? ""}`), with `onChange` calling the hook's `setFilter` directly (hook debounces URL writes at 400ms). The hook exposes `resetSignal` (incremented in `removeFilter` and `clearAll`), used as `key` on each input so chip removal / Clear all forces a remount with fresh defaults.
- Reason: ESLint `react-hooks/set-state-in-effect` rejects the obvious controlled-mirror pattern (useState + useEffect to sync from URL). A key tied to the URL value directly would remount mid-typing (hook writes URL → URL change → key change → input remounts). The `resetSignal` separates "user typing" from "external reset," so typing never remounts.
- Affects: `hooks/use-property-filters.ts`, `components/property/property-filters.tsx`.

### 2026-10-14 — Toaster mounted in `app/providers.tsx`, not every page
- Decision: `<Toaster />` from `components/ui/sonner.tsx` renders once in `Providers`. Phase 2 shipped the sonner component but never mounted it; Phase 3 surfaced this when the share-copy toast test came back empty.
- Reason: One mount in `Providers` covers every page including auth pages and admin shell. Toast-caller code uses `import { toast } from "sonner"` directly.
- Affects: `app/providers.tsx`.

### 2026-10-14 — Footer uses a hardcoded year
- Decision: Footer legal line says `© 2026 Real Estate Portal`, not `${new Date().getFullYear()}`.
- Reason: Next 16 cacheComponents forbids `new Date()` in client components under prerender ("unstable value"). Alternatives rejected: moving the Footer to a server component (then it can't be imported from the client home page), or forcing dynamic (fights cacheComponents). The year drifts once a year; a one-line edit then is cheaper than today's build-fight.
- Affects: `components/layout/footer.tsx`.

### 2026-10-14 — Rate limiting is in-memory LRU (not Redis)
- Decision: `lib/rate-limit.ts` keeps a per-IP sliding-window token array inside an `lru-cache`. 5 requests / 15 min / IP / endpoint-key on login, register, forgot-password.
- Reason: Phase 2 scope + lazy. In-memory survives one serverless instance; the project is a single Vercel deployment with low expected abuse. One `ponytail:` comment at `lib/rate-limit.ts` names the ceiling + Upstash upgrade path.
- Consequence accepted: multi-instance fleets would need coordinated storage. Not a concern until the app scales out.
- Affects: `lib/rate-limit.ts`, `app/api/auth/{login,register,forgot-password}/route.ts`.

### 2026-10-14 — Middleware runs on `nodejs` runtime (not edge)
- Decision: `middleware.ts` has `export const runtime = "nodejs"`. It uses `jsonwebtoken.verify` to validate the session cookie.
- Reason: `jsonwebtoken` relies on `node:crypto`, unavailable in the default edge runtime. Rejected alternative: swap to `jose` for edge compatibility, which would add a second JWT library just to satisfy middleware's runtime. The nodejs runtime is a single-line toggle in Next 16.
- Consequence accepted: middleware runs on serverless Node rather than at the edge, adding a few ms of cold start. Middleware is a UX convenience, not a security boundary — API routes guard themselves.
- Affects: `middleware.ts`.

### 2026-10-14 — shadcn `form` not installed; use RHF `register()` with existing shadcn Input/Label directly
- Decision: `npx shadcn@latest add form` exits silently on the `base-nova` style (likely a registry gap). Rather than fight it, the five auth forms use `useForm({ resolver: zodResolver(schema) })` with plain `<Input {...register("field")}>` + `<Label>` + a tiny `<p className="text-destructive">`.
- Reason: shadcn's `Form` component is a thin RHF-context wrapper; for 5 short forms the raw RHF API ships the same UX in fewer files, with no `FormField`/`FormItem`/`FormControl`/`FormMessage` ceremony. Phase 0 memory's "Phase 2 should add form" is superseded by this.
- Affects: `app/(auth)/{login,register,verify-email,forgot-password,reset-password}/page.tsx`.

### 2026-10-14 — Base-nova shadcn `Button` lacks `asChild`; link-with-buttonVariants fallback
- Decision: Where auth pages wanted `<Button asChild><Link/></Button>`, they now use `<Link className={buttonVariants({variant: "outline"})}>`. The base-nova Button props type does not include `asChild`.
- Reason: Lazy — don't modify a shadcn-owned component to add asChild just to save a few style props at call sites. `buttonVariants` is already exported from `components/ui/button.tsx`.
- Affects: all five auth pages.

### 2026-10-14 — EMAIL_NOT_VERIFIED login state has no "Resend verification" action
- Decision: `/login`'s `EMAIL_NOT_VERIFIED` renders an amber block with "Verify your email before logging in. Check your inbox for the verification link." but **no Resend action**. UI-UX §5.4 wants one; the frozen API has no resend-verification endpoint.
- Reason: Frozen-API-wins. The three alternatives were: add a non-frozen endpoint (violates CLAUDE.md), re-POST register which would always 409 (unusable), or omit the action (chosen). The user confirmed this choice in Phase 2 planning.
- Affects: `app/(auth)/login/page.tsx`.

### 2026-10-14 — Home page moved into `app/(public)/` route group
- Decision: `app/page.tsx` moved to `app/(public)/page.tsx`; `app/(public)/layout.tsx` created and mounts the shared `Nav`. Admin and auth pages do not see the public layout.
- Reason: Matches `docs/UI-UX-SPEC.md §4` (home shares the public pill-nav layout) and the folder sketch in `CLAUDE.md §3`. Phase 0 had created the empty `(public)/` folder but hadn't moved the home in.
- Affects: `app/(public)/page.tsx`, `app/(public)/layout.tsx`.

### 2026-10-14 — `/profile` server component wraps data in `<Suspense>` for Cache Components build
- Decision: `app/(public)/profile/page.tsx` splits into an outer `ProfilePage` (static shell) and an inner async `ProfileContent` wrapped in `<Suspense>`. The cookie read + DB query live only inside `ProfileContent`.
- Reason: Next 16 has `experimental.cacheComponents` enabled by default, which forbids both `export const dynamic = "force-dynamic"` and uncached cookie/db access during prerender. Suspense is the recommended path — static shell is prerendered, dynamic subtree streams in on request.
- Affects: `app/(public)/profile/page.tsx`.

### 2026-09-21 — Documentation-only session; specification frozen
- Decision: The project specification was written to `docs/` as 5 documents plus `CLAUDE.md` and this file. No code was written, no dependencies installed, no scaffolding created.
- Reason: The specification was fully scoped before the build started, so every future session works from the same frozen source instead of re-deciding settled questions.
- Affects: All of `docs/`, `CLAUDE.md`.

### 2026-09-21 — Verification and reset tokens are stateless JWTs
- Decision: Email-verification and password-reset tokens are short-lived JWTs signed with `JWT_SECRET`, carrying `sub` and a `purpose` claim. Nothing is stored in the database. Verification tokens live 24 hours; reset tokens live 1 hour.
- Reason: The locked User schema has no token fields. Storing tokens would mean extending a frozen schema. Rejected alternative: adding `emailVerificationToken`, `passwordResetToken`, and `passwordResetExpires` to User, which would give revocable single-use tokens at the cost of changing the locked schema.
- Consequence accepted: a reset link cannot be revoked early. It stays valid until it expires, even after the password has already been changed. The 1-hour lifetime limits the exposure.
- Affects: `lib/token.ts`, all auth routes, `docs/DATABASE.md` section 10, `docs/API.md` section 3.

### 2026-09-21 — City list is a hardcoded constant
- Decision: Cities come from a `CITIES` constant in `lib/constants.ts`, used by both the listing filter dropdown and the home page "Browse by City" bento grid. No city endpoint exists.
- Reason: The locked API surface has no city endpoint, and the city set is small and stable. Rejected alternative: a `GET /api/cities` distinct-aggregation endpoint, which would add an endpoint outside the frozen API surface and a query on every page load.
- Consequence accepted: adding a city requires a code change.
- Affects: `lib/constants.ts`, the property filters, the home bento grid, `city` validation in the Zod schemas.

### 2026-09-21 — Star ratings are public; only review content is gated
- Decision: `averageRating` and `reviewCount` are included in public property responses and rendered on cards and the detail page for guests. Only the review list and the write form require a session.
- Reason: The rating is a browsing signal that helps a guest decide what to open, rather than review content itself. Gating it would leave guests with no quality signal at all. Rejected alternative: stripping both fields from public responses, which is more literally consistent with "guests cannot see reviews" but makes the listing cards noticeably less useful.
- Affects: `docs/PRODUCT-SPEC.md` BR-14, `docs/API.md` sections 5 and 6, the `PropertyCard` component.

### 2026-10-14 — Display + body fonts
- Decision: Fraunces (display, weight 600, variable `--font-display`) + Inter (body, variable `--font-sans`), both loaded via `next/font/google`.
- Reason: UI-UX-SPEC §1.3 names roles only ("display font", "neutral sans"), not families. Fraunces reads as "considered, not template" and holds the specified `-0.03em` tracking at the display size; Inter is a safe neutral sans with excellent tabular numerals for prices.
- Affects: `app/layout.tsx`, `app/globals.css`.

### 2026-10-14 — Tailwind v4 CSS-first config
- Decision: Project uses Tailwind v4 (what Next.js 16 scaffolds). All design tokens — colors, radius, fonts — live in `app/globals.css` inside `@theme inline`. There is NO `tailwind.config.ts` file.
- Reason: Next 16 ships Tailwind 4 by default. Fighting that would mean downgrading to Tailwind 3 and overriding the PostCSS setup. UI-UX-SPEC §1 token *values* are unaffected; only the config *location* changes from the DEVELOPMENT-PLAN Phase 0 reference to `tailwind.config.ts`. The CLAUDE.md component rule ("no raw hex in components") is enforced the same way via these variables.
- Affects: `app/globals.css` (holds every token), reference to `tailwind.config.ts` in `docs/DEVELOPMENT-PLAN.md` Phase 0's "Files affected" list is now historical.

### 2026-10-14 — shadcn base-nova preset
- Decision: Used `shadcn init -y -d`, which installs the `base-nova` preset. This brings `@base-ui/react` (not `@radix-ui/*`) as the primitive library, the `cn` npm package in `lib/utils.ts`, `tw-animate-css` for animations, and `lucide-react` icons.
- Reason: Modern shadcn v4 defaults; same team as Radix, same component contract. Fighting the default (pinning Radix-based shadcn) is not worth the maintenance tax.
- Affects: `components/ui/*`, `components.json`, `package.json`, `lib/utils.ts`.

### 2026-10-14 — shadcn `form` component deferred to Phase 2
- Decision: 17 of the 18 shadcn components requested in the playbook were installed in Phase 0. `form` was skipped by shadcn-add because it depends on `react-hook-form`, which is not a Phase 0 dependency.
- Reason: Phase 0 scope forbids auth/form deps. Phase 2 installs React Hook Form + Zod; add `form` there.
- Affects: Phase 2 task list — add `npx shadcn@latest add form` as a prerequisite before building the auth pages.

### 2026-10-14 — Admin seeded via `.save()`, not findOneAndUpdate upsert
- Decision: `scripts/seed.ts` creates the admin by `findOne` → if missing, `new User({...}).save()`. If an admin exists, it is left untouched (no password re-hash, no profile overwrite).
- Reason: The DATABASE.md §11 seed contract says "upserted by email". A Mongoose `findOneAndUpdate` upsert bypasses the `pre("save")` bcrypt hook and would persist the admin password in **plaintext**. The frozen schema requires a hashed password. The find+save+skip pattern is the only path that satisfies both idempotence and the hashing requirement with the frozen schema. Properties use the same pattern for consistency.
- Affects: `scripts/seed.ts`.

### 2026-10-14 — `dbName: "realestate"` forced in `lib/db.ts`
- Decision: `mongoose.connect(uri, { bufferCommands: false, dbName: "realestate" })`. The connect options force the DB name regardless of what the URI path contains.
- Reason: A URI without a `/realestate` path defaults mongoose to the `test` database. Forcing `dbName` server-side makes the app DB-correct against the URI used by the MongoDB MCP, which lacks a DB path. One source of truth for the DB name, no env coordination required.
- Consequence accepted: Changing the DB name later requires a code edit, not an env edit. Acceptable — the DB name is schema-adjacent and belongs with the code.
- Affects: `lib/db.ts`.

### 2026-10-14 — Email unique index declared on the field only
- Decision: `email` has `unique: true` on the field; the `schema.index({ email: 1 }, { unique: true })` call was removed.
- Reason: Mongoose warns on duplicate index declarations; both forms produce the same index. The field-level form is enough and reads better next to the other field options.
- Affects: `models/User.ts`.

### 2026-10-14 — Mongoose 8 async `pre("save")` has no `next` param
- Decision: `userSchema.pre("save", async function () { ... })` — no `next` argument, body returns/throws.
- Reason: With Mongoose 8 types, the `next` overload collides with `SaveOptions` and TypeScript picks the wrong signature; the async-no-`next` form is the documented modern path. The hook is simpler too.
- Affects: `models/User.ts`.

---

## Open questions for user

- [2026-10-14] Rating-chip visibility (card + detail) was NOT runtime-verified in Phase 3 because every seeded property has `reviewCount: 0`. The code path exists (`reviewCount > 0` guard, amber-ringed pill with aria-label "Rated X.X out of 5 from N reviews"); verify via Playwright once Phase 5 lands a seeded review.
- [2026-10-14] Phase 2's Nav mounts above the hero as a sticky solid pill rather than floating inside the hero frame (per UI-UX §4's "floating pill inside the hero frame" rule for the home page specifically). Decision deferred: either patch Nav to detect `pathname === "/"` and render translucent inside the frame, or accept the Phase 2 shape. Flagged in case Phase 7 polish wants to address.

---

## Things to remember for next session

- [2026-10-14] The 6 seed property `_id`s are now stable at: Mumbai 2BHK `6acf66b5231ebbe4c355d1ae`, Indiranagar 3BHK (draft) `6acf66b5231ebbe4c355d1af`, Pune Garden House `6acf66b5231ebbe4c355d1b0`, Hyderabad Villa `6acf66b5231ebbe4c355d1b1`, Chennai Plot `6acf66b5231ebbe4c355d1b2`, Delhi Office (draft) `6acf66b5231ebbe4c355d1b3`. 4 published, 2 draft. Will change after any drop+reseed.
- [2026-10-14] Property-list card payload is intentionally stripped of `description`, `images`, `address`, `contactPhone`, `contactWhatsApp`, `viewCount`. Only the detail endpoint returns them. Phase 4 favorites list must either call the detail endpoint per item or we extend the card payload — the latter changes the frozen contract, so flagged.
- [2026-10-14] Hero and bento city imagery is hardcoded Cloudinary URLs from the seed set (`realestate/seed/*`). The bento maps 5 cities to images (Mumbai, Bengaluru, Delhi, Pune, Hyderabad); the remaining 3 CITIES (Chennai, Kolkata, Ahmedabad) have no bento tile — the bento is a fixed 5-tile layout per UI-UX §3.4.
- [2026-10-14] `hooks/use-property-filters.ts` exposes `resetSignal` — a counter the filter bar uses as a React `key` on each range `<Input>` so chip-remove and clear-all remount them. Required because the obvious useState/useEffect sync-from-URL pattern violates `react-hooks/set-state-in-effect`. Phase 4 forms can borrow the pattern if the same lint rule bites.
- [2026-10-14] `app/providers.tsx` now mounts `<Toaster />` from `components/ui/sonner.tsx`. Any page can `import { toast } from "sonner"` and call `toast.success(...)` without extra setup.
- [2026-10-14] `components/property/property-card.tsx` is the one-link card. The heart button inside it must `e.preventDefault()` AND `e.stopPropagation()` or the surrounding `<Link>` fires. Keep this invariant when Phase 4 wires the mutation.
- [2026-10-14] The detail page is `"use client"` and uses `use(params)` wrapped in `<Suspense fallback={<DetailSkeleton/>}>`. Required for Next 16 cacheComponents or build fails with HANGING_PROMISE_REJECTION on prerender.
- [2026-10-14] `components/layout/footer.tsx` has a hardcoded `© 2026`. Next 16 cacheComponents forbids `new Date()` in client components. Bump when the calendar does.
- [2026-10-14] Phase 2 reseeded admin at `ankit72p@gmail.com` with a NEW `_id`. Hard-coded admin references, if any Phase 3+ code introduces them, must be re-fetched after any further reseed. Properties were untouched (6 existed, 0 inserted).
- [2026-10-14] Resend account is in testing mode (no verified domain). It will only deliver to the account owner's email (`ankit72p@gmail.com`), strict equality — + aliases are rejected. For Phase 8 production delivery, verify a sending domain in the Resend dashboard and update `EMAIL_FROM`.
- [2026-10-14] `EMAIL_FROM` is `onboarding@resend.dev` in dev (`.env.local`). Must change to a verified-domain address before production.
- [2026-10-14] The home page lives at `app/(public)/page.tsx`, not `app/page.tsx`. Phase 3 edits the former; the latter does not exist.
- [2026-10-14] Nav mounts via `app/(public)/layout.tsx`. Auth pages have their own `app/(auth)/layout.tsx` (centered card, no nav), as specified in UI-UX §5.4–5.8.
- [2026-10-14] Protected server pages that read cookies / do DB queries must wrap the data read in `<Suspense>` because of Next 16's cacheComponents. See `app/(public)/profile/page.tsx` for the pattern. `export const dynamic = "force-dynamic"` throws a build error.
- [2026-10-14] Middleware uses `runtime = "nodejs"` for `jsonwebtoken.verify`. If anything in Phase 3+ needs edge-only behavior from middleware, swap in `jose` instead.
- [2026-09-21] The specification in `docs/` is FROZEN. Do not improve or reconcile it. If two documents contradict each other, stop and ask the user.
- [2026-09-21] The FUTURE list in `docs/PRODUCT-SPEC.md` section 5 is a do-not-build list, not a backlog.
- [2026-09-21] Never install a dependency without asking first.
- [2026-10-14] 17 shadcn components live in `components/ui/`. Restyle in place; do not override per call site.
- [2026-10-14] All design tokens live in `app/globals.css` (`@theme inline` + `:root`). There is no `tailwind.config.ts`.
- [2026-10-14] shadcn uses `@base-ui/react`, not `@radix-ui/*`. Component imports read `from "@base-ui/react/<primitive>"`.
- [2026-10-14] `cn` helper is a re-export from the `cn` npm package in `lib/utils.ts`. API is identical to the classic `clsx + tailwind-merge` wrapper.
- [2026-10-14] `AGENTS.md` at the repo root is auto-regenerated by `next dev` on each boot. Do not delete; coexists with `CLAUDE.md`.
- [2026-10-14] `components/ui/carousel.tsx:98` has one `eslint-disable-next-line react-hooks/set-state-in-effect` with a `ponytail:` comment — a shadcn-published pattern that needs a sync initial read against embla.
- [2026-10-14] Default shadcn Button uses `rounded-lg` which maps to `--radius-lg = 20px` here. UI-UX-SPEC §1.5 says buttons want `--radius-md = 12px`. When Phase 3 touches the button, change the base class to `rounded-md`.
- [2026-10-14] The `test` database on Atlas has orphan seed data (one admin + six properties) from the first seed run before `dbName` was forced. Drop it manually from the Atlas UI if you want a clean cluster — the running app only touches `realestate`.
- [2026-10-14] `scripts/seed.ts` carries a header comment with the six Cloudinary `public_id` + `asset_id` pairs for the seed images (under `realestate/seed/*`). Regenerate or clean up via the Cloudinary MCP if ever needed.
- [2026-10-14] The 6 seed property `_id`s are stable within one DB only; after a drop+reseed they change. If a Phase 3 test URL hardcodes one, remember to re-fetch after any reseed.
- [2026-10-14] Cloudinary MCP burned 25 of 50 free-tier image-generation credits on Phase 1 (one failed-then-successful batch). Phase 4 avatar/property uploads use the regular upload API, not generate-image, so this doesn't block.
- [2026-10-14] `tsx` scripts need explicit `loadEnv({ path: ".env.local" })` — Node doesn't auto-load `.env.local` the way Next.js dev does. `scripts/seed.ts` loads `.env.local` then `.env` as a fallback.
- [2026-10-14] Mongoose 8 async `pre("save")` hooks must NOT take a `next` parameter — the typing picks `SaveOptions` instead of a callback. Write `async function () { ... }` and return/throw.

