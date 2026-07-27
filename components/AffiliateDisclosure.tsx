export function AffiliateDisclosure({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-black/50 ${className}`}>
      This post may contain affiliate links. If you book or buy through them, I may
      earn a small commission at no extra cost to you.
    </p>
  );
}
