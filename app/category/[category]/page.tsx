import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PostCard } from "@/components/PostCard";
import { categories, getCategory } from "@/lib/site";
import { sanityFetch } from "@/lib/sanity/fetch";
import { postsByCategoryQuery } from "@/lib/sanity/queries";
import type { Post } from "@/lib/types";

export function generateStaticParams() {
  return categories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};

  return {
    title: category.label,
    description: category.description,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = getCategory(slug);

  if (!category) {
    notFound();
  }

  const { data: posts } = await sanityFetch<Post[]>({
    query: postsByCategoryQuery,
    params: { category: category.slug },
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-serif text-3xl">{category.label}</h1>
      <p className="mt-2 max-w-xl text-black/60">{category.description}</p>

      {posts.length === 0 ? (
        <p className="mt-10 text-sm text-black/50">New posts coming soon.</p>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
