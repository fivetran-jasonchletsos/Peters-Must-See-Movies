"use client";

import { useState } from "react";
import Link from "next/link";
import {
  recommend,
  MOOD_CHOICES,
  ERA_CHOICES,
  PACING_CHOICES,
  LOAD_CHOICES,
  FAMILIAR_CHOICES,
  type Answers,
  type Mood,
  type EraPick,
  type Pacing,
  type Load,
  type Familiar,
  type Choice,
} from "@/lib/recommend";
import { movieSlug } from "@/lib/movie-slug";

type Stage = 0 | 1 | 2 | 3 | 4 | 5;

export default function MatchPage() {
  const [stage, setStage] = useState<Stage>(0);
  const [mood, setMood] = useState<Mood | null>(null);
  const [era, setEra] = useState<EraPick | null>(null);
  const [pacing, setPacing] = useState<Pacing | null>(null);
  const [load, setLoad] = useState<Load | null>(null);
  const [familiar, setFamiliar] = useState<Familiar | null>(null);

  function reset() {
    setStage(0);
    setMood(null);
    setEra(null);
    setPacing(null);
    setLoad(null);
    setFamiliar(null);
  }

  function back() {
    if (stage > 0) setStage((stage - 1) as Stage);
  }

  return (
    <main className="min-h-screen px-5 py-12 sm:px-6 sm:py-16 md:px-16">
      <div className="mx-auto max-w-3xl">

        <p className="eyebrow eyebrow--accent">
          Peter's Movies &middot; Match
        </p>
        <h1 className="serif mt-3 text-4xl font-light text-ink leading-tight sm:text-5xl md:text-6xl">
          What's the movie tonight?
        </h1>
        <p className="serif mt-4 text-lg italic note leading-relaxed">
          Five questions. Peter's shelf will answer.
        </p>

        <div className="mt-10 flex items-center gap-2" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={
                "h-1.5 flex-1 transition-colors " +
                (stage === 5
                  ? "bg-accent"
                  : i < stage
                  ? "bg-accent"
                  : i === stage
                  ? "bg-accent/60"
                  : "bg-ink/10")
              }
            />
          ))}
        </div>

        <div className="mt-10">
          {stage === 0 && (
            <QuestionPanel number={1} prompt="What's the mood tonight?" choices={MOOD_CHOICES}
              value={mood} onPick={(v) => { setMood(v); setStage(1); }} />
          )}
          {stage === 1 && (
            <QuestionPanel number={2} prompt="What era?" choices={ERA_CHOICES}
              value={era} onPick={(v) => { setEra(v); setStage(2); }} />
          )}
          {stage === 2 && (
            <QuestionPanel number={3} prompt="What pacing?" choices={PACING_CHOICES}
              value={pacing} onPick={(v) => { setPacing(v); setStage(3); }} />
          )}
          {stage === 3 && (
            <QuestionPanel number={4} prompt="What's your mental load?" choices={LOAD_CHOICES}
              value={load} onPick={(v) => { setLoad(v); setStage(4); }} />
          )}
          {stage === 4 && (
            <QuestionPanel number={5} prompt="Familiar or new?" choices={FAMILIAR_CHOICES}
              value={familiar} onPick={(v) => { setFamiliar(v); setStage(5); }} />
          )}
          {stage === 5 && mood && era && pacing && load && familiar && (
            <Result answers={{ mood, era, pacing, load, familiar }} onReset={reset} />
          )}
        </div>

        {stage > 0 && stage < 5 && (
          <div className="mt-12 flex gap-6 border-t border-ink/15 pt-6">
            <button type="button" onClick={back} className="eyebrow note hover:text-accent min-h-[44px]">
              ← Back
            </button>
            <button type="button" onClick={reset} className="eyebrow note hover:text-accent min-h-[44px] ml-auto">
              Start over
            </button>
          </div>
        )}

      </div>
    </main>
  );
}

function QuestionPanel<T extends string>({
  number,
  prompt,
  choices,
  value,
  onPick,
}: {
  number: number;
  prompt: string;
  choices: readonly Choice<T>[];
  value: T | null;
  onPick: (v: T) => void;
}) {
  return (
    <div>
      <p className="eyebrow note">Question {number} of 5</p>
      <h2 className="serif mt-3 text-3xl font-light text-ink leading-[1.1] sm:text-4xl">
        {prompt}
      </h2>
      <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {choices.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onPick(c.id)}
            aria-pressed={value === c.id}
            className={
              "group text-left border bg-ink/[0.02] p-5 transition focus:outline-none focus:ring-2 focus:ring-accent/40 min-h-[88px] " +
              (value === c.id
                ? "border-accent bg-ink/[0.06]"
                : "border-ink/15 hover:border-accent/60 hover:bg-ink/[0.04]")
            }
          >
            <p className="serif text-xl font-light text-ink group-hover:text-accent transition-colors">
              {c.label}
            </p>
            <p className="serif mt-1.5 text-sm italic note">
              {c.hint}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function Result({ answers, onReset }: { answers: Answers; onReset: () => void }) {
  const { pick, runners } = recommend(answers);
  const slug = movieSlug(pick.director, pick.title);

  return (
    <div>
      <p className="eyebrow eyebrow--accent">Tonight's pick</p>

      <article className="mt-6 border border-ink/15 bg-ink/[0.02] p-6 sm:p-8">
        <p className="eyebrow note">
          {pick.director} &middot; {pick.year}
        </p>
        <h3 className="serif mt-3 text-4xl font-light text-ink leading-tight sm:text-5xl md:text-6xl">
          {pick.title}
        </h3>
        <blockquote className="mt-6 border-l-2 border-accent pl-5">
          <p className="serif text-lg italic leading-relaxed text-ink sm:text-xl">
            {pick.note}
          </p>
        </blockquote>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href={`/movie/${slug}/`}
            className="inline-flex items-center gap-2 bg-accent px-5 py-3 font-mono text-sm uppercase tracking-[0.15em] text-paper min-h-[44px] hover:bg-ink transition focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            Open the file →
          </Link>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 border border-ink/30 px-5 py-3 font-mono text-sm uppercase tracking-[0.15em] text-ink min-h-[44px] hover:border-accent hover:text-accent transition focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            Ask again
          </button>
        </div>
      </article>

      {runners.length > 0 ? (
        <div className="mt-10">
          <p className="eyebrow note">Other films that fit</p>
          <ul className="mt-4 space-y-2.5">
            {runners.map((r) => (
              <li key={`${r.director}-${r.title}`}>
                <Link
                  href={`/movie/${movieSlug(r.director, r.title)}/`}
                  className="group flex items-baseline justify-between gap-4 border-b border-ink/15 pb-2.5 hover:border-accent"
                >
                  <div className="min-w-0">
                    <p className="serif text-xl font-light text-ink group-hover:text-accent transition-colors truncate">
                      {r.title}
                    </p>
                    <p className="serif text-sm italic note">{r.director}</p>
                  </div>
                  <p className="eyebrow note shrink-0">{r.year}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-12">
        <Link href="/" className="eyebrow eyebrow--accent hover:text-ink">
          ← Back to the list
        </Link>
      </p>
    </div>
  );
}
