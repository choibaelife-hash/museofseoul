# Sanity 공개 글 캐시와 변경 알림

## 로컬 구현 범위

- 공개 글은 Next Data Cache에서 3,600초 재사용한다. 초안 미리보기는 `drafts` 관점 + 읽기 토큰 + `revalidate: 0`으로 분리한다.
- 캐시를 채울 때 `useCdn: false`로 Content Lake 원본을 읽는다. 웹훅 직후 CDN의 이전 응답이 한 시간 다시 저장되는 것을 막는다.
- 상세는 slug별, 목록은 category별, 홈 최신 글은 home 태그를 사용한다. 홈의 Beauty Insider는 beauty 목록 태그를 공유한다.
- 서명이 유효한 공개 post 변경에만 `revalidateTag(tag, { expire: 0 })`를 호출한다. 변경 전후 slug/category의 합집합을 처리한다.
- `/blog`도 동일한 카테고리 조회를 사용하므로 함께 갱신된다. 전체 layout을 비우거나 관련 없는 글 상세를 갱신하지 않는다.
- 웹훅은 이미 열린 브라우저 화면으로 변경 사항을 푸시하지 않는다. 다음 새 요청/새로고침에서 갱신된다.
- 웹훅이 누락되면 1시간 만료 뒤 요청이 들어왔을 때 재검증된다. 시간 기반 재검증은 첫 요청에 이전 응답을 줄 수 있고, 원본 요청 실패 시 이전 캐시가 유지될 수 있다. 정확히 매 정시에 실행되는 작업이 아니다.
- 이미지 URL 변경은 글 데이터와 함께 반영된다. **동일한 R2 URL의 파일 덮어쓰기**는 R2/이미지 최적화 캐시의 별도 문제다. 새 이미지에는 새 URL을 사용한다.

## 배포 승인 후 등록할 설정 — 아직 등록하지 않음

1. 홈페이지 서버 환경변수 `SANITY_REVALIDATE_SECRET`에 충분히 긴 무작위 비밀값을 설정한다. `NEXT_PUBLIC_` 접두사를 붙이지 않는다. Sanity 웹훅 Secret에 동일한 값을 넣는다. 문서/소스/로그에 실제 값을 저장하지 않는다.
2. 기존 `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`이 대상 프로젝트와 dataset을 가리키는지 확인한다.
3. 수신 URL: `https://museofseoul.com/api/sanity/revalidate`, HTTP POST, JSON.
4. Dataset: `production`. Create / Update / Delete 모두 켜기. Drafts / Versions는 모두 끄기. Webhook API version: `v2025-02-19`.
5. 다음 Filter와 Projection을 등록한다. 기본 전체 문서 payload로는 이전 주소·카테고리를 알 수 없으므로 아래 projection이 필수다.

Filter:

```groq
(before()._type == "post" || after()._type == "post") &&
!(coalesce(after()._id, before()._id) in path("drafts.**")) &&
!(coalesce(after()._id, before()._id) in path("versions.**"))
```

Projection:

```groq
{
  "projectId": sanity::projectId(),
  "dataset": sanity::dataset(),
  "operation": delta::operation(),
  "before": before(){_id, _type, "slug": slug.current, category},
  "after": after(){_id, _type, "slug": slug.current, category}
}
```

Create는 before=null, Delete는 after=null이다. Update에는 두 상태가 모두 필요하다. ID가 일치해야 한다. 수신부에서 프로젝트/dataset을 확인하고 drafts./versions. ID를 다시 차단한다. `next-sanity/webhook`의 raw body 서명 검증과 기본 Content Lake 반영 대기(3초)를 사용한다.

Sanity는 로컬 localhost 서버에 직접 전달할 수 없다. 이번 로컬 검증은 서명한 테스트 요청만 사용하며 외부 터널/웹훅 등록/실제 문서 수정은 하지 않는다.

## 실패 확인

서버 stdout/stderr의 JSON 로그에서 `event = sanity.revalidate`를 검색한다.

- `revalidated`: 갱신 성공. documentId, operation, tagCount, requestId 포함.
- `ignored`: 초안, 버전 또는 대상 외 타입.
- `rejected`: 서명/본문/프로젝트·dataset 불일치. 400/401/403 응답.
- `misconfigured`: 환경변수 누락. 503 응답.
- `failed`: 캐시 갱신 실패. 500 응답. 동일 알림 재전달은 안전하다.

응답 requestId와 서버 로그를 대조한다. 비밀키·토큰·글 본문은 로그에 기록하지 않는다. 알림이 서버에 도달하지 않은 실패는 서버 로그에 없으므로 배포 후 Sanity 웹훅 전송 이력에서도 확인한다. 로그 보관 기간은 배포 호스트 설정을 따른다. 별도 영구 로그 DB나 자동 알림 서비스는 추가하지 않았다.

## 재현 가능한 로컬 검증

Node 22.15+ 및 기존 node_modules 필요. 새 의존성 설치 불필요.

```sh
node --test tests/sanity-cache.test.mjs
node tests/sanity-cache.integration.mjs
npx tsc --noEmit --incremental false
```

- 단위/핸들러 검증: TTL=3600, 초안 캐시 제외, 서명 검증, 변경 전후 태그, 잘못된 payload, 반복 이벤트, 500 실패 로그.
- 통합 검증: 임시 디렉터리에서 **현재 Muse 홈·목록·상세 페이지와 실제 Next production 캐시**를 실행한다. Sanity 클라이언트만 로컬 테스트 데이터 서버로 대체하며 실제 Sanity/R2에 접근하지 않는다. 원본 프로젝트의 `.next`나 실행 중 서버를 덮어쓰지 않는다.
- 제목/대표 이미지 URL 변경, 카테고리·slug 이동, 이전 URL 404, 삭제, 초안과 공개 데이터 분리, 변경 없는 글 캐시 재사용을 확인한다.
- 만료 복구는 1초짜리 별도 fetch probe로 Next 동작을 확인하고, 실제 조회 코드 TTL이 3600임은 단위 검증으로 확인한다. 한 시간을 실제로 기다린 검증은 아니다.
- 실제 Sanity의 GROQ projection/전송과 배포 캐시 공유 동작은 승인 후 연결 검증이 필요하다. 서버를 여러 인스턴스로 운영하면 캐시 무효화가 모든 인스턴스에 공유되도록 호스트의 캐시 구성을 확인해야 한다.

공식 참고:
- https://www.sanity.io/docs/content-lake/webhooks
- https://www.sanity.io/docs/http-reference/webhooks
- 설치된 Next 문서: node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidateTag.md
