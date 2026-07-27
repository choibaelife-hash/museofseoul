import { siteConfig } from "@/lib/site";

// TODO: fill in lib/site.ts siteConfig.stats with real subscriber counts.
// Renders nothing until at least one stat is set, per the "no fake numbers" rule.
export function StatsBar() {
  const stats = [
    { label: "YouTube subscribers", value: siteConfig.stats.youtubeSubscribers },
    { label: "Xiaohongshu followers", value: siteConfig.stats.xiaohongshuFollowers },
  ].filter((s) => s.value !== undefined);

  if (!stats.length) return null;

  return (
    <section className="grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label}>
          <p className="font-serif text-3xl">{stat.value!.toLocaleString()}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-black/50">
            {stat.label}
          </p>
        </div>
      ))}
    </section>
  );
}
