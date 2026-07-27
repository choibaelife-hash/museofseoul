import Image from "next/image";

// Remote image domains (Sanity CDN / Cloudinary) need to be added to
// next.config.ts images.remotePatterns once those accounts exist.
export function HeroImage({
  src,
  alt,
}: {
  src?: string;
  alt: string;
}) {
  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden bg-black/5">
      {src ? (
        <Image src={src} alt={alt} fill className="object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-black/40">
          Image pending
        </div>
      )}
    </div>
  );
}
