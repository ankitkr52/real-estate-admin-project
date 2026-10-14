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

**Phase 1 — Database Layer. Not started.**

Next step: read `docs/DEVELOPMENT-PLAN.md`, Phase 1, and work through its task list.

---

## Last completed phase

### Phase 0 — Project Initialization (2026-10-14)

Scaffolded Next.js 16.4 (App Router, TypeScript, Tailwind v4, ESLint, Turbopack), shadcn/ui initialized with the base-nova preset, 17 baseline shadcn components in `components/ui/`, Fraunces + Inter fonts wired via `next/font`, UI-UX-SPEC color + radius tokens defined in `app/globals.css` via `@theme inline`, folder structure created with `.gitkeep` markers, `lib/constants.ts` with `CITIES` / `PROPERTY_TYPES` / `FURNISHING` / `SORT_OPTIONS`, `.env.example` with all 12 variables from CLAUDE.md §6. `npx tsc --noEmit`, `npm run lint`, and `npm run build` all clean.

---

## Decisions log

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

---

## Open questions for user

None.

---

## Things to remember for next session

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

