import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HeroImage } from "@/components/HeroImage";
import { CategoryBadge } from "@/components/CategoryBadge";
import { QuickInfoBox } from "@/components/QuickInfoBox";
import { PostBody } from "@/components/PostBody";
import { FAQSection } from "@/components/FAQSection";
import { RelatedPosts } from "@/components/RelatedPosts";
import { NewsletterCTA } from "@/components/NewsletterCTA";
import { sanityFetch } from "@/lib/sanity/fetch";
import { postBySlugQuery } from "@/lib/sanity/queries";
import { siteConfig } from "@/lib/site";
import type { Post } from "@/lib/types";

// Cached so generateMetadata and the page component share one Sanity fetch.
const getPost = cache(async (slug: string) => {
  const { data } = await sanityFetch<Post | null>({
    query: postBySlugQuery,
    params: { slug },
  });
  return data;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt;
  const ogImage = post.ogImage?.url || post.mainImage?.url;
  const canonical = post.canonical || `/blog/${post.slug}`;

  return {
    title,
    description,
    keywords: post.keywords,
    alternates: { canonical },
    robots: post.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.publishedAt,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.twitterTitle || title,
      description: post.twitterDescription || description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

function buildJsonLd(post: Post) {
  const url = `${siteConfig.url}/blog/${post.slug}`;
  const image = post.ogImage?.url || post.mainImage?.url;

  const main: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": post.schemaOrgType || "BlogPosting",
    headline: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    datePublished: post.publishedAt,
    mainEntityOfPage: url,
    author: { "@type": "Person", name: post.author || "Kyungmin" },
    ...(image ? { image } : {}),
  };

  if (post.isBusinessReview && post.business) {
    main.itemReviewed = {
      "@type": "LocalBusiness",
      name: post.business.name,
      address: post.business.address,
    };
  }

  const faqLd =
    post.faqSection && post.faqSection.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.faqSection.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: { "@type": "Answer", text: faq.answer },
          })),
        }
      : null;

  return { main, faqLd };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const typedPost = post;
  const { main: mainJsonLd, faqLd } = buildJsonLd(typedPost);

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(mainJsonLd) }}
      />
      {faqLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      ) : null}

      <HeroImage src={typedPost.mainImage?.url} alt={typedPost.title} />

      <div className="mt-6 flex flex-col gap-3">
        <CategoryBadge slug={typedPost.category} />
        <h1 className="font-serif text-3xl">{typedPost.title}</h1>
        <time className="text-sm text-black/50" dateTime={typedPost.publishedAt}>
          {new Date(typedPost.publishedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
      </div>

      {typedPost.quickInfo ? (
        <div className="mt-8">
          <QuickInfoBox info={typedPost.quickInfo} />
        </div>
      ) : null}

      {typedPost.body ? (
        <div className="mt-8">
          <PostBody value={typedPost.body} />
        </div>
      ) : null}

      {typedPost.faqSection ? (
        <div className="mt-12">
          <FAQSection faq={typedPost.faqSection} />
        </div>
      ) : null}

      <div className="mt-12">
        <RelatedPosts posts={[]} />
      </div>

      <div className="mt-12">
        <NewsletterCTA />
      </div>
    </article>
  );
}
