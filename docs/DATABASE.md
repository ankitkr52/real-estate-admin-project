# Database Specification — Real Estate Portal

Status: FROZEN. The three collections and their fields are locked. Do not add fields, do not rename fields, do not add a fourth collection. If a feature seems to need a new field, stop and ask the user.

---

## 1. Overview

| Item | Value |
|---|---|
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Collections | `users`, `properties`, `reviews` |
| Identifiers | Plain MongoDB `_id`. No slugs anywhere. |
| Money | `price` is a plain `Number` in INR. No currency field, no negotiable flag. |

### Serverless connection caching

Vercel invokes API routes as serverless functions. Each invocation may run in a fresh module scope but often reuses a warm container. Opening a new Mongoose connection per request exhausts the Atlas connection pool quickly. The connection helper must cache the connection and the in-flight connection promise on `globalThis`.

```typescript
// lib/db.ts — shape of the required cache
declare global {
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

// On call:
//   1. if cache.conn exists, return it
//   2. if cache.promise exists, await it (concurrent cold starts share one connect)
//   3. otherwise start mongoose.connect(...) and store the promise
//   4. on rejection, clear cache.promise so the next request can retry
```

Models must also be registered defensively, because hot reload in development re-executes model files:

```typescript
export const User = mongoose.models.User ?? mongoose.model<IUser>("User", userSchema);
```

---

## 2. Relationships Diagram

```
                    +---------------------+
                    |        User         |
                    +---------------------+
                    | _id                 |
                    | name                |
                    | email      (unique) |
                    | password            |
                    | phone               |
                    | avatar?             |
                    | role                |
                    | isEmailVerified     |
                    | favorites: [ObjId]  |--------------+
                    +---------------------+              |
                       |              |                  |
        createdBy      |              |  user            | ref: Property
        (admin only)   |              |                  | (many-to-many,
                       v              v                  |  stored on User)
            +---------------------+  +--------------------------+
            |      Property       |  |         Review           |
            +---------------------+  +--------------------------+
            | _id                 |<-| property      (ref)      |
            | title               |  | user          (ref)      |
            | description         |  | rating  1-5              |
            | type      (enum)    |  | comment                  |
            | price               |  | createdAt / updatedAt    |
            | bhk?                |  +--------------------------+
            | area                |       unique(property, user)
            | furnishing? (enum)  |
            | city                |            ^
            | address             |            |
            | images[]  max 5     |            | reviews are aggregated into
            | coverImage          |            | averageRating + reviewCount
            | contactPhone        |------------+ (denormalized onto Property)
            | contactWhatsApp     |
            | status    (enum)    |
            | viewCount           |
            | averageRating       |
            | reviewCount         |
            | createdBy    (ref)  |
            | createdAt/updatedAt |
            +---------------------+
```

Relationship summary:

| From | To | Cardinality | Stored as |
|---|---|---|---|
| User (admin) | Property | 1 to many | `Property.createdBy` reference |
| User | Property (favorites) | many to many | `User.favorites` array of ObjectId |
| User | Review | 1 to many | `Review.user` reference |
| Property | Review | 1 to many | `Review.property` reference |
| User + Property | Review | exactly 0 or 1 | compound unique index on Review |

---

## 3. User Collection

Collection name: `users`.

| Field | Type | Required | Default | Constraints / Notes |
|---|---|:---:|---|---|
| `_id` | ObjectId | auto | auto | Primary key |
| `name` | String | Yes | — | Trimmed, 2 to 60 characters |
| `email` | String | Yes | — | **Unique.** Lowercased and trimmed before save. Immutable after creation; no endpoint updates it. |
| `password` | String | Yes | — | bcrypt hash, cost factor 10. `select: false` so it is never returned by default. |
| `phone` | String | Yes | — | Indian mobile number, 10 digits. Stored as a string, never a number. |
| `avatar` | String | No | undefined | Cloudinary secure URL |
| `role` | String | Yes | `"user"` | Enum: `"user"`, `"admin"`. Never settable through any API. Only the seed script writes `"admin"`. |
| `isEmailVerified` | Boolean | Yes | `false` | Set to `true` only by the verify-email endpoint |
| `favorites` | [ObjectId] | Yes | `[]` | `ref: "Property"`. See section 7. |
| `createdAt` | Date | auto | auto | From `timestamps: true` |
| `updatedAt` | Date | auto | auto | From `timestamps: true` |

```typescript
interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  phone: string;
  avatar?: string;
  role: "user" | "admin";
  isEmailVerified: boolean;
  favorites: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
```

Notes:

- `password` carries `select: false`. Login must explicitly re-select it: `User.findOne({ email }).select("+password")`. Forgetting this produces a confusing "always wrong password" bug.
- Password hashing belongs in a `pre("save")` hook guarded by `isModified("password")`, so profile updates do not re-hash an already-hashed value.
- There are **no token fields**. See section 10.

### Indexes

| Index | Type | Purpose |
|---|---|---|
| `{ email: 1 }` | unique | Login lookup and duplicate-registration prevention |

---

## 4. Property Collection

Collection name: `properties`.

| Field | Type | Required | Default | Constraints / Notes |
|---|---|:---:|---|---|
| `_id` | ObjectId | auto | auto | Used directly in URLs. No slug field exists. |
| `title` | String | Yes | — | Trimmed, 5 to 120 characters |
| `description` | String | Yes | — | Trimmed, 20 to 5000 characters |
| `type` | String | Yes | — | Enum: `Apartment`, `House`, `Villa`, `Plot`, `Commercial` |
| `price` | Number | Yes | — | INR, positive. Single value, no range, no negotiable flag. |
| `bhk` | Number | No | undefined | Positive integer. Hidden in the UI for `Plot` and `Commercial`. Not stripped server-side; the UI decides. |
| `area` | Number | Yes | — | Square feet, positive |
| `furnishing` | String | No | undefined | Enum: `Furnished`, `Semi-Furnished`, `Unfurnished` |
| `city` | String | Yes | — | Must be a member of the `CITIES` constant. Stored as the display string. |
| `address` | String | Yes | — | Plain text. **No coordinates, no geo index.** Maps are out of scope. |
| `images` | [String] | Yes | `[]` | Cloudinary secure URLs. Maximum 5, enforced by Zod and by a schema validator. |
| `coverImage` | String | Yes | — | Cloudinary secure URL. Normally `images[0]`, but stored separately so the card never has to guess. |
| `contactPhone` | String | Yes | — | 10-digit Indian mobile, as a string |
| `contactWhatsApp` | String | Yes | — | 10-digit Indian mobile, as a string. May equal `contactPhone`. The `wa.me` link prefixes country code 91 at render time. |
| `status` | String | Yes | `"draft"` | Enum: `"draft"`, `"published"`. Created as draft always. |
| `viewCount` | Number | Yes | `0` | Incremented on every detail fetch |
| `averageRating` | Number | Yes | `0` | Denormalized. `0` means no reviews. See section 8. |
| `reviewCount` | Number | Yes | `0` | Denormalized. See section 8. |
| `createdBy` | ObjectId | Yes | — | `ref: "User"`. Always an admin. |
| `createdAt` | Date | auto | auto | Drives the "Newest" sort |
| `updatedAt` | Date | auto | auto | |

```typescript
interface IProperty {
  _id: Types.ObjectId;
  title: string;
  description: string;
  type: "Apartment" | "House" | "Villa" | "Plot" | "Commercial";
  price: number;
  bhk?: number;
  area: number;
  furnishing?: "Furnished" | "Semi-Furnished" | "Unfurnished";
  city: string;
  address: string;
  images: string[];
  coverImage: string;
  contactPhone: string;
  contactWhatsApp: string;
  status: "draft" | "published";
  viewCount: number;
  averageRating: number;
  reviewCount: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

### Indexes

| Index | Type | Purpose |
|---|---|---|
| `{ status: 1, createdAt: -1 }` | compound | The default public listing query: published, newest first. The single most common query in the app. |
| `{ status: 1, price: 1 }` | compound | Price-sorted listing, both directions (Mongo can walk an index backwards) |
| `{ status: 1, city: 1 }` | compound | City filter, which is the most-used filter and drives the home page city grid |
| `{ status: 1, type: 1 }` | compound | Type filter |

Every public index is prefixed with `status` because **every** public query filters on `status: "published"`. An index that does not lead with `status` will not be used efficiently by those queries.

Deliberately not indexed: `bhk`, `area`, `furnishing`. They are always applied together with `status` plus a leading filter, and the expected collection size for a portfolio project does not justify more index write cost. Revisit only if a real slow query appears.

---

## 5. Review Collection

Collection name: `reviews`.

| Field | Type | Required | Default | Constraints / Notes |
|---|---|:---:|---|---|
| `_id` | ObjectId | auto | auto | |
| `property` | ObjectId | Yes | — | `ref: "Property"` |
| `user` | ObjectId | Yes | — | `ref: "User"` |
| `rating` | Number | Yes | — | Integer 1 to 5 inclusive |
| `comment` | String | Yes | — | Trimmed, 5 to 1000 characters |
| `createdAt` | Date | auto | auto | Review list sorts newest first |
| `updatedAt` | Date | auto | auto | An edited review can be labelled "edited" by comparing the two |

```typescript
interface IReview {
  _id: Types.ObjectId;
  property: Types.ObjectId;
  user: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}
```

There is **no** `status`, `isApproved`, or `isFlagged` field. Reviews publish instantly, by design (BR-6). Adding such a field is building the FUTURE moderation feature.

### Indexes

| Index | Type | Purpose |
|---|---|---|
| `{ property: 1, user: 1 }` | **compound unique** | Enforces one review per user per property (BR-5) at the database level |
| `{ property: 1, createdAt: -1 }` | compound | Fetching a property's review list, newest first |

The unique index is the real enforcement. The application-level "have you already reviewed this?" check exists for a clean error message, but two simultaneous requests can both pass that check. The index is what actually prevents the duplicate, so the POST handler must also catch the resulting duplicate-key error (MongoServerError code `11000`) and translate it into the same clean error.

---

## 6. Index Summary

| Collection | Index | Unique | Query it serves |
|---|---|:---:|---|
| users | `{ email: 1 }` | Yes | Login, registration duplicate check |
| properties | `{ status: 1, createdAt: -1 }` | No | Public listing, default sort; admin listing when narrowed |
| properties | `{ status: 1, price: 1 }` | No | Public listing sorted by price ascending or descending |
| properties | `{ status: 1, city: 1 }` | No | City filter, home page city grid counts |
| properties | `{ status: 1, type: 1 }` | No | Property type filter |
| reviews | `{ property: 1, user: 1 }` | **Yes** | One-review-per-user enforcement |
| reviews | `{ property: 1, createdAt: -1 }` | No | Review list for a property |

---

## 7. Embedding vs Referencing Decisions

### Favorites as an array on User — embedded

Decision: `User.favorites: ObjectId[]`, not a `favorites` collection.

Reasoning:
- Every read is "what has *this* user favorited", which is a single document read with no join.
- Writes are `$addToSet` and `$pull`, both atomic and naturally idempotent, which gives the required idempotent-toggle behavior for free.
- The array is bounded in practice. A user favoriting thousands of properties is not a realistic scenario for this product, so the 16 MB document limit is not a concern.
- The only query the embedded form makes awkward is "who favorited this property", which no feature requires. The dashboard's total-favorites number is a one-line aggregation.

Cost accepted: the cascade delete must touch every user document that references the deleted property (`updateMany` with `$pull`). That is one indexed-free scan on a small collection, run rarely, by an admin.

### Reviews as their own collection — referenced

Decision: `reviews` is a separate collection, not an array embedded in Property.

Reasoning:
- Reviews are unbounded. A popular property could accumulate many, and embedding makes the property document grow without limit.
- The one-review-per-user rule is enforceable by a compound unique index only if reviews are documents. Inside an embedded array it would be application-level only, and therefore racy.
- Reviews need their own pagination and their own sort, independent of the property.
- Review edit and delete become single-document operations rather than array surgery.

Cost accepted: displaying a rating on a listing card would require a join. This is exactly why the rating is denormalized. See section 8.

### Images as a string array — embedded

Decision: `images: string[]` on Property.

Reasoning: hard-capped at 5, values are plain URLs, and they are never queried independently. A collection would be pure overhead.

### coverImage stored separately

Decision: `coverImage` is its own field even though it is usually `images[0]`.

Reasoning: the listing card needs exactly one URL. Making it explicit means the card never depends on array ordering, and the admin can pick a cover that is not the first image without reordering the gallery.

---

## 8. Denormalization: averageRating and reviewCount

### Why

Listing pages render up to `limit` property cards, each showing a star rating. Computing that live would mean an aggregation over `reviews` per page load. Storing the two numbers on the property turns it into a field read.

### Values

| Field | Meaning | Value with zero reviews |
|---|---|---|
| `averageRating` | Mean of all `rating` values for the property | `0` |
| `reviewCount` | Number of review documents for the property | `0` |

`averageRating` is stored rounded to one decimal place. The UI must treat `reviewCount === 0` as "no ratings yet" rather than rendering a zero-star display — `0` is a sentinel, not a real rating.

### When it recalculates

On **every** review create, update, and delete. There is no background job and no lazy recalculation.

### The recalculation procedure

Always recalculate from the full set of reviews. Never apply an incremental delta.

```typescript
// lib/rating.ts
export async function recalcPropertyRating(propertyId: Types.ObjectId) {
  const [agg] = await Review.aggregate([
    { $match: { property: propertyId } },
    { $group: { _id: "$property", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  await Property.findByIdAndUpdate(propertyId, {
    averageRating: agg ? Math.round(agg.avg * 10) / 10 : 0,
    reviewCount: agg ? agg.count : 0,
  });
}
```

Recompute-from-source is chosen over incremental updates deliberately. An incremental update (`avg = (avg * count + newRating) / (count + 1)`) drifts: every concurrent write, failed update, or manual database edit permanently corrupts the number with no way to detect it. Recomputing makes the last writer correct and makes any drift self-healing on the next review activity.

The aggregation returns an empty array when the property has no reviews, which is why the `agg ?` guard exists. Reading `agg.count` without it is the obvious bug here.

### Drift risk and rebuild

Drift can still occur if a review write succeeds and the subsequent property update fails, or if documents are edited directly in Atlas. Rebuild everything with:

```typescript
// scripts/rebuild-ratings.ts — run manually if numbers look wrong
const ids = await Property.distinct("_id");
for (const id of ids) await recalcPropertyRating(id);
```

---

## 9. Cascade Delete Flow

Triggered by `DELETE /api/admin/properties/:id` (BR-7). Order matters: remove dependents before the parent, so a mid-flow failure leaves orphans pointing at a property that still exists rather than reviews pointing at nothing.

```
Step 1  Verify the property exists         Property.findById(id)
        Not found -> 404, stop.

Step 2  Delete all its reviews             Review.deleteMany({ property: id })

Step 3  Clean up favorites everywhere      User.updateMany(
                                             { favorites: id },
                                             { $pull: { favorites: id } }
                                           )

Step 4  Delete the property                Property.findByIdAndDelete(id)

Step 5  Respond                            { success: true, data: { deleted: true } }
```

```typescript
export async function deletePropertyCascade(id: string) {
  const property = await Property.findById(id);
  if (!property) return null;

  await Review.deleteMany({ property: property._id });
  await User.updateMany(
    { favorites: property._id },
    { $pull: { favorites: property._id } }
  );
  await Property.findByIdAndDelete(property._id);

  return property;
}
```

Notes:

- Cloudinary images are **not** deleted. Removing them requires storing each image's `public_id`, and the locked schema stores URLs only. Orphaned images on Cloudinary are an accepted cost of the frozen schema.
- No transaction is used. Atlas supports them, but the steps are independently idempotent: rerunning the delete after a partial failure converges to the correct state. If a failure is observed between steps 2 and 4, simply call the endpoint again.
- Unpublishing is **not** a delete. Unpublish leaves reviews and favorites untouched; only `status` changes.

---

## 10. Token Handling: Why There Are No Token Fields

The User schema has no `emailVerificationToken`, no `passwordResetToken`, and no `passwordResetExpires`. This is deliberate and was decided explicitly (BR-12).

Email-verification and password-reset tokens are **stateless signed JWTs**:

```typescript
// lib/token.ts
type Purpose = "verify-email" | "reset-password";

export function createActionToken(userId: string, purpose: Purpose) {
  return jwt.sign({ sub: userId, purpose }, process.env.JWT_SECRET!, {
    expiresIn: purpose === "verify-email" ? "24h" : "1h",
  });
}

export function verifyActionToken(token: string, expected: Purpose) {
  const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
    sub: string;
    purpose: Purpose;
  };
  if (payload.purpose !== expected) throw new Error("wrong token purpose");
  return payload.sub;
}
```

The `purpose` claim must always be checked. Without it, a verification token would be accepted as a password-reset token, which is a privilege escalation.

| Property | Consequence |
|---|---|
| Nothing is stored | The locked User schema stays exactly as written |
| No database round-trip to validate | Verification and reset are one signature check |
| **Cannot be revoked early** | A reset link stays usable until it expires, even after the password has already been changed. Accepted; mitigated by the short 1-hour reset lifetime. |
| Rotating `JWT_SECRET` invalidates everything | Outstanding verification and reset links break. Acceptable, since the user can request a new one. |

The same `JWT_SECRET` signs the session cookie. Session tokens carry no `purpose` claim, so an action token cannot be used as a session and vice versa, provided every consumer checks the claims it expects.

---

## 11. Seed Script Contract

File: `scripts/seed.ts`. Run with `npm run seed`.

The seed script is the **only** way an admin account comes into existence (BR-11).

What it does:

1. Connects using `MONGODB_URI` from the environment.
2. Creates (or updates in place, keyed on email) one admin user:

| Field | Value |
|---|---|
| `email` | From `SEED_ADMIN_EMAIL` |
| `password` | From `SEED_ADMIN_PASSWORD`, hashed by the same `pre("save")` hook as any other user |
| `role` | `"admin"` |
| `isEmailVerified` | `true` — the admin never goes through the email flow |
| `name`, `phone` | Placeholder values, editable afterwards from `/profile` |

3. Optionally inserts a small set of sample properties, all with `createdBy` set to the admin's `_id` and a mix of `draft` and `published` so both listing paths have data.
4. Ensures indexes exist by calling `syncIndexes()` on each model.
5. Disconnects and exits with code 0, or logs and exits non-zero on failure.

Rules:

- The script must be **idempotent**. Running it twice must not create a second admin or duplicate the sample properties. Key on `email` for the admin and on `title` plus `city` for samples.
- It must never delete real data. No `deleteMany({})` unless the user explicitly asks for a reset script, which is a separate file.
- Credentials come from environment variables only. Never hardcode an admin password in the repository.
