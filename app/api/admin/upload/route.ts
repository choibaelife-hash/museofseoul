import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { ADMIN_COOKIE } from "@/middleware";
import { r2Client } from "@/lib/r2Client";

const MAX_WIDTH = 1800;
const WEBP_QUALITY = 80;

// Only guards against accidental extra path segments — Korean and other
// unicode characters are fine in R2 keys and in the folder/file name inputs.
function sanitizePathPart(value: string) {
  return value.trim().replace(/[\\/]+/g, "-");
}

async function requireAdmin() {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === process.env.ADMIN_PASSWORD;
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const category = formData.get("category");
  const folder = formData.get("folder");

  if (!(file instanceof File) || typeof category !== "string" || typeof folder !== "string" || !category || !folder) {
    return NextResponse.json({ error: "file, category, folder가 모두 필요해요" }, { status: 400 });
  }

  const baseName = sanitizePathPart(file.name.replace(/\.[^.]+$/, "")) || "image";
  const fileName = `${baseName}.webp`;
  const key = `${sanitizePathPart(category)}/${sanitizePathPart(folder)}/${fileName}`;

  try {
    const original = Buffer.from(await file.arrayBuffer());
    const compressed = await sharp(original)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    await r2Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: compressed,
        ContentType: "image/webp",
      })
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "R2 업로드에 실패했어요 — 서버 로그를 확인하세요." }, { status: 500 });
  }

  return NextResponse.json({ url: `${process.env.R2_PUBLIC_URL}/${key}`, name: fileName, key });
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { key } = await request.json();
  if (typeof key !== "string" || !key) {
    return NextResponse.json({ error: "key가 필요해요" }, { status: 400 });
  }

  try {
    await r2Client.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "R2 삭제에 실패했어요 — 서버 로그를 확인하세요." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
