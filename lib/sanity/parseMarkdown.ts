export type ParsedBlock =
  | { style: "normal" | "h2" | "h3"; text: string }
  | { style: "image"; url: string; alt: string };

const IMAGE_LINE = /^!\[(.*?)\]\((.*?)\)$/;

// Minimal on purpose — supports "## heading" / blank-line paragraphs /
// ![alt](url) image lines, the shape the write flow asks writers to paste in.
export function parseMarkdownBlocks(markdown: string): ParsedBlock[] {
  return markdown
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const image = block.match(IMAGE_LINE);
      if (image) return { style: "image" as const, alt: image[1], url: image[2] };
      if (block.startsWith("### ")) return { style: "h3" as const, text: block.slice(4) };
      if (block.startsWith("## ")) return { style: "h2" as const, text: block.slice(3) };
      return { style: "normal" as const, text: block.replace(/\n/g, " ") };
    });
}
