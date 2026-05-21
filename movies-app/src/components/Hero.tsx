import Link from "next/link";
import { movies } from "@/lib/movies";
import postersManifest from "@/../public/posters/manifest.json";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function posterFileSlug(director: string, title: string): string {
  let h = 5381;
  const s = director + "///" + title;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(16);
}
function realPosterUrlForHero(director: string, title: string): string | null {
  const slug = posterFileSlug(director, title);
  const m = postersManifest as Record<string, { found: boolean }>;
  if (m[slug]?.found) return `${BASE_PATH}/posters/${slug}.jpg`;
  return null;
}

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

function movieSlug(director: string, title: string) {
  return djb2(director + "###" + title).toString(16);
}

type MarqueeItem = {
  director: string;
  title: string;
  slug: string;
  poster: string | null;
};

const marqueeItems: MarqueeItem[] = movies.map((m) => ({
  director: m.director,
  title: m.title,
  slug: movieSlug(m.director, m.title),
  poster: realPosterUrlForHero(m.director, m.title),
}));

const marqueeTrack: MarqueeItem[] = [...marqueeItems, ...marqueeItems];

export default function Hero() {
  return (
    <header className="relative border-b border-ink/10 overflow-hidden">
      <div className="border-b border-ink/10 py-2 overflow-hidden">
        <div className="marquee-track gap-3">
          {marqueeTrack.map((item, i) => (
            <Link
              key={`${item.slug}-${i}`}
              href={`/movie/${item.slug}`}
              aria-label={`${item.title} (${item.director})`}
              title={`${item.title} — ${item.director}`}
              className="shrink-0 group block"
            >
              {item.poster ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.poster}
                  alt=""
                  className="h-12 w-8 object-cover border border-ink/10 transition group-hover:border-accent group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <span
                  className="inline-flex h-12 w-8 items-center justify-center bg-ink/5 border border-ink/15
                    font-mono text-[10px] uppercase tracking-[0.18em] text-ink/55 transition group-hover:border-accent"
                >
                  {item.director.replace(/^(The|A|An)\s+/i, "").slice(0, 2).toUpperCase()}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>

      <div className="px-4 py-5 sm:px-6 sm:py-6 md:px-10 md:py-7">
        <div className="mx-auto flex max-w-7xl flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-accent">
              Must See &nbsp;/&nbsp; Peter Chletsos
            </p>
            <h1 className="serif mt-1 text-2xl leading-tight text-ink sm:text-3xl md:text-4xl font-light">
              It's not what you look at{" "}
              <span className="hero-underline italic">that matters.</span>
            </h1>
          </div>
          <div className="min-w-0">
            <p className="serif text-sm italic text-ink/70 sm:text-base leading-snug max-w-md">
              It's what you see.  — Henry David Thoreau
            </p>
            <p className="serif mt-1 text-xs text-ink/45 leading-snug max-w-md">
              Peter Chletsos's list of must-see movies. In no particular order — and the list is fluid.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
