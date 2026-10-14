// Idempotent seed for the Real Estate Portal.
// Creates (or leaves untouched) one admin user and six sample properties.
// Run with `npm run seed`. Safe to run repeatedly: no duplicates, no overwrites.
//
// Cloudinary seed images (generated via the cloudinary MCP, stored in the
// user's Cloudinary account under realestate/seed/*). If any need to be
// regenerated or cleaned up later, use these identifiers:
//
//   public_id                                        asset_id
//   realestate/seed/apartment-mumbai-bandra          3f2cd5515192aa9995a0bddede2849b2
//   realestate/seed/apartment-bengaluru-indiranagar  cc20a58b165b168b7b3cae3246bc8394
//   realestate/seed/house-pune-baner                 328c2d386b3ad1f20459a686c0250304
//   realestate/seed/villa-hyderabad-jubilee          142d89056c480a0ce91b763467ee65ea
//   realestate/seed/plot-chennai-omr                 1abfa0ed83953388840b6eeee54f998c
//   realestate/seed/commercial-delhi-nehru           eec0922f3cc1c4bf5250a376f067c839

import { config as loadEnv } from "dotenv";
// Next.js auto-loads .env.local during dev; a plain Node script does not.
// Load .env.local first (preferred), then fall back to .env for anything missing.
loadEnv({ path: ".env.local" });
loadEnv();
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Property } from "@/models/Property";
import { Review } from "@/models/Review";

const SEED_IMAGE_URLS = {
  apartmentMumbai:
    "https://res.cloudinary.com/dubscrn25/image/upload/v1791976514/realestate/seed/apartment-mumbai-bandra.jpg",
  apartmentBengaluru:
    "https://res.cloudinary.com/dubscrn25/image/upload/v1791976535/realestate/seed/apartment-bengaluru-indiranagar.jpg",
  housePune:
    "https://res.cloudinary.com/dubscrn25/image/upload/v1791976558/realestate/seed/house-pune-baner.jpg",
  villaHyderabad:
    "https://res.cloudinary.com/dubscrn25/image/upload/v1791976581/realestate/seed/villa-hyderabad-jubilee.jpg",
  plotChennai:
    "https://res.cloudinary.com/dubscrn25/image/upload/v1791976604/realestate/seed/plot-chennai-omr.jpg",
  commercialDelhi:
    "https://res.cloudinary.com/dubscrn25/image/upload/v1791976627/realestate/seed/commercial-delhi-nehru.jpg",
} as const;

type PropertySeed = {
  title: string;
  description: string;
  type: "Apartment" | "House" | "Villa" | "Plot" | "Commercial";
  price: number;
  bhk?: number;
  area: number;
  furnishing?: "Furnished" | "Semi-Furnished" | "Unfurnished";
  city: string;
  address: string;
  image: string;
  contactPhone: string;
  contactWhatsApp: string;
  status: "draft" | "published";
};

const PROPERTY_SEEDS: PropertySeed[] = [
  {
    title: "Sunlit 2BHK near Bandra Station",
    description:
      "Bright, airy 2BHK apartment on the 12th floor with floor-to-ceiling windows and skyline views. Modular kitchen, two covered balconies, and dedicated parking. Walking distance to Bandra station and Linking Road.",
    type: "Apartment",
    price: 32500000,
    bhk: 2,
    area: 1050,
    furnishing: "Semi-Furnished",
    city: "Mumbai",
    address: "Hill Road, Bandra West, Mumbai 400050",
    image: SEED_IMAGE_URLS.apartmentMumbai,
    contactPhone: "9820012345",
    contactWhatsApp: "9820012345",
    status: "published",
  },
  {
    title: "Spacious 3BHK in Indiranagar",
    description:
      "Thoughtfully laid out 3BHK with a wrap-around balcony overlooking a tree-lined street. Vitrified tile flooring, piped gas, and a shared rooftop deck. Perfectly positioned between 100 Feet Road and CMH Road.",
    type: "Apartment",
    price: 21500000,
    bhk: 3,
    area: 1480,
    furnishing: "Furnished",
    city: "Bengaluru",
    address: "12th Main, Indiranagar, Bengaluru 560038",
    image: SEED_IMAGE_URLS.apartmentBengaluru,
    contactPhone: "9731045678",
    contactWhatsApp: "9731045678",
    status: "draft",
  },
  {
    title: "Garden House in Baner",
    description:
      "Independent two-story 4BHK with a Mangalore tile roof and a landscaped front garden. Four bedrooms, a double-height living room, servant quarters, and parking for three cars. A short drive from Balewadi High Street.",
    type: "House",
    price: 42500000,
    bhk: 4,
    area: 2800,
    furnishing: "Unfurnished",
    city: "Pune",
    address: "Baner Pashan Link Road, Pune 411045",
    image: SEED_IMAGE_URLS.housePune,
    contactPhone: "9822098765",
    contactWhatsApp: "9822098765",
    status: "published",
  },
  {
    title: "Hilltop Villa in Jubilee Hills",
    description:
      "Four-bedroom luxury villa with a private swimming pool, open lawn, and double-height glass facade. Imported kitchen, home theatre, and staff accommodation. Gated community with 24x7 security on a quiet lane in Jubilee Hills.",
    type: "Villa",
    price: 115000000,
    bhk: 4,
    area: 5600,
    furnishing: "Semi-Furnished",
    city: "Hyderabad",
    address: "Road No. 36, Jubilee Hills, Hyderabad 500033",
    image: SEED_IMAGE_URLS.villaHyderabad,
    contactPhone: "9849056789",
    contactWhatsApp: "9849056789",
    status: "published",
  },
  {
    title: "Residential Plot near OMR",
    description:
      "Rectangular residential plot of 2400 sq ft, east-facing, on a 30-foot internal road in a DTCP-approved layout. Clear title, boundary stones in place, and all amenities within 2 km. Ready for construction.",
    type: "Plot",
    price: 7200000,
    area: 2400,
    city: "Chennai",
    address: "Padur Village, OMR, Chennai 603103",
    image: SEED_IMAGE_URLS.plotChennai,
    contactPhone: "9840034567",
    contactWhatsApp: "9840034567",
    status: "published",
  },
  {
    title: "Office Floor in Nehru Place",
    description:
      "Entire fifth-floor commercial office with 3200 sq ft of carpet area, glass partitions, raised flooring, and dedicated backup power. Attached pantry and two cabins. Walkable to Nehru Place metro station.",
    type: "Commercial",
    price: 55000000,
    area: 3200,
    furnishing: "Furnished",
    city: "Delhi",
    address: "Nehru Place, New Delhi 110019",
    image: SEED_IMAGE_URLS.commercialDelhi,
    contactPhone: "9910023456",
    contactWhatsApp: "9910023456",
    status: "draft",
  },
];

async function main() {
  const { MONGODB_URI, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } = process.env;
  if (!MONGODB_URI) throw new Error("MONGODB_URI is not set");
  if (!SEED_ADMIN_EMAIL) throw new Error("SEED_ADMIN_EMAIL is not set");
  if (!SEED_ADMIN_PASSWORD) throw new Error("SEED_ADMIN_PASSWORD is not set");

  await connectDB();
  console.log("Connected to MongoDB.");

  // Ensure indexes exist (including the unique ones) BEFORE any upsert.
  await Promise.all([User.syncIndexes(), Property.syncIndexes(), Review.syncIndexes()]);
  console.log("Indexes synced.");

  // Admin: insert if missing; leave existing admin untouched so re-running
  // the seed never re-hashes the password or stomps profile edits.
  let admin = await User.findOne({ email: SEED_ADMIN_EMAIL.toLowerCase() });
  if (!admin) {
    admin = new User({
      name: "Admin",
      email: SEED_ADMIN_EMAIL,
      password: SEED_ADMIN_PASSWORD,
      phone: "9999999999",
      role: "admin",
      isEmailVerified: true,
    });
    await admin.save();
    console.log(`Admin created: ${admin.email} (${admin._id})`);
  } else {
    console.log(`Admin already exists: ${admin.email} (${admin._id})`);
  }

  // Properties: insert if missing on (title, city). Mirrors the admin
  // pattern: re-running the seed never stomps edits to an existing sample.
  let createdCount = 0;
  for (const seed of PROPERTY_SEEDS) {
    const existing = await Property.findOne({ title: seed.title, city: seed.city });
    if (existing) {
      console.log(`existed: ${seed.title} [${seed.city}, ${existing.status}]`);
      continue;
    }
    await Property.create({
      title: seed.title,
      description: seed.description,
      type: seed.type,
      price: seed.price,
      ...(seed.bhk !== undefined ? { bhk: seed.bhk } : {}),
      area: seed.area,
      ...(seed.furnishing !== undefined ? { furnishing: seed.furnishing } : {}),
      city: seed.city,
      address: seed.address,
      images: [seed.image],
      coverImage: seed.image,
      contactPhone: seed.contactPhone,
      contactWhatsApp: seed.contactWhatsApp,
      status: seed.status,
      createdBy: admin._id,
    });
    createdCount += 1;
    console.log(`created: ${seed.title} [${seed.city}, ${seed.status}]`);
  }

  console.log(
    `\nSeed complete. ${createdCount} property document(s) inserted this run, ${PROPERTY_SEEDS.length - createdCount} already existed.`,
  );
}

main()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("Seed failed:", err);
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
    process.exit(1);
  });
