"use client";

import { useEffect, useState } from "react";
import { movies, type CanonMovie } from "@/lib/movies";
import { useLikes } from "@/lib/likes";

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
        className="absolute inset-0 bg-ink/85 backdrop-blur-sm"
      />

      <div className="relative z-10 flex w-full max-w-4xl flex-col overflow-y-auto border border-paper/15 bg-ink shadow-2xl max-h-[92vh]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-paper/10 bg-ink/95 px-5 py-3 backdrop-blur sm:px-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Must See / Detail</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="font-mono text-[10px] uppercase tracking-[0.3em] text-paper/60 hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            Close ✕
          </button>
        </div>

        <div className="grid gap-8 px-5 py-6 sm:px-8 sm:py-8 md:grid-cols-[280px_1fr] md:gap-10">
          <div className="aspect-[2/3] overflow-hidden border border-paper/10 shadow-xl">
            <ProceduralPoster director={movie.director} title={movie.title} />
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-paper/40">
                Directed by {movie.director} &middot; {movie.year} &middot; {decade}s
              </p>
              <h2 id="movie-modal-title" className="serif mt-2 text-3xl font-light leading-tight text-paper sm:text-4xl md:text-5xl">
                {movie.title}
              </h2>
            </div>

            <blockquote className="border-l-2 border-accent pl-5">
              <p className="serif text-base italic leading-relaxed text-paper/85 sm:text-lg">{movie.note}</p>
              <footer className="mt-3 font-mono text-[9px] uppercase tracking-[0.28em] text-paper/40">— Peter Chletsos, curator</footer>
            </blockquote>

            <div className="flex flex-wrap gap-3">
              <a href={imdbSearchUrl(movie.title, movie.year)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-accent px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-ink transition hover:bg-paper focus:outline-none focus:ring-2 focus:ring-accent/40">
                IMDb <span aria-hidden>→</span>
              </a>
              <a href={letterboxdSearchUrl(movie.title)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-paper/20 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-paper/80 transition hover:border-accent hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent/40">
                Letterboxd <span aria-hidden>→</span>
              </a>
            </div>

            {others.length > 0 ? (
              <div className="border-t border-paper/10 pt-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-paper/40">
                  Also in the list by {movie.director}
                </p>
                <ul className="mt-3 space-y-1">
                  {others.map((o) => (
                    <li key={o.title} className="serif text-sm text-paper/70">
                      <span>{o.title}</span>
                      <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.25em] text-paper/35">{o.year}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <p className="mt-auto font-mono text-[10px] uppercase tracking-[0.3em] text-paper/30">
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
  const { isLiked, toggle } = useLikes();
  const liked = isLiked(movie.director, movie.title);

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
            <ProceduralPoster director={movie.director} title={movie.title} />
          </div>

          <span
            className="absolute right-2.5 top-2.5 bg-ink/90 border border-paper/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-paper/80 shadow-md backdrop-blur-sm pointer-events-none"
            style={{ borderRadius: "1px" }}
            aria-hidden="true"
          >
            {movie.year}
          </span>

          <span
            role="button"
            tabIndex={0}
            aria-label={liked ? `Unlike ${movie.title}` : `Like ${movie.title}`}
            aria-pressed={liked}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggle(movie.director, movie.title);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                toggle(movie.director, movie.title);
              }
            }}
            className={
              "absolute left-2.5 top-2.5 inline-flex items-center justify-center cursor-pointer h-10 w-10 backdrop-blur-sm shadow-lg transition focus:outline-none focus:ring-2 focus:ring-accent/40 " +
              (liked
                ? "bg-accent border border-accent text-ink hover:bg-paper hover:border-paper"
                : "bg-ink/85 border border-paper/25 hover:border-accent hover:bg-ink")
            }
            style={{ borderRadius: "2px" }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill={liked ? "#0a0a0a" : "none"} stroke={liked ? "#0a0a0a" : "#f5f1ea"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </span>
        </button>

        <div className={size === "s" ? "mt-2" : "mt-3"}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-left focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            <h3 className={"serif font-normal leading-snug text-paper transition-colors hover:text-accent " + (size === "s" ? "text-sm" : size === "l" ? "text-xl" : "text-[1.05rem]")}>
              {movie.title}
            </h3>
          </button>
          <p className={"mt-0.5 font-mono uppercase tracking-[0.25em] text-paper/45 " + (size === "s" ? "text-[8px]" : size === "l" ? "text-[10px]" : "text-[9px]")}>
            {movie.director}
          </p>
        </div>

        {size !== "s" ? (
          <p className={"film-note serif mt-2 leading-snug text-paper/65 " + (size === "l" ? "text-base" : "text-sm")}>
            {movie.note}
          </p>
        ) : null}
      </article>

      {open ? <MovieDetailModal movie={movie} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
