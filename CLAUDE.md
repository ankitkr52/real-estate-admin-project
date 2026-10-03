# CLAUDE.md — Real Estate Portal

Read this file and `memory.md` at the start of every session, before touching any code.

---

## 1. Project Overview

An admin-curated buy/sell property portal for the Indian market. Visitors browse quality-controlled listings and contact owners directly by phone or WhatsApp. Only an admin creates properties; registered users can favorite and review.

Built as a portfolio project, to production quality.

### Hard scope boundary

| In | Out |
|---|---|
| Buy / sell | Rentals |
| India, English, INR | Any other market or language |
| Admin-created listings | User-submitted listings |
| External contact (phone, WhatsApp) | Internal inquiry or messaging system |
| Instant reviews | Review moderation |
| Plain-text addresses | Maps, coordinates, geo search |

The FUTURE list in `docs/PRODUCT-SPEC.md` section 5 is not a backlog to work through. It is a list of things that must not be built. Nothing on it gets built without the user asking first — not a schema field, not an endpoint, not a "small" UI hook.

**Every decision in `docs/` is FROZEN.** Do not improve, modernize, or reconcile. If you find a genuine contradiction between two documents, stop and ask the user.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js, App Router, TypeScript | |
| Backend | Next.js API route handlers | No separate Express server |
| Styling | Tailwind CSS | Tokens only; no raw hex in components |
| Components, primary | shadcn/ui | Installed via CLI, owned in `components/ui/` |
| Components, secondary | Aceternity UI | Hero and rich motion only |
| Components, fallback | 21st.dev | Only when neither of the above covers it |
| Database | MongoDB Atlas + Mongoose | |
| Images | Cloudinary | Client-side unsigned upload; the API receives URLs |
| Email | Resend | Verification and password reset only |
| Validation | Zod | On every API input, shared with forms |
| Server state | TanStack Query | |
| Forms | React Hook Form + Zod resolver | |
| Auth | Custom JWT in an HTTP-only cookie, bcrypt | No NextAuth, no Auth.js, no Clerk |
| Deployment | Single Vercel project | |

This stack is locked. Do not swap a library for a "better" one.

---

## 3. Folder Structure

```
app/
  (public)/          public pages, shares the pill nav layout
    page.tsx                  home
    properties/               listing and detail
    favorites/                protected
    profile/                  protected
  (auth)/            login, register, verify-email, forgot-password, reset-password
  admin/             admin shell layout and pages
  api/               route handlers, mirroring docs/API.md
  layout.tsx
  globals.css        design tokens live here
components/
  ui/                shadcn-owned files. Restyle in place, never per call site.
  layout/            nav, footer, admin sidebar
  property/          card, grid, filters, gallery, skeletons
  review/            list, item, form, star rating and input
  admin/             stat cards, tables, property form
  shared/            empty state, error state, image upload, page header
lib/
  db.ts              cached Mongoose connection
  auth.ts            session helpers and guards
  token.ts           action tokens (verify, reset)
  response.ts        ok() and fail()
  rating.ts          recalcPropertyRating
  cloudinary.ts
  email.ts           Resend wrapper
  utils.ts           cn(), formatters
  constants.ts       CITIES, PROPERTY_TYPES, FURNISHING, SORT_OPTIONS
  validations/       Zod schemas, shared by API routes and forms
  services/          multi-step domain operations (cascade delete)
models/              User.ts, Property.ts, Review.ts
types/               shared TypeScript types
hooks/               custom React hooks
scripts/             seed.ts
docs/                the frozen specification
```

Rules:

- A file goes in `lib/` when it has no JSX. Components go in `components/`.
- Anything used by two or more features goes in `shared/`, not copied.
- One component per file, named the same as the file.

---

## 4. Coding Conventions

### TypeScript

- `strict: true`. Non-negotiable.
- **No `any` in domain code.** Model types, API payloads, and component props are all explicitly typed. `unknown` plus a narrowing check is acceptable; `any` is not.
- Prefer `type` for unions and props, `interface` for model documents.
- Derive types from Zod schemas rather than writing them twice: `type PropertyInput = z.infer<typeof propertySchema>`.
- No non-null assertions (`!`) on anything that comes from a query or a request. Handle the null case.

### API routes

Every handler follows the same shape:

```typescript
export async function POST(req: Request) {
  try {
    await connectDB();
    const session = await requireUser();              // or requireAdmin(), or omit for public

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    // ... work ...

    return ok({ thing });
  } catch (err) {
    return handleError(err);                          // logs, then returns a generic 500
  }
}
```

Non-negotiable:

- **Zod on every input.** Bodies, query strings, and route parameters. Use `safeParse`, never `parse`.
- **Every response goes through `ok()` or `fail()`.** Never a bare `NextResponse.json`.
- **Validate ObjectIds before querying.** An invalid id must return 400, never a 500 from Mongoose.
- **Never leak internals.** No stack traces, no Mongo error text in a response.
- **Never trust a client-sent `role`, `status`, `viewCount`, `averageRating`, or `reviewCount`.** Strip them.
- Query parameters are strings. Numeric filters use `z.coerce.number()`.

### Components

- Default to Server Components. Add `"use client"` only where interactivity, hooks, or browser APIs actually require it.
- Keep the client boundary as low in the tree as possible. A page should not become a client component because one button inside it needs state.
- Data fetching from the client goes through TanStack Query, never a bare `useEffect` with `fetch`.
- Every component that renders fetched data ships a matching skeleton, in the same file.
- Styling uses the design tokens. No raw hex values, no arbitrary `text-[13px]` outside the type scale.

### Naming

| Thing | Convention | Example |
|---|---|---|
| Component files | kebab-case | `property-card.tsx` |
| Components | PascalCase | `PropertyCard` |
| Hooks | `use-` prefix, kebab file | `use-property-filters.ts` |
| Utility functions | camelCase | `formatPrice` |
| Constants | SCREAMING_SNAKE | `CITIES`, `PROPERTY_TYPES` |
| Types and interfaces | PascalCase, no `I` prefix except on Mongoose documents | `PropertyCardProps`, `IProperty` |
| API route folders | kebab-case matching the URL | `app/api/forgot-password/` |

### Errors

- Every `async` operation that can fail is handled. No unhandled rejections.
- User-facing messages are plain and actionable. "Something went wrong" is the last resort, not the default.
- Log the real error server-side with context (route, user id if known) before returning a generic message.

---

## 5. Component Priority Rule

```
Need a component
  |
  +-- shadcn/ui has it?          -> npx shadcn@latest add <name>, restyle with tokens
  +-- Is it the hero or motion?  -> Aceternity
  +-- 21st.dev has it?           -> use it, note the choice in memory.md
  +-- None of the above          -> build it with Tailwind
```

Never install a fourth component library without asking. shadcn components are owned files — edit them in place rather than overriding them at every call site.

---

## 6. Environment Variables

Every variable lives in `.env.local` locally and in the Vercel dashboard in production. `.env.local` is gitignored and never committed. `.env.example` lists every name with no real values.

| Variable | Purpose | Used in | Shape |
|---|---|---|---|
| `MONGODB_URI` | Atlas connection string | `lib/db.ts` | `mongodb+srv://user:pass@cluster.mongodb.net/realestate` |
| `JWT_SECRET` | Signs session cookies and action tokens | `lib/auth.ts`, `lib/token.ts` | Random 32+ byte string. Different in production. |
| `NEXT_PUBLIC_APP_URL` | Base URL for email links and share links | `lib/email.ts`, share buttons | `http://localhost:3000` locally, the Vercel URL in production |
| `RESEND_API_KEY` | Resend authentication | `lib/email.ts` | `re_...` |
| `EMAIL_FROM` | Sender address | `lib/email.ts` | `noreply@yourdomain.com` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account | `lib/cloudinary.ts` | |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Client-side upload target | `ImageUpload` | Same value, exposed to the browser |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Unsigned upload preset | `ImageUpload` | |
| `CLOUDINARY_API_KEY` | Server-side Cloudinary calls | `lib/cloudinary.ts` | |
| `CLOUDINARY_API_SECRET` | Server-side Cloudinary calls | `lib/cloudinary.ts` | **Never** prefixed `NEXT_PUBLIC_` |
| `SEED_ADMIN_EMAIL` | Admin account created by the seed | `scripts/seed.ts` | |
| `SEED_ADMIN_PASSWORD` | Admin password for the seed | `scripts/seed.ts` | Never hardcoded in the repository |

Rule: only values safe to expose publicly carry the `NEXT_PUBLIC_` prefix. Everything with `SECRET`, `KEY`, or a password in it does not.

---

## 7. Commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server on port 3000 |
| `npm run build` | Production build. Run before considering a phase done. |
| `npm run start` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type check without emitting. Run before every commit. |
| `npm run seed` | Create the admin user and sample properties. Idempotent. |
| `npx shadcn@latest add <name>` | Add a shadcn component |

---

## 8. Git Conventions

**Branches:** `phase-<n>-<slug>` (`phase-3-public-browsing`) for phase work, `fix/<slug>` for fixes.

**Commits:** Conventional Commits.

```
feat(properties): add city and price range filters
fix(auth): reject login when the email is unverified
docs(memory): record phase 3 completion
chore(deps): add framer-motion for the hero
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `chore`.

Rules:

- Commit at the end of each phase at minimum, and at meaningful checkpoints within a phase.
- Never commit `.env.local` or any credential.
- Do not commit commented-out code or leftover `console.log`.
- Commit or push only when the user asks.

---

## 9. Definition of Done — per feature

- [ ] Behavior matches the acceptance criteria in `docs/PRODUCT-SPEC.md`, including the negative cases.
- [ ] Every API input is validated with Zod.
- [ ] Every response uses the standard shape.
- [ ] Auth and role guards match the permission matrix.
- [ ] Loading, empty, and error states exist for every data-driven surface.
- [ ] Correct at 375px, 768px, and 1440px.
- [ ] Keyboard-accessible, with visible focus and labelled icon-only buttons.
- [ ] `npx tsc --noEmit` clean; `npm run lint` clean; no `any` in domain code.
- [ ] No console errors in a normal walkthrough.
- [ ] Nothing from the FUTURE list snuck in.
- [ ] `memory.md` updated.

---

## 10. Session Rules

1. **Read `memory.md` first**, every session, before any code. It tells you the current phase and what the last session decided.
2. **Update `memory.md` after completing a phase.** Move the phase forward, log decisions with the date and the reason, and note anything the next session needs. A phase is not complete until this is done.
3. **Never install a dependency without asking.** This includes transitive helpers that "come with" a component. Name the package, say what it is for, and wait for an answer.
4. **Never change a LOCKED decision.** The stack, schema, API surface, business rules, and page map in `docs/` are frozen.
5. **Never build from the FUTURE list.** Not even a field, a flag, or a hook "for later".
6. **Ask, do not reconcile.** If two documents contradict each other, stop and ask. Silently picking one is how a spec rots.
7. **Follow the phase plan in order.** Do not start the next phase before the current one's acceptance criteria all pass. Read that phase's "What must NOT be done" list before starting it.
8. **Verify by running, not by reading.** An acceptance criterion is met when it has been observed in the running app.
9. **No code in a documentation session**, and no documentation rewrites in a code session, unless asked.
10. **Report honestly.** If something does not work, say so with the output. Do not describe a partially working feature as done.

---

## 11. Where to Look

| Question | Document |
|---|---|
| What are we building, and for whom? | `docs/PRODUCT-SPEC.md` sections 1 to 4 |
| Who is allowed to do what? | `docs/PRODUCT-SPEC.md` section 3, permission matrix |
| Is this feature in scope? | `docs/PRODUCT-SPEC.md` section 5, FUTURE list |
| What should this feature do exactly? | `docs/PRODUCT-SPEC.md` section 7, acceptance criteria |
| What about this weird input? | `docs/PRODUCT-SPEC.md` section 8, edge cases |
| What fields does this model have? | `docs/DATABASE.md` sections 3 to 5 |
| Which indexes exist and why? | `docs/DATABASE.md` section 6 |
| Why is this data shaped this way? | `docs/DATABASE.md` section 7 |
| How does the rating stay correct? | `docs/DATABASE.md` section 8 |
| What happens when a property is deleted? | `docs/DATABASE.md` section 9 |
| What does this endpoint accept and return? | `docs/API.md` sections 3 to 8 |
| What error code applies here? | `docs/API.md` section 9 |
| What color, size, or spacing? | `docs/UI-UX-SPEC.md` section 1 |
| Which component library? | `docs/UI-UX-SPEC.md` section 2 |
| What goes on this page? | `docs/UI-UX-SPEC.md` section 5 |
| What should this empty or error state say? | `docs/UI-UX-SPEC.md` section 6 |
| What am I building right now? | `memory.md`, then `docs/DEVELOPMENT-PLAN.md` |
