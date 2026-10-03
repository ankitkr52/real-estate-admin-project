# Product Specification — Real Estate Portal

Status: FROZEN. Every decision in this document is locked. Do not "improve" or modernize any of it. If a future session finds a genuine contradiction between this document and another, stop and ask the user — do not silently reconcile.

---

## 1. Product Vision

| Field | Value |
|---|---|
| Name | Real Estate Portal |
| Type | Portfolio project, built to production quality |
| Market | India only |
| Language | English only |
| Currency | INR |
| Transaction scope | Buy / Sell only. No rentals. |

An admin-curated buy/sell property portal. Visitors browse listings that an admin has quality-controlled and published, then contact the owner directly by phone or WhatsApp in one tap.

The product deliberately has **no internal inquiry system**. Contact is external. The portal's job ends at putting a trustworthy listing and a working phone number in front of a buyer.

The curation model is the core product decision: users never create listings. Only an admin does. Everything a visitor sees has passed through one person.

---

## 2. Roles

There are exactly three roles. There is no fourth role, no role hierarchy beyond this, and no per-user permission flags.

### Guest
An unauthenticated visitor. Can browse, filter, sort, and open any published property, and can see the contact phone number and WhatsApp link. Cannot favorite. Cannot read or write reviews.

### User
A registered account with a verified email. Everything a Guest can do, plus: favorite properties, read reviews, write exactly one review per property, edit or delete that review, and edit their own profile.

### Admin
Full property management, dashboard statistics, and a read-only list of registered users.

**Admin assignment:** the admin role is assigned manually by the seed script. There is no admin registration flow, no admin invite flow, and no UI anywhere that promotes a user to admin. `role` is never writable through any API endpoint.

---

## 3. Permission Matrix

| Action | Guest | User | Admin |
|---|:---:|:---:|:---:|
| Browse published properties | Yes | Yes | Yes |
| Filter / sort / paginate listings | Yes | Yes | Yes |
| View property detail page | Yes | Yes | Yes |
| See contact phone + WhatsApp link | Yes | Yes | Yes |
| See average rating and review count | Yes | Yes | Yes |
| Read the review list | No | Yes | Yes |
| Write a review | No | Yes | Yes |
| Edit / delete own review | No | Yes | Yes |
| Edit / delete another user's review | No | No | No |
| Add / remove favorites | No | Yes | Yes |
| View favorites list | No | Yes | Yes |
| Edit own profile (name, phone, avatar) | No | Yes | Yes |
| Share property (copy link, WhatsApp) | Yes | Yes | Yes |
| View draft properties | No | No | Yes |
| Create / edit / delete a property | No | No | Yes |
| Publish / unpublish a property | No | No | Yes |
| View dashboard statistics | No | No | Yes |
| View registered users list | No | No | Yes |
| Block / unblock a user | No | No | No (out of scope) |

Note: Admin is a superset of User. An admin can favorite and review like any user. Admin is not a separate identity.

---

## 4. MVP Feature List

### 4.1 Authentication
- Registration with email and password.
- Email verification is **required before login**. A newly registered account cannot log in until the emailed link has been used. Verification email is sent via Resend.
- Login and logout, session carried in an HTTP-only cookie.
- Forgot password: request a reset link by email, then set a new password from that link.

### 4.2 User Profile
- Edit name, phone, and avatar. Avatar upload goes to Cloudinary.
- View favorites list.
- Email is not editable. It is the account identity and it was verified.
- **No inquiry history** — there are no inquiries to keep history of.

### 4.3 Property Browsing

Filters:

| Filter | Values |
|---|---|
| City | One of the fixed `CITIES` constant list |
| Property type | Apartment, House, Villa, Plot, Commercial |
| Price range | Min and max, INR |
| BHK | Integer |
| Area range | Min and max, square feet |
| Furnishing | Furnished, Semi-Furnished, Unfurnished |

Sort: Newest (default), Price low to high, Price high to low.

Pagination on the listing page.

Property detail page contains: description, image gallery/carousel (maximum 5 images), plain-text address, phone number, WhatsApp click-to-chat link, view count, reviews section (visible to logged-in users only), share buttons (copy link and WhatsApp share), and a favorite toggle.

### 4.4 Reviews
- Logged-in users only, for **both reading and writing**. A guest sees a prompt to log in where the review list would be.
- One review per user per property, enforced by a compound unique index at the database level, not only in application code.
- Star rating 1 to 5 plus a written comment. Both required.
- A user can edit or delete their own review. Nobody can edit or delete anyone else's, including admin.
- Reviews publish instantly. There is no moderation queue.
- The property document carries denormalized `averageRating` and `reviewCount`, recalculated on every review create, update, and delete.

### 4.5 Favorites
- Add and remove favorites. Logged-in only.
- Stored as an array of property ObjectIds on the User document. Not a separate collection.
- Favoriting is idempotent: favoriting an already-favorited property is a success, not an error.

### 4.6 Admin Panel
- Dashboard statistics: total properties, total users, total favorites (aggregated across all users).
- Properties CRUD: create, read, update, delete.
- Publish / unpublish toggle, moving a property between `draft` and `published`.
- Registered users list, view only. No block, no unblock, no delete, no role change.

### 4.7 Sharing
- Copy link button, copies the property detail URL to the clipboard.
- WhatsApp share button, opens WhatsApp with a pre-filled message containing the property link.

---

## 5. Out of Scope (FUTURE)

These are explicitly **not** in the MVP. Do not build them. Do not add schema fields, endpoints, UI affordances, or "just in case" hooks for them.

- Bathrooms filter
- Amenities filter
- Maps integration (no coordinates are stored; address is plain text)
- Recently viewed
- Property comparison
- Similar properties
- Email notifications (beyond verification and password reset)
- Saved searches
- Review moderation
- Admin block / unblock users
- Social login
- Rentals
- Payments

Adding any of these requires a specification change agreed with the user first. Discovering that one would be "easy to add" is not a reason to add it.

---

## 6. Business Rules

| # | Rule | Enforced where |
|---|---|---|
| BR-1 | Only an admin creates properties. | `POST /api/admin/properties`, role check in middleware |
| BR-2 | Properties are created as `draft` and are invisible publicly until an admin publishes them. | Schema default plus `status: "published"` filter on all public queries |
| BR-3 | A verified email is required before login. | `POST /api/auth/login` checks `isEmailVerified` |
| BR-4 | Only logged-in users may read or write reviews. | Auth guard on all four review endpoints |
| BR-5 | One review per user per property. Editing is allowed; a second review is not. | Compound unique index `{ property: 1, user: 1 }` plus a pre-check in the POST handler |
| BR-6 | Reviews go live instantly. No moderation. | No status field exists on Review |
| BR-7 | Deleting a property cascade-deletes its reviews and pulls its id out of every user's favorites. | `DELETE /api/admin/properties/:id` |
| BR-8 | Contact is external only: phone number and WhatsApp click-to-chat. There is no internal inquiry system. | No inquiry model, no inquiry endpoint |
| BR-9 | Maximum 5 images per property. | Zod validation on create and update |
| BR-10 | View count increments on every detail page load. No per-user deduplication in the MVP. | `GET /api/properties/:id` |
| BR-11 | The admin role is assigned by the seed script only, never through registration or any API. | `role` is stripped from every request body before it reaches the model |
| BR-12 | Email-verification and password-reset tokens are stateless signed JWTs. No token is stored in the database. | `lib/token.ts` |
| BR-13 | The city list is a fixed constant in the codebase, shared by the filter dropdown and the home page city grid. There is no city endpoint. | `lib/constants.ts` |
| BR-14 | `averageRating` and `reviewCount` are public. Guests see the star rating on cards and on the detail page; only the review list and the write form are gated behind login. | Public property responses include both fields |

---

## 7. Acceptance Criteria

Written as Given / When / Then. Each is a testable statement of done.

### 7.1 Registration and Email Verification

```
Given a visitor on /register with an email not already in use
When they submit a valid name, email, phone, and password
Then an account is created with isEmailVerified = false and role = "user"
And a verification email is sent via Resend linking to /verify-email?token=...
And the response does not set a session cookie
```

```
Given a visitor submits a registration email that already exists
When the form is submitted
Then the response is an error identifying the email as already registered
And no second account is created
```

```
Given a user holding a valid, unexpired verification token
When /verify-email posts that token
Then isEmailVerified becomes true
And the user is directed to log in
```

```
Given a verification token that is expired or malformed
When /verify-email posts it
Then the page shows a clear failure message and an option to request a new link
And no account state changes
```

### 7.2 Login and Logout

```
Given a registered user with isEmailVerified = true
When they submit the correct email and password
Then an HTTP-only session cookie is set
And the response carries the user's id, name, email, avatar, and role
```

```
Given a registered user with isEmailVerified = false
When they submit correct credentials
Then login is refused with a message stating the email is not yet verified
And no session cookie is set
```

```
Given any login attempt with a wrong password or an unknown email
When submitted
Then the response is a single generic "invalid credentials" error
And the response does not reveal whether the email exists
```

```
Given a logged-in user
When they log out
Then the session cookie is cleared
And protected routes redirect to /login
```

### 7.3 Forgot and Reset Password

```
Given any email address submitted to /forgot-password
When the request is made
Then the response is always a generic success, whether or not the account exists
And a reset email is sent only if the account exists
```

```
Given a valid, unexpired reset token and a new password meeting the password rules
When /reset-password is submitted
Then the password hash is replaced
And the user can log in with the new password
And the old password no longer works
```

### 7.4 Property Browsing

```
Given properties exist in both draft and published status
When a visitor opens /properties
Then only published properties appear
And no draft property is reachable by guessing its URL
```

```
Given a visitor applies city, type, price, BHK, area, and furnishing filters together
When the listing loads
Then only properties matching every applied filter are returned
And the active filters are reflected in the URL query string
And reloading that URL reproduces the same result set
```

```
Given a filter combination matching zero properties
When the listing loads
Then an empty state is shown with a control to clear filters
And no error is raised
```

```
Given more properties than one page holds
When the visitor moves to page 2
Then the next slice is returned with the same filters and sort applied
And the total count and page count are available to the UI
```

### 7.5 Property Detail

```
Given a published property
When any visitor opens its detail page
Then viewCount increments by one
And the gallery, description, address, price, rating, phone, and WhatsApp link all render
```

```
Given a property of type Plot or Commercial
When its detail page or card renders
Then no BHK value is displayed
```

```
Given a visitor taps the WhatsApp contact link
When the link opens
Then it targets the property's contactWhatsApp number with a pre-filled message referencing the property
```

### 7.6 Favorites

```
Given a logged-in user viewing a property they have not favorited
When they tap the favorite toggle
Then the property id is added to their favorites array
And the toggle immediately reflects the favorited state
```

```
Given a logged-in user viewing a property they have already favorited
When they tap the favorite toggle
Then the property id is removed from their favorites array
```

```
Given a guest viewing any property
When they tap the favorite toggle
Then they are prompted to log in
And no favorite is recorded
```

```
Given a user whose favorites include a property that has since been deleted
When they open /favorites
Then the deleted property does not appear and does not cause an error
```

### 7.7 Reviews

```
Given a guest on a property detail page
When the reviews section renders
Then neither the review list nor the write form is shown
And a prompt to log in is shown in their place
And the average rating and review count remain visible
```

```
Given a logged-in user who has not reviewed this property
When they submit a rating between 1 and 5 and a comment
Then the review is created and appears in the list immediately
And the property's averageRating and reviewCount are recalculated
```

```
Given a logged-in user who has already reviewed this property
When they attempt to create a second review
Then the request is refused
And the UI offers editing their existing review instead
```

```
Given a user editing their own review's rating
When the edit is saved
Then the review is updated
And the property's averageRating is recalculated from all remaining reviews
```

```
Given a user deletes their own review
When the delete completes
Then reviewCount decreases by one
And averageRating is recalculated, becoming 0 if no reviews remain
```

```
Given a user attempts to edit or delete a review belonging to someone else
When the request is made
Then it is refused as forbidden
And the review is unchanged
```

### 7.8 Admin — Property CRUD

```
Given an admin submits a valid new property
When it is created
Then its status is "draft" regardless of what the request body says
And it does not appear in any public listing
```

```
Given an admin uploads images for a property
When more than 5 images are submitted
Then the request is refused by validation
And nothing is persisted
```

```
Given an admin publishes a draft property
When the publish endpoint is called
Then status becomes "published"
And the property appears in public listings
```

```
Given an admin unpublishes a published property
When the unpublish endpoint is called
Then status returns to "draft"
And the property disappears from public listings
And any user favorite pointing at it is left intact
```

```
Given an admin deletes a property that has reviews and is favorited by several users
When the delete completes
Then the property is removed
And every review of that property is removed
And the property id is pulled from every user's favorites array
```

```
Given a logged-in non-admin user calls any /api/admin/* endpoint
When the request is made
Then it is refused as forbidden
And the response does not leak whether the target resource exists
```

### 7.9 Admin — Dashboard and Users

```
Given properties, users, and favorites exist
When an admin opens /admin
Then total properties, total users, and total favorites are displayed
And total favorites is the sum of favorites across all user documents
```

```
Given registered users exist
When an admin opens /admin/users
Then each user's name, email, phone, role, verification status, and join date are listed
And no control exists to block, delete, or change the role of any user
```

### 7.10 Sharing

```
Given any visitor on a property detail page
When they tap the copy link button
Then the full property URL is written to the clipboard
And a confirmation is shown
```

```
Given any visitor taps the WhatsApp share button
When the share opens
Then WhatsApp opens with a message pre-filled with the property title and its URL
```

---

## 8. Edge Cases

| Case | Expected behavior | Enforced where |
|---|---|---|
| Registration with an email that exists but is unverified | Refused as already registered. Offer to resend verification rather than creating a duplicate. | Register handler |
| Login before verification | Refused with a specific "verify your email" message, distinct from wrong-password | Login handler |
| Wrong password vs unknown email | Same generic error for both, to avoid account enumeration | Login handler |
| Forgot password for a non-existent email | Generic success response, no email sent | Forgot-password handler |
| Reset token reused after the password was already changed | Token remains technically valid until expiry. Documented consequence of the stateless-token decision. | See DATABASE.md, Token Handling |
| Expired verification or reset token | Clear failure message plus a path to request a new link | Verify / reset handlers |
| Property id that is not a valid ObjectId | 400 with a validation error, never a 500 | Route-level ObjectId validation |
| Property id that is valid but not found | 404 | Property handlers |
| Draft property requested by id publicly | 404, identical to not-found. Existence is not leaked. | `GET /api/properties/:id` |
| BHK supplied for a Plot or Commercial property | Accepted and stored but never displayed in the UI | UI conditional |
| Furnishing absent | Field omitted from the card and detail page, not rendered as empty | UI conditional |
| Property with zero reviews | `averageRating` is 0 and `reviewCount` is 0. The UI shows "No ratings yet", not zero stars. | Schema defaults plus UI |
| Second review attempt by the same user | Refused. The duplicate is caught by the unique index even under a race. | Unique index plus POST pre-check |
| Rating outside 1 to 5, or non-integer | Refused by Zod validation | Review schema |
| Empty or whitespace-only comment | Refused by Zod validation | Review schema |
| Favoriting an already-favorited property | Idempotent success, no duplicate entry | `$addToSet` |
| Unfavoriting something not favorited | Idempotent success | `$pull` |
| Favorites list containing deleted properties | Missing references are filtered out of the response | Favorites handler |
| Property with fewer than 5 images | Gallery adapts. Only `coverImage` is structurally required. | UI |
| Cloudinary upload failure | Form stays populated, the error surfaces, nothing is persisted | Upload handler |
| Resend send failure during registration | The account is still created. The user is told to use "resend verification". | Register handler |
| Price or area entered as a non-number | Refused by validation with a field-level message | Zod coercion |
| Filter min greater than max | Refused by validation with a field-level message | Zod refine |
| Page number beyond the last page | Empty result set with the correct total, not an error | Listing handler |
| Concurrent review writes changing the rating | Recalculation reads all reviews and overwrites, so the last write is correct rather than drifting | Recalc procedure |
| User deleted while holding favorites | Out of scope. There is no user-delete flow in the MVP. | — |

---

## 9. Definition of Done

A feature is done when all of the following are true.

- [ ] Behavior matches the acceptance criteria in this document, including the negative cases.
- [ ] Every API input is validated with Zod before reaching the database.
- [ ] Every response follows the standard shape in API.md.
- [ ] Authentication and role checks are present on every endpoint the permission matrix says needs one.
- [ ] Loading, empty, and error states exist for every data-driven surface.
- [ ] The UI is correct at mobile, tablet, and desktop widths.
- [ ] No TypeScript errors, and no `any` in domain code.
- [ ] No console errors or unhandled promise rejections in normal use.
- [ ] Nothing from the FUTURE list was built along the way.
- [ ] No dependency was installed without asking the user first.
- [ ] `memory.md` was updated with what was completed and any decisions made.
