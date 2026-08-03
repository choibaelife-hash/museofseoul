"use client";

import { useMemo, useRef, useState } from "react";
import { categories } from "@/lib/site";
import { parseMarkdownBlocks } from "@/lib/sanity/parseMarkdown";

type FaqItem = { question: string; answer: string };
type ImageItem = { url: string; alt: string; key: string };
type PendingImage = { file: File; previewUrl: string };

async function uploadToR2(file: File, category: string, folder: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("category", category);
  formData.append("folder", folder);
  const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "업로드 실패");
  // alt 텍스트는 일단 파일명으로 자동 입력 — 나중에 AI 자동화로 교체 예정
  return { url: data.url as string, alt: data.name as string, key: data.key as string };
}

async function deleteFromR2(key: string) {
  const res = await fetch("/api/admin/upload", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "삭제 실패");
  }
}

const STEPS = [
  { n: 1 as const, label: "소재 & 방향 설정" },
  { n: 2 as const, label: "본문 생성 & 발행" },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const inputClass =
  "w-full rounded-md border border-plum/15 px-3 py-2 text-sm text-plum outline-none focus:border-mauve";
const cardClass = "rounded-lg border border-plum/12 bg-background p-5";
const labelClass = "mb-2 block text-xs uppercase tracking-wide text-mauve";
const primaryBtn = "rounded-md bg-plum px-5 py-2.5 text-sm text-white hover:opacity-90 disabled:opacity-50";
const secondaryBtn = "rounded-md border border-plum/25 px-5 py-2.5 text-sm text-plum hover:bg-cream disabled:opacity-50";
const ghostLink = "text-sm text-mauve hover:text-plum";

export function WriteWizard() {
  const [step, setStep] = useState<1 | 2>(1);

  const [category, setCategory] = useState(categories[0].slug);
  const [memo, setMemo] = useState("");
  const [folder, setFolder] = useState("");
  const [pending, setPending] = useState<PendingImage[]>([]);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [mainIndex, setMainIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const [focusKeyphrase, setFocusKeyphrase] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [direction, setDirection] = useState("");

  const [bodyMarkdown, setBodyMarkdown] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [faqSection, setFaqSection] = useState<FaqItem[]>([
    { question: "", answer: "" },
    { question: "", answer: "" },
    { question: "", answer: "" },
  ]);

  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function handleImageFiles(files: FileList | File[]) {
    const added = Array.from(files).map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    setPending((list) => [...list, ...added]);
  }

  function removePending(i: number) {
    setPending((list) => {
      URL.revokeObjectURL(list[i].previewUrl);
      return list.filter((_, idx) => idx !== i);
    });
  }

  async function saveImages() {
    if (!folder.trim()) {
      setUploadError("폴더명을 먼저 입력하세요");
      return;
    }
    if (pending.length === 0) return;
    setUploadError("");
    setUploading(true);
    const categoryLabel = categories.find((c) => c.slug === category)?.label ?? category;
    const stillPending: PendingImage[] = [];
    for (const p of pending) {
      try {
        const uploaded = await uploadToR2(p.file, categoryLabel, folder);
        setImages((list) => [...list, uploaded]);
        URL.revokeObjectURL(p.previewUrl);
      } catch (err) {
        stillPending.push(p);
        setUploadError(err instanceof Error ? err.message : "업로드 실패");
      }
    }
    setPending(stillPending);
    setUploading(false);
  }

  async function removeImage(i: number) {
    const target = images[i];
    try {
      await deleteFromR2(target.key);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "삭제 실패");
      return;
    }
    setImages((list) => list.filter((_, idx) => idx !== i));
    setMainIndex((prev) => {
      if (i === prev) return 0;
      return i < prev ? prev - 1 : prev;
    });
  }

  function exportPromptMd() {
    const imageList =
      images
        .map((img, i) => `- ${img.url} (alt: ${img.alt || "없음"})${i === mainIndex ? " — 메인" : ""}`)
        .join("\n") || "(업로드된 이미지 없음)";

    const md = `# Muse of Seoul — 글쓰기 프롬프트

## 기본 정보
- Focus keyphrase: ${focusKeyphrase || "(미정)"}
- Title: ${title || "(미정)"}
- Category: ${categories.find((c) => c.slug === category)?.label}
- Lead: ${excerpt || "(미정)"}

## 소재 메모
${memo || "(없음)"}

## 사용 가능한 이미지
${imageList}

## 글 방향 / 구조
${direction || "(미정)"}

## 작성 규칙 (Sanity 가이드라인)
- Focus keyphrase는 제목·Meta Title·본문 첫 문단·마지막 문단에 포함
- Meta Title 60자 이내, Meta Description 120~160자 — 둘 다 키프레이즈 포함
- FAQ 최소 3개, 질문은 실제 검색 문장처럼, 답변은 50~300자로 단정적으로
- 본문 중간에 이미지를 넣을 땐 위 이미지 목록의 URL로 \`![alt 텍스트](이미지 URL)\` 형식으로 삽입
- 모든 이미지에 Alt 텍스트 필수

## 출력 형식
마크다운 — 소제목은 \`## \`, 문단은 빈 줄로 구분, 이미지는 \`![]()\` 형식으로 본문 중간에 배치`;

    downloadFile(`prompt_${slug || "post"}.md`, md);
  }

  function handleUploadMd(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBodyMarkdown(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  const parsedBody = useMemo(() => parseMarkdownBlocks(bodyMarkdown), [bodyMarkdown]);

  const checklist = useMemo(() => {
    const kp = focusKeyphrase.trim().toLowerCase();
    const firstTextBlock = parsedBody.find((b) => b.style !== "image");
    const firstParagraph = (firstTextBlock && "text" in firstTextBlock ? firstTextBlock.text : "").toLowerCase();
    const metaTitleValue = metaTitle || title;
    const metaDescValue = metaDescription || excerpt;
    const filledFaqs = faqSection.filter((f) => f.question.trim() && f.answer.trim());
    return [
      { label: "키프레이즈가 제목에 포함", pass: !!kp && title.toLowerCase().includes(kp) },
      {
        label: "Meta Title 길이",
        pass: metaTitleValue.length > 0 && metaTitleValue.length <= 60,
        detail: `${metaTitleValue.length} / 60자`,
      },
      {
        label: "Meta Description 길이",
        pass: metaDescValue.length > 0 && metaDescValue.length <= 160,
        detail: `${metaDescValue.length} / 160자`,
      },
      { label: "본문 첫 문단에 키프레이즈 포함", pass: !!kp && firstParagraph.includes(kp) },
      { label: "FAQ 최소 3개", pass: filledFaqs.length >= 3, detail: `현재 ${filledFaqs.length}개` },
      { label: "메인 이미지 Alt 텍스트", pass: !!images[mainIndex]?.alt.trim() },
    ];
  }, [focusKeyphrase, title, metaTitle, metaDescription, excerpt, parsedBody, faqSection, images, mainIndex]);

  const passCount = checklist.filter((c) => c.pass).length;

  async function submit(nextStatus: "draft" | "published") {
    setStatus("saving");
    setMessage("");
    try {
      const res = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          title,
          slug,
          category,
          focusKeyphrase,
          excerpt,
          mainImage: images[mainIndex],
          bodyMarkdown,
          metaTitle,
          metaDescription,
          faqSection,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "저장에 실패했어요");
      setStatus("done");
      setMessage(
        nextStatus === "published"
          ? `발행 완료 — /blog/${data.slug}`
          : "초안으로 저장했어요. Sanity Studio에서 확인할 수 있어요."
      );
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "저장에 실패했어요");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 text-plum">
      <h1 className="font-serif text-2xl">글 작성하기</h1>
      <p className="mt-1 text-sm text-mauve">Muse of Seoul Studio · 관리자</p>

      <nav className="mt-8 flex items-center border-b border-plum/12 pb-5">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex flex-1 items-center last:flex-none">
            <button
              type="button"
              onClick={() => setStep(s.n)}
              className={`flex items-center gap-2 whitespace-nowrap text-sm ${step === s.n ? "text-plum" : "text-mauve/60"}`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border font-serif text-xs ${
                  step === s.n ? "border-plum bg-plum text-white" : "border-plum/25"
                }`}
              >
                {s.n}
              </span>
              {s.label}
            </button>
            {i < STEPS.length - 1 && <span className="mx-3 h-px flex-1 bg-plum/12" />}
          </div>
        ))}
      </nav>

      {step === 1 && (
        <div className="mt-8 flex flex-col gap-5">
          <div className={cardClass}>
            <label className={labelClass}>카테고리</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => setCategory(c.slug)}
                  className={`rounded-full border px-3 py-1.5 text-sm ${
                    category === c.slug ? "border-plum bg-plum text-white" : "border-plum/20 text-mauve"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className={cardClass}>
            <label className={labelClass}>폴더명</label>
            <input
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              placeholder="예: 강남 하이드라페이셜 후기"
              className={inputClass}
            />
          </div>

          <div className={cardClass}>
            <label className={labelClass}>이미지 업로드</label>
            <div className="grid grid-cols-3 gap-2.5">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files.length) handleImageFiles(e.dataTransfer.files);
                }}
                onClick={() => imageInputRef.current?.click()}
                className={`flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-center text-[11px] leading-tight ${
                  dragOver ? "border-plum bg-cream text-plum" : "border-plum/25 text-mauve"
                }`}
              >
                <span className="text-lg">+</span>
                <span>
                  끌어다 놓거나
                  <br />
                  클릭해서 선택
                </span>
              </div>

              {pending.map((p, i) => (
                <div key={p.previewUrl} className="relative aspect-[3/4] overflow-hidden rounded-lg border border-plum/12 opacity-60">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.previewUrl} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePending(i)}
                    title="삭제"
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs leading-none text-white hover:bg-black/80"
                  >
                    ×
                  </button>
                  <span className="absolute inset-x-0 bottom-0 bg-black/40 py-0.5 text-center text-[9px] tracking-wide text-white">
                    대기중
                  </span>
                </div>
              ))}

              {images.map((img, i) => (
                <div
                  key={img.url}
                  className={`relative aspect-[3/4] overflow-hidden rounded-lg border ${
                    mainIndex === i ? "border-plum" : "border-plum/12"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.alt}
                    onClick={() => setLightboxUrl(img.url)}
                    className="h-full w-full cursor-zoom-in object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    title="저장소에서도 삭제"
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs leading-none text-white hover:bg-black/80"
                  >
                    ×
                  </button>
                  <button
                    type="button"
                    onClick={() => setMainIndex(i)}
                    className={`absolute inset-x-0 bottom-0 py-0.5 text-[9px] tracking-wide ${
                      mainIndex === i ? "bg-plum text-white" : "bg-black/40 text-white hover:bg-black/60"
                    }`}
                  >
                    {mainIndex === i ? "메인" : "메인으로"}
                  </button>
                </div>
              ))}
            </div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => e.target.files && handleImageFiles(e.target.files)}
              className="hidden"
            />

            <button
              type="button"
              onClick={saveImages}
              disabled={pending.length === 0 || uploading}
              className={`mt-3 ${secondaryBtn}`}
            >
              {uploading ? "저장 중..." : `저장 (${pending.length}장 대기중)`}
            </button>

            {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}
            {images.length > 0 && (
              <p className="mt-2 text-xs text-mauve">사진을 클릭하면 크게 보여요 — 대표 지정은 아래 버튼으로.</p>
            )}

            <div className="mt-3 flex items-start gap-2 rounded-lg bg-cream p-3 text-xs text-mauve">
              <span>📮</span>
              <span>
                <b className="text-plum">텔레그램으로도 가능</b> — 나중에 봇으로 사진·메모를 보내면 이 화면에 그대로
                채워지도록 붙일 자리예요.
              </span>
            </div>
          </div>

          <div className={cardClass}>
            <label className={labelClass}>메모 (소재)</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              className={inputClass}
              placeholder="이 글에서 하고 싶은 이야기, 참고할 내용"
            />
          </div>

          <div className={cardClass}>
            <label className={labelClass}>포커스 키프레이즈</label>
            <input
              value={focusKeyphrase}
              onChange={(e) => setFocusKeyphrase(e.target.value)}
              className={inputClass}
              placeholder="예: hydrafacial gangnam price"
            />
          </div>

          <div className={cardClass}>
            <label className={labelClass}>타이틀</label>
            <input value={title} onChange={(e) => handleTitleChange(e.target.value)} className={inputClass} />
            <div className="mt-2 flex items-center gap-2 text-xs text-mauve">
              <span>슬러그</span>
              <input
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                className="flex-1 rounded-md border border-plum/15 px-2 py-1 font-mono text-xs text-plum outline-none focus:border-mauve"
              />
            </div>
          </div>

          <div className={cardClass}>
            <label className={labelClass}>리드 (Lead) — 미입력 시 Meta Description으로도 사용</label>
            <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} className={inputClass} />
          </div>

          <div className={cardClass}>
            <label className={labelClass}>글 방향 / 구조</label>
            <textarea
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              rows={3}
              className={inputClass}
              placeholder="가격 → 소요시간 → 통증 → 영어 응대 순서로. 마지막에 예약 팁 한 문단."
            />
          </div>

          <div className="rounded-lg border border-plum/12 bg-cream p-5">
            <p className="mb-3 text-sm text-plum/80">
              여기까지 정한 내용을 프롬프트 md 파일로 내려받아서 Claude에 붙여넣어 글을 쓰세요. 받은 결과를 md로
              저장해서 다음 단계에 업로드하면 돼요.
            </p>
            <button type="button" onClick={exportPromptMd} className={primaryBtn}>
              프롬프트 MD 다운로드
            </button>
          </div>

          <button type="button" onClick={() => setStep(2)} className={`self-end ${primaryBtn}`}>
            다음: 본문 생성 & 발행 →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="mt-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.5fr_1fr]">
            <div className="flex flex-col gap-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-xs uppercase tracking-wide text-mauve">
                    본문 MD — 업로드하거나 직접 붙여넣기
                  </label>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".md,text/markdown"
                      onChange={handleUploadMd}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-md border border-plum/25 px-3 py-1.5 text-xs text-plum hover:bg-cream"
                    >
                      MD 파일 업로드
                    </button>
                  </div>
                </div>
                <textarea
                  value={bodyMarkdown}
                  onChange={(e) => setBodyMarkdown(e.target.value)}
                  rows={14}
                  className="w-full rounded-md border border-plum/15 p-3 font-mono text-xs leading-relaxed text-plum outline-none focus:border-mauve"
                  placeholder={"## 소제목\n본문 내용...\n\n![alt 텍스트](이미지 URL)\n\n## 다음 소제목\n본문 내용..."}
                />
              </div>
              <div className={cardClass}>
                <label className={labelClass}>미리보기</label>
                <div className="prose prose-neutral prose-sm max-w-none">
                  {parsedBody.length === 0 && <p className="text-mauve/70">본문을 넣으면 여기 미리보기가 떠요.</p>}
                  {parsedBody.map((block, i) => {
                    if (block.style === "image") {
                      // eslint-disable-next-line @next/next/no-img-element
                      return <img key={i} src={block.url} alt={block.alt} className="rounded-md" />;
                    }
                    if (block.style === "h2") return <h2 key={i}>{block.text}</h2>;
                    if (block.style === "h3") return <h3 key={i}>{block.text}</h3>;
                    return <p key={i}>{block.text}</p>;
                  })}
                </div>
              </div>
            </div>

            <aside className={`h-fit ${cardClass}`}>
              <p className={labelClass}>SEO 가이드라인</p>
              <ul className="flex flex-col gap-3">
                {checklist.map((c) => (
                  <li key={c.label} className="flex items-start gap-2 text-sm">
                    <span
                      className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full text-xs ${
                        c.pass ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {c.pass ? "✓" : "!"}
                    </span>
                    <span>
                      {c.label}
                      {c.detail && <span className="block text-xs text-mauve">{c.detail}</span>}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 font-serif text-2xl text-plum">
                {passCount}/{checklist.length}
              </p>
            </aside>
          </div>

          <div className={cardClass}>
            <label className={`mb-3 block ${labelClass.replace("mb-2 ", "")}`}>SEO — Meta / FAQ (선택)</label>
            <div className="flex flex-col gap-3">
              <input
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Meta Title (미입력 시 타이틀 사용)"
                className={inputClass}
              />
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={2}
                placeholder="Meta Description (미입력 시 리드 사용)"
                className={inputClass}
              />
              {faqSection.map((f, i) => (
                <div key={i} className="rounded-md border border-plum/12 p-3">
                  <input
                    value={f.question}
                    onChange={(e) =>
                      setFaqSection((list) =>
                        list.map((item, idx) => (idx === i ? { ...item, question: e.target.value } : item))
                      )
                    }
                    placeholder={`질문 ${i + 1}`}
                    className={`mb-2 ${inputClass}`}
                  />
                  <textarea
                    value={f.answer}
                    onChange={(e) =>
                      setFaqSection((list) =>
                        list.map((item, idx) => (idx === i ? { ...item, answer: e.target.value } : item))
                      )
                    }
                    rows={2}
                    placeholder={`답변 ${i + 1}`}
                    className={inputClass}
                  />
                </div>
              ))}
              <button type="button" onClick={() => setFaqSection((list) => [...list, { question: "", answer: "" }])} className={`self-start ${ghostLink}`}>
                + FAQ 추가
              </button>
            </div>
          </div>

          {message && <p className={`text-sm ${status === "error" ? "text-red-600" : "text-green-700"}`}>{message}</p>}

          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setStep(1)} className={ghostLink}>
              ← 이전
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={() => submit("draft")} disabled={status === "saving"} className={secondaryBtn}>
                초안으로 저장
              </button>
              <button type="button" onClick={() => submit("published")} disabled={status === "saving"} className={primaryBtn}>
                발행하기
              </button>
            </div>
          </div>
        </div>
      )}

      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/80 p-8"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[90vw] cursor-default rounded-md object-contain"
          />
        </div>
      )}
    </div>
  );
}
