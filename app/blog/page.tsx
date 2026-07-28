import type { Metadata } from "next";
import { categories } from "@/lib/site";
import { sanityFetch } from "@/lib/sanity/fetch";
import { postsByCategoryQuery } from "@/lib/sanity/queries";
import type { Post } from "@/lib/types";
import { ArchiveExplorer } from "@/components/archive/ArchiveExplorer";

export const metadata: Metadata = {
  title: "Blog",
  description: "Browse every category at a glance.",
};

export default async function BlogPage() {
  const sections = await Promise.all(
    categories.map(async (category) => {
      const { data } = await sanityFetch<Post[]>({
        query: postsByCategoryQuery,
        params: { category: category.slug },
      });
      return { category, posts: data.slice(0, 3) };
    }),
  );

  return <ArchiveExplorer sections={sections} />;
}
