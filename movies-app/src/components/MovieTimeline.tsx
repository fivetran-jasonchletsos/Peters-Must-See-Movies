import Link from "next/link";
import { movies } from "@/lib/movies";
import postersManifest from "@/../public/posters/manifest.json";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// ─── slug helpers (same djb2 as Hero.tsx) ────────────────────────────────────

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

function movieSlug(director: string, title: string) {
  return djb2(director + "###" + title).toString(16);
}

// poster uses director + "///" + title (matching Hero.tsx posterFileSlug)
function posterSlug(director: string, title: string): string {
  let h = 5381;
  const s = director + "///" + title;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

function posterUrl(director: string, title: string): string | null {
  const slug = posterSlug(director, title);
  const m = postersManifest as Record<string, { found: boolean }>;
  if (m[slug]?.found) return `${BASE_PATH}/posters/${slug}.jpg`;
  return null;
}

// ─── timeline constants ───────────────────────────────────────────────────────

const YEAR_START = 1930; // visual left anchor (a bit before 1939)
const YEAR_END   = 2030; // visual right anchor (a bit after 2023)
const YEAR_SPAN  = YEAR_END - YEAR_START; // 100

// Decades to render on the rail
const DECADES = [1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];

// ─── build per-year stacks ────────────────────────────────────────────────────

type MovieDot = {
  title: string;
  director: string;
  year: number;
  slug: string;
  poster: string | null;
};

function buildYearStacks(): Map<number, MovieDot[]> {
  const map = new Map<number, MovieDot[]>();
  for (const m of movies) {
    if (!map.has(m.year)) map.set(m.year, []);
    map.get(m.year)!.push({
      title: m.title,
      director: m.director,
      year: m.year,
      slug: movieSlug(m.director, m.title),
      poster: posterUrl(m.director, m.title),
    });
  }
  return map;
}

// ─── position helpers ─────────────────────────────────────────────────────────

// Returns a percentage (0–100) left position for a given year on the rail
function yearToPercent(year: number): number {
  return ((year - YEAR_START) / YEAR_SPAN) * 100;
}

// ─── component ────────────────────────────────────────────────────────────────

export default function MovieTimeline() {
  const stacks = buildYearStacks();
  const total  = movies.length;
  const maxStack = Math.max(...Array.from(stacks.values()).map((v) => v.length));

  // Determine vertical height needed: rail sits at a fixed band, dots stack below
  // Each dot row is 14px tall + 4px gap. Plus space for tooltip above rail.
  const DOT_SIZE = 7;       // px — rendered as inline-block
  const DOT_GAP  = 4;       // px between stacked dots

  // We render the timeline as a relative-positioned container with:
  //  – a thin horizontal rail line
  //  – decade tick marks + labels
  //  – per-year dot columns stacked below the rail
  // All positioned via inline `left: X%` on absolute children.
  // The outer div scrolls horizontally on mobile (min-width: 900px).

  return (
    <div className="w-full">
      {/* Mobile drag hint */}
      <p className="mb-3 flex items-center justify-center gap-2 font-mono text-[9px] uppercase tracking-[0.3em] text-ink/25 sm:hidden">
        <span aria-hidden="true">←</span>
        drag to explore
        <span aria-hidden="true">→</span>
      </p>

      {/* Scrollable container */}
      <div
        className="overflow-x-auto pb-4"
        style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        {/* Fixed-width inner layout */}
        <div
          className="relative"
          style={{
            minWidth: "900px",
            // Height: label row (24) + tick (16) + rail (2) + dot stack area + bottom padding
            height: `${24 + 16 + 2 + (DOT_SIZE + DOT_GAP) * maxStack + 20}px`,
          }}
        >
          {/* ── Rail ──────────────────────────────────────────────────────── */}
          <div
            className="absolute left-0 right-0 bg-ink/15"
            style={{ top: "42px", height: "1px" }}
            aria-hidden="true"
          />

          {/* Subtle accent glow on the rail — a thin ember line underneath */}
          <div
            className="absolute left-0 right-0 bg-ember/20"
            style={{ top: "43px", height: "1px" }}
            aria-hidden="true"
          />

          {/* ── Decade ticks + labels ─────────────────────────────────────── */}
          {DECADES.map((decade) => {
            const pct = yearToPercent(decade);
            return (
              <div
                key={decade}
                className="absolute"
                style={{ left: `${pct}%`, top: "0px" }}
              >
                {/* Label — links to /?decade=XXXX#canon */}
                <Link
                  href={`/?decade=${decade}#canon`}
                  className="group absolute block"
                  style={{ transform: "translateX(-50%)", top: "0px" }}
                  title={`Filter to ${decade}s`}
                >
                  <span
                    className="font-mono text-[9px] uppercase tracking-[0.28em] text-ink/35
                      transition-colors group-hover:text-accent whitespace-nowrap block text-center"
                  >
                    {decade}s
                  </span>
                </Link>

                {/* Tick mark */}
                <div
                  className="absolute w-px bg-ink/20"
                  style={{
                    left: "0px",
                    top: "20px",
                    height: "24px",
                  }}
                  aria-hidden="true"
                />
              </div>
            );
          })}

          {/* ── Year dot stacks ───────────────────────────────────────────── */}
          {Array.from(stacks.entries()).map(([year, dots]) => {
            const pct = yearToPercent(year);
            // The first dot sits just below the rail; subsequent dots stack downward
            const railBottom = 44; // px from top of container

            return (
              <div
                key={year}
                className="absolute"
                style={{
                  left: `${pct}%`,
                  top: `${railBottom}px`,
                  transform: "translateX(-50%)",
                }}
              >
                {dots.map((dot, stackIdx) => {
                  const dotTop = stackIdx * (DOT_SIZE + DOT_GAP);
                  return (
                    <Link
                      key={dot.slug}
                      href={`/movie/${dot.slug}`}
                      className="group absolute block"
                      style={{
                        top: `${dotTop}px`,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: `${DOT_SIZE}px`,
                        height: `${DOT_SIZE}px`,
                      }}
                      title={`${dot.title} (${dot.year})`}
                      aria-label={`${dot.title} — ${dot.director}, ${dot.year}`}
                    >
                      {/* The dot itself */}
                      <span
                        className="block rounded-full bg-accent transition-all duration-150
                          group-hover:scale-[2.2] group-hover:bg-accent group-hover:shadow-[0_0_8px_2px_rgba(217,79,58,0.6)]"
                        style={{ width: `${DOT_SIZE}px`, height: `${DOT_SIZE}px` }}
                        aria-hidden="true"
                      />

                      {/* Tooltip — appears above dot on hover */}
                      {/* Only the top dot in a stack shows poster; all show label */}
                      <span
                        className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2
                          -translate-x-1/2 z-50
                          opacity-0 group-hover:opacity-100
                          transition-opacity duration-150
                          flex flex-col items-center gap-1"
                        aria-hidden="true"
                      >
                        {/* Tiny poster thumbnail — only if poster exists */}
                        {dot.poster && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={dot.poster}
                            alt=""
                            className="w-8 h-12 object-cover border border-accent/50 shadow-lg flex-none"
                            loading="lazy"
                          />
                        )}

                        {/* Title chip */}
                        <span
                          className="block whitespace-nowrap bg-paper border border-ink/15
                            px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-ink
                            shadow-[0_4px_16px_rgba(0,0,0,0.7)]"
                        >
                          {dot.title}
                          <span className="ml-1.5 text-accent">{dot.year}</span>
                        </span>

                        {/* Arrow notch */}
                        <span
                          className="block w-0 h-0"
                          style={{
                            borderLeft: "4px solid transparent",
                            borderRight: "4px solid transparent",
                            borderTop: "4px solid rgba(245,241,234,0.15)",
                            marginTop: "-1px",
                          }}
                        />
                      </span>
                    </Link>
                  );
                })}
              </div>
            );
          })}

          {/* ── Year span labels at far edges ─────────────────────────────── */}
          <span
            className="absolute font-mono text-[9px] text-ink/20 tracking-widest"
            style={{ left: `${yearToPercent(1939) - 0.5}%`, top: "35px", transform: "translateX(-50%)" }}
            aria-hidden="true"
          >
            1939
          </span>
          <span
            className="absolute font-mono text-[9px] text-ink/20 tracking-widest"
            style={{ left: `${yearToPercent(2023) + 0.5}%`, top: "35px", transform: "translateX(-50%)" }}
            aria-hidden="true"
          >
            2023
          </span>
        </div>
      </div>

      {/* Total count */}
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.3em] text-ink/30 text-center">
        {total} films &middot; 1939 &ndash; 2023
      </p>
    </div>
  );
}
