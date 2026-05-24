import Link from "next/link";
import SubmissionRejector from "@/components/SubmissionRejector";
import SubmissionsTicker from "@/components/SubmissionsTicker";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit an Film — Peter's Movies",
  description:
    "Submit a film for canon consideration. Cortex evaluates it against the curator's standards and names the film on Peter's list that already does the job better.",
};

export default function SubmitPage() {
  return (
    <main className="min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-ink/10 px-5 py-4 sm:px-6 md:px-16">
        <div className="mx-auto max-w-6xl flex items-center gap-3">
          <Link
            href="/"
            className="eyebrow note transition hover:text-accent"
          >
            Peter's Movies
          </Link>
          <span className="font-mono text-sm text-ink/50">/</span>
          <span className="eyebrow note">
            Submit
          </span>
        </div>
      </div>

      {/* Hero strip */}
      <header className="border-b border-ink/10 px-5 py-6 sm:px-6 sm:py-7 md:px-16 md:py-9">
        <div className="mx-auto max-w-6xl">
          <p className="mb-1 eyebrow eyebrow--accent">
            Peter's Movies / Submit
          </p>
          <h1 className="serif text-2xl leading-tight text-ink sm:text-3xl md:text-4xl">
            Pitch a film for the list.
          </h1>
          <p className="serif mt-2 max-w-2xl text-sm italic text-ink/70 sm:text-base">
            the list doesn't need it. Submit anyway. Cortex will explain — in detail —
            which film on the list already does the job your film is trying to do.
          </p>
        </div>
      </header>

      <section className="px-5 py-12 sm:px-6 sm:py-16 md:px-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <SubmissionRejector />
        </div>
      </section>

      <SubmissionsTicker />
    </main>
  );
}
