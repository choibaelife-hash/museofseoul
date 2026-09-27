import { randomUUID } from "node:crypto";
import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { parseBody } from "next-sanity/webhook";
import { changedPostTags, isPostChange } from "@/lib/sanity/cache";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const secret = process.env.SANITY_REVALIDATE_SECRET?.trim();
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const log = (status: string, details: Record<string, unknown> = {}) => {
    const entry = JSON.stringify({ event: "sanity.revalidate", requestId, status, ...details });
    if (status === "failed" || status === "misconfigured") console.error(entry);
    else console.info(entry);
  };
  const respond = (status: number, result: string) =>
    Response.json({ result, requestId }, { status });

  if (!secret || !projectId || !dataset) {
    log("misconfigured");
    return respond(503, "Webhook configuration missing");
  }

  let body: unknown;
  try {
    // Verifies the raw-body signature and waits for Content Lake consistency.
    const parsed = await parseBody<unknown>(request, secret);
    if (parsed.isValidSignature !== true) {
      log("rejected", { reason: "signature" });
      return respond(401, "Invalid signature");
    }
    body = parsed.body;
  } catch {
    log("rejected", { reason: "malformed_request" });
    return respond(400, "Malformed webhook");
  }

  if (!isPostChange(body)) {
    log("rejected", { reason: "payload" });
    return respond(400, "Invalid payload");
  }
  if (body.projectId !== projectId || body.dataset !== dataset) {
    log("rejected", { reason: "project_or_dataset" });
    return respond(403, "Wrong project or dataset");
  }

  const tags = changedPostTags(body);
  try {
    // Immediate expiration: the next request waits for fresh data, including 404s.
    // Tags invalidate every dependent page; no global layout/path purge is needed.
    for (const tag of tags) revalidateTag(tag, { expire: 0 });
    log(tags.length ? "revalidated" : "ignored", {
      documentId: (body.after ?? body.before)?._id,
      operation: body.operation,
      tagCount: tags.length,
    });
    return respond(200, tags.length ? "Revalidated" : "Ignored");
  } catch {
    // A repeated delivery safely retries the same tag invalidations.
    log("failed", { operation: body.operation, documentId: (body.after ?? body.before)?._id });
    return respond(500, "Cache invalidation failed");
  }
}
