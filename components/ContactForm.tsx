"use client";

import { useState } from "react";

// TODO: wire up to a real submission endpoint (e.g. Resend, Formspree) before launch.
export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return <p className="text-sm">Thanks for reaching out — I&apos;ll get back to you soon.</p>;
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      <label className="flex flex-col gap-1 text-sm">
        Name
        <input
          type="text"
          required
          className="rounded-md border border-black/20 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          type="email"
          required
          className="rounded-md border border-black/20 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Message
        <textarea
          required
          rows={5}
          className="rounded-md border border-black/20 px-3 py-2"
        />
      </label>
      <button
        type="submit"
        className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-black/80"
      >
        Send
      </button>
    </form>
  );
}
