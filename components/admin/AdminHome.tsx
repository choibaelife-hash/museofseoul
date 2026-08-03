import Link from "next/link";

const mockDrafts = [
  { id: "m1", title: "강남 하이드라페이셜 후기", hasImages: true, hasBody: false, savedAt: "8/3 14:20" },
  { id: "m2", title: "이대 왁싱 후기", hasImages: true, hasBody: true, savedAt: "8/2 09:10" },
  { id: "m3", title: "홍대 반영구 눈썹", hasImages: false, hasBody: false, savedAt: "8/1 21:45" },
];

const cardClass = "rounded-lg border border-plum/12 bg-background p-5";
const labelClass = "mb-2 block text-xs uppercase tracking-wide text-mauve";
const smallBtn = "rounded-md border border-plum/25 px-3 py-1.5 text-xs text-plum hover:bg-cream";

export function AdminHome() {
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
              {mockDrafts.map((d) => (
                <tr key={d.id} className="border-b border-plum/8 last:border-0">
                  <td className="py-2 pr-2">{d.title}</td>
                  <td className="py-2 pr-2">{d.hasImages ? "O" : "-"}</td>
                  <td className="py-2 pr-2">{d.hasBody ? "O" : "-"}</td>
                  <td className="py-2 text-mauve">{d.savedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
