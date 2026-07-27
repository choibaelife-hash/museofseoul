import type { Faq } from "@/lib/types";

export function FAQSection({ faq }: { faq: Faq[] }) {
  if (!faq.length) return null;

  return (
    <section>
      <h2 className="font-serif text-xl">FAQ</h2>
      <div className="mt-4 flex flex-col divide-y divide-black/10">
        {faq.map((item) => (
          <details key={item.question} className="group py-4">
            <summary className="cursor-pointer list-none font-medium">
              {item.question}
            </summary>
            <p className="mt-2 text-sm text-black/70">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
