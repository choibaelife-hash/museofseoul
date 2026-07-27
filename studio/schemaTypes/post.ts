import { createElement } from "react";
import { defineField, defineType, defineArrayMember } from "sanity";
import { Icon } from "@sanity/icons";

const PostIcon = () => createElement(Icon, { symbol: "document" });

// SEO/AEO field structure (groups, focusKeyphrase, required alt text,
// schemaOrgType, FAQ discipline, social fallback chain) is carried over
// from jennyjessie-classroom's journalPost.ts. The quickInfo group is new —
// that project has no price/booking concept, this one is built around it.
export const postType = defineType({
  name: "post",
  title: "Post",
  type: "document",
  icon: PostIcon,
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "quickInfo", title: "Quick Info" },
    { name: "seo", title: "SEO" },
    { name: "social", title: "Social" },
    { name: "aeo", title: "AEO / GEO" },
  ],
  fields: [
    defineField({
      name: "focusKeyphrase",
      title: "Focus Keyphrase",
      description:
        "글 작성 전 가장 먼저 입력 · 이 글이 구글에서 검색됐으면 하는 핵심 키워드 1개 (예: piko laser Gangnam price) · 제목·Meta Title·본문 첫 문단·마무리 문단에 포함",
      type: "string",
      group: "content",
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      group: "content",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      description: "제목 입력 후 Generate 버튼 클릭 — URL 주소로 사용됩니다",
      type: "slug",
      group: "content",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "category",
      title: "Category",
      description: "글 카테고리 선택 · JSON-LD(articleSection)와 /category 페이지 라우팅에 사용됨",
      type: "string",
      group: "content",
      validation: (r) => r.required().error("카테고리를 선택하세요"),
      options: {
        list: [
          { title: "K-Beauty Treatments", value: "beauty" },
          { title: "K-Beauty Products", value: "k-beauty" },
          { title: "Stay in Seoul", value: "stay" },
          { title: "Where to Go in Seoul", value: "where-to-go" },
        ],
        layout: "radio",
      },
    }),
    defineField({
      name: "subcategory",
      title: "Subcategory (Seoul Beauty Insider)",
      description: "K-Beauty Treatments 글에만 해당 — Seoul Beauty Insider 코너 분류용",
      type: "string",
      group: "content",
      hidden: ({ document }) => document?.category !== "beauty",
      options: {
        list: [
          { title: "K-Clinic", value: "k-clinic" },
          { title: "Body & Spa", value: "body-spa" },
          { title: "Hair & Makeup", value: "hair-makeup" },
          { title: "Skin & Face", value: "skin-face" },
        ],
        layout: "radio",
      },
    }),
    defineField({
      name: "publishedAt",
      title: "Date",
      type: "datetime",
      group: "content",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "author",
      title: "Author",
      type: "string",
      group: "content",
      initialValue: "Kyungmin",
      hidden: true,
    }),
    defineField({
      name: "excerpt",
      title: "Lead",
      description:
        "160자 이내 · Meta Description 미입력 시 자동 사용 · ChatGPT·Perplexity 등 AI 검색 인용용 — 단정적이고 명확하게 작성",
      type: "text",
      rows: 3,
      group: "content",
      validation: (r) => r.max(160).warning("160자를 넘으면 메타 디스크립션으로 쓸 때 잘릴 수 있습니다"),
    }),
    defineField({
      name: "mainImage",
      title: "Main Image",
      type: "object",
      group: "content",
      fields: [
        defineField({
          name: "url",
          title: "Image URL",
          type: "url",
          description: "R2에 업로드 후 URL 붙여넣기",
        }),
        defineField({
          name: "alt",
          type: "string",
          title: "Alt text",
          validation: (r) => r.required().error("Alt 텍스트를 입력하세요 — 이미지 설명이 없으면 발행할 수 없습니다"),
        }),
      ],
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      group: "content",
      validation: (r) => r.min(1).error("본문은 최소 1개 블록이 필요합니다"),
      of: [
        defineArrayMember({
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "H2", value: "h2" },
            { title: "H3", value: "h3" },
            { title: "Quote", value: "blockquote" },
          ],
          lists: [
            { title: "Bullet", value: "bullet" },
            { title: "Number", value: "number" },
          ],
        }),
        defineArrayMember({
          type: "object",
          name: "image",
          fields: [
            defineField({
              name: "url",
              title: "Image URL",
              type: "url",
              description: "R2에 업로드 후 URL 붙여넣기",
            }),
            defineField({ name: "alt", type: "string", title: "Alt text" }),
          ],
        }),
      ],
    }),
    defineField({
      name: "relatedPosts",
      title: "Related Posts",
      type: "array",
      group: "content",
      of: [defineArrayMember({ type: "reference", to: [{ type: "post" }] })],
      validation: (r) => r.max(3).warning("보통 3개면 충분합니다"),
    }),

    // Quick Info — price/booking/affiliate structure has no equivalent in
    // the reference schema, designed from scratch for this content type.
    defineField({
      name: "quickInfo",
      title: "Quick Info",
      description: "가격·위치·예약 정보 — 포스트 상세 페이지의 QuickInfoBox에 표시됨",
      type: "object",
      group: "quickInfo",
      fields: [
        defineField({
          name: "price",
          title: "Price",
          description: "원화 먼저, 달러는 괄호 안에 — 예: ₩85,000 (~$62)",
          type: "string",
        }),
        defineField({
          name: "location",
          title: "Location",
          type: "string",
        }),
        defineField({
          name: "english",
          title: "English support",
          description: "영어 응대 가능 여부",
          type: "boolean",
        }),
        defineField({
          name: "duration",
          title: "Duration",
          description: "시술/체험 소요 시간 (beauty 카테고리용)",
          type: "string",
          hidden: ({ document }) => document?.category !== "beauty",
        }),
        defineField({
          name: "painLevel",
          title: "Pain level (1-10)",
          description: "beauty 카테고리에만 해당",
          type: "number",
          validation: (r) => r.min(1).max(10),
          hidden: ({ document }) => document?.category !== "beauty",
        }),
        defineField({
          name: "bookingUrl",
          title: "Booking URL",
          description: "예약 페이지 직접 링크 (있는 경우)",
          type: "url",
        }),
        defineField({
          name: "affiliateLinks",
          title: "Affiliate Links",
          description: "Klook / Booking / Agoda / 올리브영 등 아웃링크 — 채워지면 포스트에 어필리에이트 공시 문구가 자동 표시됨",
          type: "array",
          of: [
            defineArrayMember({
              type: "object",
              name: "affiliateLink",
              fields: [
                defineField({ name: "label", title: "Label", type: "string", validation: (r) => r.required() }),
                defineField({ name: "url", title: "URL", type: "url", validation: (r) => r.required() }),
                defineField({
                  name: "platform",
                  title: "Platform",
                  type: "string",
                  options: {
                    list: ["klook", "getyourguide", "booking", "agoda", "oliveyoung", "other"],
                  },
                }),
              ],
              preview: {
                select: { title: "label", subtitle: "platform" },
              },
            }),
          ],
        }),
      ],
    }),

    // SEO
    defineField({
      name: "metaTitle",
      title: "Meta Title",
      description: "60자 이내 · Focus Keyphrase 반드시 포함 · 미입력 시 Title 그대로 사용",
      type: "string",
      group: "seo",
      validation: (r) => r.max(60).warning("60자를 넘으면 구글 검색결과에서 잘릴 수 있습니다"),
    }),
    defineField({
      name: "metaDescription",
      title: "Meta Description",
      description: "120~160자 · Focus Keyphrase 포함 · 미입력 시 Lead 사용",
      type: "text",
      rows: 3,
      group: "seo",
      validation: (r) => r.max(160).warning("160자를 넘으면 구글 검색결과에서 잘릴 수 있습니다"),
    }),
    defineField({
      name: "ogImage",
      title: "OG Image",
      description: "1200×630px 권장 · 미입력 시 Main Image 사용",
      type: "object",
      group: "seo",
      fields: [
        defineField({
          name: "url",
          title: "Image URL",
          type: "url",
          description: "R2에 업로드 후 URL 붙여넣기",
        }),
        defineField({ name: "alt", type: "string", title: "Alt text" }),
      ],
    }),
    defineField({
      name: "keywords",
      title: "Keywords",
      description: "서브 키워드 3~5개 · Focus Keyphrase의 유사 표현·관련 주제어",
      type: "array",
      group: "seo",
      of: [defineArrayMember({ type: "string" })],
      options: { layout: "tags" },
    }),
    defineField({
      name: "canonical",
      title: "Canonical URL",
      description: "미입력 시 /blog/[slug] 자동 사용 · 동일 내용이 여러 URL에 있을 때만 입력",
      type: "url",
      group: "seo",
    }),
    defineField({
      name: "noindex",
      title: "No Index",
      description: "체크하면 구글 수집 제외 · 초안·중복 페이지에만 사용",
      type: "boolean",
      group: "seo",
      initialValue: false,
    }),
    defineField({
      name: "schemaOrgType",
      title: "Schema.org Type",
      description: "BlogPosting: 일반 포스트 · Review: 클리닉/제품 리뷰 글 · FAQPage: FAQ 비중이 큰 글",
      type: "string",
      group: "seo",
      initialValue: "BlogPosting",
      options: {
        list: [
          { title: "BlogPosting (기본)", value: "BlogPosting" },
          { title: "Review", value: "Review" },
          { title: "FAQPage", value: "FAQPage" },
        ],
        layout: "radio",
      },
    }),
    defineField({
      name: "isBusinessReview",
      title: "Is a business review?",
      description: "체크하면 아래 업체 정보가 나타나고, JSON-LD에 LocalBusiness가 함께 표시됩니다 (클리닉/카페/숙소 리뷰용)",
      type: "boolean",
      group: "seo",
      initialValue: false,
    }),
    defineField({
      name: "business",
      title: "Business Info",
      type: "object",
      group: "seo",
      hidden: ({ document }) => !document?.isBusinessReview,
      fields: [
        defineField({ name: "name", title: "Business name", type: "string" }),
        defineField({ name: "address", title: "Address", type: "string" }),
      ],
    }),

    // Social
    defineField({
      name: "twitterTitle",
      title: "Twitter Title",
      description: "미입력 시 Meta Title → Title 순으로 자동 사용",
      type: "string",
      group: "social",
    }),
    defineField({
      name: "twitterDescription",
      title: "Twitter Description",
      description: "미입력 시 Meta Description → Lead 순으로 자동 사용",
      type: "text",
      rows: 3,
      group: "social",
    }),

    // AEO
    defineField({
      name: "faqSection",
      title: "FAQ Section",
      description: "AI 검색(ChatGPT, Perplexity 등) 인용 최적화 · 최소 3개 이상 · 본문에 중복 작성 금지 — 이 탭에만 입력",
      type: "array",
      group: "aeo",
      validation: (r) => r.min(3).warning("FAQ는 최소 3개를 권장합니다"),
      of: [
        defineArrayMember({
          type: "object",
          name: "faqItem",
          title: "FAQ Item",
          fields: [
            defineField({
              name: "question",
              title: "Question",
              description: '실제 검색 쿼리 형태로 · 물음표(?)로 끝내기',
              type: "string",
              validation: (r) => r.required(),
            }),
            defineField({
              name: "answer",
              title: "Answer",
              description: "50~300자 · 정의+답을 첫 문장에 단정적으로 — AI가 그대로 인용하는 텍스트",
              type: "text",
              rows: 4,
              validation: (r) => r.required(),
            }),
          ],
          preview: { select: { title: "question" } },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "category" },
  },
});
