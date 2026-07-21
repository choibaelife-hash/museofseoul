# Muse of Seoul — 사이트맵 & 정보구조 설계 (v2)

> 기준 문서: `museofseoul.md` (2026년 7월)
> 이 문서는 원본 기획을 SEO/AEO 사이트맵 설계 원칙(키워드가 페이지 수를 결정한다 / 보유 자산 없는 섹션은 넣지 않는다 / 전환 동선을 명확히 한다)으로 재검토해 구체화한 버전.
> 원본 문서는 그대로 두고, 이 문서가 실제 구현(Next.js 라우팅 / Sanity 스키마)의 기준이 된다.

---

## 1. 기본 정보

| 항목 | 내용 |
|---|---|
| 브랜드명 | Muse of Seoul |
| 업종 | 서울 뷰티 라이프스타일 콘텐츠 블로그 (영문) |
| 한 줄 정의 | 서울에 사는 한국인 여성이 영어권 20~40대 여성 독자에게 전하는 로컬 뷰티·라이프스타일 가이드 |
| 타겟 고객 | B2C — 서울 뷰티 투어리즘에 관심 있는 영어권 독자 (동남아/유럽/북미) |
| 언어 | 영어 단일 (hreflang 불필요) |
| 연계 채널 | YouTube "경민 in Seoul", 샤오홍슈 |

### 전환 목표 (신규 확정)
- **현재는 별도 전환 목표 없음.** 회원가입/상담신청형 사이트가 아님.
- **장기 목표는 포스트 본문 내 어필리에이트 아웃링크 클릭** (Klook / GetYourGuide / Booking.com / Agoda / 올리브영 글로벌).
- 따라서 Home Hero의 CTA는 "가입시켜라"가 아니라 **"콘텐츠를 더 보게 만들어라(Explore)"** 로 설계한다. 뉴스레터 구독은 2순위(장기 자산 축적용), 문의(Contact)는 3순위(브랜드 제휴용)다.

### 신뢰 자산 (신규 확정)
- YouTube / 샤오홍슈 **구독자 수** 보유 → Home에 Stats 섹션 포함 확정.
- 실제 후기(리뷰) 콘텐츠는 경민님 본인의 1인칭 경험담으로 대체 (원본 문서 11장 "글 공통 원칙"과 일치).
- 콘텐츠 상태: 카테고리별 초안 일부 보유 (완전 제로 시작 아님) → 초안 있는 카테고리부터 우선 발행 가능.

---

## 2. 확정 사이트맵

```
/                         Home — 브랜드 진입 + 카테고리 허브
├── /blog                 전체 포스트 목록 (카테고리 필터 탭)
│   └── /blog/[slug]      포스트 상세
├── /category/food            역할: 정보형 키워드 → 트래픽 유입용
├── /category/stay            역할: 어필리에이트 단가 높음 (Booking/Agoda)
├── /category/beauty          역할: 핵심 수익 — 어필리에이트 + 향후 클리닉 제휴
├── /category/k-beauty        역할: 어필리에이트 (올리브영 글로벌)
├── /category/neighborhoods   역할: 검색량 많은 정보형 키워드
├── /about                 역할: E-E-A-T 강화, 구독자 수(Stats) 노출
└── /contact               역할: 제휴 문의 (3순위 전환)
```

**`/team` 페이지는 만들지 않는다** — 1인 운영이라 `/about` 하나로 E-E-A-T 요건이 충분히 충족됨. 별도 페이지는 내부링크만 분산시킴.

**2~3단계로 보류 (원안 유지):** `/clinics`, `/beauty-guide`, `/tours` — 지금은 보유 자산(트래픽, 클리닉 제휴 실적)이 없으므로 제외.

---

## 3. Home 페이지 섹션 (순서 고정)

```
① Hero
   - H1 후보: "Seoul Through a Local's Eyes"
   - 서브: "Beauty, Food & Life in Seoul"
   - CTA: "Explore →" (카테고리 탐색 유도, 가입/구매 유도 아님)

② Stats  ← 신규 추가 (보유 자산 확인됨)
   - YouTube 구독자 수 / 샤오홍슈 팔로워 수 카드
   - 필요 시 "방문한 클리닉/카페 수" 등 활동량 지표 추가 가능

③ Featured Posts
   - 카테고리별 1개씩 큐레이션

④ About 미리보기
   - 경민님 사진 + 2~3줄 소개 + "Read More →"

⑤ Category Strip
   - 5개 카테고리 아이콘 + 이름 → /category/[slug]

⑥ Newsletter CTA (2순위)
   - "Get Seoul tips in your inbox"

⑦ Latest Posts Grid
   - 최신 6~9개

⑧ Footer
   - SNS 링크 + 카테고리 목록 + NAP(선택)
```

원본 문서 대비 바뀐 점: Stats 섹션 추가, Newsletter CTA를 1순위가 아닌 2순위로 명시적으로 재배치.

---

## 4. 포스트 상세 페이지 — 전환 구조 보완

전환 목표가 "아웃링크 클릭"이므로, `QuickInfoBox`가 실질적인 전환 지점이 된다. 원본 스키마의 `booking: string`은 문자열 메모용이라 실제 링크 역할을 못 한다.

**Sanity `quickInfo` 필드 보완 제안**
```ts
{ name: 'bookingUrl', type: 'url' },       // booking: string → url로 변경
{ name: 'affiliateLinks', type: 'array', of: [{
  type: 'object', fields: [
    { name: 'label',    type: 'string' },   // "Book on Klook"
    { name: 'url',      type: 'url' },
    { name: 'platform', type: 'string',
      options: { list: ['klook', 'getyourguide', 'booking', 'agoda', 'oliveyoung', 'other'] } },
  ]
}]},
```
지금 당장 링크를 채우지 않아도 되지만, 필드는 미리 만들어 두고 발행 시 비워두는 방식으로 시작.

**신규 컴포넌트: `<AffiliateDisclosure />`**
어필리에이트 링크가 실제로 포스트에 들어가는 시점부터 필수. Google AdSense 정책 및 표시광고법(협찬/제휴 표시 의무) 대응. 포스트 상단 또는 QuickInfoBox 근처에 "This post contains affiliate links" 형태로 고정 노출.

---

## 5. Sanity 스키마 보완안

원본 문서 7장의 Post 스키마는 유지하되 다음을 검토:

- **`category`를 문자열 enum에서 별도 `category` document 타입으로 분리할 것을 권장** (강제 아님).
  - 이유: `/category/[slug]` 가 정식 pillar 페이지로 사이트맵에 포함됐으므로, 카테고리 자체에 `title`, `description`, `heroImage`, `seo` 필드가 필요함. 문자열 enum으로는 카테고리 페이지의 메타/히어로 콘텐츠를 관리할 곳이 없음.
  - 트레이드오프: 원본 문서의 "초기엔 단순하게" 원칙과 상충. 포스트 100개 이전 트래픽 낮은 단계에서는 문자열 enum + 카테고리 페이지 텍스트를 코드에 하드코딩해도 무방. **카테고리 설명/썸네일을 자주 바꿀 계획이면 분리, 아니면 원안(문자열) 유지해도 됨.**
- `quickInfo.bookingUrl`, `quickInfo.affiliateLinks` 추가 (4장 참고).
- `faq`, `relatedPosts`, `seo`, `tags`는 원안 그대로 유지.

---

## 6. 기술 SEO 구체화

**Next.js App Router 라우팅 매핑**
```
app/page.tsx                        → /
app/blog/page.tsx                   → /blog
app/blog/[slug]/page.tsx            → /blog/[slug]
app/category/[category]/page.tsx    → /category/food 등 (generateStaticParams로 5개 고정 생성)
app/about/page.tsx                  → /about
app/contact/page.tsx                → /contact
app/sitemap.ts                      → sitemap.xml (next-sitemap 패키지 대신 App Router 네이티브 방식 — 별도 빌드 스텝 없이 배포 시 자동 반영되고 타입 안전함)
app/robots.ts                       → robots.txt
public/llms.txt                     → AI 크롤러용 정적 파일
```

**JSON-LD 매핑**
| 콘텐츠 유형 | 스키마 |
|---|---|
| 모든 포스트 공통 | `Article` |
| 클리닉/시술 후기 글 | `Review` + `LocalBusiness` (mainEntity로 클리닉명/주소) |
| FAQ 섹션 있는 글 (전체 포스트 필수이므로 사실상 전부) | `FAQPage` |

**`llms.txt` 골격**
```
# Muse of Seoul
> Beauty, food, and lifestyle guides for Seoul, written by a local.

## Categories
- Beauty Treatments: /category/beauty
- K-Beauty Products: /category/k-beauty
- Stay in Seoul: /category/stay
- Food & Cafes: /category/food
- Seoul Neighborhoods: /category/neighborhoods
```

---

## 7. 제외된 페이지 및 이유

| 페이지 | 이유 |
|---|---|
| `/team` | 1인 운영, `/about`으로 충분 |
| `/clinics` | 트래픽·클리닉 제휴 실적 없음 → 2단계로 보류 |
| `/beauty-guide` | 큐레이션할 만한 포스트 볼륨 부족 → 2단계로 보류 |
| `/tours` | 판매 상품·예약 시스템 없음 → 3단계로 보류 |
| 가짜 후기/수치 섹션 | 보유하지 않은 자산은 넣지 않음 (Testimonials는 실제 후기 확보 전까지 제외) |

---

## 8. 다음 단계

1. Sanity 스키마 실제 구현 (`post`, 필요 시 `category` document, `siteSettings`)
2. Next.js 14 프로젝트 스캐폴딩 (App Router + TypeScript + Tailwind)
3. 이 문서를 기준으로 컴포넌트 구현 순서 결정: `Header → HeroImage → PostCard → QuickInfoBox → CategoryBadge → FAQSection → RelatedPosts → NewsletterCTA → AffiliateDisclosure → Footer`
