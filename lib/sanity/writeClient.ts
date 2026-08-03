import { createClient } from "next-sanity";
import { apiVersion } from "@/lib/sanity/client";

// Server-only — needs SANITY_API_WRITE_TOKEN (Editor role), never expose to the browser.
export const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
});
