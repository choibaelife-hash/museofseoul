import Link from "next/link";
import { categories, siteConfig } from "@/lib/site";

export function Header() {
  return (
    <header className="border-b border-black/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-serif text-xl tracking-tight">
          {siteConfig.name}
        </Link>

        <nav className="flex items-center gap-8 text-sm">
          <Link href="/">Home</Link>

          <div className="group relative">
            <Link href="/blog">Blog</Link>
            <div className="invisible absolute left-0 top-full z-10 w-56 rounded-md border border-black/10 bg-white p-2 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/category/${category.slug}`}
                  className="block rounded px-3 py-2 hover:bg-black/5"
                >
                  {category.label}
                </Link>
              ))}
            </div>
          </div>

          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </div>
    </header>
  );
}
