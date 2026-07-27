import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import Link from "next/link";
import { StatsBar } from "@/components/StatsBar";
import { NewsletterCTA } from "@/components/NewsletterCTA";
import { SeoulBeautyInsider } from "@/components/sections/SeoulBeautyInsider";
import { categories, getCategory, siteConfig } from "@/lib/site";
import { sanityFetch } from "@/lib/sanity/fetch";
import { insiderPostsQuery, latestPostsQuery } from "@/lib/sanity/queries";
import type { InsiderPost, Post } from "@/lib/types";

const outlineButton =
  "inline-block border border-foreground px-5 py-2.5 text-xs uppercase tracking-widest text-foreground transition-colors hover:bg-foreground hover:text-white";

const categoryTileColors = ["bg-mauve/10", "bg-aqua/20", "bg-cream", "bg-mauve/5", "bg-aqua/10"];

// Categories fall back to a color tile until the real photo is dropped
// into /public — see the `image` field in lib/site.ts.
function categoryImageExists(image: string) {
  return fs.existsSync(path.join(process.cwd(), "public", image));
}

function LatestPostsSection({
  eyebrow,
  title,
  posts,
}: {
  eyebrow: string;
  title: string;
  posts: Post[];
}) {
  return (
    <section className="mx-auto w-full max-w-6xl px-6">
      <div className="mb-10 flex items-end justify-between gap-4 border-b border-foreground/10 pb-5">
        <div>
          <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.2em] text-mauve">
            {eyebrow}
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl">{title}</h2>
        </div>
        <Link href="/blog" className={`${outlineButton} hidden sm:inline-block`}>
          See more
        </Link>
      </div>
      {posts.length === 0 ? (
        <p className="text-sm text-foreground/50">New posts coming soon.</p>
      ) : (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
              <div className="relative mb-4 aspect-[4/3] overflow-hidden bg-black/5">
                {post.mainImage ? (
                  <Image
                    src={post.mainImage.url}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : null}
              </div>
              <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-mauve">
                {getCategory(post.category)?.label}
              </span>
              <h3 className="mt-2 mb-2 font-serif text-lg leading-snug group-hover:underline">
                {post.title}
              </h3>
              <p className="mb-4 line-clamp-3 text-xs leading-relaxed text-foreground/60">
                {post.excerpt}
              </p>
              <time className="text-[11px] text-foreground/40" dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function Home() {
  const { data } = await sanityFetch<Post[]>({
    query: latestPostsQuery,
    params: { limit: 9 },
  });
  const { data: insiderPosts } = await sanityFetch<InsiderPost[]>({
    query: insiderPostsQuery,
  });
  const posts = data;
  const [mainFeatured, ...rest] = posts;
  const popularPosts = rest.slice(0, 3);
  const beautyPosts = rest
    .filter((post) => post.category === "beauty" || post.category === "k-beauty")
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* Hero */}
      {mainFeatured ? (
        <section className="grid grid-cols-1 border-b border-foreground/10 md:grid-cols-2">
          <div className="flex flex-col justify-center bg-cream/40 px-6 py-12 sm:px-10 md:px-16">
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-mauve">
              {getCategory(mainFeatured.category)?.label ?? "Featured"}
            </span>
            <h1 className="font-serif text-4xl leading-tight sm:text-5xl">
              {mainFeatured.title}
            </h1>
            <p className="mt-4 max-w-md text-sm text-foreground/60">{mainFeatured.excerpt}</p>
            <Link
              href={`/blog/${mainFeatured.slug}`}
              className={`${outlineButton} mt-6 self-start`}
            >
              Read now
            </Link>
          </div>
          <div className="relative min-h-[320px] overflow-hidden bg-black/5 md:min-h-full">
            {mainFeatured.mainImage ? (
              <Image
                src={mainFeatured.mainImage.url}
                alt={mainFeatured.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-black/40">
                Image pending
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 pt-16 text-center">
          <h1 className="font-serif text-4xl sm:text-5xl">{siteConfig.tagline}</h1>
          <p className="max-w-xl text-foreground/60">Beauty, Food & Life in Seoul</p>
          <Link href="/blog" className={`mt-2 ${outlineButton}`}>
            Explore →
          </Link>
        </section>
      )}

      {(siteConfig.stats.youtubeSubscribers !== undefined ||
        siteConfig.stats.xiaohongshuFollowers !== undefined) && (
        <div className="mx-auto w-full max-w-6xl px-6">
          <StatsBar />
        </div>
      )}

      {/* Dive into Beauty — category grid */}
      <section className="mx-auto grid w-full grid-cols-1 border-y border-foreground/10 md:grid-cols-6">
        <div className="flex flex-col justify-between gap-6 border-b border-foreground/10 p-8 md:col-span-1 md:border-b-0 md:border-r md:p-10">
          <div>
            <span className="mb-3 block text-[10px] font-medium uppercase tracking-[0.2em] text-mauve">
              Categories
            </span>
            <h2 className="font-serif text-2xl leading-snug sm:text-3xl">
              Muse of Seoul
              <br />
              Beauty
            </h2>
          </div>
          <Link href="/blog" className={`${outlineButton} self-start`}>
            See more
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:col-span-5 md:grid-cols-4">
          {categories.map((category, i) => {
            const hasImage = categoryImageExists(category.image);
            return (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className={`group relative flex aspect-[3/4] flex-col justify-end overflow-hidden border-b border-r border-foreground/10 p-5 last:border-r-0 ${hasImage ? "" : categoryTileColors[i % categoryTileColors.length]}`}
              >
                {hasImage ? (
                  <>
                    <Image
                      src={category.image}
                      alt={category.label}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </>
                ) : null}
                <div className="relative flex items-center justify-between">
                  <span className={`text-sm font-medium ${hasImage ? "text-white" : ""}`}>
                    {category.label}
                  </span>
                  <span
                    className={`text-lg transition-transform group-hover:translate-x-1 ${hasImage ? "text-white/80" : "text-foreground/40"}`}
                  >
                    →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Popular Posts — image + title only */}
      {popularPosts.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-6">
          <h2 className="mb-6 font-serif text-2xl">Popular Posts</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {popularPosts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
                <div className="relative mb-3 aspect-square overflow-hidden bg-black/5">
                  {post.mainImage ? (
                    <Image
                      src={post.mainImage.url}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : null}
                </div>
                <h3 className="font-serif text-base leading-snug group-hover:underline">
                  {post.title}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      <SeoulBeautyInsider posts={insiderPosts} />

      <LatestPostsSection
        eyebrow="Just Published"
        title="My Newest Beauty Stories"
        posts={beautyPosts}
      />

      {/* TODO: replace with the real Instagram carousel embed once the account is connected */}
      <section className="mx-auto w-full max-w-6xl px-6">
        <div className="mb-6">
          <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.2em] text-mauve">
            Follow Along
          </span>
          <h2 className="font-serif text-2xl">Card News on Instagram</h2>
        </div>
        <div className="flex items-center justify-center rounded-lg border border-dashed border-foreground/20 bg-black/5 px-6 py-16 text-sm text-foreground/40">
          Instagram carousel — coming soon
        </div>
      </section>

      {/* About preview */}
      <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-6 text-center">
        <div className="h-24 w-24 rounded-full bg-mauve/20" />
        <h2 className="font-serif text-2xl">Hi, I&apos;m Kyungmin</h2>
        <p className="max-w-md text-sm text-foreground/60">
          I live in Seoul and write about the beauty treatments, cafes, and
          neighborhoods I actually visit — in plain English, with real prices.
        </p>
        <Link href="/about" className="text-sm underline">
          Read More →
        </Link>
      </section>

      <div className="mx-auto w-full max-w-6xl px-6">
        <NewsletterCTA />
      </div>
    </div>
  );
}
