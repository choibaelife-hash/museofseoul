import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Partnership and collaboration inquiries for Muse of Seoul.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <h1 className="font-serif text-3xl">Contact</h1>
      <p className="mt-2 text-black/60">
        For brand partnerships, clinic collaborations, or press inquiries.
      </p>
      <div className="mt-8">
        <ContactForm />
      </div>
    </div>
  );
}
