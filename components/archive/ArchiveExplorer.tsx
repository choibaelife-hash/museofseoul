"use client";

import { useEffect, useRef, useState } from "react";
import { PostCard } from "@/components/PostCard";
import type { Category } from "@/lib/site";
import type { Post } from "@/lib/types";

// Same colors as the home category tiles (app/page.tsx), reused as-is.
const categoryColors: Record<Category["slug"], string> = {
  beauty: "rgba(115, 83, 100, 0.12)", // mauve
  "k-beauty": "rgba(172, 206, 209, 0.30)", // aqua
  stay: "rgba(239, 231, 218, 0.70)", // cream
  "where-to-go": "rgba(55, 38, 58, 0.08)", // plum
};

const BASE_GROW = 0.5; // compact band height, half of the old baseline
const ACTIVE_GROW = 6;

type Section = { category: Category; posts: Post[] };

export function ArchiveExplorer({ sections }: { sections: Section[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Continuous position in "section index" space (0..sections.length-1) —
  // driven by wheel input instead of real page scroll, so all 4 bands stay
  // on screen at once and just resize/fade as this moves.
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(progress);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onWheel(e: WheelEvent) {
      const max = sections.length - 1;
      const atStart = progressRef.current <= 0 && e.deltaY < 0;
      const atEnd = progressRef.current >= max && e.deltaY > 0;
      // Let the wheel event fall through to the page (to reach the header/
      // footer) once we're at either edge and still scrolling further that way.
      if (atStart || atEnd) return;
      e.preventDefault();
      setProgress((p) => Math.max(0, Math.min(max, p + e.deltaY * 0.003)));
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [sections.length]);

  const ratios = sections.map((_, i) => Math.max(0, 1 - Math.abs(progress - i)));

  return (
    <div ref={containerRef} className="flex h-screen flex-col overflow-hidden">
      {sections.map(({ category, posts }, i) => {
        const ratio = ratios[i];
        const isActive = ratio > 0.5;
        return (
          <div
            key={category.slug}
            className="flex min-h-0 flex-col overflow-hidden px-10 md:px-16"
            style={{
              flexGrow: BASE_GROW + ratio * (ACTIVE_GROW - BASE_GROW),
              flexBasis: 0,
              backgroundColor: categoryColors[category.slug],
            }}
          >
            <h2
              className={`shrink-0 pt-8 font-serif font-bold text-plum transition-all duration-300 ${
                isActive ? "text-6xl" : "text-lg opacity-70"
              }`}
            >
              {category.label}
            </h2>

            <div className="min-h-0 flex-1 overflow-hidden">
              <div
                className="flex h-full flex-col justify-center transition-opacity duration-200"
                style={{ opacity: ratio }}
              >
                {posts.length === 0 ? (
                  <p className="text-sm text-black/50">New posts coming soon.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {posts.map((post, idx) => (
                      <ArchiveCard
                        key={post.slug}
                        post={post}
                        active={isActive}
                        delay={idx * 120}
                        visibleFrom={idx === 1 ? "sm" : idx === 2 ? "lg" : undefined}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const visibilityClasses = {
  sm: "hidden sm:block",
  lg: "hidden lg:block",
};

function ArchiveCard({
  post,
  active,
  delay,
  visibleFrom,
}: {
  post: Post;
  active: boolean;
  delay: number;
  visibleFrom?: keyof typeof visibilityClasses;
}) {
  return (
    <div
      className={`rounded-lg transition-all duration-500 hover:-translate-y-1 hover:shadow-lg ${
        active ? "translate-y-0 opacity-100" : "translate-y-[14px] opacity-0"
      } ${visibleFrom ? visibilityClasses[visibleFrom] : ""}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <PostCard post={post} showCategory={false} imageAspect="aspect-square" />
    </div>
  );
}
