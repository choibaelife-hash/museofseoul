import Link from "next/link";
import { categories, siteConfig } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-black/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 text-sm text-black/60 sm:flex-row sm:justify-between">
        <div>
          <p className="font-serif text-lg text-black">{siteConfig.name}</p>
          <p className="mt-1 max-w-xs">{siteConfig.description}</p>
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-medium text-black">Categories</span>
          {categories.map((category) => (
            <Link key={category.slug} href={`/category/${category.slug}`}>
              {category.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-medium text-black">Elsewhere</span>
          {/* TODO: link to YouTube "경민 in Seoul" and 샤오홍슈 once URLs are confirmed */}
          <span>YouTube — Kyungmin in Seoul</span>
          <span>Xiaohongshu</span>
        </div>
      </div>
    </footer>
  );
}
