import { createHash } from "node:crypto";

export const PUBLIC_POST_REVALIDATE = 3600;

// Hash user-controlled slugs to stay within Next's 256-character tag limit.
const key = (value: string) => createHash("sha256").update(value).digest("hex");
export const postCacheTags = {
  home: "sanity:posts:home",
  detail: (slug: string) => `sanity:post:${key(slug)}`,
  category: (category: string) => `sanity:category:${key(category)}`,
};

type Snapshot = {
  _id: string;
  _type: string;
  slug: string | null;
  category: string | null;
};

export type PostChange = {
  projectId: string;
  dataset: string;
  operation: "create" | "update" | "delete";
  before: Snapshot | null;
  after: Snapshot | null;
};

const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const nullableString = (value: unknown) => value === null || typeof value === "string";
const snapshot = (value: unknown): value is Snapshot | null => value === null || (
  object(value) && typeof value._id === "string" && value._id.length > 0 &&
  typeof value._type === "string" && nullableString(value.slug) && nullableString(value.category)
);

export function isPostChange(value: unknown): value is PostChange {
  if (!object(value) || typeof value.projectId !== "string" || typeof value.dataset !== "string" ||
      !snapshot(value.before) || !snapshot(value.after)) return false;
  if (value.operation === "create") return value.before === null && value.after !== null;
  if (value.operation === "delete") return value.before !== null && value.after === null;
  return value.operation === "update" && value.before !== null && value.after !== null &&
    value.before._id === value.after._id;
}

export function changedPostTags(change: PostChange): string[] {
  const states = [change.before, change.after].filter((state): state is Snapshot => state !== null);
  // Defense in depth: a misconfigured webhook must not expose draft/release changes.
  if (states.some((state) => state._id.startsWith("drafts.") || state._id.startsWith("versions."))) return [];
  const posts = states.filter((state) => state._type === "post");
  if (!posts.length) return [];
  const tags = new Set([postCacheTags.home]);
  for (const post of posts) {
    if (post.slug) tags.add(postCacheTags.detail(post.slug));
    if (post.category) tags.add(postCacheTags.category(post.category));
  }
  return [...tags];
}
