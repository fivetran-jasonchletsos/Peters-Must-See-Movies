import Link from "next/link";
import { movies, type CanonMovie } from "@/lib/movies";
import Section from "@/components/Section";
import postersManifest from "@/../public/posters/manifest.json";

// ---------------------------------------------------------------------------
// Poster helpers — mirror MovieTimeline so the same hash produces the same file.
// ---------------------------------------------------------------------------

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const MANIFEST = postersManifest as Record<string, { found: boolean }>;

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}
function posterSlugFor(d: string, t: string): string {
  return djb2(d + "///" + t).toString(16);
}
function movieSlugFor(d: string, t: string): string {
  return djb2(d + "###" + t).toString(16);
}
function posterSrc(m: CanonMovie): string | null {
  const ps = posterSlugFor(m.director, m.title);
  return MANIFEST[ps]?.found ? `${BASE_PATH}/posters/${ps}.jpg` : null;
}

// ---------------------------------------------------------------------------
// Derived stats — all computed at build time from the list array.
// ---------------------------------------------------------------------------

export type DecadeBucket = {
  decade: number;
  count: number;
  pct: number;
  share: number;
  movies: CanonMovie[];
};

export type DirectorBucket = {
  director: string;
  count: number;
  pct: number;
  movies: CanonMovie[];
};

export type YearBucket = {
  year: number;
  count: number;
  movies: CanonMovie[];
};

export type liststatsData = {
  totalAlbums: number;
  distinctArtists: number;
  earliestYear: number;
  latestYear: number;
  medianYear: number;
  peakYear: { year: number; count: number };
  decades: DecadeBucket[];
  decadeMaxCount: number;
  years: YearBucket[];
  yearMaxCount: number;
  topArtists: DirectorBucket[];
  artistMaxCount: number;
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

  // ---- Per-year buckets (films per year) ----
  const yearMap = new Map<number, CanonMovie[]>();
  for (const m of movies) {
    if (!yearMap.has(m.year)) yearMap.set(m.year, []);
    yearMap.get(m.year)!.push(m);
  }
  const yearBuckets: YearBucket[] = [];
  for (let y = earliestYear; y <= latestYear; y++) {
    const ms = yearMap.get(y) ?? [];
    yearBuckets.push({ year: y, count: ms.length, movies: ms });
  }
  const yearMaxCount = Math.max(...yearBuckets.map((b) => b.count));
  const peakBucket = yearBuckets.reduce((best, b) =>
    b.count > best.count ? b : best
  );
  const peakYear = { year: peakBucket.year, count: peakBucket.count };

  // ---- Decade distribution + poster lists ----
  const decadeMap = new Map<number, CanonMovie[]>();
  for (const a of movies) {
    const d = Math.floor(a.year / 10) * 10;
    if (!decadeMap.has(d)) decadeMap.set(d, []);
    decadeMap.get(d)!.push(a);
  }
  const decadeMaxCount = Math.max(...Array.from(decadeMap.values()).map((v) => v.length));
  const decades: DecadeBucket[] = Array.from(decadeMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([decade, ms]) => ({
      decade,
      count: ms.length,
      pct: Math.round((ms.length / decadeMaxCount) * 100),
      share: Math.round((ms.length / totalAlbums) * 100),
      movies: ms.sort((a, b) => a.year - b.year),
    }));

  // ---- Director counts + movie lists ----
  const dirMap = new Map<string, CanonMovie[]>();
  for (const a of movies) {
    if (!dirMap.has(a.director)) dirMap.set(a.director, []);
    dirMap.get(a.director)!.push(a);
  }
  const artistMaxCount = Math.max(...Array.from(dirMap.values()).map((v) => v.length));
  const topArtists: DirectorBucket[] = Array.from(dirMap.entries())
    .filter(([, ms]) => ms.length >= 2)
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 10)
    .map(([director, ms]) => ({
      director,
      count: ms.length,
      pct: Math.round((ms.length / artistMaxCount) * 100),
      movies: ms.sort((a, b) => a.year - b.year),
    }));

  // ---- Career arcs ----
  const careerArcs = Array.from(dirMap.entries())
    .filter(([, ms]) => ms.length >= 2)
    .map(([director, ms]) => {
      const ys = ms.map((m) => m.year);
      const earliest = Math.min(...ys);
      const latest = Math.max(...ys);
      return { director, earliest, latest, gap: latest - earliest };
    })
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 5);

  // ---- John Wick saga (Chad Stahelski) ----
  const wickFilms = movies
    .filter((a) => a.director === "Chad Stahelski")
    .sort((a, b) => a.year - b.year);
  const wu = {
    count: wickFilms.length,
    films: wickFilms.map(({ director, title, year }) => ({ director, title, year })),
  };

  // ---- Curator's eras (thirds by year) ----
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
    peakYear,
    decades,
    decadeMaxCount,
    years: yearBuckets,
    yearMaxCount,
    topArtists,
    artistMaxCount,
    careerArcs,
    wu,
    eras,
  };
}

// ---------------------------------------------------------------------------
// Shared classes — readability-first. Larger fonts, higher contrast.
// (Senior reader; default base font is already 18px from globals.css.)
// ---------------------------------------------------------------------------

const KICKER = "font-mono text-xs uppercase tracking-[0.25em] text-accent";
const LABEL = "font-mono text-xs uppercase tracking-[0.2em] text-ink/70";

const ARTIST_CARD_LINK =
  "block border border-ink/15 bg-ink/[0.03] p-5 transition hover:border-accent/50 hover:bg-ink/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50";

// ---------------------------------------------------------------------------
// PosterThumb — small clickable poster used in strips. Resting size readable
// at arm's length; grows on hover so titles + details surface.
// ---------------------------------------------------------------------------

function PosterThumb({
  m,
  size = 44,
}: {
  m: CanonMovie;
  size?: number;
}) {
  const src = posterSrc(m);
  const slug = movieSlugFor(m.director, m.title);
  const w = size;
  const h = Math.round(size * 1.5); // 2:3 poster aspect

  return (
    <Link
      href={`/movie/${slug}`}
      className="group/poster relative shrink-0"
      style={{ width: w, height: h }}
      title={`${m.title} — ${m.director} (${m.year})`}
      aria-label={`${m.title} by ${m.director}, ${m.year}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={w}
          height={h}
          loading="lazy"
          className="block h-full w-full object-cover border border-ink/15 transition group-hover/poster:border-accent group-hover/poster:scale-[1.6] group-hover/poster:z-20 group-hover/poster:shadow-2xl"
          style={{ position: "relative", zIndex: 1 }}
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center border border-ink/15 bg-ink/[0.06] text-[9px] font-mono uppercase tracking-wider text-ink/50 transition group-hover/poster:border-accent"
        >
          {m.year}
        </span>
      )}
      <span
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 hidden -translate-x-1/2 flex-col items-center group-hover/poster:flex"
      >
        <span className="whitespace-nowrap border border-ink/20 bg-paper px-2 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-ink shadow-xl">
          {m.title}
        </span>
        <span className="whitespace-nowrap bg-paper/95 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-ink/70">
          {m.director} &middot; {m.year}
        </span>
      </span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// PosterStrip — a horizontal row of poster thumbs, wraps on small screens.
// Used inside decade and director rows so the bar visualization is *also*
// the actual films.
// ---------------------------------------------------------------------------

function PosterStrip({
  movies,
  size = 44,
}: {
  movies: CanonMovie[];
  size?: number;
}) {
  return (
    <div className="flex flex-wrap items-end gap-1.5">
      {movies.map((m) => (
        <PosterThumb key={`${m.director}-${m.title}`} m={m} size={size} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FilmsPerYearChart — vertical bar chart, one bar per year from earliest to
// latest. Decade columns get bold year labels in serif; off-decade years are
// quiet ticks. Each bar is a Link to filter the catalog.
// ---------------------------------------------------------------------------

function FilmsPerYearChart({
  buckets,
  maxCount,
  peakYear,
}: {
  buckets: YearBucket[];
  maxCount: number;
  peakYear: { year: number; count: number };
}) {
  const CHART_HEIGHT = 200;
  const BAR_GAP = 2;

  return (
    <div className="border border-ink/15 bg-ink/[0.02] p-5 sm:p-7">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <p className={LABEL}>Films per year</p>
        <p className="font-mono text-xs text-ink/70">
          Peak: <span className="serif text-base text-ink">{peakYear.year}</span> &middot; {peakYear.count} films
        </p>
      </div>

      <div className="overflow-x-auto -mx-5 px-5 sm:-mx-7 sm:px-7">
        <div style={{ minWidth: `${buckets.length * 14}px` }}>
          {/* Bars */}
          <div
            className="flex items-end"
            style={{ height: CHART_HEIGHT, gap: BAR_GAP }}
          >
            {buckets.map((b) => {
              const isDecade = b.year % 10 === 0;
              const isPeak = b.year === peakYear.year;
              const heightPct = b.count === 0 ? 0 : (b.count / maxCount) * 100;
              const minVisible = b.count === 0 ? 1 : Math.max(4, (heightPct / 100) * CHART_HEIGHT);

              const bar = (
                <span
                  className={`block w-full transition ${
                    isPeak
                      ? "bg-accent group-hover/yr:bg-ember"
                      : "bg-accent/55 group-hover/yr:bg-accent"
                  } ${b.count === 0 ? "bg-ink/10" : ""}`}
                  style={{ height: minVisible }}
                />
              );

              if (b.count === 0) {
                return (
                  <span
                    key={b.year}
                    className="group/yr flex flex-1 flex-col items-center"
                    style={{ minWidth: 8 }}
                    title={`${b.year} — no films`}
                  >
                    <span className="flex-1" />
                    {bar}
                  </span>
                );
              }

              return (
                <Link
                  key={b.year}
                  href={`/?decade=${Math.floor(b.year / 10) * 10}#movies`}
                  className="group/yr flex flex-1 flex-col items-center justify-end relative"
                  style={{ minWidth: 8 }}
                  title={`${b.year} — ${b.count} film${b.count === 1 ? "" : "s"}`}
                  aria-label={`${b.year}: ${b.count} films`}
                >
                  {/* Count label that appears on hover above the bar */}
                  <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap border border-ink/20 bg-paper px-2 py-0.5 font-mono text-[10px] text-ink shadow-md group-hover/yr:block z-10">
                    {b.year} &middot; {b.count}
                  </span>
                  <span className="flex-1" />
                  {bar}
                  {isDecade ? (
                    <span
                      className="absolute -bottom-2 h-1 w-px bg-ink/40"
                      aria-hidden="true"
                    />
                  ) : null}
                </Link>
              );
            })}
          </div>

          {/* Axis: decade labels in serif, well-sized for older readers */}
          <div className="mt-4 flex" style={{ gap: BAR_GAP }}>
            {buckets.map((b) => {
              const isDecade = b.year % 10 === 0;
              const isEdge = b.year === buckets[0].year || b.year === buckets[buckets.length - 1].year;
              return (
                <span
                  key={`label-${b.year}`}
                  className="flex flex-1 justify-center"
                  style={{ minWidth: 8 }}
                >
                  {isDecade ? (
                    <span className="serif text-sm text-ink/75 sm:text-base">{b.year}</span>
                  ) : isEdge ? (
                    <span className="font-mono text-[10px] text-ink/50">{b.year}</span>
                  ) : null}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <p className="mt-5 serif text-sm italic text-ink/65 sm:text-base">
        Each bar is a year of cinema on the list. The tallest is {peakYear.year}.
        Hover a bar to see the count, click to filter the list to that decade.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MovieStats() {
  const stats = computeliststats();
  const {
    totalAlbums,
    distinctArtists,
    earliestYear,
    latestYear,
    medianYear,
    peakYear,
  } = stats;

  return (
    <>
      {/* ----------------------------------------------------------------- */}
      {/* Section A: Headline numbers                                         */}
      {/* ----------------------------------------------------------------- */}
      <Section number="01" title="By the Numbers" blurb="Peter's list, quantified.">
        <div className="flex flex-col gap-0 lg:flex-row lg:items-stretch">
          <div className="flex items-center justify-center border border-ink/15 bg-ink/[0.03] p-10 lg:flex-1 lg:p-16">
            <div className="text-center">
              <p
                className="serif leading-none text-ink select-none"
                style={{ fontSize: "clamp(7rem, 22vw, 16rem)", fontWeight: 300 }}
                aria-label={`${totalAlbums} films on the list`}
              >
                {totalAlbums}
              </p>
              <p className="serif mt-4 text-lg text-ink/70 sm:text-xl">films on the list</p>
            </div>
          </div>

          <div className="border border-ink/15 bg-ink/[0.02] lg:w-72 lg:border-l-0">
            {[
              { label: "Distinct directors", value: distinctArtists },
              { label: "First year", value: earliestYear },
              { label: "Latest year", value: latestYear },
              { label: "Median release", value: medianYear },
              { label: `Peak year`, value: peakYear.year, sub: `${peakYear.count} films` },
            ].map(({ label, value, sub }) => (
              <div
                key={label}
                className="flex items-baseline justify-between gap-4 border-b border-ink/15 px-6 py-5 last:border-b-0"
              >
                <div>
                  <p className={LABEL}>{label}</p>
                  {sub ? <p className="font-mono text-xs text-ink/60 mt-0.5">{sub}</p> : null}
                </div>
                <p className="serif text-3xl font-light text-ink sm:text-4xl">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* Section B: Films per year — vertical bar chart                     */}
      {/* ----------------------------------------------------------------- */}
      <Section
        number="02"
        title="Across the Years"
        blurb={`From ${earliestYear} to ${latestYear} — the shape of Peter's list across nine decades of film.`}
      >
        <FilmsPerYearChart
          buckets={stats.years}
          maxCount={stats.yearMaxCount}
          peakYear={stats.peakYear}
        />
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* Section C: Decade-by-decade poster wall                            */}
      {/* ----------------------------------------------------------------- */}
      <Section
        number="03"
        title="By the Decade"
        blurb="Each row is a decade and every film on it. Click a poster to open the film, click the decade heading to filter the list."
      >
        <div className="space-y-3">
          {stats.decades.map(({ decade, count, share, pct, movies: ms }) => (
            <div
              key={decade}
              className="border border-ink/15 bg-ink/[0.02] p-4 sm:p-5"
            >
              <div className="mb-3 flex items-baseline justify-between gap-4">
                <Link
                  href={`/?decade=${decade}#movies`}
                  className="group/dec inline-flex items-baseline gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                  aria-label={`Filter the list to the ${decade}s — ${count} films`}
                >
                  <span className="serif text-3xl font-light text-ink sm:text-4xl group-hover/dec:text-accent transition-colors">
                    {decade}s
                  </span>
                  <span className="font-mono text-xs text-ink/50 opacity-0 transition-opacity group-hover/dec:opacity-100">
                    filter list &rarr;
                  </span>
                </Link>
                <div className="text-right">
                  <p className="serif text-2xl font-light text-ink">
                    {count} <span className="text-ink/55 text-base">film{count === 1 ? "" : "s"}</span>
                  </p>
                  <p className="font-mono text-xs text-ink/70">{share}% of the list</p>
                </div>
              </div>

              {/* Share bar — wider + taller than before so it actually reads */}
              <div className="mb-4 h-2 w-full bg-ink/8 overflow-hidden">
                <div
                  className="h-full bg-accent/65"
                  style={{ width: `${pct}%` }}
                  aria-hidden="true"
                />
              </div>

              <PosterStrip movies={ms} size={48} />
            </div>
          ))}
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* Section D: Most-represented directors — with poster strips         */}
      {/* ----------------------------------------------------------------- */}
      <Section
        number="04"
        title="Most Represented"
        blurb="Directors with more than one entry on the list. Click a name to filter, click a poster to open the film."
      >
        <div className="space-y-3">
          {stats.topArtists.map(({ director, count, movies: ms }) => (
            <div
              key={director}
              className="border border-ink/15 bg-ink/[0.02] p-4 sm:p-5"
            >
              <div className="mb-3 flex items-baseline justify-between gap-4">
                <Link
                  href={`/?q=${encodeURIComponent(director)}#movies`}
                  className="group/dir inline-flex items-baseline gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                  aria-label={`Filter the list to ${director} — ${count} films`}
                >
                  <span className="serif text-2xl font-light text-ink sm:text-3xl group-hover/dir:text-accent transition-colors">
                    {director}
                  </span>
                  <span className="font-mono text-xs text-ink/50 opacity-0 transition-opacity group-hover/dir:opacity-100">
                    filter list &rarr;
                  </span>
                </Link>
                <p className="serif text-xl font-light text-ink sm:text-2xl">
                  {count} <span className="text-ink/55 text-base">film{count === 1 ? "" : "s"}</span>
                </p>
              </div>
              <PosterStrip movies={ms} size={52} />
            </div>
          ))}
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* Section E: Career arcs                                             */}
      {/* ----------------------------------------------------------------- */}
      <Section
        number="05"
        title="Longest Career Arcs"
        blurb="For directors with multiple entries, the years between their earliest and latest film on the list."
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
              <p className="serif mt-3 text-xl font-light text-ink leading-snug">
                {director}
              </p>
              <p className="mt-2 font-mono text-sm text-ink/65">
                {earliest}&thinsp;&mdash;&thinsp;{latest}
              </p>
              <p className="mt-3 font-mono text-[10px] text-accent opacity-0 transition-opacity group-hover:opacity-100">
                browse in movies &rarr;
              </p>
            </Link>
          ))}
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* Section F: John Wick saga callout                                  */}
      {/* ----------------------------------------------------------------- */}
      <Section
        number="06"
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
              <p className="mt-2 font-mono text-xs text-accent opacity-0 transition-opacity group-hover/wu:opacity-100">
                browse in movies &rarr;
              </p>
            </Link>
            <p className="serif mt-2 text-base italic text-ink/60">
              out of {totalAlbums} total
            </p>
          </div>
          <div className="flex-1 space-y-3">
            {stats.wu.films.map(({ director, title, year }) => (
              <div
                key={`${director}-${title}`}
                className="flex items-baseline justify-between gap-4 border-b border-ink/15 pb-3"
              >
                <div>
                  <p className="serif text-lg font-light text-ink">{title}</p>
                  <p className="font-mono text-xs text-ink/65">{director}</p>
                </div>
                <p className="serif shrink-0 text-lg font-light text-ink/55">{year}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* Section G: Curator's eras                                          */}
      {/* ----------------------------------------------------------------- */}
      <Section
        number="07"
        title="Curator's Eras"
        blurb="The list split into three equal thirds by year. Each era's signature film is the median entry of that bucket."
      >
        <div className="grid grid-cols-1 gap-px bg-ink/15 md:grid-cols-3">
          {stats.eras.map(({ label, startYear, endYear, count, pct, signature }) => (
            <Link
              key={label}
              href={`/?decade=${startYear}#movies`}
              className="group/era block bg-paper p-6 sm:p-8 transition-colors hover:bg-ink/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/50"
              aria-label={`Browse ${label} era (${startYear}–${endYear}) — ${count} films`}
            >
              <p className={KICKER}>{label}</p>
              <p className="serif mt-2 text-3xl font-light text-ink">{startYear}&ndash;{endYear}</p>
              <p className="mt-2 font-mono text-sm text-ink/65">
                {count} films &middot; {pct}% of movies
              </p>
              <div className="mt-6 border-t border-ink/15 pt-5">
                <p className={LABEL}>Signature film</p>
                <p className="serif mt-2 text-lg font-light text-ink leading-snug">
                  {signature.title}
                </p>
                <p className="mt-1 font-mono text-sm text-ink/65">
                  {signature.director} &middot; {signature.year}
                </p>
              </div>
              <p className="mt-4 font-mono text-[10px] text-accent opacity-0 transition-opacity group-hover/era:opacity-100">
                browse era &rarr;
              </p>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
