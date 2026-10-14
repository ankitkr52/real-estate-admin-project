import type { PropertyType, Furnishing, City } from "@/lib/constants";

export type PropertyCardData = {
  _id: string;
  title: string;
  type: PropertyType;
  price: number;
  bhk?: number;
  area: number;
  furnishing?: Furnishing;
  city: City;
  coverImage: string;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
};

export type PropertyDetailData = {
  _id: string;
  title: string;
  description: string;
  type: PropertyType;
  price: number;
  bhk?: number;
  area: number;
  furnishing?: Furnishing;
  city: City;
  address: string;
  images: string[];
  coverImage: string;
  contactPhone: string;
  contactWhatsApp: string;
  viewCount: number;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PropertyListResponse = {
  properties: PropertyCardData[];
  pagination: Pagination;
};

export type PropertyDetailResponse = {
  property: PropertyDetailData;
  isFavorited: boolean;
};
