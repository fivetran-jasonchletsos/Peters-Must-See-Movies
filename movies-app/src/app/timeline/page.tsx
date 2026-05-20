import Link from "next/link";
import MovieTimeline from "@/components/MovieTimeline";
import { movies } from "@/lib/movies";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Timeline — Must See",
  description:
    "Every film placed by year — 1939 to 2023. Click a decade to filter the list; click a film to read its entry.",
};

export default function TimelinePage() {
  const total = movies.length;

  return (
    <main className="min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-paper/10 px-5 py-4 sm:px-6 md:px-16">
        <div className="mx-auto max-w-6xl flex items-center gap-3">
          <Link
            href="/"
            className="font-mono text-[10px] uppercase tracking-[0.3em] text-paper/40 transition hover:text-accent"
          >
            Must See
          </Link>
          <span className="font-mono text-[10px] text-paper/20">/</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-paper/70">
            Timeline
          </span>
        </div>
      </div>

      {/* Hero */}
      <header className="border-b border-paper/10 px-5 py-8 sm:px-6 sm:py-10 md:px-16 md:py-14">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
            Across time
          </p>
          <h1 className="serif mt-2 text-3xl font-light leading-tight text-paper sm:text-4xl md:text-5xl">
            1939 <span className="text-paper/40">→</span> 2023
          </h1>
          <p className="serif mt-4 max-w-xl text-sm italic text-paper/70 leading-relaxed sm:text-base">
            Every film placed by year. Click a decade label to filter the list.
            Click any dot to open the film.
          </p>
          <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.28em] text-paper/30">
            {total} films across 84 years
          </p>
        </div>
      </header>

      {/* Timeline */}
      <section className="px-5 py-12 sm:px-6 sm:py-16 md:px-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <MovieTimeline />
        </div>
      </section>

      {/* Back link */}
      <div className="border-t border-paper/10 px-5 py-8 sm:px-6 md:px-16">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Link
            href="/"
            className="font-mono text-[10px] uppercase tracking-[0.25em] text-paper/50 hover:text-accent transition focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            ← Back to the list
          </Link>
          <Link
            href="/analytics"
            className="font-mono text-[10px] uppercase tracking-[0.25em] text-paper/50 hover:text-accent transition focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            Stats →
          </Link>
        </div>
      </div>
    </main>
  );
}
