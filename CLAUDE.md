@AGENTS.md

# CLAUDE.md

이 문서는 "Muse of Seoul" 프로젝트에서 작업하는 Claude Code를 위한 안내입니다. 코드 아키텍처와 디자인/기획 현황을 한 곳에 담습니다.

## 명령어

git 저장소 하나에 npm 프로젝트가 두 개 들어있어서, 어느 디렉토리에서 실행하는지가 중요합니다.

**Next.js 앱 (저장소 루트):**
```bash
npm run dev     # next dev
npm run build   # next build
npm run start   # next start
npm run lint    # eslint
```
테스트 러너는 설정되어 있지 않음.

**Sanity Studio (`studio/`):**
```bash
cd studio
npm run dev     # sanity dev --port 3334
npm run build   # sanity build
npm run deploy  # sanity deploy
```

## 환경 변수

`.env.local`에 필요 (값은 여기 안 적음, 이름만):

- Sanity: `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_READ_TOKEN`, `SANITY_API_WRITE_TOKEN`
- R2 이미지 저장소: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`
- admin 로그인: `ADMIN_ID`, `ADMIN_PASSWORD`

## 아키텍처

**독립된 두 앱, 하나의 Sanity 프로젝트.** Next.js 앱(`app/`)은 공개 사이트 + 쿠키로 보호되는 admin UI이고, `studio/`는 별도의 Sanity Studio 배포(자체 `package.json`, 자체 `node_modules`)로 콘텐츠 편집을 담당합니다. 둘은 공유 Sanity 데이터셋과 아래 Presentation/draft-mode 연결로만 이어져 있고, 빌드 단계는 공유하지 않습니다.

**데이터 흐름 — Sanity → Next.js:**
- `lib/sanity/client.ts` — `next-sanity` 클라이언트.
- `lib/sanity/fetch.ts` — `next-sanity`의 `defineLive()` 대신 직접 만든 `sanityFetch()` 래퍼. `defineLive()`는 이 프로젝트가 켜지 않은 Next.js Cache Components를 전제로 하고 있어서 실제로는 빈 데이터만 반환했고, 그래서 페이지들은 `client.fetch`를 직접 호출하고 `draftMode()` 값으로 perspective(`drafts`/`published`), `stega`, CDN 사용 여부를 직접 분기합니다. 트레이드오프: Studio에서 수정한 내용이 프리뷰에 실시간 스트리밍되지 않고 새로고침해야 반영됨.
- `lib/sanity/queries.ts` — GROQ 쿼리 모음.
- `app/api/draft-mode/{enable,disable}/route.ts` + `components/DisableDraftMode.tsx` — Visual Editing/프리뷰 모드 진입·종료.
- Studio의 `studio/presentation/`이 Presentation 툴의 딥링크를 실제 사이트 라우트로 매핑.

**콘텐츠 입력 경로는 두 개, 둘 다 같은 Sanity 데이터셋에 씀:**
1. Studio(`studio/`) — 표준 Sanity 편집 UI, `schemaTypes/`에 `post` 문서 타입 정의.
2. 앱 내장 admin(`app/admin/*`, `middleware.ts`가 `ADMIN_COOKIE`를 `ADMIN_PASSWORD`와 비교해서 게이트) — 커스텀 글쓰기 플로우(`components/admin/WriteWizard.tsx`)로, 작성한 콘텐츠를 `lib/sanity/markdownToBlocks.ts`/`parseMarkdown.ts`로 Portable Text로 변환한 뒤 `lib/sanity/writeClient.ts` + `app/api/admin/publish/route.ts`로 발행합니다. 임시저장 상태는 `localStorage`(키는 `lib/adminDrafts.ts`)를 통해 `/admin/write`와 `/admin` 홈 목록 사이를 오가며, 발행 전까지는 Sanity에 저장되지 않습니다.

**이미지는 Sanity 에셋이 아니라 Cloudflare R2에 저장됩니다.** `lib/r2Client.ts`가 AWS S3 SDK를 R2의 S3 호환 엔드포인트로 설정합니다. `app/api/admin/upload/route.ts`는 `/admin/write`와 `/admin/images` 양쪽이 공유하는 단일 업로드 라우트로, 업로드된 이미지를 저장 전에 `sharp`로 재인코딩(최대 너비로 리사이즈, WebP 변환)해서 두 플로우 모두 로직 중복 없이 자동 압축 혜택을 받습니다.

**렌더링:** `components/PostBody.tsx`가 `@portabletext/react`로 Portable Text를 렌더링합니다. `lib/site.ts`는 Sanity가 아닌 수동 관리 사이트 설정(4개 최상위 카테고리, 카테고리→색상 타일 폴백 맵, `siteConfig`)을 담고 있음 — 카테고리는 Sanity 문서 타입이 아닙니다.

**Sanity 스키마는 SEO/AEO 구조를 전제로 설계됨.** `studio/schemaTypes/post.ts`의 `seo` 필드 그룹에 focusKeyphrase, Meta Title/Description, `schemaOrgType`(BlogPosting/Review/FAQPage), OG 이미지 폴백, FAQ 섹션(최소 3개 권장)이 있고, 각 필드 설명 문구 자체가 구글 검색뿐 아니라 ChatGPT·Perplexity 같은 AI 검색 인용까지 염두에 두고 쓰여 있습니다.

**모바일은 PWA 홈화면 추가를 지원하며, admin과 일반 사이트가 매니페스트를 분리해서 씁니다.** 일반 사이트는 `app/manifest.ts`(`start_url: "/"`), admin은 `public/admin-manifest.webmanifest`를 따로 둬서 `/admin/write`를 홈 화면에 추가했을 때 항상 홈("/")이 아니라 admin 화면으로 열리도록 `app/admin/layout.tsx`에서 메타데이터를 오버라이드합니다.

## 브랜드 톤

에디토리얼/매거진 톤. 채워진 버튼 대신 아웃라인·밑줄 텍스트 링크, 대문자+넓은 자간 라벨을 씀.

## 컬러

| 이름 | 값 | 용도 |
|---|---|---|
| Background | `#ffffff` | 기본 배경 |
| Editorial Plum | `#37263a` | 기본 텍스트(foreground), Seoul Beauty Insider 섹션 배경 |
| Seoul Mauve | `#735364` | 메인 시그니처 컬러 — eyebrow 라벨, 링크 hover, 카테고리 타일 틴트 |
| Pure Dew Aqua | `#acced1` | 보조 컬러 — Insider 섹션 뱃지, 카테고리 타일 틴트 |
| Seoul Ivory Beige | `#efe7da` | 보조 배경 — 히어로 텍스트 박스 등 |

정의 위치: `app/globals.css`의 `@theme inline` (`--color-cream/mauve/aqua/plum`).

## 폰트

- **Serif — Playfair Display** (`--font-playfair`, Tailwind `font-serif`): 헤딩 전용
- **Sans — Montserrat** (`--font-montserrat`, Tailwind `font-sans`): 본문/UI 기본

## 카테고리 (4개, 확정)

K-Beauty Treatments(`beauty`) · K-Beauty Products(`k-beauty`) · Stay in Seoul(`stay`) · Where to Go in Seoul(`where-to-go`) — `lib/site.ts`에 하드코딩.

## 콘텐츠 자동화 방향

- **최종 목표**: 글 리서치→작성→Sanity 업로드까지 n8n으로 전체 자동화
- **현재 단계**: 반자동. Sanity 스키마의 각 항목(제목·카테고리·SEO 필드 등)과 글 본문을 먼저 채울 수 있는 구조부터 admin 글쓰기 화면(WriteWizard)에 잡아두는 중. 구조 필드를 채우면 그 값이 반영된 프롬프트 md 파일을 다운로드하고, 그 프롬프트로 외부에서 작성한 본문을 다시 md 업로드로 불러와 채우는 방식으로 콘텐츠 값을 채우고 있음 — n8n 자동화는 이 흐름이 안정된 다음 단계

## 관리자(admin) 화면

- `/admin/write` — 글쓰기 화면 (WriteWizard) — 위 반자동 md 흐름이 여기서 일어남
- `/admin/images` — 이미지 업로드/관리
- `/admin` — 홈, 임시저장 목록에서 다시 불러오기 가능
- 모바일에서 PWA로 홈화면 추가 가능하며, admin과 일반 사이트가 매니페스트가 분리되어 있어 admin을 홈화면에 추가해도 항상 admin 화면으로 열림 (일반 사이트를 추가하면 일반 홈으로 열림)

## 현재 작업 상황 (2026-08-05 기준)

- 홈페이지 모바일 레이아웃을 격자형에서 가로 스와이프 캐러셀 구조로 전면 개편 완료 (카테고리 타일, Popular Posts, Just Published, Seoul Beauty Insider) — 스크롤바는 숨김 처리
- 버튼 스타일을 박스형에서 밑줄 텍스트 링크로 통일
- Categories 섹션 상/하단 구분선 제거
- 관리자 업로드(`/admin/write`, `/admin/images`)에 `sharp` 기반 자동 압축(WebP, 최대 1800px, quality 80) 적용 — `app/api/admin/upload/route.ts` 공용 라우트
- `/admin/write` ↔ `/admin` 홈 간 임시저장(로컬스토리지) 라운드트립 구현

## 다음 세션에서 할 일

- **모바일 헤더 로고 한 줄 처리**: `components/Header.tsx`의 좌측 상단 "Muse of Seoul" 로고가 모바일 폭에서 여러 줄로 줄바꿈됨 — 한 줄로 보이게 수정. 클릭 시 홈으로 이동은 이미 `<Link href="/">`라 기능상 되어 있음, 표시만 정리하면 됨.
- **`/blog` 페이지(ArchiveExplorer) 방향 결정**: 지금은 `components/archive/ArchiveExplorer.tsx`가 페이지 전체(휠로 카테고리 전환)를 담당함. 아래 재설계안으로 바꿀지, 다른 방식으로 갈지 결정 필요.
- **`/blog` 페이지 재설계 아이디어(확정, 구현 대기)**: 세로 스크롤 = 카테고리 전환(현재 방식 유지) / 카테고리 안에서 좌우로 스와이프하면 그 카테고리의 다른 글이 보이도록 (최근 3개만 노출)

## 보류 / 결정 대기

- PC 히어로 이미지 칸 축소 + 1:1 비율 변경 — 보류 (재요청 전까지 작업 금지)
- 블로그 상세 페이지 JSON-LD에 Google 권장 16:9/4:3/1:1 이미지 배열 추가 — 나중으로 미룸
- Popular Posts를 실제 조회수 기준으로 바꿀지 여부 — 트래킹 미구현이라 현재는 최신순 임시 사용
- Seoul Beauty Insider 소개 문구 A/B/C 3안 중 미확정 (`docs/02-design-decisions.md` 참고)
- Instagram 카드뉴스 임베드, Newsletter Mailchimp 연동 — 둘 다 자리만 있고 미연동

## 세션 종료 규칙

작업 세션이 끝날 때마다 (사용자가 "오늘 여기까지", "마무리하자" 등 종료 신호를 주면):
1. 이 `CLAUDE.md`를 자동으로 업데이트할 것
2. 완료된 작업, 현재 상태, 다음 할 일을 "현재 작업 상황" 섹션에 기록할 것
3. 브랜드/구조/방향성 등 주요 결정사항도 해당 섹션(컬러·폰트·콘텐츠 자동화 방향·보류 항목 등)에 반영할 것
