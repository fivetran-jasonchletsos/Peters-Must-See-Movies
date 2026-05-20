import Link from "next/link";
import { movies } from "@/lib/movies";

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
};

const marqueeItems: MarqueeItem[] = movies.map((m) => ({
  director: m.director,
  title: m.title,
  slug: movieSlug(m.director, m.title),
}));

const marqueeTrack: MarqueeItem[] = [...marqueeItems, ...marqueeItems];

export default function Hero() {
  return (
    <header className="relative border-b border-paper/10 overflow-hidden">
      <div className="border-b border-paper/10 py-2 overflow-hidden">
        <div className="marquee-track gap-3">
          {marqueeTrack.map((item, i) => (
            <Link
              key={`${item.slug}-${i}`}
              href={`/movie/${item.slug}`}
              aria-label={`${item.title} (${item.director})`}
              title={`${item.title} — ${item.director}`}
              className="shrink-0 group inline-flex items-center gap-2 px-3 py-1 border border-paper/10 bg-paper/5
                transition hover:border-accent hover:bg-paper/10"
            >
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-paper/45">
                {item.director
                  .replace(/^(The|A|An)\s+/i, "")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/80 whitespace-nowrap">
                {item.title}
              </span>
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
            <h1 className="serif mt-1 text-2xl leading-tight text-paper sm:text-3xl md:text-4xl font-light">
              It's not what you look at{" "}
              <span className="hero-underline italic">that matters.</span>
            </h1>
          </div>
          <div className="min-w-0">
            <p className="serif text-sm italic text-paper/70 sm:text-base leading-snug max-w-md">
              It's what you see.  — Henry David Thoreau
            </p>
            <p className="serif mt-1 text-xs text-paper/45 leading-snug max-w-md">
              Peter Chletsos's list of must-see movies. In no particular order — and the list is fluid.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
