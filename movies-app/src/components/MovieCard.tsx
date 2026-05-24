"use client";

import { useEffect, useState } from "react";
import { movies, type CanonMovie } from "@/lib/movies";
import postersManifest from "@/../public/posters/manifest.json";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function posterSlug(director: string, title: string): string {
  let h = 5381;
  const s = director + "///" + title;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

function realPosterUrl(director: string, title: string): string | null {
  const slug = posterSlug(director, title);
  const m = postersManifest as Record<string, { found: boolean }>;
  if (m[slug]?.found) return `${BASE_PATH}/posters/${slug}.jpg`;
  return null;
}

function imdbSearchUrl(title: string, year: number) {
  return `https://www.imdb.com/find/?q=${encodeURIComponent(`${title} ${year}`)}&s=tt`;
}

function letterboxdSearchUrl(title: string) {
  return `https://letterboxd.com/search/films/${encodeURIComponent(title)}/`;
}

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

const PALETTES: [string, string][] = [
  ["#0d1f2b", "#d4a017"],
  ["#1a1410", "#e8a04a"],
  ["#0b1a14", "#7eb8c9"],
  ["#1e1e2d", "#c8b06b"],
  ["#2a1410", "#d4634a"],
  ["#1a1a1a", "#c9b386"],
  ["#2a1f14", "#c47a3a"],
  ["#0e1f2b", "#4ec9b0"],
];

const SHAPES = ["panel", "letterbox", "marquee", "frame", "thirds"] as const;

function posterProps(director: string, title: string) {
  const seed = djb2(director + "///" + title);
  return {
    bg: PALETTES[seed % PALETTES.length][0],
    fg: PALETTES[seed % PALETTES.length][1],
    shape: SHAPES[(seed >> 4) % SHAPES.length],
    seed,
  };
}

function ProceduralPoster({ director, title }: { director: string; title: string }) {
  const { bg, fg, shape, seed } = posterProps(director, title);
  const directorInitial = director.replace(/^(The|A|An)\s+/i, "").charAt(0).toUpperCase();
  const titleWords = title.split(/\s+/).slice(0, 4).join(" ");

  const blockA =
    shape === "letterbox" ? `M0,12 L100,12 L100,30 L0,30 Z`
    : shape === "marquee" ? `M0,0 L100,0 L100,28 L0,28 Z`
    : shape === "frame" ? `M5,5 L95,5 L95,40 L5,40 Z`
    : shape === "thirds" ? `M0,0 L100,0 L100,33 L0,33 Z`
    : `M0,0 L100,0 L100,38 L0,38 Z`;

  const blockB =
    shape === "letterbox" ? `M0,70 L100,70 L100,88 L0,88 Z`
    : shape === "marquee" ? `M0,72 L100,72 L100,100 L0,100 Z`
    : shape === "frame" ? `M5,60 L95,60 L95,95 L5,95 Z`
    : shape === "thirds" ? `M0,67 L100,67 L100,100 L0,100 Z`
    : `M0,62 L100,62 L100,100 L0,100 Z`;

  const grainDots = Array.from({ length: 14 }, (_, i) => ({
    gx: ((seed * (i + 7) * 1999) >>> 0) % 100,
    gy: ((seed * (i + 3) * 3001) >>> 0) % 100,
  }));

  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="h-full w-full" style={{ display: "block" }}>
      <rect width="100" height="100" fill={bg} />
      <path d={blockA} fill={fg} opacity="0.85" />
      <path d={blockB} fill={fg} opacity="0.55" />
      {grainDots.map(({ gx, gy }, i) => (
        <circle key={i} cx={gx} cy={gy} r="0.5" fill={fg} opacity="0.18" />
      ))}
      <text x="50" y="55" textAnchor="middle" dominantBaseline="middle" fontFamily="Georgia, serif" fontSize="36" fontWeight="bold" fill={bg} opacity="0.4">{directorInitial}</text>
      <text x="5" y="93" fontFamily="ui-monospace, monospace" fontSize="5.2" fill={bg} opacity="0.75" fontWeight="500">{titleWords.length > 24 ? titleWords.slice(0, 24) + "…" : titleWords}</text>
    </svg>
  );
}

export type CardSize = "s" | "m" | "l";

function MovieDetailModal({ movie, onClose }: { movie: CanonMovie; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const decade = Math.floor(movie.year / 10) * 10;
  const index = movies.findIndex((a) => a.director === movie.director && a.title === movie.title);
  const others = movies.filter((a) => a.director === movie.director && a.title !== movie.title);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="movie-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
    >
      <button
        type="button"
        aria-label="Close movie details"
        onClick={onClose}
        className="absolute inset-0 bg-paper/85 backdrop-blur-sm"
      />

      <div className="relative z-10 flex w-full max-w-4xl flex-col overflow-y-auto border border-ink/15 bg-paper shadow-2xl max-h-[92vh]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink/15 bg-paper/95 px-5 py-4 backdrop-blur sm:px-8">
          <p className="eyebrow eyebrow--accent">Peter's Movies / Detail</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="eyebrow text-ink/75 hover:text-accent min-h-[44px] px-2 -mr-2 focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            Close ✕
          </button>
        </div>

        <div className="grid gap-8 px-5 py-7 sm:px-8 sm:py-9 md:grid-cols-[280px_1fr] md:gap-10">
          <div className="aspect-[2/3] overflow-hidden border border-ink/15 shadow-xl">
            {(() => {
              const real = realPosterUrl(movie.director, movie.title);
              return real ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={real} alt={`${movie.title} poster`} className="h-full w-full object-cover" />
              ) : (
                <ProceduralPoster director={movie.director} title={movie.title} />
              );
            })()}
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <p className="eyebrow note">
                Directed by {movie.director} &middot; {movie.year} &middot; {decade}s
              </p>
              <h2 id="movie-modal-title" className="serif mt-3 text-3xl font-light leading-tight text-ink sm:text-4xl md:text-5xl">
                {movie.title}
              </h2>
            </div>

            <blockquote className="border-l-2 border-accent pl-5">
              <p className="serif text-lg italic leading-relaxed text-ink sm:text-xl">{movie.note}</p>
              <footer className="mt-3 eyebrow eyebrow--small note">— Peter Chletsos, curator</footer>
            </blockquote>

            <div className="flex flex-wrap gap-3">
              <a href={imdbSearchUrl(movie.title, movie.year)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-accent px-5 py-3 font-mono text-sm uppercase tracking-[0.18em] text-paper transition hover:bg-ink focus:outline-none focus:ring-2 focus:ring-accent/40 min-h-[44px]">
                IMDb <span aria-hidden>→</span>
              </a>
              <a href={letterboxdSearchUrl(movie.title)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-ink/30 px-5 py-3 font-mono text-sm uppercase tracking-[0.18em] text-ink transition hover:border-accent hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent/40 min-h-[44px]">
                Letterboxd <span aria-hidden>→</span>
              </a>
            </div>

            {others.length > 0 ? (
              <div className="border-t border-ink/15 pt-5">
                <p className="eyebrow note">
                  Also on the list by {movie.director}
                </p>
                <ul className="mt-3 space-y-2">
                  {others.map((o) => (
                    <li key={o.title} className="serif text-base text-ink/85">
                      <span>{o.title}</span>
                      <span className="ml-2 font-mono text-sm text-ink/60">{o.year}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <p className="mt-auto eyebrow eyebrow--small eyebrow--quiet">
              Entry {index + 1} of {movies.length} on the list
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MovieCard({
  movie,
  size = "m",
}: {
  movie: CanonMovie;
  size?: CardSize;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <article className="group flex flex-col">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Open details for ${movie.title}, directed by ${movie.director}`}
          className="relative aspect-[2/3] overflow-hidden block w-full text-left focus:outline-none focus:ring-2 focus:ring-accent/60 focus:ring-offset-2 focus:ring-offset-ink"
          style={{ borderRadius: "2px" }}
        >
          <div className="film-card-cover h-full w-full">
            {(() => {
              const real = realPosterUrl(movie.director, movie.title);
              return real ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={real} alt={`${movie.title} poster`} className="h-full w-full object-cover" />
              ) : (
                <ProceduralPoster director={movie.director} title={movie.title} />
              );
            })()}
          </div>

          <span
            className="absolute right-2.5 top-2.5 bg-paper/95 border border-ink/15 px-2.5 py-1 font-mono text-xs uppercase tracking-[0.15em] text-ink shadow-md backdrop-blur-sm pointer-events-none"
            style={{ borderRadius: "1px" }}
            aria-hidden="true"
          >
            {movie.year}
          </span>
        </button>

        <div className={size === "s" ? "mt-2.5" : "mt-3.5"}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-left focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            <h3 className={"serif font-normal leading-snug text-ink transition-colors hover:text-accent " + (size === "s" ? "text-base" : size === "l" ? "text-2xl" : "text-lg")}>
              {movie.title}
            </h3>
          </button>
          <p className={"serif mt-1 italic note " + (size === "s" ? "text-sm" : size === "l" ? "text-lg" : "text-base")}>
            {movie.director} <span className="not-italic font-mono text-ink/55 ml-1">{movie.year}</span>
          </p>
        </div>

        {size !== "s" ? (
          <p className={"film-note serif mt-3 leading-relaxed text-ink/80 " + (size === "l" ? "text-lg" : "text-base")}>
            {movie.note}
          </p>
        ) : null}
      </article>

      {open ? <MovieDetailModal movie={movie} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
