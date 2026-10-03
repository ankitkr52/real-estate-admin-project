# API Specification — Real Estate Portal

All endpoints are Next.js App Router route handlers under `app/api/`. There is no separate Express server.

Status: FROZEN. The endpoint list below is complete. Do not add endpoints. If a UI need appears to require a new one, stop and ask the user.

---

## 1. Standard Response Shape

Every endpoint, without exception, returns one of these two shapes.

```typescript
// Success
{
  success: true,
  data: { ... }        // always an object, never a bare array or scalar
}

// Error
{
  success: false,
  message: string,                        // human-readable, safe to display
  errors?: Record<string, string[]>       // field-level, present only on validation failures
}
```

Lists are always wrapped, never returned as a top-level array:

```typescript
{ success: true, data: { properties: [...], pagination: { ... } } }
```

This is so a list response can grow extra keys (totals, applied filters) without becoming a breaking change.

### HTTP status conventions

| Status | Meaning | Used when |
|---|---|---|
| 200 | OK | Successful read, update, or delete |
| 201 | Created | A new resource was created (register, create property, create review) |
| 400 | Bad Request | Zod validation failed, or a malformed ObjectId |
| 401 | Unauthorized | No session, or an invalid or expired session cookie |
| 403 | Forbidden | Authenticated but not permitted (wrong role, not the owner) |
| 404 | Not Found | Resource does not exist, or exists but is not visible to this caller |
| 409 | Conflict | Uniqueness violated (email taken, review already exists) |
| 429 | Too Many Requests | Rate limit tripped on an auth endpoint |
| 500 | Internal Server Error | Unhandled failure. The message is always generic. |

Rule: a 500 response never contains a stack trace, a Mongo error string, or any internal detail. Log the real error server-side and return a generic message.

### Helper

Every handler returns through one pair of helpers so the shape can never drift:

```typescript
// lib/response.ts
export const ok = <T>(data: T, status = 200) =>
  NextResponse.json({ success: true, data }, { status });

export const fail = (
  message: string,
  status = 400,
  errors?: Record<string, string[]>
) => NextResponse.json({ success: false, message, ...(errors && { errors }) }, { status });
```

---

## 2. Authentication Model

### Session cookie

| Property | Value |
|---|---|
| Cookie name | `session` |
| Contents | JWT signed with `JWT_SECRET` |
| `httpOnly` | `true` — never readable from JavaScript |
| `secure` | `true` in production, `false` in local development |
| `sameSite` | `lax` |
| `path` | `/` |
| Lifetime | 7 days |

Session JWT payload:

```typescript
{
  sub: string;        // user _id
  role: "user" | "admin";
  iat: number;
  exp: number;
}
```

The payload carries `role` so a role check does not require a database read on every request. Consequence to accept: if a user's role changed, their existing session keeps the old role until it expires. Since roles are only ever set by the seed script, this is not a practical problem.

Action tokens (email verification, password reset) are a different thing entirely: they are passed in a request body, never in a cookie, and they carry a `purpose` claim that must be verified. See DATABASE.md section 10.

### Guards

Three levels, applied per route:

| Guard | Behavior |
|---|---|
| `public` | No session required. If a valid session exists it may be read (for example to decide whether to include `isFavorited`). |
| `user` | A valid session is required. Missing or invalid gives 401. |
| `admin` | A valid session with `role === "admin"` is required. No session gives 401; a non-admin session gives 403. |

```typescript
// lib/auth.ts
export async function getSession(): Promise<SessionPayload | null>;
export async function requireUser(): Promise<SessionPayload>;   // throws 401
export async function requireAdmin(): Promise<SessionPayload>;  // throws 401 or 403
```

`middleware.ts` additionally protects **page** routes, redirecting unauthenticated visitors away from `/favorites`, `/profile`, and `/admin/*`. The middleware is a UX convenience. It is not the security boundary — every API route performs its own guard, because middleware can be bypassed by calling the API directly.

### Ownership checks

Route-level role checks are not sufficient for reviews. `PATCH /api/reviews/:id` requires that `review.user` equals the session's `sub`. An admin is not exempt: nobody edits another person's review (PRODUCT-SPEC section 3).

---

## 3. Auth Endpoints

### POST /api/auth/register

| | |
|---|---|
| Auth | public |
| Role | — |
| Status | 201 on success |

Request body:

```typescript
{
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().regex(/^[6-9]\d{9}$/),           // Indian mobile, 10 digits
  password: z.string().min(8).max(72)                 // 72 is the bcrypt input limit
}
```

Behavior:
1. Validate. 2. Reject if the email exists. 3. Create the user with `role: "user"` and `isEmailVerified: false`. 4. Create a `verify-email` action token. 5. Send the verification email through Resend. 6. Respond. **No session cookie is set.**

Any `role` key present in the request body is discarded before the model is touched (BR-11).

Success:

```typescript
{ success: true, data: { message: "Registration successful. Check your email to verify your account." } }
```

Errors:

| Status | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Any field fails validation |
| 409 | `EMAIL_TAKEN` | The email is already registered, verified or not |
| 500 | `INTERNAL_ERROR` | Unexpected failure |

If Resend fails but the user was created, still return 201 with a message pointing at the resend path. Do not roll the account back and do not return an error, or the user will be stuck unable to re-register.

---

### POST /api/auth/verify-email

| | |
|---|---|
| Auth | public |
| Role | — |
| Status | 200 |

```typescript
{ token: z.string().min(1) }
```

Behavior: verify the token's signature, expiry, and `purpose === "verify-email"`; load the user by `sub`; set `isEmailVerified = true`. Already-verified is treated as success, so a double-clicked link does not show an error.

Success:

```typescript
{ success: true, data: { message: "Email verified. You can now log in." } }
```

Errors:

| Status | Code | When |
|---|---|---|
| 400 | `INVALID_TOKEN` | Malformed, wrong signature, or wrong `purpose` |
| 400 | `TOKEN_EXPIRED` | Past the 24-hour lifetime |
| 404 | `USER_NOT_FOUND` | The token's `sub` no longer exists |

---

### POST /api/auth/login

| | |
|---|---|
| Auth | public |
| Role | — |
| Status | 200 |

```typescript
{
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1)
}
```

Behavior: find the user with `.select("+password")`; compare with bcrypt; refuse if `isEmailVerified` is false; sign the session JWT and set the cookie.

Success:

```typescript
{
  success: true,
  data: {
    user: {
      id: string,
      name: string,
      email: string,
      phone: string,
      avatar?: string,
      role: "user" | "admin"
    }
  }
}
```

`password` is never present in any response, in any endpoint.

Errors:

| Status | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Malformed body |
| 401 | `INVALID_CREDENTIALS` | Unknown email **or** wrong password — deliberately the same error for both |
| 403 | `EMAIL_NOT_VERIFIED` | Credentials are correct but the email is unverified |
| 429 | `RATE_LIMITED` | Too many attempts from one IP |

`EMAIL_NOT_VERIFIED` is distinct from `INVALID_CREDENTIALS` on purpose: it only fires after the password already matched, so it reveals nothing to an attacker who does not already have the password.

---

### POST /api/auth/logout

| | |
|---|---|
| Auth | user |
| Role | any |
| Status | 200 |

No body. Clears the `session` cookie by setting it with `maxAge: 0`.

```typescript
{ success: true, data: { message: "Logged out." } }
```

---

### POST /api/auth/forgot-password

| | |
|---|---|
| Auth | public |
| Role | — |
| Status | 200 always |

```typescript
{ email: z.string().trim().toLowerCase().email() }
```

Behavior: look the user up. If found, create a `reset-password` action token (1-hour expiry) and email a link to `/reset-password?token=...`. If not found, do nothing. **Return the same success response either way.**

```typescript
{ success: true, data: { message: "If that email is registered, a reset link has been sent." } }
```

Errors:

| Status | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | The email is not a valid email |
| 429 | `RATE_LIMITED` | Too many requests from one IP |

A 404 here would turn this endpoint into an account-existence oracle. It must never 404.

---

### POST /api/auth/reset-password

| | |
|---|---|
| Auth | public |
| Role | — |
| Status | 200 |

```typescript
{
  token: z.string().min(1),
  newPassword: z.string().min(8).max(72)
}
```

Behavior: verify signature, expiry, and `purpose === "reset-password"`; load the user; assign the new password and save so the hashing hook runs. Existing sessions are **not** invalidated — a documented consequence of stateless sessions.

```typescript
{ success: true, data: { message: "Password updated. You can now log in." } }
```

Errors:

| Status | Code | When |
|---|---|---|
| 400 | `INVALID_TOKEN` | Bad signature or wrong `purpose` |
| 400 | `TOKEN_EXPIRED` | Past the 1-hour lifetime |
| 400 | `VALIDATION_ERROR` | The new password is too short |
| 404 | `USER_NOT_FOUND` | The token's `sub` no longer exists |

---

### GET /api/auth/me

| | |
|---|---|
| Auth | user |
| Role | any |
| Status | 200 |

No body, no query. Reads the session, loads the user, returns the same `user` object shape as login. This is the endpoint TanStack Query uses to hydrate the client's auth state.

Errors:

| Status | Code | When |
|---|---|---|
| 401 | `UNAUTHORIZED` | No session or an invalid one |
| 404 | `USER_NOT_FOUND` | The session is valid but the user was removed |

---

## 4. User Endpoints

### PATCH /api/user/profile

| | |
|---|---|
| Auth | user |
| Role | any |
| Status | 200 |

```typescript
{
  name?: z.string().trim().min(2).max(60),
  phone?: z.string().regex(/^[6-9]\d{9}$/),
  avatar?: z.string().url()                  // Cloudinary secure URL, already uploaded
}
```

All fields optional, but at least one must be present. `email`, `password`, `role`, `isEmailVerified`, and `favorites` are **not** accepted here and are stripped if sent.

The avatar file is uploaded to Cloudinary from the client before this call. This endpoint only ever receives the resulting URL, never binary data.

Success: `{ success: true, data: { user: { ...same shape as login... } } }`

Errors:

| Status | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Invalid field, or an empty body |
| 401 | `UNAUTHORIZED` | No session |

---

### GET /api/user/favorites

| | |
|---|---|
| Auth | user |
| Role | any |
| Status | 200 |

No query parameters. Returns the full favorites list unpaginated — it is a bounded, personal list.

Behavior: load the user, populate `favorites`, then **filter out** any entry that failed to populate (the property was deleted) and any entry whose `status` is not `published` (it was unpublished after being favorited).

```typescript
{
  success: true,
  data: { properties: PropertyCard[] }
}
```

Errors: 401 `UNAUTHORIZED`.

---

### POST /api/user/favorites/:propertyId

| | |
|---|---|
| Auth | user |
| Role | any |
| Status | 200 |

No body. `propertyId` must be a valid ObjectId that refers to an existing published property.

Behavior: `User.findByIdAndUpdate(userId, { $addToSet: { favorites: propertyId } })`. `$addToSet` makes this idempotent: favoriting twice is a success, not a 409.

```typescript
{ success: true, data: { favorited: true } }
```

Errors:

| Status | Code | When |
|---|---|---|
| 400 | `INVALID_ID` | `propertyId` is not a valid ObjectId |
| 401 | `UNAUTHORIZED` | No session |
| 404 | `PROPERTY_NOT_FOUND` | No such property, or it is a draft |

---

### DELETE /api/user/favorites/:propertyId

| | |
|---|---|
| Auth | user |
| Role | any |
| Status | 200 |

Behavior: `$pull` from `favorites`. Idempotent — removing something not favorited is a success. Unlike POST, this does **not** require the property to still exist, so users can clear stale favorites.

```typescript
{ success: true, data: { favorited: false } }
```

Errors: 400 `INVALID_ID`, 401 `UNAUTHORIZED`.

---

## 5. Property Endpoints (public)

### GET /api/properties

| | |
|---|---|
| Auth | public |
| Role | — |
| Status | 200 |

Always filters `status: "published"`. This filter is not overridable by any query parameter.

Query parameters:

| Param | Type | Default | Validation | Notes |
|---|---|---|---|---|
| `city` | string | — | Must be a member of `CITIES` | Exact match |
| `type` | string | — | One of the 5 type enum values | |
| `minPrice` | number | — | `coerce.number().nonnegative()` | Inclusive |
| `maxPrice` | number | — | `coerce.number().positive()` | Inclusive. Must be >= `minPrice`. |
| `bhk` | number | — | `coerce.number().int().positive()` | Exact match, not "or more" |
| `minArea` | number | — | `coerce.number().nonnegative()` | Inclusive |
| `maxArea` | number | — | `coerce.number().positive()` | Inclusive. Must be >= `minArea`. |
| `furnishing` | string | — | One of the 3 furnishing enum values | |
| `sort` | string | `newest` | `newest` \| `price_asc` \| `price_desc` | |
| `page` | number | `1` | `coerce.number().int().min(1)` | |
| `limit` | number | `12` | `coerce.number().int().min(1).max(48)` | Capped so a caller cannot request the whole collection |

Every parameter is optional. Unknown parameters are ignored rather than rejected, so a stale bookmarked URL still works.

Sort mapping:

| `sort` | Mongo sort |
|---|---|
| `newest` | `{ createdAt: -1 }` |
| `price_asc` | `{ price: 1 }` |
| `price_desc` | `{ price: -1 }` |

Success:

```typescript
{
  success: true,
  data: {
    properties: [{
      _id: string,
      title: string,
      type: string,
      price: number,
      bhk?: number,
      area: number,
      furnishing?: string,
      city: string,
      coverImage: string,
      averageRating: number,    // public, see BR-14
      reviewCount: number,      // public
      createdAt: string
    }],
    pagination: {
      page: number,
      limit: number,
      total: number,            // total matching documents, not the page size
      totalPages: number
    }
  }
}
```

The card payload deliberately omits `description`, `images`, `address`, `contactPhone`, `contactWhatsApp`, and `viewCount`. Listing responses should not ship contact details for dozens of properties at once.

Errors:

| Status | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | A parameter fails validation, or `minPrice > maxPrice`, or `minArea > maxArea` |

A page beyond the last page is **not** an error. It returns an empty `properties` array with the correct `total`.

---

### GET /api/properties/:id

| | |
|---|---|
| Auth | public |
| Role | — |
| Status | 200 |

Behavior:
1. Validate that `:id` is a valid ObjectId. If not, 400 — never let a bad id reach Mongoose and surface as a 500.
2. Find by id **with** `status: "published"`. A draft returns 404, identical to not-found, so draft existence is not leaked.
3. Atomically increment `viewCount` using `findOneAndUpdate` with `$inc` and `{ new: true }`, so the response already reflects the increment (BR-10).
4. If a session exists, compute `isFavorited` by checking the user's favorites array.

Success:

```typescript
{
  success: true,
  data: {
    property: {
      _id: string,
      title: string,
      description: string,
      type: string,
      price: number,
      bhk?: number,
      area: number,
      furnishing?: string,
      city: string,
      address: string,
      images: string[],
      coverImage: string,
      contactPhone: string,
      contactWhatsApp: string,
      viewCount: number,
      averageRating: number,
      reviewCount: number,
      createdAt: string
    },
    isFavorited: boolean          // false for guests
  }
}
```

`status` and `createdBy` are not exposed publicly. The caller already knows it is published, and who created it is internal.

Errors:

| Status | Code | When |
|---|---|---|
| 400 | `INVALID_ID` | Not a valid ObjectId |
| 404 | `PROPERTY_NOT_FOUND` | No such property, or it is a draft |

---

## 6. Review Endpoints

All four require a session. Guests get 401 even for reading (BR-4).

### GET /api/properties/:id/reviews

| | |
|---|---|
| Auth | user |
| Role | any |
| Status | 200 |

Query: `page` (default 1), `limit` (default 10, max 50).

Returns reviews for the property, newest first, with the author's `name` and `avatar` populated. Includes `isOwn` per review so the UI can show edit and delete controls without a second comparison.

```typescript
{
  success: true,
  data: {
    reviews: [{
      _id: string,
      rating: number,
      comment: string,
      user: { _id: string, name: string, avatar?: string },
      isOwn: boolean,
      createdAt: string,
      updatedAt: string
    }],
    pagination: { page, limit, total, totalPages },
    myReview: { _id: string, rating: number, comment: string } | null
  }
}
```

`myReview` is returned separately so the UI can decide between "write a review" and "edit your review" without scanning the page, which may not contain the user's own review at all.

Errors: 400 `INVALID_ID`, 401 `UNAUTHORIZED`, 404 `PROPERTY_NOT_FOUND`.

---

### POST /api/properties/:id/reviews

| | |
|---|---|
| Auth | user |
| Role | any |
| Status | 201 |

```typescript
{
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(5).max(1000)
}
```

Behavior:
1. Validate the body and the property id.
2. Confirm the property exists and is published.
3. Pre-check for an existing review by this user for this property. If found, 409.
4. Create the review. **Wrap in try/catch for Mongo error 11000** — under concurrency, two requests can both pass step 3, and the unique index is what actually stops the duplicate. Translate 11000 into the same 409.
5. Call `recalcPropertyRating(propertyId)`.

```typescript
{
  success: true,
  data: {
    review: { ...review shape... },
    property: { averageRating: number, reviewCount: number }   // so the UI updates without a refetch
  }
}
```

Errors:

| Status | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Rating out of range, comment too short |
| 400 | `INVALID_ID` | Bad property id |
| 401 | `UNAUTHORIZED` | No session |
| 404 | `PROPERTY_NOT_FOUND` | No such property, or draft |
| 409 | `REVIEW_EXISTS` | This user already reviewed this property |

---

### PATCH /api/reviews/:id

| | |
|---|---|
| Auth | user |
| Role | owner only |
| Status | 200 |

```typescript
{
  rating?: z.number().int().min(1).max(5),
  comment?: z.string().trim().min(5).max(1000)
}
```

At least one field required. Ownership is checked against the session: `review.user` must equal `session.sub`. **Admin is not exempt.** After a rating change, `recalcPropertyRating` runs.

Success: same shape as POST.

Errors:

| Status | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` / `INVALID_ID` | Bad body or bad id |
| 401 | `UNAUTHORIZED` | No session |
| 403 | `FORBIDDEN` | The review belongs to someone else |
| 404 | `REVIEW_NOT_FOUND` | No such review |

---

### DELETE /api/reviews/:id

| | |
|---|---|
| Auth | user |
| Role | owner only |
| Status | 200 |

Same ownership rule. Deletes the review, then calls `recalcPropertyRating`, which sets `averageRating` to 0 if it was the last one.

```typescript
{
  success: true,
  data: {
    deleted: true,
    property: { averageRating: number, reviewCount: number }
  }
}
```

Errors: 400 `INVALID_ID`, 401 `UNAUTHORIZED`, 403 `FORBIDDEN`, 404 `REVIEW_NOT_FOUND`.

---

## 7. Admin — Property Endpoints

All require `role === "admin"`. No session gives 401; a non-admin session gives 403.

### GET /api/admin/properties

| | |
|---|---|
| Auth | admin |
| Status | 200 |

Query: `status` (`draft` \| `published`, omitted means all), `city`, `type`, `search` (case-insensitive partial match on `title`), `sort` (default `newest`), `page` (default 1), `limit` (default 20, max 100).

Unlike the public listing, this returns **all statuses** by default. Response rows include `status`, `viewCount`, and `createdAt` for the admin table.

```typescript
{
  success: true,
  data: {
    properties: [{
      _id, title, type, price, city, coverImage,
      status, viewCount, reviewCount, averageRating, createdAt
    }],
    pagination: { page, limit, total, totalPages }
  }
}
```

Errors: 400 `VALIDATION_ERROR`, 401 `UNAUTHORIZED`, 403 `FORBIDDEN`.

---

### POST /api/admin/properties

| | |
|---|---|
| Auth | admin |
| Status | 201 |

```typescript
{
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(20).max(5000),
  type: z.enum(["Apartment", "House", "Villa", "Plot", "Commercial"]),
  price: z.coerce.number().positive(),
  bhk: z.coerce.number().int().positive().optional(),
  area: z.coerce.number().positive(),
  furnishing: z.enum(["Furnished", "Semi-Furnished", "Unfurnished"]).optional(),
  city: z.enum(CITIES),
  address: z.string().trim().min(5).max(300),
  images: z.array(z.string().url()).min(1).max(5),      // BR-9
  coverImage: z.string().url(),
  contactPhone: z.string().regex(/^[6-9]\d{9}$/),
  contactWhatsApp: z.string().regex(/^[6-9]\d{9}$/)
}
```

Behavior: `status` is forced to `"draft"` regardless of the body (BR-2). `createdBy` is set from the session. `viewCount`, `averageRating`, and `reviewCount` start at their schema defaults and are not accepted from the body.

Images are uploaded to Cloudinary client-side first; this endpoint receives URLs only.

Success: `{ success: true, data: { property: { ...full property... } } }`

Errors:

| Status | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Any field invalid, or more than 5 images |
| 401 / 403 | `UNAUTHORIZED` / `FORBIDDEN` | Not an admin |

---

### PATCH /api/admin/properties/:id

| | |
|---|---|
| Auth | admin |
| Status | 200 |

Body: the create schema with every field optional. At least one field required.

Not accepted here: `status` (use the publish and unpublish endpoints), `viewCount`, `averageRating`, `reviewCount`, `createdBy`. Sending them is not an error; they are stripped.

Success: `{ success: true, data: { property: { ...full property... } } }`

Errors: 400 `VALIDATION_ERROR` / `INVALID_ID`, 401, 403, 404 `PROPERTY_NOT_FOUND`.

---

### PATCH /api/admin/properties/:id/publish

| | |
|---|---|
| Auth | admin |
| Status | 200 |

No body. Sets `status` to `"published"`. Publishing an already-published property is an idempotent success.

Guard: refuse with 400 `INCOMPLETE_PROPERTY` if the property lacks a `coverImage` or has zero images. A published listing with no image is broken, and this is the last point at which it can be caught.

```typescript
{ success: true, data: { property: { _id, status: "published" } } }
```

Errors: 400 `INVALID_ID` / `INCOMPLETE_PROPERTY`, 401, 403, 404 `PROPERTY_NOT_FOUND`.

---

### PATCH /api/admin/properties/:id/unpublish

| | |
|---|---|
| Auth | admin |
| Status | 200 |

No body. Sets `status` to `"draft"`. Idempotent.

Unpublishing does **not** touch reviews or favorites. Users keep the property in their favorites array; it is simply filtered out of the favorites response while it is a draft, and reappears if it is republished.

```typescript
{ success: true, data: { property: { _id, status: "draft" } } }
```

Errors: 400 `INVALID_ID`, 401, 403, 404 `PROPERTY_NOT_FOUND`.

---

### DELETE /api/admin/properties/:id

| | |
|---|---|
| Auth | admin |
| Status | 200 |

No body. Runs the cascade in DATABASE.md section 9: delete reviews, pull the id from every user's favorites, delete the property (BR-7).

```typescript
{
  success: true,
  data: {
    deleted: true,
    reviewsDeleted: number,
    favoritesCleaned: number       // number of user documents modified
  }
}
```

The counts are returned so the admin UI can state what actually happened rather than a bare "deleted".

Errors: 400 `INVALID_ID`, 401, 403, 404 `PROPERTY_NOT_FOUND`.

---

## 8. Admin — Dashboard and Users

### GET /api/admin/stats

| | |
|---|---|
| Auth | admin |
| Status | 200 |

No parameters.

```typescript
{
  success: true,
  data: {
    totalProperties: number,       // all statuses
    publishedProperties: number,
    draftProperties: number,
    totalUsers: number,            // role "user" and "admin" together
    totalFavorites: number         // sum of favorites array lengths across all users
  }
}
```

`totalFavorites` is an aggregation, not a count of documents, because favorites live inside user documents:

```typescript
const [agg] = await User.aggregate([
  { $group: { _id: null, total: { $sum: { $size: "$favorites" } } } },
]);
const totalFavorites = agg?.total ?? 0;    // empty collection returns []
```

The `agg?.total ?? 0` guard matters: with no users the aggregation returns an empty array, and reading `.total` off `undefined` throws.

Errors: 401 `UNAUTHORIZED`, 403 `FORBIDDEN`.

---

### GET /api/admin/users

| | |
|---|---|
| Auth | admin |
| Status | 200 |

Query: `page` (default 1), `limit` (default 20, max 100), `search` (case-insensitive partial match on name or email).

```typescript
{
  success: true,
  data: {
    users: [{
      _id: string,
      name: string,
      email: string,
      phone: string,
      avatar?: string,
      role: "user" | "admin",
      isEmailVerified: boolean,
      favoritesCount: number,
      createdAt: string
    }],
    pagination: { page, limit, total, totalPages }
  }
}
```

`password` is excluded by the schema's `select: false`, but the projection should exclude it explicitly as well rather than relying on that alone. The raw `favorites` array is not returned — only its length, since the admin has no use for another user's list.

This endpoint is read-only. There is no corresponding PATCH or DELETE, by design (PRODUCT-SPEC section 5).

Errors: 400 `VALIDATION_ERROR`, 401 `UNAUTHORIZED`, 403 `FORBIDDEN`.

---

## 9. Errors

Every error response uses the shape from section 1. The `code` column is the internal identifier used in logs and in this document; the client reacts to the HTTP status and displays `message`.

| Code | HTTP | When it fires | Example body |
|---|:---:|---|---|
| `VALIDATION_ERROR` | 400 | Zod parse failed on a body or query | `{ success: false, message: "Validation failed", errors: { price: ["Expected number"] } }` |
| `INVALID_ID` | 400 | A route parameter is not a valid ObjectId | `{ success: false, message: "Invalid property id" }` |
| `INVALID_TOKEN` | 400 | Action token malformed, badly signed, or wrong `purpose` | `{ success: false, message: "This link is not valid." }` |
| `TOKEN_EXPIRED` | 400 | Action token past expiry | `{ success: false, message: "This link has expired. Request a new one." }` |
| `INCOMPLETE_PROPERTY` | 400 | Publish attempted with no images or no cover image | `{ success: false, message: "Add at least one image before publishing." }` |
| `UNAUTHORIZED` | 401 | No session cookie, or invalid or expired | `{ success: false, message: "You must be logged in." }` |
| `INVALID_CREDENTIALS` | 401 | Login failed — unknown email or wrong password | `{ success: false, message: "Invalid email or password." }` |
| `FORBIDDEN` | 403 | Authenticated but not permitted: non-admin on an admin route, or editing someone else's review | `{ success: false, message: "You do not have permission to do that." }` |
| `EMAIL_NOT_VERIFIED` | 403 | Correct credentials but `isEmailVerified` is false | `{ success: false, message: "Verify your email before logging in." }` |
| `PROPERTY_NOT_FOUND` | 404 | No such property, or a draft requested publicly | `{ success: false, message: "Property not found." }` |
| `REVIEW_NOT_FOUND` | 404 | No such review | `{ success: false, message: "Review not found." }` |
| `USER_NOT_FOUND` | 404 | A valid token or session points at a user that no longer exists | `{ success: false, message: "Account not found." }` |
| `EMAIL_TAKEN` | 409 | Registration with an existing email | `{ success: false, message: "That email is already registered." }` |
| `REVIEW_EXISTS` | 409 | Second review by the same user for the same property, from the pre-check or from Mongo 11000 | `{ success: false, message: "You have already reviewed this property." }` |
| `RATE_LIMITED` | 429 | Too many auth attempts from one IP | `{ success: false, message: "Too many attempts. Try again later." }` |
| `INTERNAL_ERROR` | 500 | Anything unhandled | `{ success: false, message: "Something went wrong." }` |

### Rules

1. **Never leak existence.** A draft property and a non-existent property both return `PROPERTY_NOT_FOUND`. Login returns the same `INVALID_CREDENTIALS` for an unknown email and a wrong password. `forgot-password` always succeeds.
2. **Never leak internals.** No stack traces, no Mongo error text, no file paths. Log the real error server-side with the request path and return a generic message.
3. **401 vs 403.** 401 means "we do not know who you are". 403 means "we know, and the answer is no". A guest hitting an admin route gets 401, not 403.
4. **Validation errors carry `errors`.** Field-keyed arrays of messages, so React Hook Form can attach them to inputs directly. No other error type includes `errors`.

---

## 10. Validation Rules

Shared Zod schemas live in `lib/validations/` and are imported by both the API route and the matching React Hook Form resolver. One schema, two consumers — the client and the server can never disagree about what is valid.

```typescript
// lib/validations/common.ts
export const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");
export const indianPhone = z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number");
export const password = z.string().min(8, "At least 8 characters").max(72);

export const pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
});
```

```typescript
// lib/validations/property.ts
export const propertyFilters = pagination
  .extend({
    city: z.enum(CITIES).optional(),
    type: z.enum(PROPERTY_TYPES).optional(),
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().positive().optional(),
    bhk: z.coerce.number().int().positive().optional(),
    minArea: z.coerce.number().nonnegative().optional(),
    maxArea: z.coerce.number().positive().optional(),
    furnishing: z.enum(FURNISHING).optional(),
    sort: z.enum(["newest", "price_asc", "price_desc"]).default("newest"),
  })
  .refine((v) => !v.minPrice || !v.maxPrice || v.minPrice <= v.maxPrice, {
    message: "Minimum price cannot exceed maximum price",
    path: ["minPrice"],
  })
  .refine((v) => !v.minArea || !v.maxArea || v.minArea <= v.maxArea, {
    message: "Minimum area cannot exceed maximum area",
    path: ["minArea"],
  });
```

Standing rules:

- **Every** API input is parsed with Zod before it touches the database. Bodies, query strings, and route parameters. No exceptions.
- Use `safeParse`, not `parse`, in route handlers, and convert the error with `error.flatten().fieldErrors` into the `errors` object.
- Query parameters arrive as strings, so numeric filters must use `z.coerce.number()`. Plain `z.number()` rejects every query parameter.
- `.trim()` on every free-text string before length checks, so whitespace cannot satisfy a minimum length.
- Enums are defined once as `as const` arrays in `lib/constants.ts` and reused in both the Zod schema and the Mongoose schema. Two copies of the same enum will drift.
