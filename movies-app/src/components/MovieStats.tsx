import Link from "next/link";
import { movies, type CanonMovie } from "@/lib/movies";
import Section from "@/components/Section";

// ---------------------------------------------------------------------------
// Derived stats — all computed at build time from the list array. No fake data.
// ---------------------------------------------------------------------------

export type liststatsData = {
  totalAlbums: number;
  distinctArtists: number;
  earliestYear: number;
  latestYear: number;
  medianYear: number;
  topArtists: { director: string; count: number; pct: number }[];
  maxCount: number;
  decades: { decade: number; count: number; pct: number }[];
  careerArcs: { director: string; earliest: number; latest: number; gap: number }[];
  wu: { count: number; films: { director: string; title: string; year: number }[] };
  eras: {
    label: "Early" | "Middle" | "Late";
    startYear: number;
    endYear: number;
    count: number;
    pct: number;
    signature: CanonMovie;
  }[];
};

export function computeliststats(): liststatsData {
  // ---- Headline numbers ----
  const totalAlbums = movies.length;

  const artistSet = new Set(movies.map((a) => a.director));
  const distinctArtists = artistSet.size;

  const years = movies.map((a) => a.year).sort((a, b) => a - b);
  const earliestYear = years[0];
  const latestYear = years[years.length - 1];

  const mid = Math.floor(years.length / 2);
  const medianYear =
    years.length % 2 === 0
      ? Math.round((years[mid - 1] + years[mid]) / 2)
      : years[mid];

  // ---- Artist counts ----
  const countMap = new Map<string, number>();
  for (const a of movies) {
    countMap.set(a.director, (countMap.get(a.director) ?? 0) + 1);
  }
  const maxCount = Math.max(...countMap.values());

  const topArtists = Array.from(countMap.entries())
    .filter(([, c]) => c >= 2)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([director, count]) => ({
      director,
      count,
      pct: Math.round((count / maxCount) * 100),
    }));

  // ---- Decade distribution ----
  const decadeMap = new Map<number, number>();
  for (const a of movies) {
    const d = Math.floor(a.year / 10) * 10;
    decadeMap.set(d, (decadeMap.get(d) ?? 0) + 1);
  }
  const decadeMax = Math.max(...decadeMap.values());
  const decades = Array.from(decadeMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([decade, count]) => ({
      decade,
      count,
      // pct relative to largest decade (for bar widths), stored separately as share
      pct: Math.round((count / decadeMax) * 100),
    }));

  // ---- Career arcs ----
  const arcMap = new Map<string, number[]>();
  for (const a of movies) {
    const entry = arcMap.get(a.director) ?? [];
    entry.push(a.year);
    arcMap.set(a.director, entry);
  }
  const careerArcs = Array.from(arcMap.entries())
    .filter(([, ys]) => ys.length >= 2)
    .map(([director, ys]) => {
      const earliest = Math.min(...ys);
      const latest = Math.max(...ys);
      return { director, earliest, latest, gap: latest - earliest };
    })
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 5);

  // ---- The John Wick saga — most-represented director on the list ----
  const wickFilms = movies
    .filter((a) => a.director === "Chad Stahelski")
    .sort((a, b) => a.year - b.year);
  const wu = {
    count: wickFilms.length,
    films: wickFilms.map(({ director, title, year }) => ({ director, title, year })),
  };

  // ---- Curator eras (thirds by year, sorted) ----
  const sorted = [...movies].sort((a, b) => a.year - b.year);
  const third = Math.floor(sorted.length / 3);
  const buckets: [CanonMovie[], "Early" | "Middle" | "Late"][] = [
    [sorted.slice(0, third), "Early"],
    [sorted.slice(third, third * 2), "Middle"],
    [sorted.slice(third * 2), "Late"],
  ];
  const eras = buckets.map(([bucket, label]) => {
    const signature = bucket[Math.floor(bucket.length / 2)];
    return {
      label,
      startYear: bucket[0].year,
      endYear: bucket[bucket.length - 1].year,
      count: bucket.length,
      pct: Math.round((bucket.length / totalAlbums) * 100),
      signature,
    };
  });

  return {
    totalAlbums,
    distinctArtists,
    earliestYear,
    latestYear,
    medianYear,
    topArtists,
    maxCount,
    decades,
    careerArcs,
    wu,
    eras,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const KICKER = "font-mono text-[10px] uppercase tracking-[0.3em] text-accent";
const MUTED = "font-mono text-[10px] uppercase tracking-[0.3em] text-ink/50";

// Shared classes for clickable rows — adds hover highlight, cursor, and the
// subtle right-arrow affordance via a CSS pseudo-element approach using a
// hidden span that reveals on hover.
const ROW_LINK =
  "group/row flex items-center gap-5 rounded-sm transition-colors hover:bg-ink/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 -mx-2 px-2 py-0.5";

const ARTIST_CARD_LINK =
  "block border border-ink/10 bg-ink/[0.03] p-5 transition hover:border-accent/40 hover:bg-ink/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50";

export default function MovieStats() {
  const stats = computeliststats();
  const { totalAlbums, distinctArtists, earliestYear, latestYear, medianYear } =
    stats;

  // Share of total for decade labels (not bar width)
  const decadeShareMap = new Map(
    stats.decades.map(({ decade, count }) => [
      decade,
      Math.round((count / totalAlbums) * 100),
    ])
  );

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Section A: Headline numbers — giant serif number + stats column     */}
      {/* ------------------------------------------------------------------ */}
      <Section number="02" title="By the Numbers" blurb="Pete's list, quantified.">
        <div className="flex flex-col gap-0 lg:flex-row lg:items-stretch">
          <div className="flex items-center justify-center border border-ink/8 bg-ink/[0.03] p-10 lg:flex-1 lg:p-16">
            <div className="text-center">
              <p
                className="serif leading-none text-ink select-none"
                style={{ fontSize: "clamp(6rem, 20vw, 14rem)", fontWeight: 300 }}
                aria-label={`${totalAlbums} films on the list`}
              >
                {totalAlbums}
              </p>
              <p className={`${MUTED} mt-3`}>films on the list</p>
            </div>
          </div>

          {/* Stats column — tight, contrasting. Year/median rows are non-clickable. */}
          <div className="border border-ink/8 bg-ink/[0.02] lg:w-64 lg:border-l-0">
            {[
              { label: "Distinct directors", value: distinctArtists },
              { label: "First year", value: earliestYear },
              { label: "Latest year", value: latestYear },
              { label: "Median release", value: medianYear },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex flex-col justify-between gap-2 border-b border-ink/8 p-6 last:border-b-0"
              >
                <p className={MUTED}>{label}</p>
                <p className="serif text-3xl font-light text-ink sm:text-4xl">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* Section B: Decade distribution                                       */}
      {/* ------------------------------------------------------------------ */}
      <Section
        number="&#x00B7;"
        title="By the Decade"
        blurb="How the decades stack up, film by film. Click a decade to explore it in the list."
      >
        <div className="space-y-2">
          {stats.decades.map(({ decade, count, pct }) => {
            const share = decadeShareMap.get(decade) ?? 0;
            return (
              <Link
                key={decade}
                href={`/?decade=${decade}#movies`}
                className={ROW_LINK}
                aria-label={`Browse ${decade}s — ${count} records`}
              >
                <p className={`${KICKER} w-16 shrink-0 text-right`}>
                  {decade}s
                </p>
                <div className="relative h-7 flex-1 bg-ink/5 overflow-hidden">
                  <div
                    className="h-full bg-accent/60 transition-all group-hover/row:bg-accent"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex w-20 shrink-0 flex-col items-end">
                  <span className="serif text-xl font-light text-ink">{count}</span>
                  <span className={`${MUTED} text-right`}>{share}%</span>
                </div>
                {/* Arrow affordance */}
                <span
                  className="shrink-0 font-mono text-[10px] text-accent opacity-0 transition-opacity group-hover/row:opacity-100"
                  aria-hidden="true"
                >
                  &#x2192;
                </span>
              </Link>
            );
          })}
        </div>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* Section C: Most-represented directors                                  */}
      {/* ------------------------------------------------------------------ */}
      <Section
        number="&#x00B7;"
        title="Most Represented"
        blurb="Directors with more than one entry. Click any director to filter the list."
      >
        <div className="space-y-1">
          {stats.topArtists.map(({ director, count, pct }) => (
            <Link
              key={director}
              href={`/?q=${encodeURIComponent(director)}#movies`}
              className={ROW_LINK}
              aria-label={`Browse ${director} — ${count} films`}
            >
              <p className="serif w-48 shrink-0 text-sm font-light text-ink sm:w-56">
                {director}
              </p>
              <div className="relative h-5 flex-1 bg-ink/5 overflow-hidden">
                <div
                  className="h-full bg-accent/60 transition-all group-hover/row:bg-accent"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className={`${MUTED} w-16 shrink-0 text-right`}>
                {count} {count === 1 ? "film" : "films"}
              </p>
              {/* Arrow affordance */}
              <span
                className="shrink-0 font-mono text-[10px] text-accent opacity-0 transition-opacity group-hover/row:opacity-100"
                aria-hidden="true"
              >
                &#x2192;
              </span>
            </Link>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* Section D: Career arcs                                               */}
      {/* ------------------------------------------------------------------ */}
      <Section
        number="&#x00B7;"
        title="Longest Career Arcs"
        blurb="For directors with multiple entries, the gap between earliest and latest film in the list."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {stats.careerArcs.map(({ director, earliest, latest, gap }) => (
            <Link
              key={director}
              href={`/?q=${encodeURIComponent(director)}#movies`}
              className={ARTIST_CARD_LINK}
              aria-label={`Browse ${director} — ${gap}-year arc`}
            >
              <p className={KICKER}>{gap} yr arc</p>
              <p className="serif mt-3 text-lg font-light text-ink leading-snug">
                {director}
              </p>
              <p className="mt-2 font-mono text-xs text-ink/40">
                {earliest}&thinsp;&mdash;&thinsp;{latest}
              </p>
              <p className="mt-3 font-mono text-[9px] text-accent opacity-0 transition-opacity group-hover:opacity-100">
                browse in movies &#x2192;
              </p>
            </Link>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* Section E: Coen Brothers family callout                                    */}
      {/* ------------------------------------------------------------------ */}
      <Section
        number="&#x00B7;"
        title="The John Wick Saga"
        blurb="Chad Stahelski's Wick chapters — the most-represented director on the list."
      >
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-16">
          <div className="shrink-0">
            <p className={KICKER}>Wick chapters</p>
            <Link
              href="/?q=John%20Wick#movies"
              className="group/wu block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded-sm"
              aria-label={`Browse the ${stats.wu.count} John Wick films`}
            >
              <p
                className="serif mt-2 text-accent leading-none transition-opacity hover:opacity-80"
                style={{ fontSize: "clamp(5rem, 14vw, 10rem)", fontWeight: 300 }}
                aria-hidden="true"
              >
                {stats.wu.count}
              </p>
              <p className="mt-1 font-mono text-[9px] text-accent opacity-0 transition-opacity group-hover/wu:opacity-100">
                browse in movies &#x2192;
              </p>
            </Link>
            <p className="serif mt-2 text-ink/40 text-sm italic">
              out of {totalAlbums} total
            </p>
          </div>
          <div className="flex-1 space-y-3">
            {stats.wu.films.map(({ director, title, year }) => (
              <div
                key={`${director}-${title}`}
                className="flex items-baseline justify-between gap-4 border-b border-ink/10 pb-3"
              >
                <div>
                  <p className="serif font-light text-ink">{title}</p>
                  <p className={MUTED}>{director}</p>
                </div>
                <p className="serif shrink-0 font-light text-ink/40">{year}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* Section F: Curator's eras                                            */}
      {/* ------------------------------------------------------------------ */}
      <Section
        number="&#x00B7;"
        title="Curator's Eras"
        blurb="The list split into three equal thirds by year. Each era's signature film is the median entry of that bucket."
      >
        <div className="grid grid-cols-1 gap-px bg-ink/10 md:grid-cols-3">
          {stats.eras.map(({ label, startYear, endYear, count, pct, signature }) => (
            <Link
              key={label}
              href={`/?decade=${startYear}#movies`}
              className="group/era block bg-paper p-6 sm:p-8 transition-colors hover:bg-ink/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/50"
              aria-label={`Browse ${label} era (${startYear}–${endYear}) — ${count} films`}
            >
              <p className={KICKER}>{label}</p>
              <p className="serif mt-2 text-3xl font-light text-ink">{startYear}&ndash;{endYear}</p>
              <p className="mt-2 font-mono text-xs text-ink/40">
                {count} films &middot; {pct}% of movies
              </p>
              <div className="mt-6 border-t border-ink/10 pt-5">
                <p className={MUTED}>Signature film</p>
                <p className="serif mt-2 text-base font-light text-ink leading-snug">
                  {signature.title}
                </p>
                <p className="mt-1 font-mono text-xs text-ink/40">
                  {signature.director} &middot; {signature.year}
                </p>
              </div>
              <p className="mt-4 font-mono text-[9px] text-accent opacity-0 transition-opacity group-hover/era:opacity-100">
                browse era &#x2192;
              </p>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
