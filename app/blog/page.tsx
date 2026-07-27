import Link from "next/link";
import type { Metadata } from "next";
import { PostCard } from "@/components/PostCard";
import { categories } from "@/lib/site";
import { sanityFetch } from "@/lib/sanity/fetch";
import { allPostsQuery } from "@/lib/sanity/queries";
import type { Post } from "@/lib/types";

export const metadata: Metadata = {
  title: "Blog",
  description: "All posts on beauty, food, and life in Seoul.",
};

export default async function BlogPage() {
  const { data: posts } = await sanityFetch<Post[]>({ query: allPostsQuery });

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-serif text-3xl">Blog</h1>

      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-black px-3 py-1 text-white">All</span>
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/category/${category.slug}`}
            className="rounded-full border border-black/20 px-3 py-1 hover:bg-black/5"
          >
            {category.label}
          </Link>
        ))}
      </div>

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
