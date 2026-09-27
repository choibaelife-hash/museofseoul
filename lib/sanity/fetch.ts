import { draftMode } from "next/headers";
import { PUBLIC_POST_REVALIDATE } from "@/lib/sanity/cache";
import { client } from "@/lib/sanity/client";

// next-sanity's defineLive() targets Next.js Cache Components, which this
// project doesn't enable — it silently returned empty data here, so we talk
// to the client directly instead. Trade-off: Studio edits need a page
// reload to show up in the preview rather than streaming live.
export async function sanityFetch<T>({
  query,
  params = {},
  tags,
}: {
  query: string;
  params?: Record<string, unknown>;
  tags: string[];
}): Promise<{ data: T }> {
  const { isEnabled: isDraftMode } = await draftMode();

  const data = await client.fetch<T>(query, params, {
    perspective: isDraftMode ? "drafts" : "published",
    // Cache refills must bypass the CDN so a webhook cannot recache an old version.
    useCdn: false,
    stega: isDraftMode,
    token: isDraftMode ? process.env.SANITY_API_READ_TOKEN : undefined,
    next: isDraftMode
      ? { revalidate: 0 }
      : { revalidate: PUBLIC_POST_REVALIDATE, tags },
  });

  return { data };
}
