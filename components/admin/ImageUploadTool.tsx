"use client";

import { useRef, useState } from "react";
import { categories } from "@/lib/site";

type UploadedImage = { name: string; url: string; alt: string };

const inputClass =
  "w-full rounded-md border border-plum/15 px-3 py-2 text-sm text-plum outline-none focus:border-mauve";
const cardClass = "rounded-lg border border-plum/12 bg-background p-5";
const labelClass = "mb-2 block text-xs uppercase tracking-wide text-mauve";

export function ImageUploadTool() {
  const [category, setCategory] = useState(categories[0].slug);
  const [folder, setFolder] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<UploadedImage[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: FileList | File[]) {
    if (!folder.trim()) {
      setError("폴더명을 먼저 입력하세요");
      return;
    }
    setError("");
    setUploading(true);
    const categoryLabel = categories.find((c) => c.slug === category)?.label ?? category;
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", categoryLabel);
      formData.append("folder", folder);
      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "업로드 실패");
        // alt 텍스트는 일단 파일명으로 자동 입력 — 나중에 AI 자동화로 교체 예정
        setResults((list) => [...list, { name: data.name, url: data.url, alt: data.name }]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "업로드 실패");
      }
    }
    setUploading(false);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 text-plum">
      <h1 className="font-serif text-2xl">이미지 업로드</h1>
      <p className="mt-1 text-sm text-mauve">Muse of Seoul Studio · R2 저장소</p>

      <div className={`${cardClass} mt-8`}>
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

      <div className={`${cardClass} mt-4`}>
        <label className={labelClass}>폴더명</label>
        <input
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
          placeholder="예: 강남 하이드라페이셜 후기"
          className={inputClass}
        />
      </div>

      <div className={`${cardClass} mt-4`}>
        <label className={labelClass}>이미지 업로드</label>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-md border border-dashed p-10 text-center text-sm ${
            dragOver ? "border-plum bg-cream text-plum" : "border-plum/25 text-mauve"
          }`}
        >
          이미지를 끌어다 놓거나 클릭해서 선택 — 여러 장 가능
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          className="hidden"
        />
        {uploading && <p className="mt-2 text-xs text-mauve">업로드 중...</p>}
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>

      {results.length > 0 && (
        <div className={`${cardClass} mt-4`}>
          <label className={labelClass}>업로드 완료 ({results.length}장)</label>
          <ul className="flex flex-col gap-3">
            {results.map((img) => (
              <li key={img.url} className="flex items-center gap-3 rounded-md border border-plum/12 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.alt} className="h-14 w-14 flex-none rounded object-cover" />
                <input readOnly value={img.url} className={`${inputClass} font-mono text-xs`} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
