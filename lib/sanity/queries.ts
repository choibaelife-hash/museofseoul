import { defineQuery } from "next-sanity";

const listProjection = `{
  title,
  "slug": slug.current,
  category,
  publishedAt,
  excerpt,
  mainImage,
}`;

export const allPostsQuery = defineQuery(
  `*[_type == "post" && defined(slug.current)] | order(publishedAt desc) ${listProjection}`,
);

export const latestPostsQuery = defineQuery(
  `*[_type == "post" && defined(slug.current)] | order(publishedAt desc) [0...$limit] ${listProjection}`,
);

export const postsByCategoryQuery = defineQuery(
  `*[_type == "post" && category == $category && defined(slug.current)] | order(publishedAt desc) ${listProjection}`,
);

export const insiderPostsQuery = defineQuery(
  `*[_type == "post" && category == "beauty" && defined(subcategory) && !(_id in path("drafts.**"))] | order(publishedAt desc) [0...3] {
    _id,
    title,
    "slug": slug.current,
    mainImage,
    subcategory,
    excerpt,
    quickInfo { price, location, duration },
  }`,
);

export const postBySlugQuery = defineQuery(
  `*[_type == "post" && slug.current == $slug][0]{
    title,
    "slug": slug.current,
    category,
    publishedAt,
    author,
    excerpt,
    mainImage,
    body,
    quickInfo,
    faqSection,
    metaTitle,
    metaDescription,
    ogImage,
    keywords,
    canonical,
    noindex,
    schemaOrgType,
    isBusinessReview,
    business,
    twitterTitle,
    twitterDescription,
  }`,
);
