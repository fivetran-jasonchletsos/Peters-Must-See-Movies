"use client";

import { useMemo } from "react";
import Link from "next/link";
import { movies } from "@/lib/movies";
import { useLikes } from "@/lib/likes";

function albumKey(director: string, title: string) {
  return `${director}__${title}`;
}

export default function MovieVotingBoard() {
  const { likes, isLiked, toggle } = useLikes();

  // Only real votes — what you've hearted in this browser.
  const liked = useMemo(() => {
    return movies
      .filter((a) => likes.has(albumKey(a.director, a.title)))
      .map((movie) => ({ movie }));
  }, [likes]);

  const byDecade = useMemo(() => {
    const map = new Map<number, typeof liked>();
    for (const r of liked) {
      const d = Math.floor(r.movie.year / 10) * 10;
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(r);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([decade, items]) => ({ decade, count: items.length, items }));
  }, [liked]);

  const byArtist = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of liked) {
      counts.set(r.movie.director, (counts.get(r.movie.director) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .filter(([, c]) => c >= 2)
      .sort(([, a], [, b]) => b - a);
  }, [liked]);

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
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-paper/40">
            Voting
          </span>
        </div>
      </div>

      {/* Hero */}
      <header className="border-b border-paper/10 px-5 py-6 sm:px-6 sm:py-7 md:px-16 md:py-9">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div className="min-w-0">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
              Must See / 05 — Voting
            </p>
            <h1 className="serif text-2xl leading-tight text-paper sm:text-3xl md:text-4xl">
              Your picks.
            </h1>
            <p className="serif mt-1 max-w-xl text-sm text-paper/70 sm:text-base">
              Only real hearts, captured in this browser. Once the demo is wired to a Snowflake votes table, this page becomes a community leaderboard.
            </p>
          </div>
        </div>
      </header>

      {/* Headline numbers */}
      <section className="border-b border-paper/10 px-5 py-10 sm:px-6 md:px-16">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 md:grid-cols-4">
          <Stat label="Your votes" value={liked.length.toString()} />
          <Stat label="Canon size" value={movies.length.toString()} />
          <Stat
            label="Coverage"
            value={`${Math.round((liked.length / movies.length) * 100)}%`}
            sub="of the list hearted"
          />
          <Stat
            label="Top director (your votes)"
            value={byArtist[0]?.[0] ?? "—"}
            sub={byArtist[0] ? `${byArtist[0][1]} films` : "no repeats yet"}
          />
        </div>
      </section>

      {/* Your picks */}
      <section className="border-b border-paper/10 px-5 py-12 sm:px-6 md:px-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="serif text-2xl text-paper sm:text-3xl mb-6">
            Hearted ({liked.length})
          </h2>
          {liked.length === 0 ? (
            <p className="serif text-paper/50 italic">
              You haven't hearted anything yet. Browse{" "}
              <Link
                href="/"
                className="text-accent hover:text-paper underline-offset-2 hover:underline"
              >
                the list
              </Link>{" "}
              and tap the heart on any movie poster.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {liked.map((r) => (
                <li
                  key={`${r.movie.director}-${r.movie.title}`}
                  className="flex items-start justify-between gap-3 border border-paper/10 bg-paper/5 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="serif text-base text-paper truncate">{r.movie.title}</p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-paper/45 truncate">
                      {r.movie.director} · {r.movie.year}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(r.movie.director, r.movie.title)}
                    aria-pressed={isLiked(r.movie.director, r.movie.title)}
                    aria-label="Unlike"
                    className="flex-none inline-flex items-center justify-center h-7 w-7 bg-accent border border-accent
                      transition hover:bg-paper hover:border-paper focus:outline-none focus:ring-2 focus:ring-accent/40"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="13"
                      height="13"
                      aria-hidden="true"
                      fill="#0a0a0a"
                      stroke="#0a0a0a"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* By decade */}
      <section className="border-b border-paper/10 px-5 py-12 sm:px-6 md:px-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="serif text-2xl text-paper sm:text-3xl mb-6">
            Your picks · by decade
          </h2>
          {byDecade.length === 0 ? (
            <p className="serif text-paper/40 italic">Heart a few films to see your decade distribution.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {byDecade.map(({ decade, count }) => (
                <div key={decade} className="border-l-2 border-accent pl-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-paper/40">
                    {decade}s
                  </p>
                  <p className="serif mt-1 text-3xl font-light text-paper">{count}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* By director (only when ≥2 hearted) */}
      <section className="px-5 py-12 sm:px-6 md:px-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="serif text-2xl text-paper sm:text-3xl mb-6">
            Your picks · most-hearted directors
          </h2>
          {byArtist.length === 0 ? (
            <p className="serif text-paper/40 italic">
              Heart two or more films by the same director to see your top directors rank.
            </p>
          ) : (
            <ol className="space-y-2 max-w-2xl">
              {byArtist.map(([director, count], i) => (
                <li key={director} className="flex items-center gap-3">
                  <span className="w-6 flex-none font-mono text-xs text-paper/35">
                    {(i + 1).toString().padStart(2, "0")}
                  </span>
                  <span className="serif flex-1 text-paper">{director}</span>
                  <span className="font-mono text-xs text-accent">{count}</span>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-10 font-mono text-[9px] uppercase tracking-[0.28em] text-paper/30">
            Votes stored locally in your browser · Snowflake-backed community version is the next iteration
          </p>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border-l-2 border-accent pl-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-paper/40">
        {label}
      </p>
      <p className="serif mt-2 text-3xl font-light text-paper">{value}</p>
      {sub ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-paper/45 mt-1">
          {sub}
        </p>
      ) : null}
    </div>
  );
}
