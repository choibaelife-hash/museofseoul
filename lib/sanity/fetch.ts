import { draftMode } from "next/headers";
import { client } from "@/lib/sanity/client";

// next-sanity's defineLive() targets Next.js Cache Components, which this
// project doesn't enable — it silently returned empty data here, so we talk
// to the client directly instead. Trade-off: Studio edits need a page
// reload to show up in the preview rather than streaming live.
export async function sanityFetch<T>({
  query,
  params = {},
}: {
  query: string;
  params?: Record<string, unknown>;
}): Promise<{ data: T }> {
  const { isEnabled: isDraftMode } = await draftMode();

  const data = await client.fetch<T>(query, params, {
    perspective: isDraftMode ? "drafts" : "published",
    useCdn: !isDraftMode,
    stega: isDraftMode,
    token: isDraftMode ? process.env.SANITY_API_READ_TOKEN : undefined,
    next: isDraftMode ? { revalidate: 0 } : { revalidate: 60 },
  });

  return { data };
}
