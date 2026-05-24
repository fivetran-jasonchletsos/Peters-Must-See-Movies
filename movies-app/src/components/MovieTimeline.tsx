import Link from "next/link";
import { movies } from "@/lib/movies";
import postersManifest from "@/../public/posters/manifest.json";

// Visual pattern mirrors the music timeline: posters (or fallback dots)
// stacked vertically above a baseline, one column per year.

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

function posterSlug(director: string, title: string): string {
  return djb2(director + "///" + title).toString(16);
}

function movieSlug(director: string, title: string): string {
  return djb2(director + "###" + title).toString(16);
}

const SVG_WIDTH = 1400;
const PAD_LEFT = 56;
const PAD_RIGHT = 56;
const USABLE_WIDTH = SVG_WIDTH - PAD_LEFT - PAD_RIGHT;

const YEAR_MIN = 1939;
const YEAR_MAX = 2023;
const YEAR_SPAN = YEAR_MAX - YEAR_MIN;

const BASELINE_Y = 240;
const DOT_SIZE = 7;
const DOT_STEP = 10;
const THUMB_SIZE = 28;

const SVG_HEIGHT = BASELINE_Y + 60;

function yearToX(year: number): number {
  return PAD_LEFT + ((year - YEAR_MIN) / YEAR_SPAN) * USABLE_WIDTH;
}

const DECADES = [1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type MovieDot = {
  director: string;
  title: string;
  year: number;
  slug: string;
  posterSrc: string | null;
  x: number;
  y: number;
  colIndex: number;
};

function buildDots(): MovieDot[] {
  const manifest = postersManifest as Record<string, { found: boolean }>;
  const byYear = new Map<number, MovieDot[]>();

  for (const m of movies) {
    const ps = posterSlug(m.director, m.title);
    const hasPoster = manifest[ps]?.found === true;

    const dot: MovieDot = {
      director: m.director,
      title: m.title,
      year: m.year,
      slug: movieSlug(m.director, m.title),
      posterSrc: hasPoster ? `${BASE_PATH}/posters/${ps}.jpg` : null,
      x: yearToX(m.year),
      y: 0,
      colIndex: 0,
    };

    if (!byYear.has(m.year)) byYear.set(m.year, []);
    byYear.get(m.year)!.push(dot);
  }

  const result: MovieDot[] = [];
  for (const [, dots] of byYear) {
    dots.forEach((dot, i) => {
      dot.colIndex = i;
      dot.y = BASELINE_Y - i * DOT_STEP - DOT_SIZE / 2;
    });
    result.push(...dots);
  }

  return result;
}

const DOTS = buildDots();

export default function MovieTimeline() {
  return (
    <div>
      <div className="mb-6">
        <p className="eyebrow eyebrow--accent">
          Across time
        </p>
        <h2 className="serif mt-3 text-3xl font-light text-ink sm:text-4xl md:text-5xl leading-[1.1]">
          1939 &rarr; 2023
        </h2>
        <p className="mt-3 serif text-base italic note">
          {movies.length} films &middot; click a poster to open the film &middot; click a decade to filter the list
        </p>
      </div>

      <div className="overflow-x-auto -mx-5 px-5 sm:-mx-6 sm:px-6 md:-mx-0 md:px-0">
        <div style={{ minWidth: "1000px" }}>
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            width="100%"
            height={SVG_HEIGHT}
            aria-label="Timeline of films from 1939 to 2023"
            role="img"
            style={{ display: "block" }}
          >
            {DECADES.map((decade) => {
              const x = yearToX(decade);
              return (
                <g key={decade}>
                  <line x1={x} y1={20} x2={x} y2={BASELINE_Y}
                        stroke="#1a1410" strokeOpacity="0.08" strokeWidth="1" />
                  <line x1={x} y1={BASELINE_Y - 4} x2={x} y2={BASELINE_Y + 4}
                        stroke="#1a1410" strokeOpacity="0.3" strokeWidth="1" />
                </g>
              );
            })}

            {[YEAR_MIN, YEAR_MAX].map((yr) => (
              <line key={yr}
                    x1={yearToX(yr)} y1={BASELINE_Y - 4}
                    x2={yearToX(yr)} y2={BASELINE_Y + 4}
                    stroke="#1a1410" strokeOpacity="0.25" strokeWidth="1" />
            ))}

            <line x1={PAD_LEFT} y1={BASELINE_Y}
                  x2={SVG_WIDTH - PAD_RIGHT} y2={BASELINE_Y}
                  stroke="#1a1410" strokeOpacity="0.18" strokeWidth="1" />

            {DOTS.map((dot) => {
              if (dot.posterSrc) return null;
              return (
                <circle key={`dot-${dot.slug}`}
                        cx={dot.x} cy={dot.y} r={DOT_SIZE / 2}
                        fill="#b83420" fillOpacity="0.85" />
              );
            })}
          </svg>

          <div
            className="relative"
            style={{ marginTop: `-${SVG_HEIGHT}px`, height: `${SVG_HEIGHT}px` }}
            aria-hidden="false"
          >
            {DECADES.map((decade) => {
              const xPct = (yearToX(decade) / SVG_WIDTH) * 100;
              const yPct = ((BASELINE_Y + 12) / SVG_HEIGHT) * 100;
              return (
                <Link
                  key={`decade-label-${decade}`}
                  href={`/?decade=${decade}#list`}
                  className="absolute font-mono text-sm uppercase tracking-[0.18em] text-ink/75
                    hover:text-accent transition-colors -translate-x-1/2 py-2 px-1"
                  style={{ left: `${xPct}%`, top: `${yPct}%` }}
                  title={`Filter to ${decade}s`}
                >
                  {decade}s
                </Link>
              );
            })}

            {[
              { year: YEAR_MIN, align: "left" as const },
              { year: YEAR_MAX, align: "right" as const },
            ].map(({ year, align }) => {
              const xPct = (yearToX(year) / SVG_WIDTH) * 100;
              const yPct = ((BASELINE_Y + 12) / SVG_HEIGHT) * 100;
              return (
                <span
                  key={`end-${year}`}
                  className="absolute font-mono text-xs text-ink/60"
                  style={{
                    left: `${xPct}%`,
                    top: `${yPct}%`,
                    transform: align === "right" ? "translateX(-100%)" : "none",
                  }}
                >
                  {year}
                </span>
              );
            })}

            {DOTS.map((dot) => {
              const xPct = (dot.x / SVG_WIDTH) * 100;
              const yPct = (dot.y / SVG_HEIGHT) * 100;

              if (dot.posterSrc) {
                const halfThumbPct = ((THUMB_SIZE / 2) / SVG_WIDTH) * 100;
                const halfThumbYPct = ((THUMB_SIZE / 2) / SVG_HEIGHT) * 100;
                return (
                  <Link
                    key={`dot-${dot.slug}`}
                    href={`/movie/${dot.slug}`}
                    className="absolute group"
                    style={{
                      left: `${xPct - halfThumbPct}%`,
                      top: `${yPct - halfThumbYPct}%`,
                      width: `${(THUMB_SIZE / SVG_WIDTH) * 100}%`,
                      height: `${(THUMB_SIZE / SVG_HEIGHT) * 100}%`,
                    }}
                    title={`${dot.title} — ${dot.director} (${dot.year})`}
                    aria-label={`${dot.title} by ${dot.director}, ${dot.year}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={dot.posterSrc}
                      alt=""
                      width={THUMB_SIZE}
                      height={THUMB_SIZE}
                      className="w-full h-full object-cover border border-ink/15
                        transition group-hover:border-accent group-hover:z-10 group-hover:scale-[1.8] group-hover:shadow-xl"
                      style={{ position: "relative", zIndex: 1 }}
                      loading="lazy"
                    />
                    <span
                      className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5
                        hidden group-hover:flex flex-col items-center z-50"
                    >
                      <span
                        className="whitespace-nowrap bg-paper border border-ink/20 px-2 py-1
                          font-mono text-[9px] uppercase tracking-[0.15em] text-ink shadow-xl"
                      >
                        {dot.title}
                      </span>
                      <span
                        className="whitespace-nowrap bg-paper/95 px-2 py-0.5
                          font-mono text-[8px] uppercase tracking-[0.15em] text-ink/65"
                      >
                        {dot.director} · {dot.year}
                      </span>
                    </span>
                  </Link>
                );
              }

              const halfDotPct = ((DOT_SIZE / 2) / SVG_WIDTH) * 100;
              const halfDotYPct = ((DOT_SIZE / 2) / SVG_HEIGHT) * 100;
              return (
                <Link
                  key={`dot-${dot.slug}`}
                  href={`/movie/${dot.slug}`}
                  className="absolute group"
                  style={{
                    left: `${xPct - halfDotPct}%`,
                    top: `${yPct - halfDotYPct}%`,
                    width: `${(DOT_SIZE / SVG_WIDTH) * 100}%`,
                    height: `${(DOT_SIZE / SVG_HEIGHT) * 100}%`,
                  }}
                  title={`${dot.title} — ${dot.director} (${dot.year})`}
                  aria-label={`${dot.title} by ${dot.director}, ${dot.year}`}
                >
                  <span
                    className="absolute inset-0 rounded-full bg-accent/80 transition
                      group-hover:bg-accent group-hover:scale-[2.5] group-hover:z-10"
                  />
                  <span
                    className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                      hidden group-hover:flex flex-col items-center z-50"
                  >
                    <span
                      className="whitespace-nowrap bg-paper border border-ink/20 px-2 py-1
                        font-mono text-[9px] uppercase tracking-[0.15em] text-ink shadow-xl"
                    >
                      {dot.title}
                    </span>
                    <span
                      className="whitespace-nowrap bg-paper/95 px-2 py-0.5
                        font-mono text-[8px] uppercase tracking-[0.15em] text-ink/65"
                    >
                      {dot.director} · {dot.year}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
