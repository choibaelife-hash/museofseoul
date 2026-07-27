import { PortableText, type PortableTextComponents } from "next-sanity";
import Image from "next/image";
import type { PortableTextBlock } from "next-sanity";

const components: PortableTextComponents = {
  types: {
    image: ({ value }) => (
      <span className="relative my-6 block aspect-[16/9] w-full overflow-hidden rounded-lg bg-black/5">
        <Image src={value.url} alt={value.alt || ""} fill className="object-cover" />
      </span>
    ),
  },
};

export function PostBody({ value }: { value: PortableTextBlock[] }) {
  return (
    <div className="prose prose-neutral max-w-none">
      <PortableText value={value} components={components} />
    </div>
  );
}
