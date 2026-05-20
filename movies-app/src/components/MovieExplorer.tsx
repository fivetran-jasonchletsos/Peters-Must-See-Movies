"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { movies, type CanonMovie } from "@/lib/movies";
import MovieCard, { type CardSize } from "./MovieCard";
import GroupMarker from "./DecadeMarker";
import PullQuote from "./PullQuote";
import MovieTimeline from "./MovieTimeline";

type SortMode = "year" | "director";

function sortKey(a: CanonMovie) {
  // strip leading articles for director sort
  return a.director.replace(/^(The|A|An)\s+/i, "").toLowerCase();
}

function decadeLabel(d: number) {
  return `${d}s`;
}

function alphaBucket(letter: string): { id: string; label: string; range: [string, string] } {
  // 9 buckets — A-C, D-F, G-I, J-L, M-O, P-R, S-U, V-X, Y-#
  const c = letter.toUpperCase();
  if (c < "A") return { id: "y-z", label: "Y–#", range: ["Y", "z"] };
  if (c <= "C") return { id: "a-c", label: "A–C", range: ["A", "C"] };
  if (c <= "F") return { id: "d-f", label: "D–F", range: ["D", "F"] };
  if (c <= "I") return { id: "g-i", label: "G–I", range: ["G", "I"] };
  if (c <= "L") return { id: "j-l", label: "J–L", range: ["J", "L"] };
  if (c <= "O") return { id: "m-o", label: "M–O", range: ["M", "O"] };
  if (c <= "R") return { id: "p-r", label: "P–R", range: ["P", "R"] };
  if (c <= "U") return { id: "s-u", label: "S–U", range: ["S", "U"] };
  if (c <= "X") return { id: "v-x", label: "V–X", range: ["V", "X"] };
  return { id: "y-z", label: "Y–#", range: ["Y", "z"] };
}

const ALPHA_BUCKET_ORDER = ["a-c", "d-f", "g-i", "j-l", "m-o", "p-r", "s-u", "v-x", "y-z"];

// Pull quotes — editorial interruptions, one every ~13 films in the flat list.
// Sourced from particularly punchy curation notes in the list.
const PULL_QUOTES: { quote: string; attribution: string }[] = [
  {
    quote: "Rap rewired.",
    attribution: "On Enter the Coen Brothers (36 Chambers) — Coen Brothers Clan, 1993",
  },
  {
    quote: "The blueprint.",
    attribution: "On Unknown Pleasures — Joy Division, 1979",
  },
  {
    quote: "Built from thousands of samples and yet sounds like one continuous summer afternoon.",
    attribution: "On Since I Left You — The Avalanches, 2000",
  },
  {
    quote: "The honest one.",
    attribution: "On In Utero — Nirvana, 1993",
  },
  {
    quote: "Music boxes, harps, and microbeats. An intimate record played at the volume of an indoor whisper.",
    attribution: "On Vespertine — Björk, 2001",
  },
  {
    quote: "Grief made anthemic.",
    attribution: "On Funeral — Arcade Fire, 2004",
  },
  {
    quote: "One film. That’s all she needed.",
    attribution: "On The Miseducation of Lauryn Hill, 1998",
  },
];

// Interleave pull quotes into a flat list of films every ~13 records.
// Returns an array of either an film or a pull quote marker.
type GridItem =
  | { type: "film"; movie: CanonMovie }
  | { type: "pullquote"; quote: string; attribution: string };

function interleave(films: CanonMovie[], startQuoteIdx: number): { items: GridItem[]; nextQuoteIdx: number } {
  const INTERVAL = 13;
  const result: GridItem[] = [];
  let quoteIdx = startQuoteIdx;
  for (let i = 0; i < films.length; i++) {
    if (i > 0 && i % INTERVAL === 0 && quoteIdx < PULL_QUOTES.length) {
      result.push({ type: "pullquote", ...PULL_QUOTES[quoteIdx] });
      quoteIdx++;
    }
    result.push({ type: "film", movie: films[i] });
  }
  return { items: result, nextQuoteIdx: quoteIdx };
}

const GRID_CLASS_BY_SIZE: Record<CardSize, string> = {
  s: "grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8",
  m: "grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  l: "grid grid-cols-1 gap-x-10 gap-y-14 md:grid-cols-2 lg:grid-cols-3",
};

export default function MovieExplorer() {
  const searchParams = useSearchParams();
  const [sort, setSort] = useState<SortMode>("year");
  const [query, setQuery] = useState("");
  const [decadeFilter, setDecadeFilter] = useState<number | null>(null);
  const [size, setSize] = useState<CardSize>("s");

  // Hydrate state from URL params on first render only.
  // e.g. /?decade=1990&sort=director&q=fever&size=l
  useEffect(() => {
    const decade = searchParams.get("decade");
    const sortParam = searchParams.get("sort");
    const q = searchParams.get("q");
    const sizeParam = searchParams.get("size");

    if (decade) {
      const d = parseInt(decade, 10);
      if (!isNaN(d)) setDecadeFilter(d);
    }
    if (sortParam === "director" || sortParam === "year") {
      setSort(sortParam);
    }
    if (q) {
      setQuery(q);
    }
    if (sizeParam === "s" || sizeParam === "m" || sizeParam === "l") {
      setSize(sizeParam);
    }

    // Scroll to the list grid if any filter param was provided
    const hasFilter = decade || sortParam || q || sizeParam;
    if (hasFilter) {
      const el = document.getElementById("movies");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once on mount

  const allDecades = useMemo(() => {
    const set = new Set<number>();
    for (const a of movies) set.add(Math.floor(a.year / 10) * 10);
    return Array.from(set).sort();
  }, []);

  const filtered = useMemo(() => {
    let xs = movies;
    if (query.trim()) {
      const q = query.toLowerCase();
      xs = xs.filter(
        (a) =>
          a.director.toLowerCase().includes(q) ||
          a.title.toLowerCase().includes(q) ||
          a.note.toLowerCase().includes(q)
      );
    }
    if (decadeFilter !== null) {
      xs = xs.filter(
        (a) => Math.floor(a.year / 10) * 10 === decadeFilter
      );
    }
    return xs;
  }, [query, decadeFilter]);

  const grouped = useMemo(() => {
    if (sort === "year") {
      const buckets = new Map<number, CanonMovie[]>();
      for (const a of [...filtered].sort((x, y) => x.year - y.year)) {
        const d = Math.floor(a.year / 10) * 10;
        if (!buckets.has(d)) buckets.set(d, []);
        buckets.get(d)!.push(a);
      }
      return Array.from(buckets.entries())
        .sort(([a], [b]) => a - b)
        .map(([decade, films]) => ({
          id: `decade-${decade}`,
          label: decadeLabel(decade),
          sub: `${films[0].year}–${films[films.length - 1].year}`,
          films,
        }));
    }
    // alpha
    const buckets = new Map<string, { label: string; films: CanonMovie[] }>();
    for (const a of [...filtered].sort((x, y) =>
      sortKey(x).localeCompare(sortKey(y))
    )) {
      const first = sortKey(a)[0] ?? "z";
      const b = alphaBucket(first);
      if (!buckets.has(b.id)) buckets.set(b.id, { label: b.label, films: [] });
      buckets.get(b.id)!.films.push(a);
    }
    return ALPHA_BUCKET_ORDER.filter((id) => buckets.has(id)).map((id) => ({
      id: `alpha-${id}`,
      label: buckets.get(id)!.label,
      sub: undefined,
      films: buckets.get(id)!.films,
    }));
  }, [sort, filtered]);

  // Flatten all films for pull-quote interleaving (only when not filtering)
  const isFiltering = query.trim() !== "" || decadeFilter !== null;
  const flatAlbums = useMemo(() => {
    return grouped.flatMap((g) => g.films);
  }, [grouped]);

  return (
    <div className="relative">
      {/* Timeline — first thing in the list, click to filter by year */}
      <div className="mb-8 pb-6 border-b border-ink/10">
        <MovieTimeline />
      </div>

      {/* Controls */}
      <div className="mb-8 flex flex-col gap-4 border-b border-ink/10 pb-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">
            Sort
          </span>
          <div className="flex border border-ink/15">
            {(["year", "director"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSort(mode)}
                aria-pressed={sort === mode}
                className={
                  "px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] transition focus:outline-none focus:ring-2 focus:ring-accent/40 " +
                  (sort === mode
                    ? "bg-accent text-paper"
                    : "text-ink/60 hover:text-accent")
                }
              >
                {mode === "year" ? "Year" : "Artist (A–Z)"}
              </button>
            ))}
          </div>

          <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">
            Decade
          </span>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setDecadeFilter(null)}
              aria-pressed={decadeFilter === null}
              className={
                "px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] transition focus:outline-none focus:ring-2 focus:ring-accent/40 " +
                (decadeFilter === null
                  ? "bg-ember/80 text-ink"
                  : "text-ink/50 hover:text-accent")
              }
            >
              All
            </button>
            {allDecades.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDecadeFilter(d === decadeFilter ? null : d)}
                aria-pressed={decadeFilter === d}
                className={
                  "px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] transition focus:outline-none focus:ring-2 focus:ring-accent/40 " +
                  (decadeFilter === d
                    ? "bg-accent text-paper"
                    : "text-ink/50 hover:text-accent")
                }
              >
                {d}s
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">
            Size
          </span>
          <div className="flex border border-ink/15">
            {(["s", "m", "l"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                aria-pressed={size === s}
                aria-label={`Cover size ${s.toUpperCase()}`}
                className={
                  "px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] transition focus:outline-none focus:ring-2 focus:ring-accent/40 " +
                  (size === s
                    ? "bg-accent text-paper"
                    : "text-ink/60 hover:text-accent")
                }
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>

          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find director, movie, lyric phrase…"
            aria-label="Search the list"
            className="w-full bg-ink/5 px-3 py-1.5 font-mono text-xs text-ink placeholder:text-ink/30
              focus:outline-none focus:ring-2 focus:ring-accent/40 md:w-60"
          />
          {(query || decadeFilter !== null) && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setDecadeFilter(null);
              }}
              className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/40 hover:text-accent"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Result count */}
      <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">
        Showing {filtered.length} of {movies.length} records
      </p>

      {/* Grid — with pull quotes interleaved when not in search/filter mode */}
      {isFiltering ? (
        /* Filtered view: simple flat grid, no pull quotes */
        <div className={GRID_CLASS_BY_SIZE[size]}>
          {grouped.map((group) => (
            <div key={group.id} className="contents">
              <GroupMarker
                label={group.label}
                count={group.films.length}
                sub={group.sub}
              />
              {group.films.map((movie) => (
                <MovieCard
                  key={`${movie.director}-${movie.title}`}
                  movie={movie}
                  size={size}
                />
              ))}
            </div>
          ))}
        </div>
      ) : (
        /* Default view: grouped by decade/alpha with pull quotes after every 13 records */
        <div>
          {(() => {
            let quoteIdx = 0;
            return grouped.map((group) => {
              const { items: groupItems, nextQuoteIdx } = interleave(group.films, quoteIdx);
              quoteIdx = nextQuoteIdx;
              return (
              <div key={group.id}>
                <div className={GRID_CLASS_BY_SIZE[size]}>
                  <GroupMarker
                    label={group.label}
                    count={group.films.length}
                    sub={group.sub}
                  />
                  {groupItems.map((item, idx) =>
                    item.type === "pullquote" ? (
                      <PullQuote
                        key={`pq-${group.id}-${idx}`}
                        quote={item.quote}
                        attribution={item.attribution}
                      />
                    ) : (
                      <MovieCard
                        key={`${item.movie.director}-${item.movie.title}`}
                        movie={item.movie}
                        size={size}
                      />
                    )
                  )}
                </div>
              </div>
            );
            });
          })()}
        </div>
      )}

      {filtered.length === 0 && (
        <p className="mt-12 text-center serif text-ink/40">
          No records match. Try clearing the filter.
        </p>
      )}
    </div>
  );
}
