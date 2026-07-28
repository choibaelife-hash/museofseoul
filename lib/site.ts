export type Category = {
  slug: "where-to-go" | "stay" | "beauty" | "k-beauty";
  label: string;
  description: string;
  // Drop a 3:4 photo at this path in /public to light it up — falls back
  // to a solid color tile until the file exists.
  image: string;
};

export const categories: Category[] = [
  {
    slug: "beauty",
    label: "K-Beauty Treatments",
    description: "Clinics, skincare treatments, and honest reviews.",
    image: "/categories/beauty.jpg",
  },
  {
    slug: "k-beauty",
    label: "K-Beauty Products",
    description: "Product reviews and what's actually worth buying.",
    image: "/categories/k-beauty.jpg",
  },
  {
    slug: "stay",
    label: "Stay in Seoul",
    description: "Hotels and neighborhoods to base yourself in.",
    image: "/categories/stay.jpg",
  },
  {
    slug: "where-to-go",
    label: "Where to Go in Seoul",
    description: "Neighborhood guides, cafes, and restaurants worth the trip.",
    image: "/categories/where-to-go.jpg",
  },
];

export const siteConfig = {
  name: "Muse of Seoul",
  tagline: "Seoul through a local's eyes",
  description: "K-beauty insider Blog — your guide to beauty clinics, tours, and honest local tips in Seoul.",
  // TODO: replace with the production domain once deployed
  url: "https://museofseoul.com",
  // TODO: fill in with real counts before enabling the Stats section on Home
  stats: {
    youtubeSubscribers: undefined as number | undefined,
    xiaohongshuFollowers: undefined as number | undefined,
  },
  links: {
    youtube: undefined as string | undefined,
    xiaohongshu: undefined as string | undefined,
  },
};

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}

// Seoul Beauty Insider — subcategories under K-Beauty Treatments only.
// See docs/02-design-decisions.md for the full spec.
export const insiderSubcategories = [
  { slug: "k-clinic", label: "K-Clinic" },
  { slug: "body-spa", label: "Body & Spa" },
  { slug: "hair-makeup", label: "Hair & Makeup" },
  { slug: "skin-face", label: "Skin & Face" },
];

export function getInsiderSubcategory(slug?: string) {
  return insiderSubcategories.find((s) => s.slug === slug);
}
