import Image from "next/image";

// Remote image domains (Sanity CDN / Cloudinary) need to be added to
// next.config.ts images.remotePatterns once those accounts exist.
export function HeroImage({
  src,
  alt,
  aspectClassName = "aspect-[16/9]",
}: {
  src?: string;
  alt: string;
  aspectClassName?: string;
}) {
  return (
    <div className={`relative w-full overflow-hidden bg-black/5 ${aspectClassName}`}>
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
