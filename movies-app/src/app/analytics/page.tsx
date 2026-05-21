import Link from "next/link";
import MovieStats from "@/components/MovieStats";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics — Peter's Movies",
  description:
    "By the numbers: 180+ records, distinct directors, year span, decade distribution, career arcs across the list.",
};

export default function AnalyticsPage() {
  return (
    <main className="min-h-screen">
      <div className="border-b border-ink/10 px-5 py-4 sm:px-6 md:px-16">
        <div className="mx-auto max-w-6xl flex items-center gap-3">
          <Link
            href="/"
            className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40 transition hover:text-accent"
          >
            Peter's Movies
          </Link>
          <span className="font-mono text-[10px] text-ink/20">/</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">
            Analytics
          </span>
        </div>
      </div>

      <header className="border-b border-ink/10 px-5 py-6 sm:px-6 sm:py-7 md:px-16 md:py-9">
        <div className="mx-auto max-w-6xl">
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
            Peter's Movies / Analytics
          </p>
          <h1 className="serif text-2xl leading-tight text-ink sm:text-3xl md:text-4xl">
            the list, counted.
          </h1>
          <p className="serif mt-2 max-w-xl text-sm italic text-ink/70 sm:text-base">
            Every stat derived from the list itself. Click anything to filter back into the records.
          </p>
        </div>
      </header>

      <MovieStats />
    </main>
  );
}
