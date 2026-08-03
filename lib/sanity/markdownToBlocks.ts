import { parseMarkdownBlocks } from "@/lib/sanity/parseMarkdown";

const key = () => Math.random().toString(36).slice(2, 10);

// Builds just enough Portable Text to satisfy the `body` field in
// studio/schemaTypes/post.ts — normal/h2/h3 blocks + bodyImage objects,
// no marks or other inline formatting.
export function markdownToBlocks(markdown: string) {
  return parseMarkdownBlocks(markdown).map((block) => {
    if (block.style === "image") {
      return { _type: "bodyImage", _key: key(), url: block.url, alt: block.alt };
    }
    return {
      _type: "block",
      _key: key(),
      style: block.style,
      markDefs: [],
      children: [{ _type: "span", _key: key(), text: block.text, marks: [] }],
    };
  });
}
