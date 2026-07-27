import type { PortableTextBlock } from "next-sanity";
import type { Category } from "@/lib/site";

// Images are stored as {url, alt} objects — uploaded to R2, not Sanity's
// asset pipeline. See studio/schemaTypes/post.ts.
export type PostImage = {
  url: string;
  alt: string;
};

// Mirrors the Sanity `post` schema in studio/schemaTypes/post.ts.
export type QuickInfo = {
  price?: string;
  location?: string;
  english?: boolean;
  bookingUrl?: string;
  duration?: string;
  painLevel?: number;
  affiliateLinks?: { label: string; url: string; platform: string }[];
};

export type Faq = {
  question: string;
  answer: string;
};

export type Post = {
  title: string;
  slug: string;
  category: Category["slug"];
  subcategory?: string;
  publishedAt: string;
  mainImage?: PostImage;
  excerpt: string;
  body?: PortableTextBlock[];
  quickInfo?: QuickInfo;
  faqSection?: Faq[];
};

export type InsiderPost = {
  _id: string;
  title: string;
  slug: string;
  mainImage?: PostImage;
  subcategory?: string;
  excerpt: string;
  quickInfo?: Pick<QuickInfo, "price" | "location" | "duration">;
};
