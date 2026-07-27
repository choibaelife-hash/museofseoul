import Link from "next/link";
import { HeroImage } from "@/components/HeroImage";
import { CategoryBadge } from "@/components/CategoryBadge";
import type { Post } from "@/lib/types";

export function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <HeroImage src={post.mainImage?.url} alt={post.title} />
      <div className="mt-3 flex flex-col gap-2">
        <CategoryBadge slug={post.category} asLink={false} />
        <h3 className="font-serif text-lg leading-snug group-hover:underline">
          {post.title}
        </h3>
        <time className="text-xs text-black/50" dateTime={post.publishedAt}>
          {new Date(post.publishedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
      </div>
    </Link>
  );
}
