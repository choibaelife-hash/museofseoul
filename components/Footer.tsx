import Link from "next/link";
import { SiInstagram, SiPinterest, SiXiaohongshu, SiYoutube } from "react-icons/si";
import { siteConfig } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-black/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 text-sm text-black/60 sm:flex-row sm:justify-between">
        <div>
          <p className="font-serif text-lg text-black">{siteConfig.name}</p>
          <p className="mt-1 max-w-xs">{siteConfig.description}</p>
          <Link href="mailto:themuseofseoul@gmail.com" className="mt-2 inline-block hover:underline">
            themuseofseoul@gmail.com
          </Link>
        </div>

        <div className="flex items-start gap-4">
          {/* TODO: replace "#" with real profile URLs once accounts are live */}
          <a href="#" aria-label="YouTube" className="text-black/60 hover:text-black">
            <SiYoutube size={18} />
          </a>
          <a href="#" aria-label="Xiaohongshu" className="text-black/60 hover:text-black">
            <SiXiaohongshu size={18} />
          </a>
          <a href="#" aria-label="Instagram" className="text-black/60 hover:text-black">
            <SiInstagram size={18} />
          </a>
          <a href="#" aria-label="Pinterest" className="text-black/60 hover:text-black">
            <SiPinterest size={18} />
          </a>
        </div>
      </div>
    </footer>
  );
}
