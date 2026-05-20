import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { movies } from "@/lib/movies";
import { movieSlug, findMovieBySlug, allMovieSlugs } from "@/lib/movie-slug";
import postersManifest from "@/../public/posters/manifest.json";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function posterFileSlug(director: string, title: string): string {
  let h = 5381;
  const s = director + "///" + title;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

function realPosterUrl(director: string, title: string): string | null {
  const slug = posterFileSlug(director, title);
  const m = postersManifest as Record<string, { found: boolean }>;
  if (m[slug]?.found) return `${BASE_PATH}/posters/${slug}.jpg`;
  return null;
}

export function generateStaticParams() {
  return allMovieSlugs().map((slug) => ({ slug }));
}

type Props = { params: { slug: string } };

export function generateMetadata({ params }: Props): Metadata {
  const movie = findMovieBySlug(params.slug);
  if (!movie) return { title: "Movie not found" };
  return {
    title: `${movie.title} (${movie.year}) · Must See`,
    description: movie.note,
  };
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
];

function ProceduralPoster({ director, title }: { director: string; title: string }) {
  const seed = djb2(director + "///" + title);
  const [bg, fg] = PALETTES[seed % PALETTES.length];
  const initial = director.replace(/^(The|A|An)\s+/i, "").charAt(0).toUpperCase();
  return (
    <svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="h-full w-full" style={{ display: "block" }}>
      <rect width="100" height="150" fill={bg} />
      <rect x="0" y="10" width="100" height="40" fill={fg} opacity="0.85" />
      <rect x="0" y="100" width="100" height="50" fill={fg} opacity="0.6" />
      <text x="50" y="85" textAnchor="middle" dominantBaseline="middle" fontFamily="Georgia, serif" fontSize="48" fontWeight="bold" fill={bg} opacity="0.55">{initial}</text>
      <text x="5" y="140" fontFamily="ui-monospace, monospace" fontSize="5.2" fill={bg} opacity="0.78" fontWeight="500">{title.length > 26 ? title.slice(0, 26) + "…" : title}</text>
    </svg>
  );
}

export default function MoviePage({ params }: Props) {
  const movie = findMovieBySlug(params.slug);
  if (!movie) notFound();

  const others = movies.filter((a) => a.director === movie.director && a.title !== movie.title);
  const sameYear = movies.filter((a) => a.year === movie.year && a.title !== movie.title);
  const decade = Math.floor(movie.year / 10) * 10;
  const positionInList = movies.findIndex((a) => a.director === movie.director && a.title === movie.title) + 1;

  return (
    <main className="min-h-screen">
      <div className="border-b border-ink/10 px-5 py-4 sm:px-6 md:px-16">
        <div className="mx-auto max-w-6xl flex flex-wrap items-center gap-3">
          <Link href="/" className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40 transition hover:text-accent">
            Must See
          </Link>
          <span className="font-mono text-[10px] text-ink/20">/</span>
          <Link href={`/?decade=${decade}#canon`} className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40 transition hover:text-accent">
            {decade}s
          </Link>
          <span className="font-mono text-[10px] text-ink/20">/</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/70 truncate">{movie.title}</span>
        </div>
      </div>

      <section className="px-5 py-10 sm:px-6 md:px-16 md:py-14">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[300px_1fr] md:gap-12">
          <div className="flex flex-col gap-4">
            <div className="aspect-[2/3] overflow-hidden border border-ink/10 shadow-2xl">
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
            <div className="flex flex-wrap gap-3">
              <a href={imdbSearchUrl(movie.title, movie.year)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-accent px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-paper transition hover:bg-ink focus:outline-none focus:ring-2 focus:ring-accent/40">
                IMDb <span aria-hidden>→</span>
              </a>
              <a href={letterboxdSearchUrl(movie.title)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-ink/20 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-ink/80 transition hover:border-accent hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent/40">
                Letterboxd <span aria-hidden>→</span>
              </a>
            </div>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/45">
              Directed by {movie.director} · {movie.year} · {decade}s · Entry {positionInList} of {movies.length}
            </p>
            <h1 className="serif mt-3 text-4xl font-light text-ink leading-tight sm:text-5xl md:text-6xl">
              {movie.title}
            </h1>

            <blockquote className="mt-8 border-l-2 border-accent pl-5">
              <p className="serif text-lg italic leading-relaxed text-ink/90 sm:text-xl">{movie.note}</p>
              <footer className="mt-3 font-mono text-[10px] uppercase tracking-[0.28em] text-ink/45">— Pete Chletsos, curator</footer>
            </blockquote>
          </div>
        </div>
      </section>

      {others.length > 0 ? (
        <section className="border-t border-ink/10 px-5 py-10 sm:px-6 md:px-16">
          <div className="mx-auto max-w-6xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">
              Also on the list by {movie.director}
            </p>
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((o) => (
                <li key={o.title}>
                  <Link href={`/movie/${movieSlug(o.director, o.title)}`} className="block border border-ink/10 bg-ink/5 px-4 py-3 transition hover:border-accent hover:bg-ink/10 focus:outline-none focus:ring-2 focus:ring-accent/40">
                    <p className="serif text-base text-ink">{o.title}</p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/45">{o.year}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {sameYear.length > 0 ? (
        <section className="border-t border-ink/10 px-5 py-10 sm:px-6 md:px-16">
          <div className="mx-auto max-w-6xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">
              Also on the list from {movie.year}
            </p>
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sameYear.slice(0, 12).map((o) => (
                <li key={`${o.director}-${o.title}`}>
                  <Link href={`/movie/${movieSlug(o.director, o.title)}`} className="block border border-ink/10 bg-ink/5 px-4 py-3 transition hover:border-accent hover:bg-ink/10 focus:outline-none focus:ring-2 focus:ring-accent/40">
                    <p className="serif text-base text-ink truncate">{o.title}</p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/45 truncate">{o.director}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <div className="border-t border-ink/10 px-5 py-8 sm:px-6 md:px-16">
        <div className="mx-auto max-w-6xl">
          <Link href="/" className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/50 hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent/40">
            ← Back to the list
          </Link>
        </div>
      </div>
    </main>
  );
}
