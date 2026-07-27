import type { QuickInfo } from "@/lib/types";
import { AffiliateDisclosure } from "@/components/AffiliateDisclosure";

export function QuickInfoBox({ info }: { info: QuickInfo }) {
  const rows: { label: string; value: string }[] = [];
  if (info.price) rows.push({ label: "Price", value: info.price });
  if (info.location) rows.push({ label: "Location", value: info.location });
  if (info.duration) rows.push({ label: "Duration", value: info.duration });
  if (info.painLevel !== undefined)
    rows.push({ label: "Pain level", value: `${info.painLevel}/10` });
  if (info.english !== undefined)
    rows.push({ label: "English support", value: info.english ? "Yes" : "No" });

  const hasAffiliateLinks = !!info.affiliateLinks?.length || !!info.bookingUrl;

  return (
    <aside className="rounded-lg border border-black/10 p-5">
      <h2 className="font-serif text-base">Quick Info</h2>
      <dl className="mt-3 flex flex-col gap-2 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-4">
            <dt className="text-black/50">{row.label}</dt>
            <dd className="text-right">{row.value}</dd>
          </div>
        ))}
      </dl>

      {(info.bookingUrl || info.affiliateLinks?.length) && (
        <div className="mt-4 flex flex-col gap-2">
          {info.bookingUrl && (
            <a
              href={info.bookingUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="block rounded-md bg-black px-4 py-2 text-center text-sm text-white hover:bg-black/80"
            >
              Book now
            </a>
          )}
          {info.affiliateLinks?.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="block rounded-md border border-black/20 px-4 py-2 text-center text-sm hover:bg-black/5"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}

      {hasAffiliateLinks && <AffiliateDisclosure className="mt-3" />}
    </aside>
  );
}
