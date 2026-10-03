# UI / UX Specification — Real Estate Portal

Status: FROZEN. The palette direction, component priority rule, and page map are locked.

---

## 1. Design Language

### 1.1 Direction

High-contrast, minimal, confident. Deep navy and teal as the structural color, amber/gold as the single accent, white and off-white for content sections. Rounded corners everywhere. Generous whitespace between sections. Large headlines paired with small muted eyebrow labels.

The design should read as a considered product, not a template. The most common failure mode here is a generic Tailwind page: uniform card shadows, evenly-sized grid cells, one text size for everything. The defenses against that are the asymmetric bento grid, the framed hero, and the deliberate type scale below.

### 1.2 Color tokens

Defined as CSS custom properties in `app/globals.css` and mapped into the Tailwind theme. Never write a raw hex value in a component.

| Token | Role | Value |
|---|---|---|
| `--background` | Page background | `#FFFFFF` |
| `--surface` | Off-white section background, alternates with `--background` | `#F7F6F3` |
| `--foreground` | Primary text | `#0B1F2A` |
| `--muted-foreground` | Eyebrow labels, secondary text, metadata | `#5C6B73` |
| `--primary` | Deep navy. Buttons, dark sections, nav pill. | `#0B1F2A` |
| `--primary-foreground` | Text on primary | `#FFFFFF` |
| `--secondary` | Teal. Structural accents, badges, hover states. | `#14565A` |
| `--accent` | Amber/gold. The single attention color. | `#D9A441` |
| `--accent-foreground` | Text on accent | `#0B1F2A` |
| `--border` | Hairline borders | `#E5E3DE` |
| `--destructive` | Delete actions, error states | `#B42318` |
| `--success` | Published badge, confirmations | `#15803D` |

Usage discipline:

- `--accent` is the scarcest resource on the page. One amber element per viewport. Typically the primary CTA or the active state. If two amber things compete, one of them is wrong.
- Dark sections use `--primary` as background with `--primary-foreground` text. The hero frame and the pre-footer CTA banner are the two dark sections.
- Status badges: draft uses `--muted-foreground` on a neutral chip; published uses `--success`.

Dark mode is out of scope for the MVP. Define the tokens so adding it later is a second `:root` block rather than a refactor, but do not build a theme toggle.

### 1.3 Typography scale

Two families: a display font for headlines, a neutral sans for everything else. Load both through `next/font` so there is no layout shift.

| Step | Use | Size / line-height | Weight | Tracking |
|---|---|---|---|---|
| `display` | Hero headline only | `clamp(2.75rem, 6vw, 4.5rem)` / 1.05 | 600 | `-0.03em` |
| `h1` | Page titles | `clamp(2rem, 4vw, 3rem)` / 1.1 | 600 | `-0.02em` |
| `h2` | Section headings | `clamp(1.5rem, 3vw, 2.25rem)` / 1.2 | 600 | `-0.02em` |
| `h3` | Card titles, subsections | `1.25rem` / 1.3 | 600 | `-0.01em` |
| `body` | Default text | `1rem` / 1.6 | 400 | `0` |
| `small` | Metadata, helper text | `0.875rem` / 1.5 | 400 | `0` |
| `eyebrow` | Label above a section heading | `0.75rem` / 1 | 500 | `0.12em`, uppercase, `--muted-foreground` |
| `price` | Price figures | `1.5rem` / 1.2 | 600 | `-0.01em`, tabular numerals |

Rules:

- Headlines are at most 2 lines. If a headline wraps to 3, it is too long — shorten the copy, do not shrink the type.
- Body text maxes out at roughly 70 characters per line. Property descriptions get `max-w-prose`.
- Prices use `font-variant-numeric: tabular-nums` so a column of prices aligns.
- Price formatting is Indian: `new Intl.NumberFormat("en-IN")`, and figures of one lakh or more are abbreviated on cards (`Rs 85 L`, `Rs 1.2 Cr`) while the detail page shows the full number.

### 1.4 Spacing scale

Tailwind's default scale, restricted to these steps so rhythm stays consistent: `2, 3, 4, 6, 8, 12, 16, 20, 24, 32`.

| Context | Spacing |
|---|---|
| Section vertical padding, desktop | `py-24` |
| Section vertical padding, mobile | `py-16` |
| Grid gutter, property cards | `gap-6` desktop, `gap-4` mobile |
| Card internal padding | `p-5` |
| Form field vertical gap | `space-y-4` |
| Page container | `max-w-[1280px] mx-auto px-4 md:px-8` |
| Text-heavy container (detail page body) | `max-w-[720px]` |

### 1.5 Radius scale

Rounded corners are part of the shape language. Nothing is square.

| Token | Value | Applied to |
|---|---|---|
| `--radius-sm` | `8px` | Inputs, badges, small chips |
| `--radius-md` | `12px` | Buttons, dropdowns, dialogs |
| `--radius-lg` | `20px` | Cards, image containers |
| `--radius-xl` | `32px` | Hero frame, bento tiles, CTA banner |
| `--radius-full` | `9999px` | Nav pill, circular arrow buttons, avatars |

### 1.6 Elevation

Shadows are restrained. Depth comes from the radius and from background contrast, not from drop shadows.

| Level | Use |
|---|---|
| none | Default for cards at rest — a `1px --border` hairline instead |
| `shadow-sm` | Card hover |
| `shadow-md` | Floating nav pill, dropdown menus |
| `shadow-lg` | Dialogs and sheets only |

### 1.7 Motion

- Default transition: `150ms ease-out` for color and border, `200ms ease-out` for transform.
- Card hover: image scales to `1.03` inside a clipped container, card lifts by 2px. Nothing else moves.
- Motion beyond hover and focus lives in the hero only. Aceternity handles it there.
- Respect `prefers-reduced-motion`: all non-essential animation collapses to opacity or to nothing.

---

## 2. Component Priority Rule

Locked order. Follow it in sequence, and stop at the first level that covers the need.

| Priority | Source | Use for |
|---|---|---|
| 1 | **shadcn/ui** | Everything structural: button, input, select, dialog, sheet, dropdown, form, table, badge, skeleton, toast, tabs, avatar, pagination, carousel |
| 2 | **Aceternity UI** | The hero section and rich motion only. This is the section that most benefits from gradient and motion effects. |
| 3 | **21st.dev** | Fallback only, when neither of the above covers the need |

### Decision procedure

```
Need a component
  |
  +-- Does shadcn/ui have it?           -> YES: install via CLI, own the file, restyle with tokens
  |                                        (npx shadcn@latest add <component>)
  +-- Is it the hero, or rich motion?   -> YES: Aceternity
  |
  +-- Does 21st.dev have it?            -> YES: use it, and note the choice in memory.md
  |
  +-- None of the above                 -> Build it with Tailwind. Do not install a new
                                           component library without asking the user.
```

Notes:

- shadcn components are **installed, not imported**. The files land in `components/ui/` and belong to this project. Restyle them in place to match the tokens above rather than fighting them with utility overrides at each call site.
- Do not restyle a shadcn primitive per-usage. If the button needs an amber variant, add a variant to the button file once.
- Aceternity components are copied in and typically depend on `framer-motion`. That dependency arrives with the hero and is not a general-purpose license to animate the rest of the app.
- Never install a component library that is not one of these three without asking.

---

## 3. Design Analysis Notes

Extracted from the reference designs. Take the **structural grammar**, not the exact look. These are the patterns that give the page its character; the palette and typography above give it its identity.

### 3.1 Framed hero

The hero is not full-bleed. It is a large rounded container (`--radius-xl`) inset from the page edges with a margin, holding a background image with a dark overlay. This framing is the single most identity-defining decision on the page — it immediately separates the design from the default full-width hero.

Structure, back to front:

```
+-------------------------------------------------------------+
|  [ inset margin, page background visible around the frame ]  |
|  +-------------------------------------------------------+  |
|  |  rounded-[32px] | image + navy overlay                 |  |
|  |                                                        |  |
|  |     [ floating pill nav, overlaid at the top ]          |  |
|  |                                                        |  |
|  |     eyebrow label                                       |  |
|  |     Large headline, two lines maximum                   |  |
|  |     One short line of supporting text                   |  |
|  |     [ primary CTA with a circular arrow icon ]          |  |
|  |                                                        |  |
|  |                       [ stat badge ]  [ stat badge ]   |  |
|  +-------------------------------------------------------+  |
+-------------------------------------------------------------+
```

- Headline: 2 lines maximum, `display` step.
- Subtext: one sentence, `--muted-foreground` lightened for the dark background.
- Exactly **one** CTA. It carries an icon-arrow. There is no secondary button competing with it.
- Stat badges ("500+ Properties", "50+ Cities") are small translucent pills overlaid near the lower edge of the frame, offset rather than centered. They are decorative credibility markers; the numbers come from `--stat` constants, not from a live query.
- Built with Aceternity. This is the one place gradient and motion effects are welcome.

### 3.2 Floating pill nav

A `rounded-full` bar with a translucent background and a backdrop blur, sitting **inside** the hero frame on the home page and pinned to the top on every other page.

```
( logo )        properties   favorites   about        [ CTA button ]
```

- Logo left, links center, action right.
- Over the hero, it is translucent with light text. On other pages it is solid with `--foreground` text and a hairline border.
- On scroll past the hero, it becomes solid and sticky.
- Mobile: the pill collapses to logo plus a hamburger, which opens a shadcn Sheet from the right.
- The right-hand action is "Login" for guests and an avatar dropdown (Favorites, Profile, Admin if admin, Logout) for signed-in users.

### 3.3 Property card anatomy

The unit that repeats most in the product. Get this right first.

```
+-----------------------------------+
|  [ status badge ]                 |   <- top-left, absolute, over the image
|                                   |
|          property image           |   <- rounded top, 4:3, object-cover,
|                                   |      scales 1.03 on hover inside clip
|                       [ heart ]   |   <- top-right, absolute, favorite toggle
+-----------------------------------+
|  MUMBAI, ANDHERI WEST             |   <- eyebrow: location, above the title
|  3 BHK Apartment in Lokhandwala   |   <- h3, clamped to 2 lines
|  1,450 sq ft  ·  Semi-Furnished   |   <- small, muted, metadata row
|                                   |
|  Rs 1.2 Cr              ( -> )    |   <- price left, circular arrow CTA right
+-----------------------------------+
```

Rules:

- Location sits **above** the title as an eyebrow. This is the reference's ordering and it is deliberate: in real estate, place is read before description.
- The circular arrow button is the card's visual signature. `--radius-full`, bordered at rest, filling with `--primary` on card hover.
- The whole card is one link. The heart and the arrow are inside it, so the heart must stop event propagation.
- The status badge shows only on admin surfaces. Public listings are all published, so a "Published" badge there is noise.
- BHK is omitted from the title for Plot and Commercial.
- Rating renders as a small star chip only when `reviewCount > 0`. It is visible to guests (BR-14).
- Cards in a row must be equal height. The metadata row stays pinned to the bottom via `mt-auto` regardless of title length.

### 3.4 Asymmetric bento grid — Browse by City

Used on the home page. Tiles are deliberately **not** equal-sized; that asymmetry is what stops the section reading as a generic card grid.

Desktop (12 columns, 2 rows):

```
+---------------------------+-------------+-------------+
|                           |             |             |
|                           |   Delhi     |  Bengaluru  |
|          Mumbai           |             |             |
|        (large tile)       +-------------+-------------+
|                           |             |             |
|                           |    Pune     |  Hyderabad  |
|                           |             |             |
+---------------------------+-------------+-------------+
   col-span-6, row-span-2      col-span-3    col-span-3
```

Tablet: the large tile takes the full width, the remaining four go 2x2.
Mobile: a single column, with the large tile first and the rest at a shorter height.

Each tile: city image, navy gradient scrim from the bottom, city name in white bottom-left, property count beneath it in a lighter weight. Tiles link to `/properties?city=<name>`. The city list and images come from the `CITIES` constant (BR-13).

### 3.5 Full-bleed dark CTA banner

Sits immediately before the footer on the home page. This is the one full-width dark block — the hero being framed rather than full-bleed makes this contrast work.

- Background `--primary`, edge to edge, inner content constrained to the page container.
- Bold two-line headline, centered or left-aligned with the input to the right.
- One input plus one amber button. The input is decorative in the MVP — there is no newsletter feature — so it should be framed as a search that routes to `/properties?city=...`, not as an email capture that goes nowhere.
- Generous vertical padding, `py-24` minimum.

### 3.6 Section rhythm

Every content section follows the same vertical pattern, which is what makes the page feel composed rather than assembled:

```
eyebrow label           (small, uppercase, muted)
Section heading         (h2, at most 2 lines)
Optional one-line lead  (body, muted, max 60ch)
[ 48px gap ]
content
```

Backgrounds alternate `--background` and `--surface` between consecutive sections so the boundaries read without needing dividers.

---

## 4. Shared Layout

### Navigation

| Context | Behavior |
|---|---|
| Home | Floating pill inside the hero frame, translucent, light text |
| Other public pages | Solid pill pinned to the top, hairline border below |
| Scrolled past hero | Sticky, solid, `shadow-md` |
| Admin pages | Separate admin shell: fixed sidebar on desktop, top bar with a Sheet trigger on mobile |
| Mobile | Logo plus hamburger, Sheet from the right |

### Footer

Four columns on desktop, stacked on mobile: brand and one-line description, quick links, popular cities (from `CITIES`), contact. A thin legal line beneath. Background `--primary`, muted text.

### Admin shell

Sidebar links: Dashboard, Properties, Users. The active item takes an amber left border and a `--surface` background. The admin shell does not use the public pill nav — the visual break makes it obvious which side of the product you are on.

---

## 5. Page Specs

Shared conventions: every list surface has loading, empty, and error states. Loading means skeletons matching the real layout, never a centered spinner. Errors show a message plus a retry action, never a blank page.

---

### 5.1 `/` — Home

**Purpose.** Establish credibility in one screen and route visitors into the listing, either by city or by browsing the newest properties.

**Sections.**

1. Hero — framed, with the floating nav, headline, subtext, single CTA to `/properties`, and stat badges.
2. Browse by City — eyebrow + h2, then the asymmetric bento grid (section 3.4).
3. Newest Properties — eyebrow + h2, a 3-column grid of the 6 newest published properties, with a "View all" link to `/properties`.
4. CTA banner — full-bleed dark, before the footer.

**Key components.** Aceternity hero, `CityBentoGrid`, `PropertyCard`, shadcn Button.

**Data required.** `GET /api/properties?limit=6&sort=newest`. Cities come from the `CITIES` constant, not from an API call.

**States.**

| State | Treatment |
|---|---|
| Loading | Hero renders immediately (it is static). Six card skeletons in the properties grid. The bento grid is static and never skeletons. |
| Empty | If zero published properties exist: replace the grid with "New listings coming soon" and keep the CTA. Never show an empty grid. |
| Error | The properties section shows an inline error with retry. The rest of the page still renders — a failed fetch must not blank the home page. |

**Responsive.** Hero frame margin shrinks from `2rem` to `1rem` on mobile; headline drops to the `h1` step. Properties grid 3 / 2 / 1 columns. Bento grid as described in 3.4.

---

### 5.2 `/properties` — Listing

**Purpose.** Let a visitor narrow a large set to the few properties worth opening, without losing their filters on reload or when sharing the URL.

**Sections.**

1. Compact page header: h1 plus a result count ("48 properties in Mumbai").
2. Filter bar — desktop: a sticky horizontal bar. Mobile: a "Filters" button opening a shadcn Sheet from the bottom, with an applied-count badge.
3. Sort dropdown, right-aligned, on the same row as the result count.
4. Active filter chips, each individually removable, plus a "Clear all".
5. Property grid, 3 columns desktop.
6. Pagination beneath the grid.

**Filter controls.**

| Filter | Control |
|---|---|
| City | Select, options from `CITIES` |
| Type | Select, 5 options |
| Price range | Two number inputs, min and max, in INR |
| BHK | Segmented control: 1, 2, 3, 4, 5+ |
| Area | Two number inputs, in sq ft |
| Furnishing | Select, 3 options |

**URL is the source of truth.** Every filter, the sort, and the page live in the query string. The component reads `useSearchParams` and writes with `router.push`. Reloading or sharing the URL reproduces the exact view. Do not hold filter state only in React state — it breaks the back button and makes results unshareable.

Filter inputs are debounced at 400ms before the URL is written, so typing in a price field does not fire a request per keystroke.

**Data required.** `GET /api/properties` with every query parameter. TanStack Query keyed on the full parameter object, with `keepPreviousData` so the grid does not flash empty while the next page loads.

**States.**

| State | Treatment |
|---|---|
| Loading, first load | 12 card skeletons in the grid layout |
| Loading, filter change | Previous results dim to 60% opacity with the grid intact; no layout shift |
| Empty | Centered: "No properties match these filters", a "Clear all filters" button, plus the 3 nearest-match suggestions if any (same city, filters relaxed) |
| Error | Inline error card with retry; the filter bar stays interactive |

**Responsive.** Grid 3 / 2 / 1. Filter bar becomes a bottom Sheet under `md`. Sort stays visible on mobile as a compact icon-dropdown. Pagination becomes prev/next plus "Page 2 of 7" on mobile.

---

### 5.3 `/properties/:id` — Property Detail

**Purpose.** Give a buyer everything needed to decide to call, then make calling a single tap.

**Layout.** Two columns on desktop: content left (roughly 8 of 12), a sticky contact card right (4 of 12). Single column on mobile, with a fixed bottom contact bar.

**Sections.**

1. Breadcrumb: Home / Properties / City / Title.
2. Title block: eyebrow location, h1 title, then a metadata row with type, BHK, area, furnishing, view count, and the rating chip.
3. Image gallery — a shadcn Carousel, up to 5 images, with thumbnail strip on desktop and swipe plus dots on mobile. Cover image first.
4. Price block: full INR figure, `price` type step.
5. Description, `max-w-[720px]`.
6. Details table: type, BHK, area, furnishing, city, address. Rows for absent optional fields are omitted entirely, not rendered as "N/A".
7. Contact card (sticky on desktop): a "Call" button with the phone number and a "WhatsApp" button opening `https://wa.me/91<number>?text=<encoded message>`.
8. Share row: copy link, WhatsApp share.
9. Favorite toggle.
10. Reviews section.

**Reviews section by role.**

| Viewer | Sees |
|---|---|
| Guest | The rating summary (average plus count) and a bordered prompt: "Log in to read and write reviews", with a Login button. **No review list, no form.** |
| Logged-in, no review yet | Rating summary, the review list, and a write form with a star input plus a textarea |
| Logged-in, already reviewed | Rating summary, the review list with their own review pinned first and carrying edit and delete controls. The write form is replaced by "You reviewed this property". |

**Data required.** `GET /api/properties/:id` for the property and `isFavorited`. `GET /api/properties/:id/reviews` only when a session exists — do not fire it for guests and swallow a 401.

**States.**

| State | Treatment |
|---|---|
| Loading | Skeleton mirroring the real layout: gallery block, title lines, sticky card outline |
| Not found / draft | A 404 page with a link back to `/properties` |
| Reviews loading | Three review skeletons |
| Reviews empty, logged-in | "No reviews yet. Be the first." above the form |
| Favorite toggle failure | Optimistic state reverts and a toast explains why |
| Image fails to load | Fall back to a neutral placeholder; never a broken image icon |

**Responsive.** Under `lg` the contact card moves out of the sidebar into a fixed bottom bar with two buttons, Call and WhatsApp, side by side. The gallery becomes full-bleed swipeable. The details table becomes stacked label/value pairs.

---

### 5.4 `/login`

**Purpose.** Get a returning user in, in two fields.

**Sections.** Centered card, `max-w-[420px]`: logo, h2 "Welcome back", email and password fields, a "Forgot password?" link right-aligned above the password field, submit button, and a link to `/register`.

**Key components.** shadcn Form, Input, Button. React Hook Form with the shared Zod resolver.

**States.**

| State | Treatment |
|---|---|
| Loading | Button shows a spinner and is disabled; fields lock |
| Invalid credentials | A form-level error above the fields. Both inputs keep their values. |
| Email not verified | A distinct amber notice with a "Resend verification email" action, not a generic red error |
| Rate limited | An error naming the wait, with the button disabled |

**Responsive.** The card is full-width with `px-4` below `sm`.

---

### 5.5 `/register`

**Purpose.** Create an account and send the user to their inbox.

**Sections.** Same centered card. Fields: name, email, phone, password. Below the password, live validation hints (length met / not met). Submit, then a link to `/login`.

**Success behavior.** Do **not** redirect to login. Replace the form in place with a confirmation panel: "Check your email", the address it went to, and a "Resend" action. The user's next step is in their inbox, and a redirect loses that context.

**States.**

| State | Treatment |
|---|---|
| Loading | Button spinner, fields disabled |
| Email taken | Field-level error on the email input with a link to log in |
| Validation | Inline per field, on blur, not on every keystroke |
| Email send failed | Still shows the success panel, with a note that the email may be delayed plus the Resend action |

---

### 5.6 `/verify-email`

**Purpose.** Consume the `?token=` parameter and report the result.

**Sections.** A centered status card with one of four states. There is no form and no user input.

| State | Treatment |
|---|---|
| Verifying | Spinner, "Verifying your email..." |
| Success | Check icon, "Email verified", a "Continue to login" button |
| Expired | "This link has expired", with a "Send a new link" form taking just the email |
| Invalid / missing token | "This link is not valid", with links to register or log in |

**Data required.** `POST /api/auth/verify-email` with the token from the query string, fired once on mount. Guard against double-firing under React Strict Mode, or the second call will report a confusing failure.

---

### 5.7 `/forgot-password`

**Purpose.** Send a reset link.

**Sections.** Centered card, one email field, submit, and a link back to `/login`.

**Success behavior.** Always show the same confirmation regardless of whether the account exists (API section 3). Never reveal that an email is unregistered.

**States.** Loading spinner on the button; validation error for a malformed email; a generic confirmation panel on success.

---

### 5.8 `/reset-password`

**Purpose.** Set a new password from a token.

**Sections.** Centered card, new password and confirm password fields with a strength hint, submit.

**States.**

| State | Treatment |
|---|---|
| Missing or invalid token | The form never renders. Show the failure state plus a link to `/forgot-password`. Validate before rendering the form so the user does not fill it in for nothing. |
| Loading | Button spinner |
| Mismatch | Field-level error on confirm, validated with a Zod `.refine` |
| Success | Confirmation panel plus a "Go to login" button. Do not auto-login — the session model is cookie-based and reset does not issue one. |

---

### 5.9 `/favorites` — protected

**Purpose.** The user's saved shortlist.

**Sections.** h1 "Your favorites" with a count, then the same property grid as `/properties`. No filters, no sort, no pagination — it is a bounded personal list.

**Data required.** `GET /api/user/favorites`.

**States.**

| State | Treatment |
|---|---|
| Loading | Six card skeletons |
| Empty | Illustration or icon, "You have not saved any properties yet", and a "Browse properties" button |
| Unfavorite from this page | Optimistic removal with a slide-out; on failure the card returns and a toast explains |
| Not logged in | Middleware redirects to `/login?next=/favorites` before the page renders |

**Responsive.** Grid 3 / 2 / 1.

---

### 5.10 `/profile` — protected

**Purpose.** Edit the three editable fields.

**Sections.** h1 "Profile", then a form card: avatar upload with a circular preview and a "Change photo" button, name, phone, and a read-only email field with a "verified" badge and a tooltip explaining it cannot be changed.

**Avatar flow.** Select file → client-side validation (type is an image, size under 2MB) → upload directly to Cloudinary → on success `PATCH /api/user/profile` with the returned URL. The preview updates optimistically from a local object URL, and reverts if the upload fails.

**Data required.** `GET /api/auth/me` to populate; `PATCH /api/user/profile` to save.

**States.**

| State | Treatment |
|---|---|
| Loading | Skeletons in the field positions |
| Saving | Button spinner, fields disabled |
| Uploading avatar | Progress overlay on the avatar circle |
| Upload failed | Preview reverts, toast explains, the rest of the form keeps its values |
| Saved | Success toast; the nav avatar updates immediately from the query cache |

**Responsive.** Single column under `md`, avatar centered above the fields.

---

### 5.11 `/admin` — Dashboard

**Purpose.** Answer "what is the state of the portal" in one glance, and route to the work.

**Sections.**

1. h1 "Dashboard" with a greeting.
2. Stat cards: Total Properties (with a published / draft split), Total Users, Total Favorites.
3. Quick actions: "Add property" primary button, "View all properties".
4. Recent properties table, the 5 newest across all statuses, with status badges.

**Data required.** `GET /api/admin/stats`, `GET /api/admin/properties?limit=5&sort=newest`.

**States.** Stat card skeletons while loading. Zero values render as "0" — that is real information here, not an empty state. Errors surface per card so one failed query does not blank the dashboard.

**Responsive.** Stat cards 3 / 2 / 1. The recent table becomes a stacked list under `md`.

---

### 5.12 `/admin/properties` — Property Table

**Purpose.** Find any property, in any status, and act on it.

**Sections.** Header with h1 and an "Add property" button. A toolbar with a title search, a status filter (All / Draft / Published), and a city filter. Then the table, then pagination.

**Table columns.** Thumbnail, Title (with city beneath), Type, Price, Status badge, Views, Created, Actions.

**Actions per row.** A dropdown menu: Edit, Publish or Unpublish (whichever applies), Delete.

**Delete confirmation.** A shadcn AlertDialog naming the property and stating exactly what the cascade will do: "This will also delete N reviews and remove it from M users' favorites." Confirm is destructive-styled. Never delete on a single click.

**Data required.** `GET /api/admin/properties` with filters; the publish, unpublish, and delete endpoints on action.

**States.**

| State | Treatment |
|---|---|
| Loading | Eight skeleton rows |
| Empty, no properties at all | "No properties yet" with a prominent "Add your first property" |
| Empty, filtered | "No properties match" plus a clear-filters action |
| Mutating a row | That row dims and its actions disable; the rest of the table stays usable |
| Publish blocked (no images) | The error toast states the reason and offers "Edit to add images" |

**Responsive.** Under `lg` the table becomes cards: thumbnail, title, status, and an actions menu. Do not horizontally scroll a wide table on mobile.

---

### 5.13 `/admin/properties/new` — Create

**Purpose.** Create a complete, publishable listing in one form.

**Sections.** Grouped into fieldsets, which keeps a long form legible:

1. Basics — title, type, description
2. Pricing and size — price, area, BHK (hidden when the type is Plot or Commercial), furnishing
3. Location — city select, address textarea
4. Images — uploader, max 5, with drag-to-reorder and a "set as cover" control
5. Contact — contact phone, contact WhatsApp, with a "same as phone" checkbox

Footer actions: "Save as draft" (primary) and "Cancel". There is no "Save and publish" here — creation always produces a draft (BR-2), and publishing is a separate deliberate act from the table.

**Image uploader.** Drag and drop plus click to select. Each file validates on the client (image type, under 5MB) before uploading to Cloudinary. Thumbnails show upload progress. The first image becomes the cover by default; the cover carries a badge. The sixth file is rejected at selection time, before any upload begins.

**Conditional fields.** When type is Plot or Commercial, the BHK field is removed from the DOM, not merely disabled, and any value already entered is cleared so a stale BHK is not submitted.

**Data required.** `POST /api/admin/properties`. `CITIES`, `PROPERTY_TYPES`, and `FURNISHING` come from constants.

**States.**

| State | Treatment |
|---|---|
| Saving | Button spinner, the whole form disabled |
| Validation errors | Field-level, and the page scrolls to the first error |
| Upload in progress | Submit is disabled until every upload settles |
| Server validation failure | Field errors from the response's `errors` object map onto the matching inputs |
| Unsaved changes on navigate away | A confirmation prompt |

**Responsive.** Two columns for short paired fields on desktop (price / area, phone / WhatsApp), single column under `md`.

---

### 5.14 `/admin/properties/:id/edit` — Edit

Identical form to 5.13, with these differences:

- Fields are pre-populated from the existing property.
- Already-uploaded images appear in the uploader with remove controls.
- The header shows the current status badge and, when it is a draft, a "Publish" action.
- The primary action reads "Save changes".
- A 404 state renders when the id does not exist, rather than an empty form.
- Submits to `PATCH /api/admin/properties/:id`, which sends only changed fields.

---

### 5.15 `/admin/users` — Users List

**Purpose.** See who has registered. Read-only by design.

**Sections.** h1 "Users" with a total count, a search input (name or email), then the table and pagination.

**Table columns.** Avatar and name, Email with a verified badge, Phone, Role badge, Favorites count, Joined date.

**No actions column.** There is deliberately no menu, no block, no delete, no role change (PRODUCT-SPEC section 5). If a future session feels the urge to add one, that is the FUTURE list.

**Data required.** `GET /api/admin/users`.

**States.** Ten skeleton rows while loading; "No users yet" when empty; "No users match" when a search returns nothing.

**Responsive.** Card list under `lg`, same as the properties table.

---

## 6. Cross-Cutting States

### Skeletons

Every skeleton mirrors the real layout's dimensions so there is no layout shift when content arrives. A centered spinner on a blank page is not acceptable for any list or detail surface. Build one skeleton component per real component (`PropertyCardSkeleton` alongside `PropertyCard`) and keep them in the same file, so a layout change updates both.

### Empty states

Every empty state carries three things: an icon or illustration, a sentence explaining why it is empty, and an action that resolves it. "No results" alone is not an empty state.

| Surface | Message | Action |
|---|---|---|
| Listing, filtered | No properties match these filters | Clear all filters |
| Listing, no data | New listings coming soon | — |
| Favorites | You have not saved any properties yet | Browse properties |
| Reviews, logged-in | No reviews yet. Be the first. | Scroll to the form |
| Admin properties | No properties yet | Add your first property |
| Admin users | No users have registered yet | — |

### Errors

- **Field errors** render beneath the input, in `--destructive`, from the `errors` object in the API response.
- **Form errors** render as a bordered block above the submit button.
- **Query errors** render inline where the data would have been, with a Retry button. Never blank the whole page because one section failed.
- **Route errors** use `error.tsx` per segment, with a reset action.
- **404** uses `not-found.tsx` with a link back to `/properties`.

### Toasts

shadcn Sonner, top-right on desktop and top-center on mobile.

| Use | Example |
|---|---|
| Success, non-blocking | "Added to favorites", "Property published", "Link copied" |
| Failure of a background action | "Could not save. Try again." |
| Never | Form validation errors, which belong on the field |

Auto-dismiss at 4 seconds. Destructive confirmations use an AlertDialog, never a toast with an undo.

### Optimistic updates

Favorite toggle and review delete update the UI immediately and roll back on failure with an explanatory toast. Everything else waits for the server. Optimistic property creation or editing is not worth the rollback complexity.

---

## 7. Responsive Breakpoints

Tailwind defaults. Design mobile-first; write the mobile styles as the base and layer `md:` and `lg:` on top.

| Breakpoint | Width | Layout |
|---|---|---|
| base | under 640px | Single column. Bottom-sheet filters. Fixed bottom contact bar on detail. Hamburger nav. |
| `sm` | 640px | Two-column property grid. |
| `md` | 768px | Two-column forms for paired fields. Tables still render as cards. |
| `lg` | 1024px | Three-column property grid. Sticky detail sidebar. Real tables. Admin sidebar appears. Full pill nav. |
| `xl` | 1280px | Container caps at 1280px. Bento grid reaches its full asymmetric layout. |

| Grid | base | sm | lg |
|---|:---:|:---:|:---:|
| Property cards | 1 | 2 | 3 |
| Bento city tiles | 1 (large first) | 2 | asymmetric 6/3/3 |
| Admin stat cards | 1 | 2 | 3 |
| Footer columns | 1 | 2 | 4 |

Touch targets are at least 44x44px. The favorite heart on a card must meet this even though the icon itself is smaller — pad the hit area.

---

## 8. Accessibility Baseline

Not optional, and not deferred to the polish phase.

- **Focus.** Every interactive element has a visible focus ring, `2px` `--secondary` with a `2px` offset. Never `outline: none` without a replacement.
- **Keyboard.** Every flow completes with a keyboard alone. Dialogs and sheets trap focus and restore it on close (shadcn handles this — do not defeat it).
- **Images.** Property images take alt text of the form "`{title}` in `{city}`". Decorative images take `alt=""`.
- **Forms.** Every input has an associated `<label>`. Placeholders are never used as labels. Errors are linked with `aria-describedby` and the input carries `aria-invalid`.
- **Contrast.** Body text meets 4.5:1 and large text 3:1. Check the amber accent specifically — `--accent` on white fails for body text, so amber is for backgrounds and large elements, with `--accent-foreground` on top.
- **Icon-only buttons** carry an `aria-label`. This includes the favorite heart and the circular arrow.
- **Star ratings** expose a text equivalent: `aria-label="Rated 4.2 out of 5 from 18 reviews"`.
- **Live regions.** Toasts render in an `aria-live="polite"` region.
- **Motion.** `prefers-reduced-motion` disables the hero animation and all transform transitions.
- **Headings.** One `h1` per page, and levels are never skipped.
