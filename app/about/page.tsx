import type { Metadata } from "next";
import { StatsBar } from "@/components/StatsBar";

export const metadata: Metadata = {
  title: "About",
  description: "Kyungmin, the Seoul local behind Muse of Seoul.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-16 text-center">
      <div className="h-32 w-32 rounded-full bg-black/10" />
      <h1 className="font-serif text-3xl">Hi, I&apos;m Kyungmin</h1>
      <p className="text-black/60">
        {/* TODO: replace with real bio copy */}
        I grew up in Seoul and never left. This is where I write about the
        beauty treatments, cafes, and neighborhoods I actually visit — with
        real prices, in plain English, including the parts that weren&apos;t
        great.
      </p>
      <StatsBar />
    </div>
  );
}
