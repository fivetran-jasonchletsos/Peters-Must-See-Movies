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
    href: "/analytics",
    title: "Stats",
    blurb:
      "By the numbers — decades, directors, eras, career arcs across the list. Every stat clickable to drill back into the films.",
    glyph: "decades · directors · eras",
  },
  {
    number: "03",
    href: "/blink",
    title: "Blink",
    blurb:
      "Pete wished he could have added the 17 DVDs from Doctor Who's 'Blink' but didn't know the titles. Here they are.",
    glyph: "17 DVDs · 1965 → 1989 · classic Who",
  },
  {
    number: "04",
    href: "/submit",
    title: "Submit a Movie",
    blurb:
      "Pitch a film for the list. Snowflake Cortex returns a verdict — usually no, always with a reason rooted in what's already on Pete's shelf.",
    glyph: "→ politely rejected",
  },
  {
    number: "05",
    href: "/voting",
    title: "Your Picks",
    blurb:
      "Hearted any poster on the list? Your picks aggregate here — by decade, by director, ranked.",
    glyph: "♥ what you loved",
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
        blurb={`${total} films, ordered chronologically. In no particular order — and the list is fluid.`}
      >
        <div id="canon" />
        <Suspense fallback={<p className="serif text-paper/40">Loading…</p>}>
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
              className="group flex flex-col gap-3 border border-paper/10 bg-paper/5 p-6 transition
                hover:border-accent hover:bg-paper/10
                focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
                {card.number}
              </p>
              <h3 className="serif text-2xl text-paper leading-snug">{card.title}</h3>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper/35">
                {card.glyph}
              </p>
              <p className="serif text-sm text-paper/65 mt-auto pt-2 leading-snug">
                {card.blurb}
              </p>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-paper/40 group-hover:text-accent transition">
                Open →
              </span>
            </Link>
          ))}
        </div>
      </Section>
    </main>
  );
}
