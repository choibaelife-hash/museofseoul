import Image from "next/image";
import Link from "next/link";
import { getInsiderSubcategory } from "@/lib/site";
import type { InsiderPost } from "@/lib/types";

export function SeoulBeautyInsider({ posts }: { posts: InsiderPost[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="w-full bg-plum py-16 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex items-end justify-between gap-4 px-6">
          <div>
            <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.2em] text-aqua">
              ✦ Seoul Beauty Insider
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl">Seoul Locals' Beauty Edit </h2>
            <p className="mt-3 max-w-xl text-sm text-white/50">
              From skin clinics and body spas to hair rituals. what Seoul locals are actually booking right now. The real side of Korean wellness.
            </p>
          </div>
          <Link
            href="/beauty"
            className="hidden shrink-0 border border-white/40 px-5 py-2.5 text-xs uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-plum sm:inline-block"
          >
            See all →
          </Link>
        </div>

        <div className="flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-2">
          {posts.map((post) => {
            const subcategory = getInsiderSubcategory(post.subcategory);
            return (
              <Link
                key={post._id}
                href={`/blog/${post.slug}`}
                className="group block w-[280px] shrink-0 snap-start sm:w-[320px]"
              >
                <div className="relative mb-4 aspect-[3/4] overflow-hidden bg-white/10">
                  {post.mainImage ? (
                    <Image
                      src={post.mainImage.url}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  ) : null}
                  <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    ↗
                  </span>
                </div>
                {subcategory ? (
                  <span className="mb-3 inline-block bg-aqua px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-plum">
                    {subcategory.label}
                  </span>
                ) : null}
                <h3 className="font-serif text-lg leading-snug group-hover:underline">
                  {post.title}
                </h3>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
