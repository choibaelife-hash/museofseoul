"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DRAFTS_KEY } from "@/lib/adminDrafts";

type Draft = {
  id: string;
  savedAt: string;
  folder: string;
  title: string;
  images: unknown[];
  bodyMarkdown: string;
};

const cardClass = "rounded-lg border border-plum/12 bg-background p-5";
const labelClass = "mb-2 block text-xs uppercase tracking-wide text-mauve";
const smallBtn = "rounded-md border border-plum/25 px-3 py-1.5 text-xs text-plum hover:bg-cream";

export function AdminHome() {
  const [drafts, setDrafts] = useState<Draft[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(DRAFTS_KEY);
    if (raw) setDrafts(JSON.parse(raw));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 text-plum">
      <h1 className="font-serif text-2xl">Muse of Seoul Studio</h1>
      <p className="mt-1 text-sm text-mauve">관리자 홈</p>

      <div className={`${cardClass} mt-8`}>
        <label className={labelClass}>정보 수집 현황</label>
        <p className="text-sm text-mauve">준비 중</p>
      </div>

      <div className={`${cardClass} mt-4`}>
        <label className={labelClass}>GA4 리포트</label>
        <p className="text-sm text-mauve">준비 중</p>
      </div>

      <div className={`${cardClass} mt-4`}>
        <div className="flex items-start justify-between">
          <label className={labelClass}>포스팅</label>
          <Link href="/admin/write" className={smallBtn}>
            글작성하기 →
          </Link>
        </div>

        {drafts.length === 0 ? (
          <p className="mt-2 text-sm text-mauve">저장된 글감이 없어요.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="mt-2 w-full text-sm">
              <thead>
                <tr className="border-b border-plum/12 text-left text-xs uppercase tracking-wide text-mauve">
                  <th className="py-2 pr-2">제목</th>
                  <th className="py-2 pr-2">이미지</th>
                  <th className="py-2 pr-2">본문</th>
                  <th className="py-2">1차 저장 시간</th>
                </tr>
              </thead>
              <tbody>
                {drafts.map((d) => (
                  <tr key={d.id} className="border-b border-plum/8 last:border-0">
                    <td className="py-2 pr-2">
                      <Link href={`/admin/write?draft=${d.id}`} className="text-plum underline hover:text-mauve">
                        {d.title || d.folder || "(제목 없음)"}
                      </Link>
                    </td>
                    <td className="py-2 pr-2">{d.images?.length ? "O" : "-"}</td>
                    <td className="py-2 pr-2">{d.bodyMarkdown?.trim() ? "O" : "-"}</td>
                    <td className="py-2 text-mauve">{new Date(d.savedAt).toLocaleString("ko-KR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
