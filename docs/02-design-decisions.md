# Muse of Seoul — 홈페이지 구성 & Seoul Beauty Insider 설계 문서

> 작성 기준: 2026년 7월 · 이 문서는 실제 코드(`app/page.tsx`, `lib/site.ts`)에 반영된 결정과, 아직 코드화되지 않은 다음 단계 설계를 함께 담습니다.

---

# PART 1. 홈페이지 구성 컨셉

## 1. 브랜드 톤

- **컬러**: 배경 흰색(`#ffffff`) · 메인 시그니처 컬러 Seoul Mauve(`#735364`) · 보조 Pure Dew Aqua(`#acced1`) · Seoul Ivory Beige(`#efe7da`) · 텍스트 Editorial Plum(`#37263a`)
- **폰트**: 헤딩 Playfair Display(세리프) · 본문 Montserrat(산세리프)
- **버튼 스타일**: 채워진 버튼이 아니라 아웃라인 + 호버 시 반전(`border border-foreground → hover:bg-foreground hover:text-white`), 대문자 + 자간 넓은 라벨 — 에디토리얼/매거진 톤 유지

## 2. 홈페이지 섹션 순서 (현재 `app/page.tsx` 기준)

| 순서 | 섹션 | 데이터 소스 / 로직 | 비고 |
|---|---|---|---|
| 1 | **Hero** | 전체 글 중 발행일 최신 1개 (자동, 수동 고정 기능 없음) | 좌: 카테고리+제목+요약+CTA / 우: 이미지, 텍스트 컬럼 높이에 맞춰 꽉 참 |
| 2 | **StatsBar** | `siteConfig.stats`에 실제 숫자 있을 때만 렌더 | 가짜 숫자 금지 원칙 — 조건부 렌더로 빈 공간 자체를 안 만듦 |
| 3 | **카테고리 그리드** ("Muse of Seoul Beauty") | `lib/site.ts`의 `categories` 배열 (4개, 하드코딩) | 브랜드 컬러 타일, 카테고리 이미지 없어서 색으로 구분 |
| 4 | **Popular Posts** | 최신글 중 히어로 다음 3개 (image + title만) | 실제 조회수 데이터 없어서 임시로 최신순 사용, 나중에 트래킹 붙으면 교체 |
| 5 | **My Newest Beauty Stories** | 전체 최신글 중 `beauty`/`k-beauty` 카테고리만 필터링, 최대 6개 | 이미지+카테고리+제목+요약+날짜 카드 |
| 6 | **Follow Along (Instagram)** | 자리만 확보, 실제 임베드 아직 없음 | 계정 연동 후 실제 캐러셀로 교체 예정 |
| 7 | **About 미리보기** | 정적 텍스트 | — |
| 8 | **Newsletter CTA** | 정적 폼 (Mailchimp 미연동, TODO) | — |

## 3. 카테고리 구조 변경 히스토리

1. **원래 계획 (museofseoul.md 기준)**: Food & Cafes / Stay in Seoul / Beauty Treatments / K-Beauty Products / Seoul Neighborhoods — 5개, 각각 트래픽/제휴단가/핵심수익/제휴/검색량 목적이 달랐음
2. **1차 변경**: "Beauty Treatments" → **"K-Beauty Treatments"**로 개명 (브랜드 일관성)
3. **2차 변경**: Food & Cafes + Seoul Neighborhoods가 실사용자 입장에서 겹친다고 판단 → **"Where to Go in Seoul"**로 병합 (슬러그도 `where-to-go`로 통합, 기존 글 카테고리값 마이그레이션 완료)
4. **현재 카테고리 (4개, 확정)**:
   - K-Beauty Treatments (`beauty`)
   - K-Beauty Products (`k-beauty`)
   - Stay in Seoul (`stay`)
   - Where to Go in Seoul (`where-to-go`)

> ⚠️ Part 2의 "Seoul Beauty Insider" 하위 카테고리(K-Clinic / Body & Spa / Hair & Makeup / Skin & Face)는 이 4개 중 **K-Beauty Treatments(`beauty`) 하나의 하위 분류**이며, 최상위 카테고리 구조를 바꾸는 게 아님.

## 4. 만들었다가 다시 뺀 것들 (참고용 — 같은 실수 반복 방지)

- **"Latest Posts" 중복 섹션**: 처음엔 히어로/트렌딩 다음에 남는 글을 또 보여주는 섹션이 있었는데, 홈은 "맛보기"만 하고 전체 목록은 `/blog`가 담당해야 한다는 원칙으로 삭제
- **"Stay Trendy with Our Latest Insights"라는 이름**: 실제로는 카테고리 안 가리고 그냥 최신순으로 섞은 것뿐이라 "트렌딩"이라는 이름이 과장 → "Just Published / My Newest ~" 계열로 정정
- **카테고리 그리드를 2단으로 쪼갠 시도**: "최신글 보여주는 섹션"을 나누라는 요청을 카테고리 그리드 쪼개는 걸로 잘못 이해했던 적 있음 → 카테고리 그리드는 4칸 하나로 원복, 대신 **포스트 그리드**를 주제별로 나누는 게 맞는 요청이었음
- **"My Newest Stay & Travel Picks" 섹션**: 한 번 만들었다가, Seoul Beauty Insider 기획이 나오면서 그 자리를 Instagram 섹션으로 교체하고 삭제함

## 5. 아직 미정인 것

- Popular Posts를 실제 "인기"(조회수 등) 기준으로 바꿀지, 계속 최신순으로 둘지
- Instagram 임베드 연동 방식 (Meta 계정 인증 필요)
- Newsletter Mailchimp 실제 연동

---

# PART 2. Seoul Beauty Insider — 신규 페이지 설계

> 상태: 카테고리 확정, 소개 문구 3안 중 미정, 코드/스키마 작업 전

## 1. 배경 / 왜 만드는가

- 기존 블로그는 "내가 직접 가서 받아본" 1인칭 후기 중심 → 서울에 계속 거주해야 지속 가능한 구조
- 경민님이 서울에 없어도 지속 가능한 콘텐츠 축이 필요함
- 한국인들끼리만 공유되는 뷰티 정보(경락, 사우나, 저가 헤어샵, 가격 정보 등)가 있는데, 언어 장벽 때문에 외국인은 접근 불가
- → 이 "한국인 전용 정보"를 번역/가공해서 외국인에게 전달하는 것이 핵심 차별화 포인트가 될 수 있다고 판단
- 검토했다가 기각한 대안:
  - **`/clinics` 직접 방문 디렉토리**: 서울 상주가 전제되는 모델이라 지속가능성 문제로 보류
  - **"K-Beauty Tour" 예약 상품**: 실제 예약/결제/파트너십이 필요한 별도 사업이라 지금 단계에서 페이지로 안 만들기로 함 — 트래픽/제휴 확보 후 웨이팅리스트 형태로 재검토 (원래 로드맵 3단계 `/tours`에 해당)

## 2. 컨셉

**"한국인들끼리만 공유하던 뷰티 정보를 번역해서 전달하는 큐레이션 코너"**

- 기존 블로그(긴 글, 직접 체험 후기)와 역할 분리 — 이 페이지는 블로그보다 **짧고 가벼운 포맷**
- 원천 정보: 한국 인스타그램/샤오홍슈 등에서 도는 뷰티 정보를 관찰 → 번역 → 재구성
- **주의**: 한국 원출처를 그대로 복붙하지 않고 본인 말로 재해석 + 필요시 출처 언급 (저작권 이슈 방지)
- 인스타그램 카드뉴스 콘텐츠와 **소스를 공유** — 번역 한 번 하면 인스타 + 이 페이지 양쪽에 재사용 가능 (홈페이지 6번 섹션 "Follow Along"과 연결됨)

## 3. 페이지명

**Seoul Beauty Insider (서울뷰티인사이더)**

## 4. 카테고리 구조 (최종 확정)

K-Beauty Treatments(`beauty`)의 하위(파생) 카테고리로 Sanity에 구현 예정.

| # | 카테고리 | 포함 내용 |
|---|---|---|
| 1 | **K-Clinic** | 피부과·에스테틱 클리닉 시술 (레이저, 필링 등) |
| 2 | **Body & Spa** | 사우나, 찜질방, 바디 순환마사지 |
| 3 | **Hair & Makeup** | 헤어 관리, 메이크업, 저가 헤어샵 정보 |
| 4 | **Skin & Face** | 경락(페이스 순환/림프 마사지), 스킨케어 |

- 카테고리명은 항상 영문 유지 (한글 음역 금지 — "버짓"처럼 어색해짐)
- Budget(가격)은 별도 카테고리 대신 각 글의 `quickInfo.price` 필드로만 표시

## 5. 소개 문구 (미확정 — 3안 중 선택 대기)

**A. 에디토리얼/매거진 톤**
> 한국인들끼리만 오가던 뷰티 이야기를 엿듣다. 클리닉, 스파, 헤어, 스킨 — 서울의 진짜 뷰티 루틴을 번역해 전합니다.

**B. 짧고 태그라인처럼**
> Korea, translated. 한국인만 알던 뷰티 시크릿, 영어로 풀어드립니다.

**C. 살짝 은밀한 뉘앙스**
> 한국인들만 보던 뷰티 정보, 몰래 번역해서 가져왔습니다. 클리닉부터 스파, 헤어, 스킨까지.

## 6. 포맷 / 콘텐츠 구조 (아이디어 단계)

- 블로그 포스트보다 짧은 카드형 콘텐츠
- 기존 Post 스키마의 `quickInfo`(price/location/duration 등) 재사용 가능할 것으로 예상
- 완전히 새로운 Sanity 문서 타입이 필요한지, 기존 `post` + 서브카테고리 필드로 충분한지는 **아직 미결정**

## 7. 수익화

- 언급되는 제품/샵 어필리에이트 링크
- 트래픽 확보 후: 소규모 샵/브랜드의 "여기 소개해달라"는 스몰 제휴 — 진입장벽이 낮아 초기 수익화에 유리할 수 있음

## 8. 다음에 할 일 (체크리스트)

- [ ] 소개 문구 A/B/C 중 확정 (또는 재작성)
- [ ] Sanity 스키마: `beauty` 카테고리 하위에 서브카테고리 필드 추가 방식 설계 (예: `subcategory` string 필드 — k-clinic / body-spa / hair-makeup / skin-face)
- [ ] 네비게이션에 "Seoul Beauty Insider" 메뉴 추가
- [ ] 라우트 페이지 생성 (슬러그 미정 — `/insider` 등 후보)
- [ ] 콘텐츠 포맷(카드형 vs 짧은 글) 최종 결정
- [ ] 저작권/출처 표기 원칙 문서화 (본문 작성 가이드에 추가)
- [ ] 홈페이지에 Seoul Beauty Insider 진입점(섹션 또는 네비게이션) 추가 여부 결정
