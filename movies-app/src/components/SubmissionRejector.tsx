"use client";

import { useMemo, useState } from "react";
import { movies, type CanonMovie } from "@/lib/movies";

// ─── Deterministic hash so a given submission always gets the same verdict ─
function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

// ─── Helpers to pull comparison films from the list ──────────────────────
function pickNear(year: number, seed: number, exclude?: string): CanonMovie {
  // Find movies entries within 5 years of the submitted year
  const window = movies.filter(
    (a) => Math.abs(a.year - year) <= 5 && `${a.director}__${a.title}` !== exclude
  );
  const pool = window.length > 0 ? window : movies;
  return pool[seed % pool.length];
}

function pickFromDecade(decade: number, seed: number): CanonMovie {
  const pool = movies.filter(
    (a) => Math.floor(a.year / 10) * 10 === decade
  );
  if (pool.length === 0) return movies[seed % movies.length];
  return pool[seed % pool.length];
}

function pickRandom(seed: number, exclude?: string): CanonMovie {
  const pool = exclude
    ? movies.filter((a) => `${a.director}__${a.title}` !== exclude)
    : movies;
  return pool[seed % pool.length];
}

function fmt(a: CanonMovie) {
  return `${a.title} — ${a.director}, ${a.year}`;
}

// ─── Rejection templates ───────────────────────────────────────────────────
// Each takes ({submission, seed}) and returns a verdict that names movies
// films explicitly. The seed makes the picks deterministic per submission.
type Submission = { director: string; title: string; year?: number };

const TEMPLATES: ((s: Submission, seed: number) => string)[] = [
  (s, seed) => {
    const near = s.year ? pickNear(s.year, seed) : pickRandom(seed);
    return `the list doesn't need ${s.title}. The slot for that aesthetic is held by ${fmt(near)} — and it's not letting go.`;
  },
  (s, seed) => {
    const cmp = pickRandom(seed);
    return `Considered against ${fmt(cmp)}. Cut. the list is what it is for a reason.`;
  },
  (s, seed) => {
    const cmp = pickRandom(seed >> 4);
    return `${s.director} is fine. the list already has ${fmt(cmp)} doing the job ${s.title} wants to do, only with more conviction.`;
  },
  (s) => `${s.title} is a record that wants to be in the list. the list is a list of records that don't have to want anything.`,
  (s, seed) => {
    const dec = s.year ? Math.floor(s.year / 10) * 10 : 2000;
    const decadePick = pickFromDecade(dec, seed);
    return `The ${dec}s in the list are represented by ${fmt(decadePick)}. ${s.title} is welcome to argue, but the argument is already settled.`;
  },
  (s, seed) => {
    const cmp = pickRandom(seed);
    const cmp2 = pickRandom(seed >> 6);
    return `I appreciate the pitch. I have ${fmt(cmp)} and ${fmt(cmp2)} in the same column of the same spreadsheet. ${s.title} is not in that spreadsheet.`;
  },
  (s) => `${s.title} is a singles record. the list is an films list. Different intent, different room.`,
  (s, seed) => {
    const cmp = pickRandom(seed);
    return `If ${s.title} had ended one song earlier, the list would have a conversation. As is, ${fmt(cmp)} keeps the slot.`;
  },
  (s) => `Submitted by every record-store clerk who's read one Lester Bangs anthology. the list is curated by exactly one Lester Bangs reader.`,
  (s, seed) => {
    const cmp = pickRandom(seed);
    return `${s.director} would be in the list if this were the right ${s.director} record. ${fmt(cmp)} demonstrates what the right record looks like.`;
  },
  (s, seed) => {
    const cmp = pickRandom(seed);
    return `Two of these tracks are perfect. An film needs ten. ${fmt(cmp)} has ten.`;
  },
  (s) => `Producer's record, not the band's. the list collects bands, not boards.`,
  (s, seed) => {
    const cmp = pickRandom(seed);
    return `${s.title} was a moment. ${fmt(cmp)} outlasted its moment. That's the bar.`;
  },
  (s, seed) => {
    const cmp = pickRandom(seed);
    return `Critically respected, commercially loved, canonically inert. ${fmt(cmp)} is none of the first two and all of the third.`;
  },
  (s) => `Liner notes are a yes/no medium. This is a maybe with attitude. Maybe is not yes.`,
  (s, seed) => {
    const cmp = pickRandom(seed);
    return `Cortex flagged ${s.title} as a borderline case. The curator flagged it as ${fmt(cmp)}'s problem to solve, and ${fmt(cmp)} already solved it.`;
  },
  (s, seed) => {
    const near = s.year ? pickNear(s.year, seed) : pickRandom(seed);
    return `Released the same year as ${fmt(near)}. One of them justifies the year. The other one is ${s.title}.`;
  },
  (s) => `${s.title} is the film you put on for guests. the list is the list you put on alone.`,
  (s, seed) => {
    const cmp = pickRandom(seed);
    return `Respectfully declined. ${fmt(cmp)} is what this submission was trying to be.`;
  },
  (s) => `${s.director} is a tourist's choice. the list's tourist quota is full (see: Coen Brothers Clan).`,
];

const TEMPLATES_DUP = (s: Submission) =>
  `${s.title} by ${s.director} is already in the list. the list is finite and so is your attention. Read it.`;

const TEMPLATES_ARTIST_PRESENT = (s: Submission, count: number, examples: string[]) =>
  `Already ${count} ${s.director} record${count === 1 ? "" : "s"} in the list — ${examples.join(", ")}. the list doesn't fan-club unless the director is Coen Brothers adjacent.`;

const EMPTY_RESPONSE = "Type an director and an film. the list doesn't accept vibes.";

function pickResponse(director: string, title: string): string {
  const a = director.trim();
  const t = title.trim();
  if (!a || !t) return EMPTY_RESPONSE;

  // Already in the list
  const exists = movies.some(
    (c) =>
      c.director.toLowerCase() === a.toLowerCase() &&
      c.title.toLowerCase() === t.toLowerCase()
  );
  if (exists) return TEMPLATES_DUP({ director: a, title: t });

  // Artist already represented
  const artistEntries = movies.filter(
    (c) => c.director.toLowerCase() === a.toLowerCase()
  );
  if (artistEntries.length > 0) {
    const examples = artistEntries.slice(0, 3).map((e) => `"${e.title}"`);
    return TEMPLATES_ARTIST_PRESENT({ director: a, title: t }, artistEntries.length, examples);
  }

  // Otherwise: snobby template injected with real movies comparisons
  const seed = djb2(`${a}|||${t}`);
  const tpl = TEMPLATES[seed % TEMPLATES.length];
  return tpl({ director: a, title: t }, seed);
}

export default function SubmissionRejector() {
  const [director, setArtist] = useState("");
  const [title, setTitle] = useState("");
  const [submitted, setSubmitted] = useState<{ director: string; title: string; response: string } | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const a = director.trim();
    const t = title.trim();
    if (!a || !t) {
      setSubmitted({ director: a, title: t, response: EMPTY_RESPONSE });
      return;
    }
    setSubmitted({ director: a, title: t, response: pickResponse(a, t) });
  }

  function reset() {
    setSubmitted(null);
    setArtist("");
    setTitle("");
  }

  const placeholder = useMemo(() => {
    const samples = [
      ["The Smiths", "The Queen Is Dead"],
      ["Mac DeMarco", "Salad Days"],
      ["Vampire Weekend", "Vampire Weekend"],
      ["Tame Impala", "Currents"],
      ["Sigur Rós", "Ágætis byrjun"],
      ["Phoebe Bridgers", "Punisher"],
    ];
    const i = Math.floor((Date.now() / 60000) % samples.length);
    return samples[i];
  }, []);

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_1.2fr] md:gap-12">
      {/* Form */}
      <form
        onSubmit={onSubmit}
        className="border border-paper/10 bg-paper/5 p-6 sm:p-8"
        aria-label="Submit a film for movies consideration"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-paper/40 mb-5">
          The Suggestion Box
        </p>
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-paper/40">
            Artist
          </span>
          <input
            type="text"
            value={director}
            onChange={(e) => setArtist(e.target.value)}
            placeholder={placeholder[0]}
            className="mt-2 w-full bg-ink border border-paper/15 px-3 py-2 font-mono text-sm text-paper placeholder:text-paper/30
              focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50"
          />
        </label>
        <label className="mt-5 block">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-paper/40">
            Film
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={placeholder[1]}
            className="mt-2 w-full bg-ink border border-paper/15 px-3 py-2 font-mono text-sm text-paper placeholder:text-paper/30
              focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50"
          />
        </label>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="bg-accent px-5 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-ink
              transition hover:bg-paper focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            Submit for consideration →
          </button>
          {submitted ? (
            <button
              type="button"
              onClick={reset}
              className="font-mono text-[10px] uppercase tracking-[0.25em] text-paper/50
                hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              Try another
            </button>
          ) : null}
        </div>
        <p className="serif mt-6 text-xs italic text-paper/35 leading-relaxed">
          Submissions are evaluated against the list by Cortex. The verdict is informed by
          {" "}{movies.length} records, several decades of opinion, and a curator with strong views.
        </p>
      </form>

      {/* Response area */}
      <div className="flex min-h-[14rem] flex-col border border-paper/10 bg-ink p-6 sm:p-8">
        <div className="flex items-baseline gap-2 mb-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
            Cortex / Verdict
          </span>
          {submitted ? (
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-paper/40">
              Re: {submitted.title || "(no film)"} {submitted.director ? `· ${submitted.director}` : ""}
            </span>
          ) : null}
        </div>
        {submitted ? (
          <>
            <blockquote className="border-l-2 border-accent pl-5">
              <p className="serif text-base italic leading-relaxed text-paper/90 sm:text-lg">
                {submitted.response}
              </p>
            </blockquote>
            <p className="mt-auto pt-6 font-mono text-[9px] uppercase tracking-[0.28em] text-paper/35">
              Powered by Snowflake Cortex · Curated by Pete Chletsos
            </p>
          </>
        ) : (
          <p className="serif text-base italic text-paper/40 leading-relaxed">
            Waiting for a submission. Type an director and an film. Cortex will weigh it
            against the list and explain — in detail — what the list already has that you
            don't.
          </p>
        )}
      </div>
    </div>
  );
}
