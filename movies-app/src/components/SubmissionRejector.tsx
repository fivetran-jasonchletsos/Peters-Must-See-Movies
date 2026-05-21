"use client";

import { useMemo, useState } from "react";
import { movies, type CanonMovie } from "@/lib/movies";

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

function pickRandom(seed: number): CanonMovie {
  return movies[seed % movies.length];
}

function fmt(a: CanonMovie) {
  return `${a.title} (${a.director}, ${a.year})`;
}

type Submission = { title: string };

const TEMPLATES: ((s: Submission, seed: number) => string)[] = [
  (s, seed) => {
    const cmp = pickRandom(seed);
    return `The list doesn't need ${s.title}. The slot for that aesthetic is held by ${fmt(cmp)} — and it's not letting go.`;
  },
  (s, seed) => {
    const cmp = pickRandom(seed);
    return `Considered against ${fmt(cmp)}. Cut. The list is what it is for a reason.`;
  },
  (s, seed) => {
    const cmp = pickRandom(seed >> 4);
    return `${s.title} is fine. The list already has ${fmt(cmp)} doing the job ${s.title} wants to do, only with more conviction.`;
  },
  (s) => `${s.title} is a film that wants to be on the list. The list is films that don't have to want anything.`,
  (s, seed) => {
    const cmp = pickRandom(seed);
    const cmp2 = pickRandom(seed >> 6);
    return `Appreciate the pitch. ${fmt(cmp)} and ${fmt(cmp2)} are in the same column of the same spreadsheet. ${s.title} isn't.`;
  },
  (s, seed) => {
    const cmp = pickRandom(seed);
    return `${s.title} would be on the list if it had ended fifteen minutes earlier. As is, ${fmt(cmp)} keeps the slot.`;
  },
  (s, seed) => {
    const cmp = pickRandom(seed);
    return `Critically respected, commercially loved, canonically inert. ${fmt(cmp)} is none of the first two and all of the third.`;
  },
  (s, seed) => {
    const cmp = pickRandom(seed);
    return `${s.title} was a moment. ${fmt(cmp)} outlasted its moment. That's the bar.`;
  },
  (s) => `${s.title} is a director's flex. The list collects films, not auteurs.`,
  (s, seed) => {
    const cmp = pickRandom(seed);
    return `Two of these scenes are perfect. A film needs the whole runtime. ${fmt(cmp)} has the whole runtime.`;
  },
  (s) => `${s.title} is a singles-band album of a film: one great hook, padded out.`,
  () => `Submitted by every film-school graduate who's read one Cahiers du Cinéma anthology. The list is curated by exactly one such reader.`,
  (s, seed) => {
    const cmp = pickRandom(seed);
    return `Respectfully declined. ${fmt(cmp)} is what this submission was trying to be.`;
  },
  (s, seed) => {
    const cmp = pickRandom(seed);
    return `Cortex flagged ${s.title} as a borderline case. The curator flagged it as ${fmt(cmp)}'s problem to solve, and ${fmt(cmp)} already solved it.`;
  },
  (s) => `${s.title} is the film you put on for guests. The list is the films you put on alone.`,
  (s, seed) => {
    const cmp = pickRandom(seed);
    return `${s.title} is the wrong third act in a near-perfect film. ${fmt(cmp)} stuck the landing.`;
  },
  () => `Liner notes are a yes/no medium. This is a maybe with attitude. Maybe is not yes.`,
];

const DUP_RESPONSE = (s: Submission) =>
  `${s.title} is already on Peter's list. Read it before pitching.`;

const EMPTY_RESPONSE = "Type a film title. The list doesn't accept vibes.";

function pickResponse(title: string): string {
  const t = title.trim();
  if (!t) return EMPTY_RESPONSE;

  const exists = movies.some((c) => c.title.toLowerCase() === t.toLowerCase());
  if (exists) return DUP_RESPONSE({ title: t });

  const seed = djb2(t);
  const tpl = TEMPLATES[seed % TEMPLATES.length];
  return tpl({ title: t }, seed);
}

export default function SubmissionRejector() {
  const [title, setTitle] = useState("");
  const [submitted, setSubmitted] = useState<{ title: string; response: string } | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) {
      setSubmitted({ title: t, response: EMPTY_RESPONSE });
      return;
    }
    setSubmitted({ title: t, response: pickResponse(t) });
  }

  function reset() {
    setSubmitted(null);
    setTitle("");
  }

  const placeholder = useMemo(() => {
    const samples = [
      "The Royal Tenenbaums",
      "Lost in Translation",
      "Synecdoche, New York",
      "Children of Men",
      "Sunset Boulevard",
      "Mulholland Drive",
    ];
    const i = Math.floor((Date.now() / 60000) % samples.length);
    return samples[i];
  }, []);

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_1.2fr] md:gap-12">
      <form
        onSubmit={onSubmit}
        className="border border-ink/10 bg-ink/5 p-6 sm:p-8"
        aria-label="Submit a film for the list"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40 mb-5">
          The Suggestion Box
        </p>
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">
            Film
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={placeholder}
            className="mt-2 w-full bg-paper border border-ink/15 px-3 py-2 font-mono text-sm text-ink placeholder:text-ink/30
              focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50"
          />
        </label>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="bg-accent px-5 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-paper
              transition hover:bg-ink focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            Submit for consideration →
          </button>
          {submitted ? (
            <button
              type="button"
              onClick={reset}
              className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/50
                hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              Try another
            </button>
          ) : null}
        </div>
        <p className="serif mt-6 text-xs italic text-ink/35 leading-relaxed">
          Submissions evaluated against the list by Cortex.
          {" "}{movies.length} films, several decades of opinion, one curator with strong views.
        </p>
      </form>

      <div className="flex min-h-[14rem] flex-col border border-ink/10 bg-paper p-6 sm:p-8">
        <div className="flex items-baseline gap-2 mb-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
            Cortex / Verdict
          </span>
          {submitted ? (
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-ink/40">
              Re: {submitted.title || "(no film)"}
            </span>
          ) : null}
        </div>
        {submitted ? (
          <>
            <blockquote className="border-l-2 border-accent pl-5">
              <p className="serif text-base italic leading-relaxed text-ink/90 sm:text-lg">
                {submitted.response}
              </p>
            </blockquote>
            <p className="mt-auto pt-6 font-mono text-[9px] uppercase tracking-[0.28em] text-ink/35">
              Powered by Snowflake Cortex · Curated by Peter Chletsos
            </p>
          </>
        ) : (
          <p className="serif text-base italic text-ink/40 leading-relaxed">
            Waiting for a submission. Type a film title. Cortex will weigh it against the list
            and explain what's already on Peter's shelf that beats it.
          </p>
        )}
      </div>
    </div>
  );
}
