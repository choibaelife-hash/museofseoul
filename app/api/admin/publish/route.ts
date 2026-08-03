import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/middleware";
import { writeClient } from "@/lib/sanity/writeClient";
import { markdownToBlocks } from "@/lib/sanity/markdownToBlocks";

type FaqItem = { question: string; answer: string };

export async function POST(request: Request) {
  const store = await cookies();
  if (store.get(ADMIN_COOKIE)?.value !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const {
    status,
    title,
    slug,
    category,
    subcategory,
    focusKeyphrase,
    excerpt,
    mainImage,
    bodyMarkdown,
    metaTitle,
    metaDescription,
    faqSection,
  } = payload as {
    status: "draft" | "published";
    title: string;
    slug: string;
    category: string;
    subcategory?: string;
    focusKeyphrase?: string;
    excerpt: string;
    mainImage?: { url: string; alt: string };
    bodyMarkdown: string;
    metaTitle?: string;
    metaDescription?: string;
    faqSection?: FaqItem[];
  };

  if (!title || !slug || !category || !bodyMarkdown) {
    return NextResponse.json({ error: "필수 항목이 비어있어요 (제목/슬러그/카테고리/본문)" }, { status: 400 });
  }

  const id = status === "published" ? `post-${slug}` : `drafts.post-${slug}`;

  const doc = {
    _id: id,
    _type: "post",
    title,
    slug: { _type: "slug", current: slug },
    category,
    subcategory: category === "beauty" ? subcategory : undefined,
    focusKeyphrase: focusKeyphrase || undefined,
    excerpt,
    publishedAt: new Date().toISOString(),
    mainImage: mainImage?.url ? mainImage : undefined,
    body: markdownToBlocks(bodyMarkdown),
    metaTitle: metaTitle || undefined,
    metaDescription: metaDescription || undefined,
    faqSection: (faqSection || []).filter((f) => f.question?.trim() && f.answer?.trim()),
  };

  try {
    const result = await writeClient.createOrReplace(doc);
    return NextResponse.json({ ok: true, id: result._id, slug });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Sanity 저장에 실패했어요 — 서버 로그를 확인하세요." }, { status: 500 });
  }
}
