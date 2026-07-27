"use client";

import { useState } from "react";

// TODO: wire up to Mailchimp once the audience/list is created.
export function NewsletterCTA() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className="rounded-lg bg-black/5 px-6 py-10 text-center">
      <h2 className="font-serif text-xl">Get Seoul tips in your inbox</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-black/60">
        Beauty finds, cafe picks, and neighborhood guides — no spam.
      </p>

      {submitted ? (
        <p className="mt-4 text-sm">Thanks — check your inbox to confirm.</p>
      ) : (
        <form
          className="mx-auto mt-4 flex max-w-sm gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
        >
          <input
            type="email"
            required
            placeholder="you@example.com"
            className="w-full rounded-md border border-black/20 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="shrink-0 rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-black/80"
          >
            Subscribe
          </button>
        </form>
      )}
    </section>
  );
}
