import { Suspense } from "react";
import Link from "next/link";
import Hero from "@/components/Hero";
import Section from "@/components/Section";
import MovieExplorer from "@/components/MovieExplorer";
import { movies } from "@/lib/movies";

type HubCard = {
  number: string;
  href: string;
  title: string;
  blurb: string;
  glyph: string;
};

const HUB: HubCard[] = [
  {
    number: "02",
    href: "/timeline",
    title: "Timeline",
    blurb:
      "Every film placed by year on a single scrollable rail. Click a decade or a dot to navigate directly into the list.",
    glyph: "1939 → 2023 · every film",
  },
  {
    number: "03",
    href: "/analytics",
    title: "Stats",
    blurb:
      "By the numbers — decades, directors, eras, career arcs across the list. Every stat clickable to drill back into the films.",
    glyph: "decades · directors · eras",
  },
  {
    number: "04",
    href: "/blink",
    title: "Blink",
    blurb:
      "Peter wished he could have added the 17 DVDs from Doctor Who's 'Blink' but didn't know the titles. Here they are.",
    glyph: "17 DVDs · 1965 → 1989 · classic Who",
  },
  {
    number: "05",
    href: "/submit",
    title: "Submit a Movie",
    blurb:
      "Pitch a film for the list. Snowflake Cortex returns a verdict — usually no, always with a reason rooted in what's already on Peter's shelf.",
    glyph: "→ politely rejected",
  },
  {
    number: "06",
    href: "/match",
    title: "Matcher",
    blurb:
      "Three honest questions about tonight — mood, era, runtime budget. The matcher picks the film from Peter's shelf that fits.",
    glyph: "3 questions · 1 film",
  },
];

export default function Home() {
  const total = movies.length;

  return (
    <main className="min-h-screen">
      <Hero />

      <Section
        number="01"
        title="The List"
        blurb={`${total} films. Use the timeline to pick a year, or scroll the list.`}
      >
        <div id="canon" />
        <Suspense fallback={<p className="serif text-ink/40">Loading…</p>}>
          <MovieExplorer />
        </Suspense>
      </Section>

      <Section
        number="·"
        title="Around the list"
        blurb="The films are the point. Everything else here is in support of them."
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {HUB.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group flex flex-col gap-3 border border-ink/15 bg-ink/[0.04] p-7 transition
                hover:border-accent hover:bg-ink/[0.08]
                focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              <p className="eyebrow eyebrow--accent">
                {card.number}
              </p>
              <h3 className="serif text-2xl sm:text-3xl text-ink leading-snug font-light">{card.title}</h3>
              <p className="serif text-sm italic note">
                {card.glyph}
              </p>
              <p className="serif text-base text-ink/80 mt-auto pt-3 leading-relaxed">
                {card.blurb}
              </p>
              <span className="eyebrow note group-hover:text-accent transition">
                Open →
              </span>
            </Link>
          ))}
        </div>
      </Section>
    </main>
  );
}
