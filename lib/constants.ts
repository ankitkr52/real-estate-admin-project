export const CITIES = [
  "Mumbai",
  "Bengaluru",
  "Delhi",
  "Pune",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Ahmedabad",
] as const;

export type City = (typeof CITIES)[number];

export const PROPERTY_TYPES = [
  "Apartment",
  "House",
  "Villa",
  "Plot",
  "Commercial",
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const FURNISHING = [
  "Furnished",
  "Semi-Furnished",
  "Unfurnished",
] as const;

export type Furnishing = (typeof FURNISHING)[number];

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];
