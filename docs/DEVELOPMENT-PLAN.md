# Development Plan — Real Estate Portal

## How to use this plan

Phases run in order. Each phase has a goal, the files it touches, a task checklist, acceptance criteria, and an explicit list of what must **not** be done in it.

### The phase gate rule

A phase is finished when every acceptance criterion passes. Do not start the next phase before then. The "What must NOT be done" list exists because the natural instinct mid-phase is to reach forward — building the review UI while writing the property page, or wiring the admin form while building models. That is how half-finished features accumulate and how a build stalls at 80% in five places at once.

### After every phase

1. Verify every acceptance criterion by actually running the app, not by reading the code.
2. Update `memory.md`: move the current phase forward, log any decisions made, record anything the next session needs.
3. Commit.

### Dependencies

Phases 1 and 2 are strictly sequential. Phases 3 through 6 all depend on 1 and 2, and are otherwise fairly independent, but the recommended order stays as written because each builds UI patterns the next reuses.

---

## Phase 0 — Project Initialization

**Goal.** A running Next.js application with the styling system, component library, folder structure, and environment template in place. No features.

**Files affected.**

```
package.json
tsconfig.json
next.config.ts
tailwind.config.ts
components.json
.env.example
.env.local                (not committed)
.gitignore
app/layout.tsx
app/page.tsx
app/globals.css
lib/utils.ts
lib/constants.ts
```

**Tasks.**

- [ ] `npx create-next-app@latest` with TypeScript, Tailwind, App Router, ESLint, and the `@/*` import alias.
- [ ] Set `strict: true` in `tsconfig.json`, and enable `noUncheckedIndexedAccess`.
- [ ] Initialize shadcn/ui: `npx shadcn@latest init`.
- [ ] Install the baseline shadcn components: button, input, label, select, form, card, badge, skeleton, dialog, alert-dialog, dropdown-menu, sheet, sonner, avatar, textarea, carousel, table, tabs.
- [ ] Define the color, radius, and typography tokens from UI-UX-SPEC section 1 in `app/globals.css` and map them into `tailwind.config.ts`.
- [ ] Load the display and body fonts through `next/font`.
- [ ] Create the folder structure below with `.gitkeep` where needed.
- [ ] Write `lib/constants.ts` with `CITIES`, `PROPERTY_TYPES`, `FURNISHING`, `SORT_OPTIONS`, all `as const`.
- [ ] Write `.env.example` with every variable name and no real values.
- [ ] Confirm `.env.local` is gitignored.
- [ ] Verify the dev server boots and a token-styled test button renders correctly.

**Folder structure.**

```
app/
  (public)/            route group: public pages, shares the pill nav layout
  (auth)/              route group: login, register, verify, forgot, reset
  admin/               admin shell layout
  api/                 route handlers
  layout.tsx
  globals.css
components/
  ui/                  shadcn-owned files
  layout/              nav, footer, admin sidebar
  property/            card, grid, filters, gallery, skeletons
  review/              list, item, form, star input
  admin/               stat cards, tables, property form
  shared/              empty state, error state, page header
lib/
  db.ts                cached Mongoose connection
  auth.ts              session helpers, guards
  token.ts             action tokens
  response.ts          ok() and fail()
  rating.ts            recalcPropertyRating
  cloudinary.ts
  email.ts             Resend wrapper
  utils.ts             cn(), formatters
  constants.ts
  validations/         Zod schemas, shared by API and forms
models/
  User.ts
  Property.ts
  Review.ts
types/
  index.ts
scripts/
  seed.ts
hooks/
docs/
```

**Acceptance criteria.**

- [ ] `npm run dev` starts with no errors or warnings.
- [ ] `npm run build` completes.
- [ ] A shadcn Button renders using the project's tokens, not shadcn defaults.
- [ ] Both fonts load without a flash of unstyled text.
- [ ] `.env.example` lists every variable that CLAUDE.md names.
- [ ] `tsc --noEmit` is clean.

**What must NOT be done in this phase.**

- No database connection and no models.
- No API routes.
- No page beyond a placeholder home.
- No auth.
- No dependency beyond what the tasks above name, without asking.

---

## Phase 1 — Database Layer

**Goal.** Three models with correct types, defaults, enums, and indexes, a cached connection that survives serverless, and an idempotent seed script.

**Files affected.**

```
lib/db.ts
models/User.ts
models/Property.ts
models/Review.ts
types/index.ts
lib/rating.ts
scripts/seed.ts
package.json            (seed script entry)
```

**Tasks.**

- [ ] Write `lib/db.ts` with the `globalThis` connection and promise cache from DATABASE.md section 1.
- [ ] Create the MongoDB Atlas cluster and a database user; put the URI in `.env.local`.
- [ ] Write `models/User.ts`: fields exactly as DATABASE.md section 3, `password` with `select: false`, the bcrypt `pre("save")` hook guarded by `isModified("password")`, `timestamps: true`.
- [ ] Write `models/Property.ts` exactly as section 4, including all defaults and the 5-image validator.
- [ ] Write `models/Review.ts` exactly as section 5.
- [ ] Declare every index from the Index Summary on its model.
- [ ] Guard every model export with `mongoose.models.X ?? mongoose.model(...)`.
- [ ] Write `lib/rating.ts` with `recalcPropertyRating`, including the empty-aggregation guard.
- [ ] Write `scripts/seed.ts`: idempotent admin upsert plus sample properties, `syncIndexes()`, clean exit codes.
- [ ] Add `"seed": "tsx scripts/seed.ts"` to `package.json`.
- [ ] Run the seed and confirm the documents and indexes in Atlas.

**Acceptance criteria.**

- [ ] `npm run seed` completes, and running it a second time creates no duplicates.
- [ ] The admin user exists with `role: "admin"` and `isEmailVerified: true`.
- [ ] The admin's password is a bcrypt hash, not plaintext.
- [ ] Every index from the Index Summary is present in Atlas, and `{ property: 1, user: 1 }` shows as unique.
- [ ] Inserting two reviews with the same property and user pair fails with error 11000.
- [ ] Sample properties exist in both draft and published status.
- [ ] `recalcPropertyRating` on a property with no reviews sets both fields to 0 without throwing.
- [ ] Hot reload in development does not produce an OverwriteModelError.

**What must NOT be done in this phase.**

- No API routes.
- No UI.
- No auth logic beyond the password hashing hook.
- No Cloudinary and no Resend.

---

## Phase 2 — Authentication

**Goal.** A complete auth system: register, verify, login, logout, forgot, reset, session cookie, route guards.

**Files affected.**

```
lib/auth.ts
lib/token.ts
lib/response.ts
lib/email.ts
lib/validations/auth.ts
middleware.ts
app/api/auth/register/route.ts
app/api/auth/verify-email/route.ts
app/api/auth/login/route.ts
app/api/auth/logout/route.ts
app/api/auth/forgot-password/route.ts
app/api/auth/reset-password/route.ts
app/api/auth/me/route.ts
app/(auth)/login/page.tsx
app/(auth)/register/page.tsx
app/(auth)/verify-email/page.tsx
app/(auth)/forgot-password/page.tsx
app/(auth)/reset-password/page.tsx
components/layout/nav.tsx
hooks/use-auth.ts
```

**Tasks.**

- [ ] Write `lib/response.ts` with `ok()` and `fail()`. Every handler from here on returns through these.
- [ ] Write `lib/token.ts` with `createActionToken` and `verifyActionToken`, including the `purpose` check.
- [ ] Write `lib/auth.ts`: sign and verify the session JWT, set and clear the cookie, and the `getSession`, `requireUser`, `requireAdmin` guards.
- [ ] Set up Resend and write `lib/email.ts` with `sendVerificationEmail` and `sendPasswordResetEmail`.
- [ ] Write the Zod schemas in `lib/validations/auth.ts`, shared by the routes and the forms.
- [ ] Implement all seven auth routes exactly as API.md section 3.
- [ ] Write `middleware.ts` guarding `/favorites`, `/profile`, and `/admin/*` with a `?next=` redirect.
- [ ] Build the five auth pages with React Hook Form plus the Zod resolver and the states from UI-UX-SPEC 5.4 through 5.8.
- [ ] Wire TanStack Query: a `useAuth` hook backed by `GET /api/auth/me`, invalidated on login and logout.
- [ ] Wire the nav's auth-aware right slot: Login for guests, avatar dropdown for signed-in users.
- [ ] Add rate limiting to login, register, and forgot-password.

**Acceptance criteria.**

Every criterion in PRODUCT-SPEC sections 7.1, 7.2, and 7.3 passes, plus:

- [ ] A registration email actually arrives and its link verifies the account.
- [ ] Login before verification is refused with the distinct message.
- [ ] An unknown email and a wrong password return the identical error.
- [ ] `forgot-password` returns the same response for registered and unregistered addresses.
- [ ] The session cookie is HttpOnly and is not readable from `document.cookie`.
- [ ] Visiting `/profile` while logged out redirects to `/login?next=/profile`, and logging in lands back on `/profile`.
- [ ] A verification token cannot be used as a reset token.
- [ ] An expired token produces the expired state, not a generic error.
- [ ] Logging out clears the cookie and the nav returns to its guest state.

**What must NOT be done in this phase.**

- No property browsing, no property pages.
- No favorites or reviews.
- No admin panel. `requireAdmin` is written here but nothing calls it yet.
- No Cloudinary — avatar upload is Phase 4.
- No email beyond verification and reset. Notifications are on the FUTURE list.

---

## Phase 3 — Public Browsing

**Goal.** Guests can find and open properties. The listing with all filters, sort, and pagination, plus the detail page.

**Files affected.**

```
lib/validations/property.ts
app/api/properties/route.ts
app/api/properties/[id]/route.ts
app/(public)/page.tsx                         home
app/(public)/properties/page.tsx
app/(public)/properties/[id]/page.tsx
components/property/property-card.tsx
components/property/property-card-skeleton.tsx
components/property/property-grid.tsx
components/property/property-filters.tsx
components/property/property-sort.tsx
components/property/property-gallery.tsx
components/property/pagination.tsx
components/layout/footer.tsx
components/shared/empty-state.tsx
components/shared/error-state.tsx
hooks/use-property-filters.ts
```

**Tasks.**

- [ ] Write the `propertyFilters` Zod schema with coercion and both `.refine` range checks.
- [ ] Implement `GET /api/properties`: forced published filter, every query filter, three sorts, pagination with a real total.
- [ ] Implement `GET /api/properties/:id`: ObjectId validation, published-only, atomic `$inc` on `viewCount`, `isFavorited` when a session exists.
- [ ] Build `PropertyCard` to the anatomy in UI-UX-SPEC 3.3, with its matching skeleton.
- [ ] Build the filter bar: horizontal on desktop, bottom Sheet on mobile, with an applied-count badge.
- [ ] Write `use-property-filters` so the URL query string is the single source of truth, debounced at 400ms.
- [ ] Build active filter chips with individual removal and a clear-all.
- [ ] Build pagination, preserving every filter and the sort.
- [ ] Build the detail page: gallery carousel, title block, price, description, details table, contact card, share buttons.
- [ ] Build the sticky desktop contact card and the fixed mobile bottom bar.
- [ ] Build the home page: Aceternity hero, city bento grid, newest six properties, CTA banner.
- [ ] Build the footer.
- [ ] Wire loading, empty, and error states on every surface.

**Acceptance criteria.**

Every criterion in PRODUCT-SPEC sections 7.4 and 7.5 passes, plus:

- [ ] A draft property is not in any listing and its URL returns 404.
- [ ] Applying every filter at once returns the correct intersection.
- [ ] Copying the filtered URL into a new tab reproduces the same results.
- [ ] The back button steps correctly through filter changes.
- [ ] A zero-result filter shows the empty state with a working clear-all.
- [ ] `viewCount` increments by exactly one per detail page load.
- [ ] BHK is absent from the UI for Plot and Commercial.
- [ ] Furnishing is omitted entirely when unset, not rendered as "N/A".
- [ ] The rating chip is visible to guests when `reviewCount > 0`, and absent at 0.
- [ ] The WhatsApp link opens with a pre-filled message containing the property link.
- [ ] Card skeletons match the real card's dimensions with no layout shift.
- [ ] The grid is 3 / 2 / 1 across breakpoints and the bento grid degrades as specified.

**What must NOT be done in this phase.**

- The favorite heart renders but is **not** wired. It prompts login for guests and does nothing else yet. Phase 4 wires it.
- No reviews section yet. Leave the space; Phase 5 fills it.
- No admin routes.
- No "similar properties", no "recently viewed" — both on the FUTURE list.

---

## Phase 4 — User Features

**Goal.** Favorites work end to end, and the profile is editable including a Cloudinary avatar.

**Files affected.**

```
lib/cloudinary.ts
lib/validations/user.ts
app/api/user/profile/route.ts
app/api/user/favorites/route.ts
app/api/user/favorites/[propertyId]/route.ts
app/(public)/favorites/page.tsx
app/(public)/profile/page.tsx
components/property/favorite-button.tsx
components/shared/image-upload.tsx
hooks/use-favorites.ts
```

**Tasks.**

- [ ] Set up the Cloudinary account, an unsigned upload preset, and `lib/cloudinary.ts`.
- [ ] Implement `GET /api/user/favorites`, filtering out deleted and unpublished properties.
- [ ] Implement `POST` and `DELETE /api/user/favorites/:propertyId` with `$addToSet` and `$pull`.
- [ ] Implement `PATCH /api/user/profile`, stripping every non-editable field.
- [ ] Wire the favorite button: optimistic toggle, rollback with a toast on failure, login prompt for guests.
- [ ] Build `/favorites` with its grid, empty state, and slide-out removal.
- [ ] Build `/profile` with the avatar uploader, name, phone, and a read-only email.
- [ ] Build the reusable `ImageUpload` component — Phase 6's property form reuses it.
- [ ] Make the nav avatar update from the query cache immediately after a profile save.

**Acceptance criteria.**

Every criterion in PRODUCT-SPEC section 7.6 passes, plus:

- [ ] Favoriting the same property twice creates no duplicate and returns success.
- [ ] Unfavoriting something not favorited succeeds.
- [ ] The favorite state is correct on a fresh page load, driven by `isFavorited`.
- [ ] A guest tapping the heart is prompted to log in and no favorite is written.
- [ ] A favorited property that was deleted does not appear in `/favorites` and causes no error.
- [ ] A favorited property that was unpublished disappears from the list and returns if republished.
- [ ] An avatar upload lands on Cloudinary and the URL persists to the user document.
- [ ] A failed avatar upload reverts the preview and persists nothing.
- [ ] A non-image or oversized file is rejected client-side before any upload starts.
- [ ] `email`, `role`, and `isEmailVerified` cannot be changed through the profile endpoint even when sent explicitly.

**What must NOT be done in this phase.**

- No reviews.
- No admin surfaces.
- No inquiry history — there are no inquiries (BR-8).
- No saved searches.

---

## Phase 5 — Reviews

**Goal.** Full review CRUD with the login gate, the unique constraint, and correct denormalized rating maintenance.

**Files affected.**

```
lib/validations/review.ts
app/api/properties/[id]/reviews/route.ts
app/api/reviews/[id]/route.ts
components/review/review-section.tsx
components/review/review-list.tsx
components/review/review-item.tsx
components/review/review-form.tsx
components/review/star-rating.tsx
components/review/star-input.tsx
components/review/review-skeleton.tsx
hooks/use-reviews.ts
```

**Tasks.**

- [ ] Write the review Zod schema: integer rating 1 to 5, trimmed comment 5 to 1000.
- [ ] Implement `GET /api/properties/:id/reviews` with auth required, pagination, populated authors, `isOwn`, and `myReview`.
- [ ] Implement `POST`, with the pre-check **and** the 11000 catch, both producing `REVIEW_EXISTS`.
- [ ] Implement `PATCH` and `DELETE` with ownership checks that do not exempt admin.
- [ ] Call `recalcPropertyRating` after every create, update, and delete.
- [ ] Return the updated `averageRating` and `reviewCount` from every mutation so the UI updates without a refetch.
- [ ] Build the three role variants of the review section from UI-UX-SPEC 5.3.
- [ ] Build the star display and the interactive star input, both keyboard-accessible.
- [ ] Build the review form with edit mode, and delete behind an AlertDialog.
- [ ] Pin the user's own review to the top of the list.

**Acceptance criteria.**

Every criterion in PRODUCT-SPEC section 7.7 passes, plus:

- [ ] A guest sees the rating summary and the login prompt, and neither the list nor the form.
- [ ] A guest calling the reviews API directly receives 401.
- [ ] A second review attempt returns 409 and the UI switches to edit.
- [ ] Two simultaneous create requests result in exactly one review, the second returning 409 rather than a 500.
- [ ] Creating, editing, and deleting a review each update `averageRating` and `reviewCount` correctly.
- [ ] Deleting the last review sets `averageRating` to 0 and `reviewCount` to 0.
- [ ] `averageRating` is correct to one decimal place, verified by hand against the reviews.
- [ ] Editing another user's review returns 403, including as an admin.
- [ ] The rating shown on the listing card matches the detail page after a review changes.
- [ ] The star input is operable by keyboard and announces its value to a screen reader.

**What must NOT be done in this phase.**

- No moderation, no approval queue, no reporting or flagging (FUTURE).
- No admin review management.
- No review notification emails.
- No review helpfulness voting.

---

## Phase 6 — Admin Panel

**Goal.** The admin can run the portal: see the numbers, create, edit, publish, unpublish, and delete properties, and view registered users.

**Files affected.**

```
lib/validations/admin.ts
app/api/admin/properties/route.ts
app/api/admin/properties/[id]/route.ts
app/api/admin/properties/[id]/publish/route.ts
app/api/admin/properties/[id]/unpublish/route.ts
app/api/admin/stats/route.ts
app/api/admin/users/route.ts
app/admin/layout.tsx
app/admin/page.tsx
app/admin/properties/page.tsx
app/admin/properties/new/page.tsx
app/admin/properties/[id]/edit/page.tsx
app/admin/users/page.tsx
components/admin/admin-sidebar.tsx
components/admin/stat-card.tsx
components/admin/property-table.tsx
components/admin/property-form.tsx
components/admin/user-table.tsx
components/admin/delete-property-dialog.tsx
lib/services/property.ts                     cascade delete
```

**Tasks.**

- [ ] Build the admin layout shell: desktop sidebar, mobile top bar with a Sheet.
- [ ] Implement `GET /api/admin/properties` returning all statuses, with search and filters.
- [ ] Implement `POST /api/admin/properties`, forcing `status: "draft"` and setting `createdBy`.
- [ ] Implement `PATCH /api/admin/properties/:id`, stripping the protected fields.
- [ ] Implement publish and unpublish, with the `INCOMPLETE_PROPERTY` guard on publish.
- [ ] Implement the cascade delete in `lib/services/property.ts` and wire `DELETE`, returning the counts.
- [ ] Implement `GET /api/admin/stats`, including the favorites aggregation with its empty guard.
- [ ] Implement `GET /api/admin/users`, read-only, excluding `password` and returning only `favoritesCount`.
- [ ] Build the dashboard with stat cards and the recent-properties table.
- [ ] Build the property table with search, status filter, row actions, and card layout under `lg`.
- [ ] Build the property form with fieldsets, conditional BHK, and the image uploader with cover selection and reordering.
- [ ] Build the delete dialog stating the exact cascade counts.
- [ ] Build the users table with no actions column.

**Acceptance criteria.**

Every criterion in PRODUCT-SPEC sections 7.8 and 7.9 passes, plus:

- [ ] A logged-out visitor hitting `/admin` is redirected to login.
- [ ] A logged-in non-admin hitting `/admin` is blocked, and every `/api/admin/*` call returns 403.
- [ ] A created property is always a draft, even when the request body says `published`.
- [ ] A sixth image is rejected before upload.
- [ ] Publishing without images returns `INCOMPLETE_PROPERTY` with a useful message.
- [ ] Publishing makes the property appear publicly; unpublishing removes it.
- [ ] Unpublishing leaves reviews and favorites intact.
- [ ] Deleting a property with reviews and favorites removes the property, removes all its reviews, and pulls it from every user's favorites, with correct counts in the response.
- [ ] The dashboard's total favorites matches a manual sum of the favorites arrays.
- [ ] Stats render 0 correctly on an empty database rather than throwing.
- [ ] The users list exposes no control that mutates a user.
- [ ] The BHK field is removed from the DOM, and its value cleared, when the type is Plot or Commercial.

**What must NOT be done in this phase.**

- No block or unblock, no user deletion, no role editing (FUTURE).
- No admin review moderation.
- No bulk actions and no CSV export.
- No analytics charts. The stats are numbers.

---

## Phase 7 — Polish

**Goal.** Every state is handled, every breakpoint is correct, and the accessibility baseline is met. No new features.

**Files affected.** Any component needing a state, a responsive fix, or an accessibility fix. No new routes and no new endpoints.

**Tasks.**

- [ ] Audit every data surface for loading, empty, and error states against the table in UI-UX-SPEC section 6. Fill every gap.
- [ ] Replace any remaining spinner-on-blank-page with a layout-matching skeleton.
- [ ] Verify every empty state has an icon, a sentence, and an action.
- [ ] Add `error.tsx` per route segment and a global `not-found.tsx`.
- [ ] Test every page at 375px, 768px, 1024px, and 1440px.
- [ ] Confirm no horizontal scroll at any width.
- [ ] Confirm all touch targets are at least 44x44px, including the card heart.
- [ ] Complete the share buttons: clipboard copy with a confirmation toast, and WhatsApp share with a pre-filled message.
- [ ] Keyboard-walk every flow: register, login, filter, favorite, review, admin create.
- [ ] Verify focus rings are visible everywhere and that focus returns correctly after dialogs close.
- [ ] Add alt text to every image, in the specified form.
- [ ] Check contrast, paying attention to amber on light backgrounds.
- [ ] Add `aria-label` to every icon-only button and a text equivalent to every star rating.
- [ ] Verify `prefers-reduced-motion` disables the hero animation.
- [ ] Add `metadata` per page: title, description, and Open Graph tags on the property detail page so a shared link previews well.
- [ ] Add `loading.tsx` where a route segment benefits from streaming.
- [ ] Run Lighthouse on home, listing, and detail; fix anything below 90 on performance or accessibility.
- [ ] Remove every `console.log` and every unused import and dependency.
- [ ] Confirm `tsc --noEmit` and `npm run lint` are both clean.

**Acceptance criteria.**

- [ ] No surface can reach a blank or broken state through normal use.
- [ ] Every page is correct at all four test widths.
- [ ] Every flow completes by keyboard alone.
- [ ] Lighthouse accessibility is 90 or above on all three key pages.
- [ ] A shared property link previews with its title, description, and cover image.
- [ ] No console errors or unhandled rejections during a full walkthrough.
- [ ] Zero TypeScript errors and zero lint warnings.
- [ ] No `any` remains in domain code.

**What must NOT be done in this phase.**

- No new features. Polish means finishing what exists.
- No refactor for its own sake. Fix what is broken.
- No new dependency without asking.
- Nothing from the FUTURE list, however tempting it looks now that the app works.

---

## Phase 8 — Deployment

**Goal.** The application runs on Vercel against production MongoDB Atlas, Cloudinary, and Resend, with working email and images.

**Files affected.**

```
.env.example                 final
next.config.ts               image domains
README.md                    setup instructions
vercel.json                  only if actually needed
```

**Tasks.**

- [ ] Add the Cloudinary hostname to `images.remotePatterns` in `next.config.ts`.
- [ ] Restrict Atlas network access appropriately and create a production database user with a distinct password.
- [ ] Create the Vercel project and connect the repository.
- [ ] Add every environment variable in the Vercel dashboard for Production and Preview.
- [ ] Generate a fresh production `JWT_SECRET`. Never reuse the development one.
- [ ] Set `NEXT_PUBLIC_APP_URL` to the production URL so email links point at production, not localhost.
- [ ] Verify the Resend sending domain, or accept the onboarding domain's limits and document that.
- [ ] Deploy, then run the seed against the production database once to create the admin.
- [ ] Smoke-test in production: register, receive the verification email, verify, log in, browse, filter, favorite, review, and complete an admin create-publish-delete cycle.
- [ ] Confirm the session cookie is `Secure` in production.
- [ ] Write the README: what the project is, the stack, local setup, the environment variables, and how to seed.
- [ ] Record the production URL and any deployment gotchas in `memory.md`.

**Acceptance criteria.**

- [ ] The production build succeeds on Vercel with no errors.
- [ ] Every page loads in production.
- [ ] Registration in production delivers a real email whose link verifies the account.
- [ ] Password reset works end to end in production.
- [ ] Cloudinary images render through `next/image` without a remote-pattern error.
- [ ] The admin can log in and complete a full property lifecycle.
- [ ] The session cookie carries `Secure` and `HttpOnly`.
- [ ] No environment variable is committed to the repository.
- [ ] A cold start does not exhaust the Atlas connection pool under repeated navigation.
- [ ] The README lets someone else run the project locally from a clean clone.

**What must NOT be done in this phase.**

- No feature work.
- No custom domain unless the user asks.
- No analytics, monitoring, or error-tracking service without asking.
- No CI pipeline unless the user asks.

---

## Phase Dependency Graph

```
Phase 0  Init
   |
Phase 1  Database  (needs 0)
   |
Phase 2  Auth      (needs 1 for User, 0 for UI primitives)
   |
   +--> Phase 3  Public browsing   (needs 1 for Property; 2 only for the optional session read)
   |        |
   |        +--> Phase 4  User features  (needs 3's card and detail page, and 2's session)
   |        |
   |        +--> Phase 5  Reviews        (needs 3's detail page and 2's session)
   |
   +--> Phase 6  Admin              (needs 1, 2, and 3's form patterns; 5 for cascade testing)
            |
Phase 7  Polish       (needs everything)
            |
Phase 8  Deployment   (needs 7)
```

Phases 4, 5, and 6 can technically be reordered. The written order is recommended because Phase 4 builds the `ImageUpload` component that Phase 6's property form reuses, and Phase 5 creates the review data that makes Phase 6's cascade delete testable with real data.

---

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Serverless connection exhaustion on Atlas | 500s under load or after repeated cold starts | The `globalThis` connection cache in `lib/db.ts` is not optional. Verify it in Phase 1 and re-verify in production in Phase 8. |
| Cloudinary upload path chosen late | Rework of two forms, in Phases 4 and 6 | Decide once in Phase 4: unsigned client-side upload preset. Build `ImageUpload` as reusable from the start; Phase 6 must not write a second uploader. |
| Resend deliverability from an unverified domain | Verification emails land in spam, blocking every login in production | Verify a sending domain in Phase 8, or document the onboarding-domain limits. Test with a real inbox, not just a Resend dashboard log. |
| Rating denormalization drift | Listing cards show stale or wrong ratings, with no error to notice | Always recompute from source, never incrementally. Keep `scripts/rebuild-ratings.ts` available. |
| Duplicate review race | A 500 leaking a Mongo error instead of a clean 409 | The unique index is the real guard. The 11000 catch is mandatory, not defensive decoration. |
| Filter state drifting from the URL | Broken back button, unshareable results, duplicate sources of truth | The URL is the only source of truth for filters. No parallel React state. |
| `next/image` remote pattern missing | Every property image breaks in production while working locally | Configure the Cloudinary hostname in Phase 0 or Phase 4, not at deploy time. |
| Scope creep from the FUTURE list | An unfinished MVP with three half-built extras | Every phase names what must not be done. Read it before starting the phase, not after. |
