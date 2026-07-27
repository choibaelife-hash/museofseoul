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
import type { Post } from "@/lib/types";

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data: post } = await sanityFetch<Post | null>({
    query: postBySlugQuery,
    params: { slug },
  });

  if (!post) {
    notFound();
  }

  const typedPost = post;

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
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
