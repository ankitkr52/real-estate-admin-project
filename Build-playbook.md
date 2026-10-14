# Build Playbook — Real Estate Portal

Version: 1.0 (2026-10-14). Companion to `CLAUDE.md`, `memory.md`, and the frozen `docs/` specification.

---

## Section A — How to Use This Playbook

This playbook holds one self-contained prompt per phase (0 through 8). Each prompt is designed to be copy-pasted into a fresh Claude Code session, so the receiving session needs no memory of the session that produced this file. The prompt tells the fresh session which docs to read, which skills and MCPs to invoke, which files to create, which dependencies to install, how to verify the result, how to update `memory.md`, and when to stop. A phase prompt never auto-continues to the next phase; it ends with a hard stop so the user controls the gate.

The expected rhythm per phase is: open `Build-playbook.md`, copy the full prompt for the current phase into a new Claude Code session, keep the session in Plan Mode until the plan is reviewed, approve the plan, let the session execute, run the manual verification steps listed under "How to verify this phase manually", let the session update `memory.md` and commit, then stop and open the next phase on a new session. The playbook is written assuming that the `docs/` specification stays frozen; if any phase prompt and any `docs/` file contradict each other, stop and ask — never silently reconcile.

### Standing honest flag

The `mongodb` MCP timed out when this playbook was generated (CONNECT_TIMEOUT after 30 s). Every phase prompt that touches the database starts by asking the fresh session to verify the MCP is connected, and provides a `mongosh` fallback paragraph if it is not. Do not silently skip the verification. The `agents-observe` MCP is unavailable and not needed anywhere in this plan.

---

## Section B — Tooling Reference

The playbook recommends only what was observed as connected (or configured and expected to be available) when it was written. Rows marked "unavailable" are listed to prevent a fresh session from inventing a tool it does not have.

| Name | Type | When to use in this project | Phases |
|---|---|---|---|
| `playwright` | MCP | Default browser-automation driver for every verification step: navigate, fill forms, click, read console, read network, resize for breakpoint checks, snapshot DOM, run page JS. Scriptable and deterministic. | 2, 3, 4, 5, 6, 7, 8 |
| `claude-in-chrome` | MCP | Fallback browser automation that uses the user's real Chrome session. Use only when the step genuinely needs real sign-ins (clicking a verification link in the real Gmail inbox during Phase 2 or 8). | 2, 8 |
| `mongodb` | MCP | Preferred way to verify indexes, inspect seeded documents, confirm cascade delete, re-read denormalized fields. Fall back to `mongosh` if the MCP is not connected when the phase starts. | 1, 5, 6, 8 |
| `cloudinary` | MCP | Phase 1: generate placeholder property images with `generate-image` and reference the returned secure URLs in `scripts/seed.ts`. Phases 4 and 6: `search-assets` and `get-asset-details` to confirm app uploads landed. Phase 6: optional manual cleanup via `delete-asset` for orphans left after cascade delete testing (locked schema does not store public_ids, so app code never deletes assets). | 1, 4, 6 |
| `resend` | MCP | Phase 2: `list-emails`, `get-email`, `list-logs` to confirm the verification and reset emails were accepted by Resend. Phase 8: `create-domain`, `verify-domain`, `get-domain` to prepare the production sending domain. Not used to send transactional email from the app — the app sends via the Resend SDK from `lib/email.ts`. | 2, 8 |
| `context7` | MCP | Fetch current docs for Next.js App Router, Mongoose, Zod, TanStack Query, React Hook Form, Tailwind. Prefer over web search for library questions, especially in Phase 0 (Next.js init) and Phase 2 (middleware edge-runtime caveats). | 0, 1, 2, 3, 4, 5, 6 |
| `github` | MCP | Create the repository remote, open PRs, read PR comments, run secret scanning before Phase 8. Not required for local commits. | 7, 8 |
| `21st` | MCP | Component search when neither shadcn/ui nor Aceternity covers a need. Phase 3's hero and bento grid may call it; note the choice in `memory.md`. | 3, 7 |
| `ide` | MCP | `getDiagnostics` to confirm TypeScript cleanliness at the end of each phase without running the full compiler. | 0, 1, 2, 3, 4, 5, 6, 7 |
| `plugin_claude-mem_mcp-search` | MCP | `work_state_write` for in-session to-do tracking inside a phase, `save_memory` for durable cross-session notes, `mem_search` to recover prior decisions. | all |
| `claude_ai_Gmail` | MCP | Confirm the real verification email landed in the test inbox during Phase 2 and the Phase 8 smoke test. Fallback when the Resend MCP shows the message as "delivered" but you want to see what the recipient actually sees. | 2, 8 |
| `agents-observe` | MCP | Unavailable this session. Do not reference. | none |
| MongoDB Atlas MCP (write-heavy ops) | MCP | Unavailable. Phase prompts use the Mongoose models for writes and the `mongodb` MCP only for reads. | none |
| Playwright MCP, Chrome tabs mode | mode | Playwright can open the user's local app; prompts drive it that way rather than through hosted browsers. | 2–8 |
| `shadcn-ui` | skill | Component discovery, install, token customization. Owning the files means edits happen in `components/ui/*`, not at call sites. | 0, 2, 3, 4, 5, 6 |
| `frontend-design:frontend-design` | skill | Aesthetic direction and anti-template choices for the hero, bento grid, and card. | 3, 7 |
| `anthropic-skills:ui-ux-pro-max` | skill | Palette, font pairing, responsive and accessibility reference. | 0, 3, 7 |
| `design-taste-frontend` | skill | Pre-flight check for the home page redesign; keeps the hero from looking templated. | 3, 7 |
| `enhance-prompt` | skill | Tighten vague UI prompts before handing them to component-generation flows. | 3 |
| `superpowers:brainstorming` | skill | Required before any creative work (hero, bento, card variants). Invoke before entering Plan Mode on UI-heavy phases. | 3, 4, 5, 6, 7 |
| `superpowers:writing-plans` | skill | Required before touching code on any multi-step task. The phase prompt invokes it implicitly through Plan Mode. | all |
| `superpowers:test-driven-development` | skill | Required when implementing a feature. The playbook does not demand a Jest suite; tests here mean verification scripts (Playwright flows) run before claiming done. | 2, 3, 4, 5, 6 |
| `superpowers:systematic-debugging` | skill | Required on any bug or test failure. If a phase's acceptance test fails, invoke this before guessing a fix. | all |
| `superpowers:verification-before-completion` | skill | Required before claiming a phase is done. Evidence before assertion. | all |
| `superpowers:requesting-code-review` / `receiving-code-review` | skill | End-of-phase self-review. Optional per phase, mandatory before Phase 8. | 6, 7, 8 |
| `superpowers:finishing-a-development-branch` | skill | Branch integration decision at the end of each phase. | all |
| `superpowers:dispatching-parallel-agents` | skill | Use only when two tasks in a phase are truly independent (rare). | 3, 6 |
| `ponytail:ponytail` | skill | Active throughout. Keeps every decision at the smallest working solution. | all |
| `ponytail:ponytail-review` | skill | End-of-phase pass over the diff for over-engineering. | all |
| `ponytail:ponytail-audit` | skill | One-shot whole-repo audit, run before Phase 7. | 7 |
| `claude-mem:learn-codebase` | skill | Prime a fresh session when the project has grown. Useful on resuming Phase 4 or later. | 4, 5, 6, 7 |
| `claude-mem:handoff` | skill | End-of-session handoff when the session is getting long and the phase is incomplete. | all |
| `claude-mem:make-plan` / `do` | skill | Alternative plan-then-execute pattern. Not required if the fresh session already enters Plan Mode. | all |
| `claude-mem:mem-search` | skill | Recover decisions from prior sessions when `memory.md` is thin. | all |
| `code-review` (built-in) | skill | `/code-review` on the current diff. | 2, 3, 4, 5, 6, 7, 8 |
| `simplify` (built-in) | skill | `/simplify` on the current diff for reuse and efficiency only. | 7 |
| `security-review` (built-in) | skill | `/security-review` before Phase 8 deploy. | 7, 8 |
| `run` (built-in) | skill | Launch and drive the local app for manual verification. | 0, 3, 4, 5, 6, 7 |
| `claude-in-chrome` (built-in skill) | skill | Companion to the MCP; follow it when switching browser tools. | 2, 8 |

Explicitly unavailable (do not plan around): Resend transactional sending from an MCP session (the app must send email at runtime from Vercel), Cloudinary upload-preset management (configured once in the Cloudinary dashboard), Vercel deployment MCP, Lighthouse MCP, GitHub Copilot code review as a required gate.

---

## Section C — Phase Prompts

Phases run in order. Each prompt below is self-contained and ends with a hard stop.

---

### Phase 0 — Project Initialization

#### Goal

A running Next.js application with the styling system, component library, folder structure, and environment template in place. No features.

#### Skills & MCPs for this phase

- `superpowers:writing-plans`: enter Plan Mode first; do not touch files until the plan is approved.
- `shadcn-ui` (skill): install the shadcn CLI and the baseline component set listed below.
- `context7` (MCP): fetch current Next.js 15 App Router + `next/font` + Tailwind 3 docs before scaffolding, so the generated config matches the installed version rather than training-cutoff memory.
- `anthropic-skills:ui-ux-pro-max` (skill): source for color, radius, and typography tokens aligned with the UI-UX-SPEC section 1 scale.
- `ide` (MCP): `getDiagnostics` at the end of the phase to confirm TypeScript cleanliness without a full compile.
- `ponytail:ponytail` (skill): active; no speculative files, no boilerplate scaffolding beyond the folder structure the phase names.
- `plugin_claude-mem_mcp-search` (MCP): `work_state_write` for an in-session Phase 0 checklist.

#### Prerequisites

- The working directory contains `CLAUDE.md`, `memory.md`, `Build-playbook.md`, and `docs/` only. No `package.json` yet.
- Node 20 or newer available on the PATH.
- Git initialized (the repository already is).

#### Copy-paste prompt for Claude Code

```text
You are starting Phase 0 (Project Initialization) of the Real Estate Portal.

Before writing any code, do the following in order:

1. Read CLAUDE.md in full. It describes the stack, folder structure, naming,
   session rules, and the component priority rule. Treat it as frozen.
2. Read memory.md in full. It tells you the current project state and anything
   the last session decided. memory.md is append-only.
3. Read docs/DEVELOPMENT-PLAN.md, the "Phase 0 — Project Initialization" section
   only. Pay particular attention to the Tasks list, the Folder structure block,
   the Acceptance criteria list, and the "What must NOT be done in this phase"
   list.
4. Read docs/UI-UX-SPEC.md section 1 (Design Language). You need the color
   tokens, radius scale, type scale, and the two fonts for globals.css.

Enter Plan Mode. Invoke superpowers:writing-plans. Produce a plan containing:

- Every file you will create, exact path and purpose.
- Every dependency you will install, split into production and dev, and the
  reason each is required by Phase 0 tasks (not Phase 1+).
- The exact npx create-next-app command and its flags.
- The exact list of shadcn components you will add in one CLI call.
- The content of tsconfig.json compiler-options changes.
- The content of globals.css design tokens.
- The content of tailwind.config.ts token mappings.
- The content of lib/constants.ts (CITIES, PROPERTY_TYPES, FURNISHING,
  SORT_OPTIONS, all `as const`).
- The verification plan: how you will confirm every Phase 0 acceptance
  criterion before claiming done.

Stop and wait for the user to approve the plan. Do not install anything or
scaffold anything until approved.

Once approved, execute in this order:

a. Invoke the context7 MCP: resolve-library-id for "next.js", then query-docs
   for the current App Router scaffold and next/font usage. Confirm the
   create-next-app flags still match the current Next.js major.
b. Run `npx create-next-app@latest .` with: TypeScript yes, Tailwind yes, App
   Router yes, ESLint yes, import alias `@/*`, src/ no (we keep app/ at root
   per CLAUDE.md's folder structure). If create-next-app refuses the current
   working directory because it is non-empty, DO NOT delete files; move the
   existing docs/, CLAUDE.md, memory.md, and Build-playbook.md to a temp
   directory, scaffold into the project root, then restore them. Report the
   move.
c. Patch tsconfig.json: set `"strict": true` and
   `"noUncheckedIndexedAccess": true` in compilerOptions.
d. Initialize shadcn: `npx shadcn@latest init`. When asked for the base color,
   choose "slate" or whatever matches the UI-UX-SPEC token palette.
e. Add the shadcn baseline in one call:
   `npx shadcn@latest add button input label select form card badge skeleton
    dialog alert-dialog dropdown-menu sheet sonner avatar textarea carousel
    table tabs`.
   Confirm each file lands under components/ui/.
f. Load the display and body fonts through next/font in app/layout.tsx. Pick
   the two families named in UI-UX-SPEC section 1. Expose both as CSS
   variables and reference them in tailwind.config.ts under fontFamily.
g. Write app/globals.css with the full token set from UI-UX-SPEC section 1:
   color (background, foreground, primary, muted, border, destructive, ring),
   radius scale, and the font-family CSS variables. No raw hex values in any
   component after this phase; everything references a token.
h. Patch tailwind.config.ts to map every token under theme.extend.colors,
   theme.extend.borderRadius, theme.extend.fontFamily. Do not keep shadcn
   defaults where they conflict with the project tokens.
i. Create the folder structure exactly as listed in DEVELOPMENT-PLAN Phase 0.
   Add .gitkeep in each empty folder so git tracks it. Folders required:
     app/(public)/, app/(auth)/, app/admin/, app/api/,
     components/ui/ (already present), components/layout/, components/property/,
     components/review/, components/admin/, components/shared/,
     lib/, lib/validations/, lib/services/,
     models/, types/, hooks/, scripts/
j. Write lib/constants.ts. Export CITIES, PROPERTY_TYPES, FURNISHING,
   SORT_OPTIONS, all `as const`. Values:
     CITIES: six to ten major Indian cities, display strings (e.g. "Mumbai",
     "Bengaluru", "Delhi", "Pune", "Hyderabad", "Chennai", "Kolkata",
     "Ahmedabad").
     PROPERTY_TYPES: "Apartment", "House", "Villa", "Plot", "Commercial".
     FURNISHING: "Furnished", "Semi-Furnished", "Unfurnished".
     SORT_OPTIONS: a tuple of { value, label } pairs for "Newest", "Price:
     Low to High", "Price: High to Low".
k. Write lib/utils.ts with the shadcn-provided `cn()` helper (clsx + tailwind-
   merge). Confirm the two deps were installed by shadcn init; if not, install
   them before writing the file.
l. Write .env.example listing every variable name named in CLAUDE.md section
   6, with no real values. Confirm .env.local is in .gitignore (Next.js's
   default gitignore already includes it; verify).
m. Replace app/page.tsx with a minimal placeholder that renders the shadcn
   Button and confirms the fonts and tokens are live. Not the real home — the
   real home is Phase 3.

Verification (run before claiming done):

- `npm run dev` boots on port 3000 with no errors and no warnings in the
  terminal.
- Open http://localhost:3000 via the playwright MCP: navigate, snapshot, and
  confirm the Button renders with the project's token-driven colors (not
  shadcn defaults) and the two fonts are applied.
- `npx tsc --noEmit` exits 0.
- `npm run build` completes with no errors.
- `npm run lint` is clean.
- Call ide MCP getDiagnostics on a representative file; zero errors.
- Grep the repository for raw hex colors in app/ and components/ outside
  globals.css; zero hits.
- `cat .env.example` lists every variable from CLAUDE.md section 6.

Once every verification step passes:

1. Update memory.md:
   - Move "Current phase" to "Phase 1 — Database Layer. Not started."
   - Move Phase 0 into "Last completed phase" with the date and a one-line
     summary of what was built.
   - Append any decisions made during the phase to the Decisions log with the
     date, decision, reason, and affected files.
   - Append any facts the next session needs to "Things to remember".
2. Stage the changes and create one commit:
   `git commit -m "feat: phase 0 project initialization"`
   Do not push unless the user asks.

Report:
- The file count created, the dependency list added, the memory.md diff
  summary, and the commit SHA.
- Any deviation from the plan and the reason.

Then STOP. Do not start Phase 1. Wait for the user.
```

#### How to verify this phase manually

- Open http://localhost:3000 in a browser. The placeholder home renders without a flash of unstyled text.
- Resize the window to 375 px and 1440 px. No horizontal scroll, no layout break.
- Open DevTools; the console is clean.
- Confirm `.env.local` does not exist in the git working tree (or if it does, that it is listed in `.gitignore`).
- Confirm the `docs/` directory and `CLAUDE.md`, `memory.md`, `Build-playbook.md` are intact (unchanged by the scaffold).

#### Common pitfalls for this phase

- `create-next-app` refusing to run in a non-empty directory. Move protected files out, scaffold, restore. Never run `rm -rf`.
- Picking shadcn's default neutral color instead of the project's token palette. Restyle in `components/ui/button.tsx` once; do not override at call sites.
- Forgetting `noUncheckedIndexedAccess`. Phase 1 model indexing and Phase 3 pagination rely on it to catch out-of-range reads.
- Installing a toast library when `sonner` is already in the shadcn baseline. Do not install `react-hot-toast` or `react-toastify`.

---

### Phase 1 — Database Layer

#### Goal

Three Mongoose models with correct types, defaults, enums, and indexes; a cached serverless connection; an idempotent seed script that uses Cloudinary-generated placeholder images for sample properties.

#### Skills & MCPs for this phase

- `superpowers:writing-plans`: Plan Mode before any file is written.
- `cloudinary` (MCP): `generate-image` to create six placeholder property photos; store the returned secure URLs as a constant inside `scripts/seed.ts`.
- `mongodb` (MCP): confirm the Atlas cluster is reachable; verify the indexes exist after `syncIndexes()`. Fall back to `mongosh` if the MCP is not connected.
- `context7` (MCP): fetch current Mongoose 8 docs for `pre("save")`, `select: false`, and discriminator-free compound-unique indexes.
- `ide` (MCP): `getDiagnostics` after writing each model.
- `ponytail:ponytail` (skill): active; no secondary indexes beyond those listed, no helper abstractions over Mongoose models.

#### Prerequisites

- Phase 0 complete. `package.json`, `tsconfig.json`, folder structure, and `lib/constants.ts` all exist.
- A MongoDB Atlas cluster exists and the connection URI is in `.env.local` as `MONGODB_URI`.
- A Cloudinary account exists (needed in Phase 4 anyway; for Phase 1 only its API credentials are needed for the MCP to generate images into that account; the project does not yet consume the Cloudinary SDK).

#### Copy-paste prompt for Claude Code

```text
You are starting Phase 1 (Database Layer) of the Real Estate Portal.

Before writing any code, do the following in order:

1. Read CLAUDE.md in full.
2. Read memory.md in full. Confirm Phase 0 is logged as complete.
3. Read docs/DEVELOPMENT-PLAN.md, "Phase 1 — Database Layer" section.
4. Read docs/DATABASE.md in full. The three schemas, their defaults, enums,
   and indexes are frozen. Do not add fields, do not rename fields, do not
   add a fourth collection.
5. Confirm the mongodb MCP is connected. If it responds, use it to list the
   current indexes on the target database (there should be none yet). If it
   is not connected, note this in memory.md and use `mongosh` for the same
   verification later in the phase.

Enter Plan Mode. Invoke superpowers:writing-plans. Produce a plan containing:

- The content of lib/db.ts (globalThis cache, promise sharing on concurrent
  cold starts, error-clearing).
- The content of each of the three models: User, Property, Review. For each,
  the field list, the enums, the defaults, the schema-level validators (the
  five-image cap for Property), the pre("save") hook on User, and the exact
  index declarations.
- The content of lib/rating.ts with recalcPropertyRating and the empty-agg
  guard.
- The content of types/index.ts (shared types derived from the model
  interfaces, not duplicated by hand).
- The content of scripts/seed.ts, including:
    - Loading dotenv and connecting via lib/db.ts.
    - Reading SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD from the environment.
    - Upserting the admin by email with role: "admin", isEmailVerified: true,
      a bcrypt-hashed password driven by the pre("save") hook.
    - Six sample properties keyed on (title, city) for idempotence, mixing
      draft and published status, with createdBy pointing at the admin.
    - Calling syncIndexes() on each model.
    - Clean exit codes.
- The exact `generate-image` prompts you will issue to the cloudinary MCP for
  the six property placeholder photos. Each prompt names the property type
  and a plausible interior or exterior angle. Do not reuse generic stock
  prompts.
- The list of dependencies to install: mongoose, bcryptjs, dotenv, tsx,
  @types/bcryptjs. Nothing else.

Stop and wait for the user to approve the plan.

Once approved, execute:

a. Install the five dependencies above in one `npm install` call. Install
   tsx under devDependencies.
b. Add the "seed" script to package.json: "seed": "tsx scripts/seed.ts".
c. Write lib/db.ts exactly as planned. Guard the cache on globalThis with the
   declare block from DATABASE.md section 1.
d. Write models/User.ts, models/Property.ts, models/Review.ts in that order.
   Each model exports its document interface AND the model, with the
   mongoose.models.X ?? mongoose.model(...) guard around the model export.
e. Declare every index listed in the DATABASE.md Index Summary on its model
   via schema.index(...). The {property: 1, user: 1} index on Review is
   UNIQUE.
f. Write lib/rating.ts. recalcPropertyRating takes a Types.ObjectId, runs the
   aggregation, rounds the mean to one decimal, and uses the `agg ?` guard so
   a property with zero reviews gets 0/0 instead of throwing.
g. Write types/index.ts re-exporting the three document interfaces plus any
   shared payload types the UI will need later (keep this file small — add
   when something actually needs it, not speculatively).
h. Call the cloudinary MCP's generate-image six times. Store each returned
   secure URL in a `SEED_IMAGE_URLS` constant inside scripts/seed.ts. Record
   the asset_ids and public_ids in a short block of comments at the top of
   the seed script so a future session can find and cleanup those assets if
   needed.
i. Write scripts/seed.ts. Confirm idempotence:
     - Admin is upserted by email with findOneAndUpdate + upsert: true.
     - Properties are upserted by (title, city) composite key with the same
       pattern.
     - syncIndexes() is called on each model BEFORE the upserts so unique
       constraints are in force.
j. Run `npm run seed` once. Capture the output.
k. Run `npm run seed` a second time. The output should show no new documents
   created. Confirm by counting via the mongodb MCP (or `mongosh`).

Verification (run before claiming done):

- `npm run seed` completes exit 0 both runs.
- Via the mongodb MCP (or mongosh): the users collection has exactly one
  admin document, the properties collection has exactly six documents, and
  the reviews collection has none.
- The admin document's password field is a bcrypt hash (starts with `$2a$`
  or `$2b$`), not plaintext.
- `db.properties.getIndexes()` lists {status: 1, createdAt: -1},
  {status: 1, price: 1}, {status: 1, city: 1}, {status: 1, type: 1} plus _id.
- `db.reviews.getIndexes()` lists {property: 1, user: 1} with unique: true
  and {property: 1, createdAt: -1} plus _id.
- Attempt to insert two review documents with the same (property, user)
  pair via mongosh. The second insert fails with error 11000.
- Call recalcPropertyRating on a sample property id with no reviews via a
  short tsx one-liner; it does not throw and the property's averageRating
  stays 0.
- Hot reload: with `npm run dev` running, touch any model file. The next
  request does not produce OverwriteModelError.
- `npx tsc --noEmit` is clean. ide MCP getDiagnostics on the models and seed
  is clean.

Once every verification step passes:

1. Update memory.md:
   - Move "Current phase" to "Phase 2 — Authentication. Not started."
   - Move Phase 1 into "Last completed phase" with date and a one-line
     summary.
   - Append any decisions (e.g. "SEED_IMAGE_URLS pinned to six cloudinary
     secure URLs; replacing them requires regenerating via the cloudinary
     MCP").
2. Create one commit: `git commit -m "feat: phase 1 database layer"`
3. Do not push unless the user asks.

Report:
- The index verification output, the seed-run output (both runs), the six
  Cloudinary public_ids, and the commit SHA.

Then STOP. Do not start Phase 2.
```

#### How to verify this phase manually

- Open MongoDB Atlas in a browser (or Compass locally). Confirm the three collections exist and the indexes match the DATABASE.md Index Summary table.
- `mongosh "<MONGODB_URI>"` and run `db.users.findOne({ role: "admin" })`. The returned document has `isEmailVerified: true` and no plaintext password.
- `mongosh` → `db.properties.find({ status: "published" }).count()`. Non-zero and matches the seed plan.
- Attempt to run the seed a third time. Still no duplicates.

#### Common pitfalls for this phase

- Writing the `pre("save")` password hook without the `isModified("password")` guard. Profile updates in Phase 4 will re-hash an already-hashed value and lock the user out.
- Forgetting `select: false` on `password`. Login in Phase 2 will fail with a confusing "wrong password" message because `User.findOne({ email })` returns no password field by default.
- Letting the seed script call `deleteMany({})`. Idempotence is upsert, not drop-and-recreate.
- Generating Cloudinary images into the wrong account because the MCP is logged in to a different Cloudinary user. Call `get-usage-details` first to confirm the account.

---

### Phase 2 — Authentication

#### Goal

A complete auth system: register, verify, login, logout, forgot, reset, HTTP-only session cookie, route guards. Verification emails are inspected via the Resend MCP during testing.

#### Skills & MCPs for this phase

- `superpowers:writing-plans`: Plan Mode first.
- `superpowers:test-driven-development`: write a Playwright flow for register-verify-login before implementing the UI if useful.
- `context7` (MCP): current Next.js middleware edge-runtime constraints, current `jsonwebtoken` and `bcryptjs` usage.
- `resend` (MCP): `list-emails`, `get-email`, `list-logs` to confirm verification and reset emails were accepted. Not used to send email from the app.
- `claude_ai_Gmail` (MCP): fallback to inspect the real inbox for the verification link.
- `playwright` (MCP): drive the auth flows end-to-end during verification.
- `claude-in-chrome` (MCP): optional, for live Chrome if the user wants to watch.
- `shadcn-ui` (skill): the auth pages use `form`, `input`, `button`, `label`, `card`.
- `plugin_claude-mem_mcp-search` (MCP): `work_state_write` for the per-route task list.
- `ponytail:ponytail` (skill): active; no helper function with one call site, no auth abstraction layer beyond lib/auth.ts.

#### Prerequisites

- Phase 1 complete.
- A Resend account exists; `RESEND_API_KEY` and `EMAIL_FROM` are in `.env.local`. In development, Resend's onboarding domain is acceptable.
- `NEXT_PUBLIC_APP_URL` is set to `http://localhost:3000`.
- A test email inbox the user controls (Gmail is fine).

#### Copy-paste prompt for Claude Code

```text
You are starting Phase 2 (Authentication) of the Real Estate Portal.

Before writing any code, do the following in order:

1. Read CLAUDE.md in full.
2. Read memory.md in full. Confirm Phase 1 is logged as complete.
3. Read docs/DEVELOPMENT-PLAN.md, "Phase 2 — Authentication" section.
4. Read docs/API.md sections 1 (standard response shape), 2 (authentication
   model), 3 (auth endpoints), 9 (errors), 10 (validation rules). The seven
   auth endpoints are frozen.
5. Read docs/PRODUCT-SPEC.md sections 7.1, 7.2, 7.3 (the acceptance criteria
   for registration, login, forgot/reset).
6. Read docs/UI-UX-SPEC.md section 5, subsections 5.4 through 5.8 (the five
   auth pages).
7. Read docs/DATABASE.md section 10 (why there are no token fields on User).
   Tokens are stateless signed JWTs with a `purpose` claim.
8. Confirm the resend MCP is connected via list-domains. Confirm the mongodb
   MCP is connected via a short ping listing the users collection count.

Enter Plan Mode. Invoke superpowers:writing-plans. Produce a plan containing:

- The content of lib/response.ts (ok, fail, handleError).
- The content of lib/token.ts (createActionToken, verifyActionToken with the
  purpose check).
- The content of lib/auth.ts (signSessionToken, verifySessionToken, cookie
  set and clear helpers, getSession, requireUser, requireAdmin).
- The content of lib/email.ts (Resend client, sendVerificationEmail,
  sendPasswordResetEmail; render a minimal HTML + plaintext body with the
  action URL built from NEXT_PUBLIC_APP_URL and the token).
- The content of lib/validations/auth.ts (shared Zod schemas for register,
  login, forgot, reset).
- The seven route files under app/api/auth/, each following the handler
  shape in CLAUDE.md section 4 (connectDB, guard if any, safeParse, work,
  ok, handleError wrapper).
- The content of middleware.ts guarding /favorites, /profile, /admin/* with
  a ?next= redirect when the session is missing.
- The five auth pages under app/(auth)/ with React Hook Form + the Zod
  resolver.
- The components/layout/nav.tsx auth-aware right slot.
- The hooks/use-auth.ts TanStack Query hook backed by GET /api/auth/me.
- The rate-limiting approach for login, register, forgot-password. The
  simplest working approach is an in-memory LRU keyed on IP; mark it with a
  `ponytail:` comment naming the ceiling (survives one serverless instance,
  not a fleet) and the upgrade path (swap to Upstash Redis if abuse appears).
- The list of dependencies to install: jsonwebtoken, @types/jsonwebtoken,
  @tanstack/react-query, @tanstack/react-query-devtools (dev), react-hook-form,
  @hookform/resolvers, zod, resend, lru-cache. Nothing else.

Stop and wait for the user to approve the plan.

Once approved, execute:

a. Install the dependencies above.
b. Add shadcn components the plan requires that are not yet installed. Only
   add what you will use in Phase 2.
c. Write lib/response.ts, lib/token.ts, lib/auth.ts, lib/email.ts in that
   order. Each file is small and single-purpose.
d. Write lib/validations/auth.ts and derive page-form types from the schemas
   with z.infer.
e. Write the seven route handlers under app/api/auth/. Enforce:
     - Register: lowercase + trim email, check uniqueness, hash via the User
       pre("save") hook, send verification email, DO NOT set a session cookie.
     - Verify-email: verify the token with purpose "verify-email", set
       isEmailVerified true, respond with ok({ verified: true }).
     - Login: reselect password via .select("+password"), compare, refuse if
       isEmailVerified is false with a DISTINCT message, otherwise set the
       HttpOnly session cookie.
     - Logout: clear the cookie.
     - Forgot-password: always respond ok even if the email does not exist;
       send the reset email only if the account exists.
     - Reset-password: verify the token with purpose "reset-password", set
       the new password (hook rehashes).
     - Me: return the current user minus password; 401 if no session.
f. Write middleware.ts. The matcher covers /favorites, /profile, /admin/*.
g. Build the five auth pages. Each page handles its own loading, submitting,
   success, and error states per UI-UX-SPEC section 6. Use shadcn form,
   input, button, label.
h. Wire TanStack Query at app/layout.tsx (QueryClientProvider as a Client
   Component wrapper). Add Devtools only in development.
i. Build components/layout/nav.tsx with the auth-aware right slot: a Login
   link for guests and an avatar dropdown (name, Profile, Favorites, Logout)
   for signed-in users.
j. Add the in-memory LRU rate limiter to the three throttled endpoints. Add
   a `ponytail:` comment naming the ceiling.

Verification (run before claiming done):

Scripted (playwright MCP):
- From a cold cookie jar: navigate to /register, fill the form with a fresh
  test email you control, submit, assert the success state renders and no
  session cookie is set.
- Call resend MCP list-emails filtered by the test address and verify the
  verification email is listed with status accepted/delivered. get-email to
  confirm the body contains the verification URL.
- Open the real inbox (Gmail MCP or claude-in-chrome) and click the
  verification link. Assert the resulting page shows the verified state.
- Navigate to /login with the newly-verified credentials, submit, assert the
  response sets a Set-Cookie with HttpOnly and SameSite=Lax, and the nav now
  shows the avatar dropdown.
- Open DevTools inside playwright via browser_evaluate; confirm
  `document.cookie` does NOT contain the session cookie name.
- Log out, assert the cookie is cleared and the nav returns to the Login
  state.
- Attempt login before verification with a new fresh email; assert the
  response message is distinct from the wrong-password message.
- Attempt login with a wrong password and with an unknown email. Both return
  the identical generic error.
- Submit forgot-password with a non-existent email; assert the generic
  success. list-emails confirms NO email was sent for that address.
- Submit forgot-password with the test email; call the reset link, pick a
  new password, log in with it, confirm the old password no longer works.
- Visit /profile logged out; assert the redirect is /login?next=/profile.
  Log in, assert the landing is /profile.

Database side (mongodb MCP):
- The admin from Phase 1 is intact and unchanged.
- The newly-created test user has isEmailVerified true after verification
  and the bcrypt-hashed new password after reset.

Static:
- `npx tsc --noEmit` clean.
- `npm run lint` clean.
- Grep for `any` under lib/, app/api/auth/, app/(auth)/; zero in domain code.

Once every verification step passes:

1. Update memory.md:
   - Move "Current phase" to "Phase 3 — Public Browsing. Not started."
   - Move Phase 2 into "Last completed phase" with date and a one-line
     summary.
   - Append decisions (e.g. "Rate limiting is in-memory LRU; ponytail
     comment at lib/auth.ts marks the upgrade path to Upstash Redis").
2. Create one commit: `git commit -m "feat: phase 2 authentication"`

Report:
- The resend MCP list-emails snapshot proving the verification email went
  out.
- The cookie-attribute snapshot (HttpOnly, Secure in prod, SameSite).
- The commit SHA.

Then STOP. Do not start Phase 3.
```

#### How to verify this phase manually

- Register a new user with your real email in your browser. The verification email arrives (check spam if Resend's onboarding domain is in use). Click the link; the page shows verified. Log in; the nav shows your avatar initials.
- Log out. The nav returns to the Login state. Visit `/profile` → redirect to `/login?next=/profile`. Log in → land on `/profile`.
- Trigger forgot-password with the real email, follow the link, set a new password, log in with it, confirm the old password fails.
- Open DevTools → Application → Cookies. The session cookie carries `HttpOnly`. In the Console, `document.cookie` does not list it.

#### Common pitfalls for this phase

- Edge runtime in `middleware.ts`: Node-only crypto APIs (notably `jsonwebtoken`) do not run in the Edge runtime. Keep middleware minimal — read the cookie, decode just enough to decide redirect vs continue, and perform the real `verifySessionToken` inside the route handler. If `jsonwebtoken` refuses to load in middleware, use `jose` for the Edge path or set the matcher's `runtime: "nodejs"`.
- Returning a bare `NextResponse.json(...)` from any auth route. Every response must go through `ok()` or `fail()`.
- Trusting a client-supplied `role` on register. Strip it in the Zod schema and never pass it to `User.create`.
- Sending verification email before the user is saved. Save first; on save failure, no email went out. On email-send failure, keep the user and surface "resend verification" (BR consequence in PRODUCT-SPEC edge cases).

---

### Phase 3 — Public Browsing

#### Goal

Guests can find and open properties. Listing with every filter, three sorts, pagination, URL-as-source-of-truth; detail page with gallery, contact, share, and a disabled favorite heart that prompts login.

#### Skills & MCPs for this phase

- `superpowers:brainstorming`: before designing the hero and bento, invoke it. The hero sets the tone of the whole product.
- `frontend-design:frontend-design` (skill): aesthetic direction for the hero and card.
- `anthropic-skills:ui-ux-pro-max` (skill): breakpoint reference, color/palette validation.
- `design-taste-frontend` (skill): pre-flight check before writing the home page.
- `enhance-prompt` (skill): tighten any `21st` MCP search prompts.
- `21st` (MCP): component search only when neither shadcn nor Aceternity covers it. Note the choice in memory.md.
- `context7` (MCP): current App Router params/searchParams typing, TanStack Query hydration in the App Router.
- `playwright` (MCP): drive filter combinations, URL round-trip, pagination, viewCount increment, mobile breakpoints via `browser_resize`.
- `mongodb` (MCP): sanity-check viewCount in the database.
- `shadcn-ui` (skill): `card`, `select`, `sheet`, `badge`, `button`, `carousel`, `skeleton`.
- `plugin_claude-mem_mcp-search` (MCP): work_state_write.
- `ponytail:ponytail` (skill): active; no "useFilters" context when a URL query string works, no card variant for every status, no abstract Grid<T> component.

#### Prerequisites

- Phase 1 and Phase 2 complete.
- At least six seeded properties exist, split between draft and published statuses.

#### Copy-paste prompt for Claude Code

```text
You are starting Phase 3 (Public Browsing) of the Real Estate Portal.

Before writing any code, do the following in order:

1. Read CLAUDE.md in full.
2. Read memory.md in full. Confirm Phase 2 is logged as complete.
3. Read docs/DEVELOPMENT-PLAN.md, "Phase 3 — Public Browsing" section.
4. Read docs/API.md section 5 (public property endpoints). Index and detail
   are the frozen contract.
5. Read docs/PRODUCT-SPEC.md sections 4.3, 7.4, 7.5, and the matching rows
   of section 8 (edge cases).
6. Read docs/UI-UX-SPEC.md section 3.3 (property card anatomy), section 4
   (shared layout), section 5 (page specs: home, listing, detail), section
   7 (responsive breakpoints).
7. Invoke superpowers:brainstorming for the home hero and bento grid. Record
   the design direction in memory.md (one paragraph).

Enter Plan Mode. Invoke superpowers:writing-plans. Produce a plan containing:

- The content of lib/validations/property.ts (propertyFilters schema with
  z.coerce.number() for price/area/bhk/page/limit, enum validation on city,
  type, furnishing, sort; two .refine range checks for price and area).
- The content of app/api/properties/route.ts (GET): forced status
  "published" filter, every query filter wired, three sorts, pagination
  returning the real total via countDocuments.
- The content of app/api/properties/[id]/route.ts (GET): ObjectId validation
  returning 400 on invalid, status "published" check returning 404 on draft
  (identical to not-found; existence is not leaked), atomic $inc on
  viewCount, isFavorited field only when a session exists.
- The property card component (components/property/property-card.tsx) built
  to UI-UX-SPEC 3.3 anatomy, including the rating chip visible only when
  reviewCount > 0, BHK hidden for Plot and Commercial, furnishing omitted
  entirely when unset.
- The matching skeleton (components/property/property-card-skeleton.tsx) with
  the SAME dimensions as the real card (no CLS).
- The grid, filter bar (horizontal on desktop, bottom Sheet on mobile with
  an applied-count badge), sort dropdown, pagination.
- The hooks/use-property-filters.ts: URL query string is the SOLE source of
  truth; debounced at 400 ms; active chips with individual removal.
- The property detail page: gallery via shadcn carousel, title block, price
  with INR formatter, description, details table, sticky desktop contact
  card and fixed mobile bottom bar with phone (tel:) and WhatsApp (wa.me)
  links. The favorite heart renders but on tap it prompts login — Phase 4
  wires it to the mutation.
- The home page: Aceternity hero (or a minimal custom hero if Aceternity is
  not yet added), city bento grid using CITIES, newest six properties grid,
  CTA banner, footer.
- The footer.
- The empty-state and error-state primitives under components/shared/.
- A short list of dependencies to install (framer-motion if the hero needs
  it; aceternity-ui-style components live as copied files, not as a
  package). Ask before adding any package.

Stop and wait for the user to approve the plan.

Once approved, execute the plan in the order above. After writing each
component ship its matching skeleton in the same file where sensible.

Verification (run before claiming done):

Scripted (playwright MCP):
- Navigate to /properties with no filter. Snapshot the grid; it shows only
  published properties and nothing with status draft.
- Pick a draft property's _id (via mongodb MCP) and navigate directly to
  /properties/<that id>. The response is 404 (not a 500 and not a "draft"
  banner).
- Navigate to /properties?city=<X>&type=<Y>&minPrice=<A>&maxPrice=<B>&bhk=<N>
  &minArea=<M>&maxArea=<Q>&furnishing=<Z>&sort=priceAsc&page=1. The URL is
  the source of truth: snapshot the grid, reload, snapshot again. Identical.
- Apply a filter combination that yields zero results. The empty state
  renders with a Clear-all action; no error.
- Change pages; the URL updates to page=2 and preserves every other param.
- Press the browser Back button; the previous filter set is restored.
- Open a property detail page. Snapshot the gallery (carousel), title,
  price (formatted INR), description, address, contact card. The viewCount
  on the Property document (verified via mongodb MCP) increased by exactly
  one.
- For a Plot or Commercial property, assert BHK is absent from the DOM.
- For a property with furnishing unset, assert furnishing is absent from the
  DOM.
- The WhatsApp link href is wa.me/91<10 digits>?text=<url-encoded message
  containing the property URL>.
- Click the share-copy button; a toast confirms copy. (Verify via
  browser_evaluate on navigator.clipboard.)
- resize to 375 px: grid is one column, the filter bar is a bottom Sheet
  trigger. resize to 768 px: two columns, horizontal filters. resize to
  1440 px: three columns.
- The rating chip appears on cards where reviewCount > 0 and is absent at
  zero. (Seed properties start at 0; create a one-off review manually via
  Phase 5 is not yet available — defer this check and leave a note in
  memory.md.)
- Favorite heart on a card: tapping as a guest opens the login prompt and
  does not call any API.

Static:
- `npx tsc --noEmit` clean. `npm run lint` clean.
- No raw hex outside globals.css. Grep for /#[0-9a-fA-F]{6}/ in app/ and
  components/.
- No `any` in domain code.

Once every verification step passes:

1. Update memory.md:
   - Move "Current phase" to "Phase 4 — User Features. Not started."
   - Move Phase 3 into "Last completed phase".
   - Record the hero design direction and any 21st MCP component ids chosen.
   - Record deferred verifications (e.g. rating-chip test requires Phase 5
     data) as "Open questions for user" so the next session re-checks.
2. Create one commit: `git commit -m "feat: phase 3 public browsing"`

Then STOP. Do not start Phase 4.
```

#### How to verify this phase manually

- Open http://localhost:3000. Hero renders. Scroll: city bento, six newest properties, CTA, footer.
- Click into a property. Gallery works. Copy-link toast appears. WhatsApp link opens in a new tab.
- Open http://localhost:3000/properties. Apply filters; watch the URL update as you type (with the 400 ms debounce). Reload the URL; same result set.
- Reduce the window to a phone width. The filter Sheet opens from the bottom.
- Try a draft property's _id directly in the URL — you get a 404.

#### Common pitfalls for this phase

- Keeping filter state in React state alongside the URL. One source of truth: the URL. Reading `useSearchParams` and writing with `router.replace`.
- Spinning on a blank page while the listing fetches. Ship card skeletons with the same dimensions, or you will introduce CLS.
- Rendering a 0-star rating for a property with `reviewCount === 0`. Zero is a sentinel. Show "No ratings yet" instead.
- Fetching `GET /api/properties/:id` from the client while also increments happen server-side on the page render. Decide once: either the detail page is a Server Component that calls the handler via a server-side fetch (increment on each view) or client-side TanStack Query (which still produces one view per load, as long as it is not stale-while-revalidate for the detail route). Keep it simple: Server Component page.

---

### Phase 4 — User Features

#### Goal

Favorites work end-to-end with optimistic UI, idempotent server operations, and clean handling of deleted or unpublished targets. The profile is editable with a Cloudinary avatar upload.

#### Skills & MCPs for this phase

- `superpowers:writing-plans` and `superpowers:test-driven-development`.
- `cloudinary` (MCP): `search-assets` and `get-asset-details` to confirm the ImageUpload component is actually landing files.
- `playwright` (MCP): drive favorite toggles, optimistic rollback (fail the mutation deliberately), profile edit, avatar upload.
- `mongodb` (MCP): confirm `$addToSet` and `$pull` reach the database correctly.
- `context7` (MCP): current Cloudinary unsigned upload parameters, TanStack Query optimistic mutation pattern.
- `shadcn-ui` (skill): `avatar`, `dropdown-menu`, `alert-dialog`.
- `ponytail:ponytail` (skill): active; no favorites service class, no shared upload hook with branches for a single call site.

#### Prerequisites

- Phases 0 through 3 complete.
- A Cloudinary unsigned upload preset exists in the Cloudinary dashboard (`NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`).
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is set.

#### Copy-paste prompt for Claude Code

```text
You are starting Phase 4 (User Features) of the Real Estate Portal.

Before writing any code, do the following in order:

1. Read CLAUDE.md in full.
2. Read memory.md in full. Confirm Phase 3 is logged complete and any
   deferred Phase 3 verifications are listed under "Open questions".
3. Read docs/DEVELOPMENT-PLAN.md, "Phase 4 — User Features" section.
4. Read docs/API.md section 4 (user endpoints).
5. Read docs/PRODUCT-SPEC.md section 7.6 and the favorites rows of section 8.
6. Read docs/UI-UX-SPEC.md section 5 (favorites page, profile page) and the
   favorite heart row in section 3.3.
7. Confirm the cloudinary MCP is connected: list-images with max_results 1
   to confirm authentication to the right cloud.

Enter Plan Mode. Invoke superpowers:writing-plans. Produce a plan containing:

- The content of lib/cloudinary.ts: a thin wrapper if any server-side work
  is needed; otherwise just typed helpers for building the unsigned upload
  URL and parsing the response. The project uses client-side unsigned
  uploads; the server stores only the returned secure_url.
- The content of lib/validations/user.ts: profileUpdate schema with name
  (2 to 60), phone (10 digits), optional avatar (URL). STRIPS email, role,
  isEmailVerified, favorites.
- app/api/user/profile/route.ts (PATCH): auth required, parse, update,
  return the updated user minus password.
- app/api/user/favorites/route.ts (GET): auth required, return the user's
  favorites populated with the Property fields the card needs, FILTERED to
  only published and non-null references.
- app/api/user/favorites/[propertyId]/route.ts (POST and DELETE): auth
  required, ObjectId validation, $addToSet on POST, $pull on DELETE. Both
  idempotent successes.
- components/property/favorite-button.tsx: optimistic toggle with TanStack
  Query mutation, rollback on error with a shadcn sonner toast, guest tap
  opens the login prompt.
- components/shared/image-upload.tsx: reusable uploader with drag-and-drop,
  client-side size and type validation, direct POST to Cloudinary with the
  unsigned preset, and a progress indicator. Phase 6's property form reuses
  this.
- hooks/use-favorites.ts.
- app/(public)/favorites/page.tsx: protected via middleware; grid of the
  user's favorites, empty state, slide-out remove animation.
- app/(public)/profile/page.tsx: avatar uploader, name, phone, read-only
  email, update button.
- Nav avatar updates from the query cache immediately after a profile save.

Stop and wait for the user to approve the plan.

Once approved, execute the plan.

Verification (run before claiming done):

Scripted (playwright MCP + cloudinary MCP + mongodb MCP):
- Sign in as the test user. Navigate to a published property. Tap the heart.
  Assert the UI flips to filled immediately (optimistic). Via the mongodb
  MCP, confirm the property _id was pushed to the user's favorites array.
- Tap the heart again. Assert the UI flips to empty. Via the mongodb MCP,
  confirm the array no longer contains the id.
- Tap the heart twice in rapid succession. Assert no duplicates in the
  favorites array (idempotence via $addToSet).
- Log out. Navigate to a property. Tap the heart. Assert the login prompt
  opens and no network call to /api/user/favorites was made.
- Create a scenario where the favorite POST will fail: temporarily stop the
  dev server mid-click, or use playwright's browser_network_request to
  intercept and return 500 for one call. Assert the heart rolls back and a
  toast surfaces the error.
- Admin unpublishes a property the test user has favorited (do this via
  the admin API if available, otherwise directly in the mongodb MCP).
  Reload /favorites. Assert the unpublished property is NOT listed and no
  error renders. Re-publish; it reappears.
- Admin deletes a property the test user has favorited (direct delete via
  mongodb MCP is acceptable here, before Phase 6's cascade is wired). Reload
  /favorites. The deleted property does not appear and does not error.
- On /profile: upload an avatar. Assert the file is validated client-side
  for size and type before the POST. After upload, call cloudinary MCP
  search-assets filtered to the preset's folder; confirm the asset exists.
  Reload the page; the avatar persists.
- Save the profile with name "A" (one character) and assert the form shows
  a Zod validation error. Save with a valid name; the nav avatar updates
  without a reload.
- Attempt to PATCH /api/user/profile with email, role, or isEmailVerified
  via browser_evaluate using fetch directly. Assert the response does not
  change those fields (strip test). Via mongodb MCP, confirm the user
  document still has the original email and role.

Static:
- `npx tsc --noEmit` and lint clean.
- No `any` in domain code.
- ide MCP getDiagnostics clean.

Once every verification step passes:

1. Update memory.md:
   - Move "Current phase" to "Phase 5 — Reviews. Not started."
   - Move Phase 4 into "Last completed phase".
   - Record the Cloudinary folder convention chosen for avatars (e.g.
     `realestate/avatars/<user-id>`) and whether property uploads will share
     or split the folder.
2. Create one commit: `git commit -m "feat: phase 4 user features"`

Then STOP. Do not start Phase 5.
```

#### How to verify this phase manually

- Favorite a property on desktop, open the same account in a private window and sign in; `/favorites` lists the property.
- Upload an avatar. It renders in the nav immediately and still renders after a full page reload.
- Open DevTools → Network while favoriting. One request to `POST /api/user/favorites/<id>`. No retry storm.
- Try to update your email via the profile form (it should be read-only). Confirm the field has `readOnly` or is simply not rendered as an input.

#### Common pitfalls for this phase

- Sending the Cloudinary `api_secret` to the browser. Only `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` cross the boundary. Never prefix `CLOUDINARY_API_SECRET` with `NEXT_PUBLIC_`.
- Omitting the strip-list on `PATCH /api/user/profile`. Even if the UI doesn't send them, the API must refuse to apply `email`, `role`, `isEmailVerified`.
- Writing a second uploader for Phase 6 instead of reusing `ImageUpload`. The playbook names this as a risk; keep the component reusable.
- Not populating `favorites` in `GET /api/user/favorites`. The card needs cover image, title, price. One `.populate("favorites", "title coverImage price city type status")` and filter in-code or via `$match` for `status: "published"`.

---

### Phase 5 — Reviews

#### Goal

Full review CRUD with the login gate, the compound unique constraint, and correct denormalized rating maintenance.

#### Skills & MCPs for this phase

- `superpowers:writing-plans`, `superpowers:test-driven-development`.
- `mongodb` (MCP): verify `averageRating` and `reviewCount` after every mutation; prove the unique index is enforced under a race.
- `playwright` (MCP): drive the three role variants of the reviews section; script the race (two parallel POSTs) via `browser_run_code_unsafe` and `fetch`.
- `shadcn-ui` (skill): `textarea`, `alert-dialog`, `avatar`.
- `context7` (MCP): current Mongoose aggregation syntax if needed.
- `ponytail:ponytail` (skill): active; `recalcPropertyRating` already exists from Phase 1 — reuse it.

#### Prerequisites

- Phases 0 through 4 complete.
- At least one published property with no reviews yet, so the first-review path can be tested from scratch.

#### Copy-paste prompt for Claude Code

```text
You are starting Phase 5 (Reviews) of the Real Estate Portal.

Before writing any code, do the following in order:

1. Read CLAUDE.md in full.
2. Read memory.md in full. Confirm Phase 4 is logged complete.
3. Read docs/DEVELOPMENT-PLAN.md, "Phase 5 — Reviews" section.
4. Read docs/API.md section 6 (review endpoints).
5. Read docs/PRODUCT-SPEC.md sections 4.4, 7.7, and the review rows of 8.
6. Read docs/DATABASE.md sections 5 (Review collection), 7 (embedding
   decisions), 8 (denormalization: averageRating and reviewCount).
7. Read docs/UI-UX-SPEC.md section 5.3 (review section variants) and the
   star rating anatomy.

Enter Plan Mode. Invoke superpowers:writing-plans. Produce a plan containing:

- The content of lib/validations/review.ts (rating: z.coerce.number().int()
  .min(1).max(5); comment: z.string().trim().min(5).max(1000)).
- app/api/properties/[id]/reviews/route.ts: GET requires auth, returns a
  paginated list with populated author (name, avatar), computes `isOwn`
  per review, and surfaces the current user's `myReview` separately so the
  UI can pin it. POST requires auth, Zod-parses, runs a pre-check for an
  existing review, calls Review.create, catches error 11000 and translates
  it to the SAME REVIEW_EXISTS error, then calls recalcPropertyRating,
  returns the created review + updated { averageRating, reviewCount }.
- app/api/reviews/[id]/route.ts: PATCH and DELETE. Ownership check: the
  session user must be the review's user. Admin does NOT bypass. After
  success, call recalcPropertyRating and return the updated denormalized
  pair.
- components/review/review-section.tsx: three variants per UI-UX-SPEC 5.3:
    - guest: show rating summary + a prompt to log in; no list, no form.
    - user, has not reviewed: list + form.
    - user, has reviewed: list with the user's review pinned, with edit
      and delete controls.
- components/review/review-list.tsx and review-item.tsx with "edited" label
  computed from updatedAt > createdAt + a small threshold.
- components/review/review-form.tsx with edit mode and a submit button that
  disables while in-flight.
- components/review/star-rating.tsx (read-only display, aria-label with the
  numeric value) and star-input.tsx (keyboard operable, arrow keys, Enter
  to submit).
- hooks/use-reviews.ts (TanStack Query hooks for list, create, update,
  delete; invalidate the detail-page query on mutation success so the
  rating chip updates).

Stop and wait for the user to approve the plan.

Once approved, execute the plan.

Verification (run before claiming done):

Scripted (playwright + mongodb MCPs):
- Sign out. Open a property detail page. Assert the review section shows
  the rating summary (which may be "No ratings yet"), the login prompt,
  and NO list and NO form. Call /api/properties/:id/reviews via
  browser_evaluate fetch; assert 401.
- Sign in as the test user (not the admin). Open the same property. Submit
  a 5-star review with a 50-character comment. Assert the review appears in
  the list and the rating chip on the detail page updates. Via mongodb MCP,
  confirm averageRating is 5.0 and reviewCount is 1.
- Attempt to submit a second review on the same property. Assert 409 and
  the UI switches to the edit variant (the user's review is pinned and the
  form is pre-filled).
- Simulate the race: in the browser console via browser_run_code_unsafe,
  Promise.all two fetch POSTs with the same body to the same endpoint for
  a different property. Assert exactly one 201 and one 409. Via mongodb
  MCP, exactly one review document exists.
- Edit the review's rating from 5 to 3. Assert the detail-page rating chip
  updates. Via mongodb MCP, averageRating is 3.0 and reviewCount is still
  1.
- Open an admin session in a second browser context. Open the same
  property; the admin can see the other user's review but no edit or
  delete controls appear on it. Call PATCH /api/reviews/:id directly;
  assert 403.
- Delete the review as its author. Assert the list is now empty, the
  summary returns to "No ratings yet", averageRating and reviewCount are
  both 0.
- Reload the detail page and confirm the "No ratings yet" state persists
  across the viewCount increment.

Static:
- tsc, lint, getDiagnostics clean.
- No `any` in domain code.
- Grep: Review.deleteOne is never called without a prior ownership check.

Once every verification step passes:

1. Update memory.md:
   - Move "Current phase" to "Phase 6 — Admin Panel. Not started."
   - Record the exact phrasing used for the login prompt in the review
     section (so Phase 7 polish does not accidentally change it).
2. Create one commit: `git commit -m "feat: phase 5 reviews"`

Then STOP. Do not start Phase 6.
```

#### How to verify this phase manually

- As a guest: open a property, see the rating summary and the login prompt where the list would be.
- As a signed-in non-admin: write a review. The star rating is keyboard-operable (Tab in, arrow keys to pick, Enter to submit).
- Edit your review; the "edited" label appears. Delete it; the pinned block disappears and the summary returns to "No ratings yet".
- As an admin: open the same property; you can read reviews but you cannot edit or delete someone else's.

#### Common pitfalls for this phase

- Catching error 11000 and returning a 500. The code is the whole point of the unique index: translate it to the same `REVIEW_EXISTS` error as the pre-check hits.
- Letting the admin bypass the ownership check. BR-4 does not grant admins moderation. If the user asks for admin moderation later, that is a FUTURE item.
- Applying an incremental delta to `averageRating`. DATABASE.md section 8 forbids this. Always recompute via `recalcPropertyRating`.
- Returning the updated rating only from the PATCH response but not from the DELETE response. Both mutations need the updated pair so the UI never falls out of sync.

---

### Phase 6 — Admin Panel

#### Goal

The admin can run the portal: see the dashboard numbers, create, edit, publish, unpublish, and delete properties (with cascade), and view the registered users list.

#### Skills & MCPs for this phase

- `superpowers:writing-plans`, `superpowers:brainstorming` (for the admin shell layout), `superpowers:test-driven-development`.
- `mongodb` (MCP): verify the cascade delete before and after (reviews removed, favorites pulled).
- `cloudinary` (MCP): `search-assets` after an admin uploads property images, `delete-asset` as the manual cleanup step for assets left orphan by cascade delete (the schema does not store `public_id`, so the app code cannot delete them automatically).
- `playwright` (MCP): drive the full admin loop: dashboard → create → publish → edit → unpublish → delete.
- `shadcn-ui` (skill): `table`, `tabs`, `dialog`, `alert-dialog`, `badge`, `sheet` (mobile admin shell).
- `context7` (MCP): current Next.js parallel-route or route-group patterns if the admin shell uses one.
- `ponytail:ponytail` (skill): active; no AdminService class, no "CRUD operation" abstraction. The cascade delete is three Mongoose calls in a function.

#### Prerequisites

- Phases 0 through 5 complete.
- The seeded admin account can log in.

#### Copy-paste prompt for Claude Code

```text
You are starting Phase 6 (Admin Panel) of the Real Estate Portal.

Before writing any code, do the following in order:

1. Read CLAUDE.md in full.
2. Read memory.md in full. Confirm Phase 5 is logged complete.
3. Read docs/DEVELOPMENT-PLAN.md, "Phase 6 — Admin Panel" section.
4. Read docs/API.md sections 7 (admin property endpoints) and 8 (admin
   dashboard and users).
5. Read docs/PRODUCT-SPEC.md sections 4.6, 7.8, 7.9 and the admin rows of
   section 8.
6. Read docs/DATABASE.md section 9 (cascade delete flow).
7. Read docs/UI-UX-SPEC.md section 5 subsections for the admin shell,
   dashboard, properties table, property form, users table.

Enter Plan Mode. Invoke superpowers:writing-plans. Produce a plan containing:

- The content of lib/validations/admin.ts: adminPropertyCreate schema
  (title, description, type, price, bhk?, area, furnishing?, city,
  address, images (array of secure URLs, max 5), coverImage, contactPhone,
  contactWhatsApp). The schema REFUSES client-supplied status, viewCount,
  averageRating, reviewCount, createdBy. Separate adminPropertyUpdate
  schema with .partial() on the same shape minus the immutable fields.
- The content of lib/services/property.ts: deletePropertyCascade exactly as
  DATABASE.md section 9: findById → deleteMany reviews → updateMany pull
  favorites → findByIdAndDelete property → return counts { reviewsDeleted,
  usersUpdated }.
- The six admin route files:
    - GET /api/admin/properties (search, status filter, pagination; returns
      ALL statuses).
    - POST /api/admin/properties: force status "draft", set createdBy to
      the admin user id, strip protected fields.
    - PATCH /api/admin/properties/:id: strip protected fields, update,
      return the updated property.
    - POST /api/admin/properties/:id/publish: require images.length >= 1,
      otherwise fail with INCOMPLETE_PROPERTY.
    - POST /api/admin/properties/:id/unpublish: set status "draft",
      preserve reviews and favorites.
    - DELETE /api/admin/properties/:id: call deletePropertyCascade, return
      the counts.
- GET /api/admin/stats: totalProperties, totalUsers, totalFavorites via
  one aggregation on users ($unwind favorites, $count). Empty-collection
  guard: respond with 0 when there are no users.
- GET /api/admin/users: read-only; exclude password; compute
  favoritesCount via projection.
- app/admin/layout.tsx: admin shell (desktop sidebar, mobile top bar with a
  Sheet). Guarded by requireAdmin via middleware.
- app/admin/page.tsx: dashboard with stat cards and the most recent six
  properties table.
- app/admin/properties/page.tsx: table with search, status filter, row
  actions (edit, publish/unpublish, delete). Card layout below lg.
- app/admin/properties/new/page.tsx and app/admin/properties/[id]/edit/
  page.tsx: both wrap components/admin/property-form.tsx. The form uses
  fieldsets, conditional BHK (shown for Apartment/House/Villa, hidden AND
  cleared for Plot/Commercial), the Phase 4 ImageUpload component with
  cover selection and reordering.
- app/admin/users/page.tsx: users table, no mutation controls.
- components/admin/delete-property-dialog.tsx: AlertDialog that fetches the
  cascade preview counts (one GET to a dedicated preview endpoint, OR
  compute them client-side from already-loaded data; prefer the latter if
  the admin properties table already has reviewCount per row).

Stop and wait for the user to approve the plan.

Once approved, execute the plan.

Verification (run before claiming done):

Scripted (playwright + mongodb + cloudinary MCPs):
- Guest hits /admin: redirected to /login.
- Logged-in non-admin hits /admin: blocked. Call GET /api/admin/stats via
  fetch; assert 403. Call POST /api/admin/properties with a valid body;
  assert 403.
- Sign in as admin. Open /admin. Stats cards render finite numbers.
- Create a new property. Assert via mongodb MCP that status is "draft"
  even if the request body sent "published".
- Upload six images via the ImageUpload in the form. Assert the sixth is
  rejected client-side (not uploaded) with a visible message.
- Upload five valid images. After submit, call cloudinary MCP search-assets
  filtered to the property folder; confirm five secure URLs land there.
- Attempt to publish while the property has zero images (edit it to clear
  images first). Assert INCOMPLETE_PROPERTY with a useful message.
- Publish the property. Open /properties as a guest; the property appears.
- Unpublish the property. Open /properties as a guest; it disappears.
  Confirm via mongodb MCP that reviews and favorites referencing this
  property are UNCHANGED.
- As the test user (not admin), favorite this property, then write a
  review on it.
- As admin, delete the property. The confirmation dialog states the exact
  cascade counts (1 review, 1 favorited-user). After delete:
    - mongodb MCP: the property is gone.
    - mongodb MCP: the review on that property is gone.
    - mongodb MCP: the test user's favorites array no longer contains the
      property id.
    - The DELETE response body contains the counts.
- As a manual cleanup step: call cloudinary MCP search-assets for the five
  images uploaded above (they are now orphans). Call delete-asset for each.
  (This is a manual step; it is NOT wired into the delete endpoint. The
  locked schema stores URLs only, not public_ids, so automatic deletion is
  out of scope.)
- Open /admin/users. The test user is listed. No block, delete, or role-
  change control exists on the row.
- Create a Plot property. Assert the form hides BHK and that submitting
  clears any residual BHK value. Via mongodb MCP, confirm bhk is
  undefined / not present.

Static:
- tsc, lint, getDiagnostics clean.
- No `any` in domain code.
- Grep the admin routes for requireAdmin usage; every admin handler calls
  it exactly once.

Once every verification step passes:

1. Update memory.md:
   - Move "Current phase" to "Phase 7 — Polish. Not started."
   - Record the Cloudinary folder convention finalized for property
     images (e.g. `realestate/properties/<property-id>/`).
   - Record the admin shell layout choice (sidebar vs top-bar on mobile).
2. Create one commit: `git commit -m "feat: phase 6 admin panel"`

Then STOP. Do not start Phase 7.
```

#### How to verify this phase manually

- Log in as admin. The nav avatar menu offers "Admin" (or similar) that opens `/admin`.
- Create a property with five images, publish, open the public listing in a private window — the property appears.
- Unpublish; it disappears from the public listing. Re-publish; it returns.
- Delete a property with reviews and favorites; the confirmation dialog states the counts. After delete, open `/favorites` as the test user; the deleted property is gone with no error.
- `/admin/users` lists users as read-only.

#### Common pitfalls for this phase

- A client-side body that sets `status: "published"` on create. The server must force `"draft"`. Testing this is explicit — try it.
- Running the cascade delete inside a transaction and failing because Atlas rejects the write concern on the free tier. DATABASE.md section 9 says no transaction; the three steps are independently idempotent.
- Rendering a "Block user" button somewhere. The scope says no block flow. Not even a disabled placeholder.
- Admin editing someone else's review via the admin UI. Not a Phase 6 feature. Admin is a user, not a moderator (BR-4).

---

### Phase 7 — Polish

#### Goal

Every state handled, every breakpoint correct, accessibility baseline met. No new features.

#### Skills & MCPs for this phase

- `ponytail:ponytail-audit` (skill): one-shot whole-repo audit before polish; what to delete, what to simplify.
- `superpowers:verification-before-completion` (skill): evidence before assertion on every acceptance item.
- `playwright` (MCP): breakpoint checks at 375, 768, 1024, 1440; keyboard walks via `browser_press_key`; Lighthouse-via-browser_run_code_unsafe if needed.
- `simplify` (built-in skill): `/simplify` pass over the diff.
- `code-review` (built-in): `/code-review high` on the current diff.
- `security-review` (built-in): dry run before Phase 8.
- `ide` (MCP): `getDiagnostics` clean across all files.
- `anthropic-skills:ui-ux-pro-max` (skill): accessibility checklist, contrast validator.

#### Prerequisites

- Phases 0 through 6 complete. Every feature exists and works.

#### Copy-paste prompt for Claude Code

```text
You are starting Phase 7 (Polish) of the Real Estate Portal.

Before touching any file, do the following in order:

1. Read CLAUDE.md in full.
2. Read memory.md in full. Confirm Phase 6 is logged complete and every
   earlier phase's "Open questions" has been resolved.
3. Read docs/DEVELOPMENT-PLAN.md, "Phase 7 — Polish" section.
4. Read docs/UI-UX-SPEC.md sections 6 (cross-cutting states), 7 (responsive
   breakpoints), 8 (accessibility baseline).
5. Invoke ponytail:ponytail-audit on the entire repository. The audit
   produces a ranked list of what to delete, simplify, or replace with
   standard-library equivalents. Save the audit output into memory.md under
   a new "Phase 7 audit" subsection. Do not act on it blindly — you decide
   per item whether it is in Phase 7 scope.

Enter Plan Mode. Invoke superpowers:writing-plans. Produce a plan with
exactly these buckets:

Bucket 1 — States audit (per the UI-UX-SPEC section 6 table).
  For every data-driven surface, list its current loading, empty, and
  error states, and whether each is implemented. For every gap, name the
  file to touch and the fix in one line.

Bucket 2 — Responsive audit.
  For every page, note correctness at 375, 768, 1024, 1440 and list fixes.
  Specifically check: no horizontal scroll at any width; all touch targets
  >= 44x44 px; card heart is tappable without triggering the card nav.

Bucket 3 — Accessibility audit.
  For every page, record: focus-ring visibility, focus-return after dialog
  close, alt text on every image, aria-label on every icon-only button,
  text equivalent on every star rating, prefers-reduced-motion disables
  the hero animation, color contrast on amber on light.

Bucket 4 — Metadata and routing.
  Add error.tsx per route segment, a global not-found.tsx, loading.tsx
  where streaming helps, per-page metadata (title, description, Open Graph
  on the property detail page with the cover image).

Bucket 5 — Cleanup from the audit.
  Delete, don't just comment out: unused imports, unused dependencies,
  console.log calls, dead code, speculative abstractions the audit
  flagged.

Bucket 6 — Lighthouse.
  Run Lighthouse (via playwright + a local run or @lhci/cli invoked ad
  hoc) on home, listing, and detail. Everything below 90 on performance
  or accessibility is a fix item.

Stop and wait for the user to approve the plan.

Once approved, execute each bucket in order. For each file touched, run
tsc, lint, and ide getDiagnostics before moving on.

Verification (run before claiming done):

- Playwright breakpoint walk: for each of /, /properties, a detail page,
  /favorites, /profile, /admin, /admin/properties/new:
    * browser_resize to 375, 768, 1024, 1440 in turn.
    * browser_snapshot and visually confirm no horizontal scroll and no
      broken layout.
- Playwright keyboard walk: Tab through /register, /login, /properties with
  filters, a detail page, writing a review, admin property create.
  Every focusable element has a visible focus ring; focus returns to the
  trigger after each dialog closes.
- Playwright: emulate_media prefers-reduced-motion: reduce; load the home
  page; assert the hero animation is disabled.
- Playwright: on a property detail page, inspect <head>: title, description,
  og:title, og:description, og:image are all set.
- /simplify over the current diff. Apply fixes that remain in scope.
- /code-review high over the current diff. Address every CONFIRMED finding;
  park PLAUSIBLE findings in memory.md as a short list.
- /security-review as a dry run; address CONFIRMED findings only.
- tsc --noEmit clean. lint clean. No `any` in domain code (grep both
  `: any` and ` as any` under app/, components/, lib/, hooks/, models/,
  types/).
- Run Lighthouse on home, listing, detail. Performance >= 90 and
  Accessibility >= 90 on all three. If any score < 90, address the top
  three suggestions and re-run until it passes.
- Full manual walkthrough with the console open: no console.error, no
  unhandled rejections, no 404 or 500 responses in the Network tab under
  normal use.

Once every verification step passes:

1. Update memory.md:
   - Move "Current phase" to "Phase 8 — Deployment. Not started."
   - Move Phase 7 into "Last completed phase".
   - Record the Lighthouse scores for home, listing, and detail.
   - Record any PLAUSIBLE code-review findings parked for later.
2. Create one commit: `git commit -m "chore: phase 7 polish"`

Then STOP. Do not start Phase 8.
```

#### How to verify this phase manually

- Walk through the whole app with DevTools open: Console tab, Network tab. No red items in either.
- Shrink the window from 1440 to 375 slowly on each page. Nothing clips, nothing overflows.
- Tab through every page from a cold tab. Focus ring is visible on every stop.
- Right-click a shared property link in a Slack-like preview tester (or paste it into Discord/Slack locally); the title, description, and cover image render.
- Toggle "Reduce motion" in your OS and reload the home; the hero does not animate.

#### Common pitfalls for this phase

- Treating polish as "add one more small feature". Phase 7 is finishing, not expanding.
- Adding a dependency to "fix" Lighthouse — most 80s climb to 90s by removing unused dependencies and running `next/image` on every raster asset.
- Deleting a console.log that was actually a `console.error` doing useful logging in a catch block. Replace with structured logging in the catch (plain `console.error(err)` is acceptable for a portfolio project) rather than silencing it.
- Changing a user-facing copy string that Phase 5 pinned (e.g. the review-section login prompt). The exact phrasing was recorded in `memory.md`; preserve it.

---

### Phase 8 — Deployment

#### Goal

The application runs on Vercel against production MongoDB Atlas, Cloudinary, and Resend, with working email and images.

#### Skills & MCPs for this phase

- `superpowers:writing-plans`, `superpowers:verification-before-completion`.
- `resend` (MCP): `create-domain`, `verify-domain`, `get-domain`, `list-emails` for the production smoke test.
- `claude_ai_Gmail` (MCP) and `claude-in-chrome` (MCP): click the real verification link in the real inbox during the smoke test.
- `mongodb` (MCP): confirm the production database indexes exist and that the admin user seeded successfully. Fall back to `mongosh` if needed.
- `cloudinary` (MCP): confirm the production account's folder structure.
- `github` (MCP): `run_secret_scanning` on the repository before any push.
- `security-review` (built-in): final pass.
- `playwright` (MCP): the production smoke test flow.
- `ponytail:ponytail` (skill): active; no CI pipeline unless the user asks, no custom domain unless the user asks, no analytics unless the user asks.

#### Prerequisites

- Phases 0 through 7 complete.
- A Vercel account exists and is connected to the user's GitHub.
- The repository has a remote on GitHub.
- The user is ready to point `NEXT_PUBLIC_APP_URL` at the Vercel URL (or a custom domain they will provide).

#### Copy-paste prompt for Claude Code

```text
You are starting Phase 8 (Deployment) of the Real Estate Portal.

Before touching anything, do the following in order:

1. Read CLAUDE.md in full.
2. Read memory.md in full. Confirm Phase 7 is logged complete and all
   acceptance items passed.
3. Read docs/DEVELOPMENT-PLAN.md, "Phase 8 — Deployment" section.
4. Read docs/DATABASE.md section 1 (serverless connection caching). This
   is the single most load-bearing production concern.
5. Run github MCP run_secret_scanning on the repository. If any secret
   candidate is reported, STOP and tell the user — do not continue to
   deploy.

Enter Plan Mode. Invoke superpowers:writing-plans. Produce a plan with:

- Changes to next.config.ts: add the Cloudinary hostname
  `res.cloudinary.com` to images.remotePatterns.
- Content of a README.md: project name, stack, prerequisites, local setup
  commands, every environment variable with a one-line purpose, how to
  seed, how to deploy.
- The exact list of Vercel environment variables to add in Production AND
  Preview. Keys from CLAUDE.md section 6, values from the user. Flag any
  variable that must be rotated for production (JWT_SECRET MUST be new;
  the development secret stays local).
- The Atlas network access change: production uses `0.0.0.0/0` only if
  Vercel's egress IPs are not readily listable; otherwise restrict to
  Vercel's documented ranges. Create a distinct production database user
  with a distinct password.
- Resend production domain plan:
    * If the user has a domain: call resend MCP create-domain, then provide
      the DNS records to the user, then verify-domain once DNS is live.
    * If not: accept Resend's onboarding domain for now, DOCUMENT its
      sending limits in README.md.
- Deployment steps: push to main, wait for Vercel build to succeed, run
  the seed against the production database once.
- Smoke-test plan: register, verify, login, browse, favorite, review, and
  complete an admin create-publish-delete cycle, all against the
  production URL.

Stop and wait for the user to approve the plan.

Once approved, execute:

a. Patch next.config.ts to add res.cloudinary.com to images.remotePatterns.
b. Write README.md.
c. Rotate JWT_SECRET for production: generate a fresh random 32+ byte
   string. Share it with the user securely (do not paste it into chat
   logs; have the user copy it from a local file that is gitignored).
d. Create the Atlas production user and connection string. Share only via
   the user's env.
e. Create the Vercel project if it does not exist. Connect to the GitHub
   repository.
f. Add every environment variable to Vercel for Production and Preview.
   NEXT_PUBLIC_APP_URL in Production points at the Vercel URL (or the
   user's custom domain, when they bring one). In Preview, leave it as
   the Vercel preview URL pattern or omit if Vercel supplies a per-deploy
   value.
g. Via the resend MCP, set up the sending domain per the plan. Call
   get-domain until status is verified.
h. Trigger a deploy (push to main, or re-deploy from the Vercel UI).
   Wait for success. If the build fails, STOP and report.
i. Once the build is green, run the seed against production exactly once.
   Prefer: Vercel CLI env pull to .env.production.local, then
   `MONGODB_URI="<prod>" npm run seed` locally. Confirm via mongodb MCP
   that the admin user and the six sample properties exist in the
   production database.

Verification (production smoke test):

- Open the production URL in playwright. Register with a REAL inbox you
  can access.
- Via the resend MCP, list-emails filtered by that address; confirm the
  verification email was accepted and delivered.
- Via the Gmail MCP or claude-in-chrome, open the real inbox, click the
  verification link, confirm the account is verified.
- Log in; the session cookie carries Secure AND HttpOnly in production.
- Browse the listing. Filter. Favorite a property. Open the detail page
  and confirm images render via next/image (no `Error: Invalid src prop`).
- As the test user, write a review.
- Log in as the seeded admin. Create a property with five Cloudinary-
  hosted images. Publish. Confirm it appears publicly. Delete. Confirm
  the cascade.
- Trigger forgot-password with the test email. Reset the password via the
  real link. Log in with the new password.
- Repeat navigation across pages for 60 seconds. Via mongodb MCP, confirm
  the Atlas connection pool stays bounded (one or two active connections,
  not fifty). This is the serverless-cache sanity check.

If any step fails, STOP and report. Do not retry a failed deploy silently.

Once every verification step passes:

1. Update memory.md:
   - Move "Current phase" to "Deployed. No current phase."
   - Record the production URL, the Resend sending domain state (onboarding
     vs verified), the Atlas production database name, the Cloudinary
     production folder prefix.
   - Record any deployment gotchas encountered (e.g. "middleware edge
     runtime refused jsonwebtoken; swapped to jose for Edge path").
2. Create one commit: `git commit -m "chore: phase 8 deployment"`
3. If the user asked for a PR, open one via github MCP create_pull_request;
   otherwise push to main only when they ask.

Report:
- The production URL.
- The resend domain status.
- The Lighthouse scores against production (home, listing, detail).
- The commit SHA.

Then STOP. The MVP is live.
```

#### How to verify this phase manually

- Open the production URL in a private browser window. Register with your real email. The verification email arrives from the production sending address.
- Click the link; the page shows verified. Log in. DevTools → Application → Cookies: the session cookie shows `Secure: true` and `HttpOnly: true`.
- Browse, filter, favorite, review. No errors in the console.
- Log in as the admin, run through a full property create-publish-delete cycle. Images render through `next/image` (no "Invalid src prop" error).
- Trigger forgot-password; the reset email arrives. Reset. Log in with the new password.

#### Common pitfalls for this phase

- Reusing the development `JWT_SECRET` in production. Generate a fresh one. Keep both local and prod secrets out of git.
- Forgetting `res.cloudinary.com` in `images.remotePatterns`. Property images will throw at the Next.js image optimizer in production while working locally.
- Running the seed against production more than once with different content, hoping idempotence saves you. Idempotence covers duplicates, not drift. Run once, verify, move on.
- Pushing with a secret in a committed `.env` or `.env.production.local`. Run `github run_secret_scanning` before every push; if it fires, fix the leak and rotate before deploying.

---

## Section D — Cross-phase Rules

The following rules apply to every phase. A fresh session must respect them regardless of which phase prompt it is executing.

1. Enter Plan Mode first. Do not touch files until the plan is approved by the user. Phase prompts assume this is already a reflex.
2. Read `CLAUDE.md` and `memory.md` at the start of every session, in that order, before any code or any search.
3. Never install a dependency without asking first — even a transitive helper that "comes with" a component. Name the package, state its purpose, and wait.
4. Never change a LOCKED decision. The stack, schema, API surface, business rules, and page map in `docs/` are frozen. Discovering a contradiction between two documents stops the session; the user resolves it.
5. Never build from the FUTURE list in `docs/PRODUCT-SPEC.md` section 5. Not a field, not an endpoint, not a UI hook.
6. Do not touch `docs/`, `CLAUDE.md`, or `Build-playbook.md` during a phase. The only exception is `memory.md`, which must be updated at the end of every phase.
7. Confirm the MCPs a phase depends on are actually connected before trusting their results. If a dependency is missing (e.g. `mongodb` MCP timeout), use the stated fallback and record the fallback in `memory.md`.
8. Verify by running, not by reading. An acceptance criterion is met when it has been observed in the running app or in a database query, not inferred from the diff.
9. Commit at the end of every phase. Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`). Do not push unless the user asks.
10. If a command fails, stop and report. Never retry silently. Never bypass with `--no-verify`, `--force`, or `-c commit.gpgsign=false`.
11. Scope guard: before writing any code in a phase, read that phase's "What must NOT be done" list in `docs/DEVELOPMENT-PLAN.md`.
12. One component per file, named the same as the file. Reusable UI goes in `components/shared/`, not copied.
13. Every API input is validated with Zod and `safeParse`. Every response goes through `ok()` or `fail()`. Never a bare `NextResponse.json`. Validate ObjectIds before querying.
14. No `any` in domain code. `unknown` with a narrowing check is acceptable.
15. Every data-driven surface ships loading, empty, and error states — in the same session that writes the surface, not later.
16. Never swap `playwright` for `claude-in-chrome` mid-phase without updating the prompt — the two have different element-selection semantics and different session identities.
17. Report honestly. If a feature partially works, say so with the output. Do not describe a half-finished feature as done.

---

## Section E — Glossary

| Term | Definition |
|---|---|
| BHK | Bedrooms-Hall-Kitchen. The common Indian way of describing a property's bedroom count. Stored as an integer on Property, hidden in the UI for `Plot` and `Commercial` types. |
| Cascade delete | Deleting a property removes its reviews and pulls its id out of every user's `favorites` array. Implemented in `lib/services/property.ts` as three sequential Mongoose calls; no transaction. See `DATABASE.md` section 9. |
| Denormalized rating | `averageRating` and `reviewCount` stored on the Property document instead of computed on every read. Recomputed in full on every review create, update, or delete via `recalcPropertyRating`. See `DATABASE.md` section 8. |
| Draft / Published | Property status. Created as `draft`; invisible to the public. Flipped to `published` by an admin action; appears in listings. Unpublishing returns it to `draft` without touching reviews or favorites. |
| Zod | Runtime validation library used on every API input and shared with form resolvers. The source of truth for input shape; TypeScript types derive from the schemas via `z.infer`. |
| HTTP-only cookie | A cookie set with the `HttpOnly` attribute so `document.cookie` cannot read it from JavaScript. Used to carry the session JWT. In production also carries `Secure`. |
| Serverless connection caching | Caching the Mongoose connection and in-flight connect promise on `globalThis` so Vercel's warm-container reuse does not exhaust the Atlas connection pool. The pattern is in `DATABASE.md` section 1 and is non-optional. |
| Bento grid | The UI pattern used on the home page to show cities as unequal tiles. One large card plus smaller ones; degrades to a flat grid at narrow widths per UI-UX-SPEC section 5. |
| Stateless action token | A short-lived signed JWT carrying `sub` and `purpose` claims, used for email verification (`"verify-email"`, 24 h) and password reset (`"reset-password"`, 1 h). Nothing is stored in the database; see `DATABASE.md` section 10. |
| Plan Mode | A Claude Code mode where the model may read and reason but cannot write files or run commands with side effects until the user approves the plan. Every phase prompt enters it first. |
| Idempotent toggle | An operation whose repeated application yields the same result as a single application. Favorites use `$addToSet` and `$pull` which are naturally idempotent, so a double-tap on the heart does not create duplicates or error. |
| Rate limiting (in-memory LRU) | Phase 2's choice: a per-process LRU keyed on IP for login/register/forgot-password. Survives a single serverless instance only; the ponytail comment names the upgrade path (Upstash Redis) if abuse appears. |
| INR formatter | Pure helper in `lib/utils.ts` that formats a numeric `price` as Indian-grouping currency (e.g. 12,34,567). Used by the property card and detail page. |
