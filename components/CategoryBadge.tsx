import Link from "next/link";
import type { Category } from "@/lib/site";
import { getCategory } from "@/lib/site";

const badgeClassName =
  "inline-block rounded-full bg-black/5 px-3 py-1 text-xs font-medium uppercase tracking-wide";

// asLink: false when nested inside another <Link> (e.g. PostCard), since
// HTML doesn't allow an <a> inside another <a>.
export function CategoryBadge({
  slug,
  asLink = true,
}: {
  slug: Category["slug"];
  asLink?: boolean;
}) {
  const category = getCategory(slug);
  if (!category) return null;

  if (!asLink) {
    return <span className={badgeClassName}>{category.label}</span>;
  }

  return (
    <Link href={`/category/${category.slug}`} className={`${badgeClassName} hover:bg-black/10`}>
      {category.label}
    </Link>
  );
}
