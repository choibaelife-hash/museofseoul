import { PostCard } from "@/components/PostCard";
import type { Post } from "@/lib/types";

export function RelatedPosts({ posts }: { posts: Post[] }) {
  if (!posts.length) return null;

  return (
    <section>
      <h2 className="font-serif text-xl">Related Posts</h2>
      <div className="mt-4 grid grid-cols-1 gap-8 sm:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}
