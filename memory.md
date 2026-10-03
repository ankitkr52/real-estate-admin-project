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

**Phase 0 — Project Initialization. Not started.**

Nothing has been built. The working directory contains only `docs/`, `CLAUDE.md`, and this file. No `package.json`, no dependencies, no code.

Next step: read `docs/DEVELOPMENT-PLAN.md`, Phase 0, and work through its task list.

---

## Last completed phase

None.

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

---

## Open questions for user

None.

---

## Things to remember for next session

- [2026-09-21] Nothing has been built yet. Start with Phase 0 in `docs/DEVELOPMENT-PLAN.md`.
- [2026-09-21] The specification in `docs/` is FROZEN. Do not improve or reconcile it. If two documents contradict each other, stop and ask the user.
- [2026-09-21] The FUTURE list in `docs/PRODUCT-SPEC.md` section 5 is a do-not-build list, not a backlog.
- [2026-09-21] Never install a dependency without asking first.
