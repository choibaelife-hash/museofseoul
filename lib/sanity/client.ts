import { createClient } from "next-sanity";

export const apiVersion = "2024-10-01";

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion,
  useCdn: true,
  stega: {
    studioUrl: "http://localhost:3334",
  },
});
