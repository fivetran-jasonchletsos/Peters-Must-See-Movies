"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { movies, type CanonMovie } from "@/lib/movies";
import { movieSlug } from "@/lib/movie-slug";

// ---------------------------------------------------------------------------
// "Which Peter movie fits you right now" — three questions, weighted score
// per candidate film, top match wins. Hand-tuned, not ML — the point is
// to give a confident, evocative answer instead of a probability distribution.
// ---------------------------------------------------------------------------

type Answer = {
  key: string;
  label: string;
  sub: string;
  scores: Record<string, number>;   // movie title → points
};

type Quiz = {
  id: string;
  prompt: string;
  intro: string;
  answers: Answer[];
};

const QUIZ: Quiz[] = [
  {
    id: "q1",
    prompt: "What do you want from this evening?",
    intro: "Pick the closest. Not your whole life — just tonight.",
    answers: [
      {
        key: "think",
        label: "Something I'll think about for days",
        sub: "Slow burn. Architecture. A film that earns its end.",
        scores: {
          "Citizen Kane": 4, "Vertigo": 4, "Mulholland Drive": 3, "Memento": 3,
          "Donnie Darko": 3, "Jacob's Ladder": 3, "Cinema Paradiso": 2,
          "2001: A Space Odyssey": 3, "Blade Runner": 3, "The Man from Earth": 3,
          "Eternal Sunshine of the Spotless Mind": 3, "12 Monkeys": 2,
        },
      },
      {
        key: "laugh",
        label: "Something that makes my face hurt from laughing",
        sub: "Joke density off the charts. Not subtle. Not interested in being subtle.",
        scores: {
          "Monty Python and the Holy Grail": 4, "It's a Mad, Mad, Mad, Mad World": 4,
          "The Princess Bride": 3, "The Big Lebowski": 3,
          "Ferris Bueller's Day Off": 3, "O Brother, Where Art Thou?": 3,
          "Time Bandits": 2, "Fargo": 2,
        },
      },
      {
        key: "lift",
        label: "Something that lifts me up",
        sub: "Bedford Falls and yellow brick. Warmth without sugar.",
        scores: {
          "It's a Wonderful Life": 4, "The Wizard of Oz": 4,
          "The Princess Bride": 3, "Cinema Paradiso": 3, "Garden State": 2,
          "The Map of Tiny Perfect Things": 3, "WALL-E": 3,
          "Ferris Bueller's Day Off": 2,
        },
      },
      {
        key: "kick",
        label: "Something with a body count",
        sub: "Motion. Stakes. Someone is going to lose by the end.",
        scores: {
          "John Wick": 4, "John Wick: Chapter 2": 3, "John Wick: Chapter 3 – Parabellum": 3,
          "John Wick: Chapter 4": 3, "Kill Bill: Vol. 1": 4, "Kill Bill: Vol. 2": 3,
          "Léon: The Professional": 3, "The Terminator": 3, "Alien": 3,
          "Hanna": 3, "District 9": 2, "Dog Day Afternoon": 2, "The Deer Hunter": 2,
        },
      },
    ],
  },
  {
    id: "q2",
    prompt: "What era are you reaching for?",
    intro: "Honest answer. The decade your gut goes to.",
    answers: [
      {
        key: "studio",
        label: "Studio system, before color was finished",
        sub: "Classical Hollywood. Sets that were built. Stars who walked.",
        scores: {
          "Citizen Kane": 4, "The Wizard of Oz": 4, "It's a Wonderful Life": 4,
          "The Treasure of the Sierra Madre": 4, "Vertigo": 3,
          "Some Like It Hot": 3, "Singin' in the Rain": 3,
        },
      },
      {
        key: "new-wave",
        label: "New Hollywood, kitchen sink, things falling apart",
        sub: "1960s–70s. American or British, both restless.",
        scores: {
          "The Loneliness of the Long Distance Runner": 4, "If....": 4,
          "It's a Mad, Mad, Mad, Mad World": 3, "The Godfather": 4,
          "Jeremiah Johnson": 3, "Dog Day Afternoon": 3, "THX 1138": 3,
          "A Boy and His Dog": 3, "The Deer Hunter": 3,
          "Monty Python and the Holy Grail": 3,
        },
      },
      {
        key: "vhs",
        label: "VHS era. Cable late at night. Color is loud.",
        sub: "Eighties and nineties. Practical effects. Soundtrack on the radio.",
        scores: {
          "Alien": 3, "Blade Runner": 4, "The Terminator": 3, "Brazil": 3,
          "Time Bandits": 3, "The Last Starfighter": 3, "Labyrinth": 3,
          "The Lost Boys": 3, "Birdy": 2, "The Princess Bride": 3,
          "Ferris Bueller's Day Off": 3, "Cinema Paradiso": 3, "Jacob's Ladder": 3,
          "Pulp Fiction": 3, "Léon: The Professional": 3, "12 Monkeys": 3,
          "Fargo": 3, "The Fifth Element": 3, "The Big Lebowski": 3,
          "Buffy the Vampire Slayer": 2, "Night on Earth": 3,
        },
      },
      {
        key: "modern",
        label: "Modern. Anything since 2000.",
        sub: "Current syntax. New tools. Streaming defaults.",
        scores: {
          "Memento": 3, "O Brother, Where Art Thou?": 3, "Donnie Darko": 3,
          "Vanilla Sky": 2, "A.I. Artificial Intelligence": 3, "Kill Bill: Vol. 1": 3,
          "Kill Bill: Vol. 2": 3, "Garden State": 3,
          "Eternal Sunshine of the Spotless Mind": 4, "The Man from Earth": 3,
          "WALL-E": 4, "Moon": 4, "District 9": 3, "Hanna": 3, "Source Code": 3,
          "John Wick": 4, "John Wick: Chapter 2": 3,
          "John Wick: Chapter 3 – Parabellum": 3, "John Wick: Chapter 4": 3,
          "The Map of Tiny Perfect Things": 3,
        },
      },
    ],
  },
  {
    id: "q3",
    prompt: "How much room are you giving it?",
    intro: "Runtime tolerance. Time budget. State of the couch.",
    answers: [
      {
        key: "tight",
        label: "Under 100 minutes — in and out",
        sub: "Tight, well-built, no waste. Done before bedtime.",
        scores: {
          "Run Lola Run": 4, "Moon": 3, "Memento": 3,
          "Donnie Darko": 2, "Source Code": 3, "Hanna": 2,
          "The Loneliness of the Long Distance Runner": 3,
          "Léon: The Professional": 2, "The Map of Tiny Perfect Things": 3,
          "Garden State": 2,
        },
      },
      {
        key: "two-hour",
        label: "Two hours feels right",
        sub: "Standard runtime. Set, develop, pay off.",
        scores: {
          "The Princess Bride": 3, "Blade Runner": 3, "Alien": 3,
          "The Terminator": 3, "Pulp Fiction": 3, "Fargo": 3,
          "The Big Lebowski": 3, "Eternal Sunshine of the Spotless Mind": 3,
          "Kill Bill: Vol. 1": 2, "Kill Bill: Vol. 2": 2,
          "John Wick": 3, "John Wick: Chapter 2": 3,
          "Time Bandits": 2, "12 Monkeys": 3, "Brazil": 2,
          "Cinema Paradiso": 2, "Jacob's Ladder": 2, "O Brother, Where Art Thou?": 3,
          "Ferris Bueller's Day Off": 3, "WALL-E": 2, "The Wizard of Oz": 3,
          "It's a Wonderful Life": 2,
        },
      },
      {
        key: "long",
        label: "I'm in for the long one",
        sub: "Two-and-a-half plus. Director's cut welcome.",
        scores: {
          "The Godfather": 4, "It's a Mad, Mad, Mad, Mad World": 4,
          "The Deer Hunter": 4, "John Wick: Chapter 3 – Parabellum": 3,
          "John Wick: Chapter 4": 4, "Citizen Kane": 2,
          "The Treasure of the Sierra Madre": 2, "Jeremiah Johnson": 3,
          "Mulholland Drive": 3, "Vanilla Sky": 2, "A.I. Artificial Intelligence": 3,
        },
      },
      {
        key: "world",
        label: "I want to live in this movie",
        sub: "World-building. Atmosphere first. Plot second.",
        scores: {
          "Blade Runner": 4, "Cinema Paradiso": 4, "Time Bandits": 3,
          "The Wizard of Oz": 4, "Brazil": 4, "Labyrinth": 3,
          "The Princess Bride": 3, "WALL-E": 3, "The Fifth Element": 4,
          "Moon": 3, "District 9": 3, "Stanno Tutti Bene (Everybody's Fine)": 2,
          "Night on Earth": 3, "Mulholland Drive": 2,
        },
      },
    ],
  },
];

// Hand-written "why this film" notes — keyed by title.
const WHY: Record<string, string> = {
  "Citizen Kane":
    "Welles at twenty-five with all the toys and the discipline to use them. You asked for something that earns its end — this is the film that taught everything else how to do that.",
  "The Wizard of Oz":
    "Three strips of Technicolor and the moment color became language. You wanted lifted up and a world to live inside — this is the original.",
  "It's a Wonderful Life":
    "Bedford Falls and the hard math of one ordinary life. You wanted warmth without sugar — Capra in his most honest mood.",
  "The Treasure of the Sierra Madre":
    "Bogart spiraling, Walter Huston dancing, gold corrupting everyone it touches. Huston's most ruthless film, hiding inside an adventure picture.",
  "The Loneliness of the Long Distance Runner":
    "Tom Courtenay running the borstal grounds and refusing the finish line on principle. British New Wave kitchen-sink at its sharpest. Under two hours and it never wastes one.",
  "It's a Mad, Mad, Mad, Mad World":
    "Every comedian in Hollywood, one buried fortune, three hours of slapstick that earns its length. The biggest comedy swing of the era.",
  "If....":
    "Lindsay Anderson at a boarding school with a machine gun. Cool, cruel, beautiful. The film that made every later 'students vs the institution' movie possible.",
  "THX 1138":
    "Lucas before Star Wars, future-shock white-on-white. Tighter, stranger, and angrier than anything he made after.",
  "The Godfather":
    "Coppola's Coppola film. Three hours that go by in forty minutes the first time you watch it.",
  "Jeremiah Johnson":
    "Redford up the mountain. Slow film about being alone. The cold gets into the camera.",
  "A Boy and His Dog":
    "L.Q. Jones adapting Harlan Ellison. Bleak, funny, talking-dog post-apocalypse from 1975. Nothing else looks like this.",
  "Dog Day Afternoon":
    "Pacino on the sidewalk yelling Attica, Attica. New York summer, real heat, true story underneath.",
  "Monty Python and the Holy Grail":
    "Coconuts, killer rabbit, the Black Knight. You can quote it without trying — this is why.",
  "The Deer Hunter":
    "Cimino, Pittsburgh into Saigon and back. Long-cut Russian roulette. Earns every minute of its three hours.",
  "Alien":
    "Scott, Giger, Sigourney. Empty space, wet corridors, perfect monster. Still the model.",
  "Time Bandits":
    "Gilliam with kids and Sean Connery as Agamemnon. The funniest history lesson ever filmed.",
  "Blade Runner":
    "Vangelis on synths, rain on the lens, replicants who knew. You said world-building — this is the world.",
  "The Last Starfighter":
    "1984 video-game wish fulfillment, full CGI Gunstar, Robert Preston having a great time. Cable late-night canon.",
  "Birdy":
    "Cage and Modine as kids who become a Vietnam veteran and his bird-obsessed friend. Parker at his most patient.",
  "The Terminator":
    "Cameron's first one, scrappy, mean, perfect. The version where you can see the budget and the seams aren't a bug.",
  "Brazil":
    "Gilliam's masterpiece. Bureaucracy, daydreams, the wrong man arrested. Long, dense, alive in every frame.",
  "Ferris Bueller's Day Off":
    "Hughes at the absolute peak. You said lift me up — Ferris is the answer the question wants.",
  "Labyrinth":
    "Henson, Bowie, Jennifer Connelly. Crystal balls, goblin king, the Bog of Eternal Stench. World on a string.",
  "The Lost Boys":
    "Schumacher with vampires on the Santa Cruz boardwalk. The shape of every later 'cool teen monster movie' came from this.",
  "The Princess Bride":
    "Reiner adapting Goldman. Quote-density per minute is unmatched. The film you put on when nothing's working.",
  "Cinema Paradiso":
    "Tornatore's town, the kid in the projection booth, the kiss reel at the end. You wanted to live in a movie — live in this one.",
  "Jacob's Ladder":
    "Lyne in the late 80s, Vietnam veteran in a New York that keeps tipping over. The film that wrote the visual grammar for everything horror has done since.",
  "Stanno Tutti Bene (Everybody's Fine)":
    "Tornatore again, Marcello Mastroianni visiting his grown children across Italy. Quiet, devastating, never melodramatic.",
  "Night on Earth":
    "Jarmusch, five cabs, five cities, one night. Time-zone movie. World-building per vignette.",
  "Buffy the Vampire Slayer":
    "Kuzui's 1992, before the series. Underrated. Hutton, Reubens, Swanson before Buffy was Buffy. Stylish.",
  "Pulp Fiction":
    "Tarantino as Tarantino. You know what this is. You picked VHS-era and dialogue density — this is the answer.",
  "Léon: The Professional":
    "Besson, Jean Reno, Natalie Portman at twelve. Restored cut runs longer and is the one to watch.",
  "12 Monkeys":
    "Gilliam again, Willis bouncing through time, Brad Pitt twitching. Brilliant cause-and-effect puzzle.",
  "Fargo":
    "Coens in Minnesota. Frances McDormand. The wood-chipper. Calm camera, brutal events.",
  "The Fifth Element":
    "Besson with all the money, Bruce Willis cab driver, Gary Oldman with a Southern accent. Pure design joy.",
  "The Big Lebowski":
    "Coens again. The Dude abides. Bowling, kidnapping, Sam Elliott. Quotable per second.",
  "Run Lola Run":
    "Tykwer. Eighty minutes, three runs, one phone call. Pure cinema kinetics.",
  "Memento":
    "Nolan's calling-card. Backwards-cut, tattoo plot, Guy Pearce's best performance.",
  "O Brother, Where Art Thou?":
    "Coens by way of Homer by way of Mississippi. Soundtrack invented a genre revival.",
  "Donnie Darko":
    "Kelly's 2001 cult object. Suburban Reagan-era, jet engine in the bedroom, a rabbit. Watch the theatrical, not the director's cut.",
  "A.I. Artificial Intelligence":
    "Kubrick's project finished by Spielberg. Argument about which director it actually is keeps the film alive twenty years on.",
  "Vanilla Sky":
    "Crowe remaking Abre Los Ojos with Cruise. Underrated. Watch with the soundtrack on.",
  "Kill Bill: Vol. 1":
    "Tarantino at peak chapter-headings. Yellow tracksuit, Crazy 88, the House of Blue Leaves. Volume 2 is the answer; this one is the asking.",
  "Kill Bill: Vol. 2":
    "Tarantino actually paying off Volume 1. Slow-burn, Carradine monologue, Pai Mei. The richer half of the two.",
  "Garden State":
    "Braff's 2004. Period piece now — Shins, New Jersey, oversized sweatshirts. Lovely.",
  "Eternal Sunshine of the Spotless Mind":
    "Gondry directing Kaufman with Carrey and Winslet. The film for thinking about and feeling at the same time.",
  "The Man from Earth":
    "Bixby's last script, single room, ten characters, one impossible premise. Cinema of conversation.",
  "WALL-E":
    "Stanton at Pixar. The first forty minutes are silent and perfect. Earns every later moment.",
  "Moon":
    "Jones's debut. Sam Rockwell talking to Sam Rockwell. Hour-and-a-half of high-density science fiction.",
  "District 9":
    "Blomkamp's first, Johannesburg with aliens, sharp politics riding inside an action movie.",
  "Hanna":
    "Wright with a Chemical Brothers score and Saoirse Ronan at sixteen. Cleaner than it has any right to be.",
  "Source Code":
    "Jones again, Gyllenhaal in a loop on a commuter train. Mid-length, lean, sneakily heartfelt.",
  "John Wick":
    "Stahelski's debut. They killed his dog. The action-film grammar that all later action films are now in conversation with.",
  "John Wick: Chapter 2":
    "Same team, bigger world, Continental Hotel lore. Best fight choreography of the decade up to this point.",
  "John Wick: Chapter 3 – Parabellum":
    "Library books and motorcycle swords. The trilogy's bridge film — operates at maximum design density.",
  "John Wick: Chapter 4":
    "Hong Kong, Paris, sniper-rifle conversations on rooftops. The longest one and somehow the leanest.",
  "The Map of Tiny Perfect Things":
    "Lendeborg and Newton in a Groundhog Day teen movie that's gentler and stranger than it sounds. Underrated 2021.",
  "2001: A Space Odyssey":
    "Kubrick. Ape, monolith, HAL, beyond the infinite. The film cinema is still trying to be.",
  "Vertigo":
    "Hitchcock's most personal — Stewart, Novak, the spiral, the cliff. Improves every viewing.",
  "Some Like It Hot":
    "Wilder, Curtis, Lemmon, Monroe. Cross-dressing, mob hit, the perfect last line.",
  "Singin' in the Rain":
    "Donen and Kelly. Highest joke density of any musical, plus the title number.",
  "Mulholland Drive":
    "Lynch's clearest puzzle. Don't try to solve it; let it solve you.",
};

function scoreAnswers(answers: (Answer | null)[]) {
  const totals = new Map<string, number>();
  for (const a of answers) {
    if (!a) continue;
    for (const [title, pts] of Object.entries(a.scores)) {
      totals.set(title, (totals.get(title) ?? 0) + pts);
    }
  }
  return Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function findMovieByTitle(title: string): CanonMovie | undefined {
  return movies.find((m) => m.title === title);
}

export default function MatchPage() {
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<(Answer | null)[]>([null, null, null]);

  const ranked = useMemo(() => scoreAnswers(picks), [picks]);
  const topTitle = ranked[0]?.[0];
  const topMovie = topTitle ? findMovieByTitle(topTitle) : null;
  const runners = ranked.slice(1, 4)
    .map(([t]) => findMovieByTitle(t))
    .filter((m): m is CanonMovie => !!m);

  function pick(i: number, ans: Answer) {
    const next = picks.slice();
    next[i] = ans;
    setPicks(next);
    setStep((s) => Math.min(s + 1, 3));
  }

  function reset() {
    setStep(0);
    setPicks([null, null, null]);
  }

  return (
    <main className="min-h-screen">
      {/* ============================ HEADER ============================ */}
      <section className="px-5 pt-12 pb-6 sm:px-6 sm:pt-16 md:px-16">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-accent">
                Section 08 · Matcher
              </p>
              <h1 className="serif text-ink font-medium leading-[0.92] tracking-tight mt-4
                             text-[48px] sm:text-[88px] md:text-[120px]">
                Which one<br/>fits you
              </h1>
            </div>
            <div className="font-mono text-[10px] tracking-widest text-muted uppercase sm:text-right sm:mt-12 leading-relaxed">
              Three questions<br/>
              {movies.length} candidates<br/>
              <span className="text-accent">no wrong answers</span>
            </div>
          </div>
          <p className="serif italic text-ink/70 text-base sm:text-lg mt-6 max-w-3xl leading-relaxed">
            Answer three honest questions about tonight — your mood, your era,
            your runtime budget. The matcher picks the film from Peter&apos;s
            shelf that fits.
          </p>
        </div>
      </section>

      {/* ============================ PROGRESS ============================ */}
      <section className="px-5 sm:px-6 md:px-16">
        <div className="mx-auto max-w-5xl flex items-center gap-3">
          {[0, 1, 2].map((i) => {
            const done = picks[i] != null;
            const active = step === i;
            return (
              <div key={i} className="flex items-center gap-3 flex-1">
                <div className={`h-[3px] flex-1 rounded transition-colors ${
                  done ? "bg-accent" : active ? "bg-ember" : "bg-ink/15"
                }`} />
              </div>
            );
          })}
          <span className="font-mono text-[10px] tracking-widest text-muted uppercase shrink-0">
            {step < 3 ? `Q ${step + 1} / 3` : "Result"}
          </span>
        </div>
      </section>

      {/* ============================ BODY ============================ */}
      <section className="px-5 pt-10 pb-16 sm:px-6 md:px-16">
        <div className="mx-auto max-w-5xl">
          {step < 3 ? (
            <QuizCard quiz={QUIZ[step]} index={step} onPick={(a) => pick(step, a)} />
          ) : (
            <Result
              topMovie={topMovie ?? null}
              why={topTitle ? WHY[topTitle] ?? "" : ""}
              picks={picks}
              runners={runners}
              onReset={reset}
            />
          )}
        </div>
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------
function QuizCard({
  quiz,
  index,
  onPick,
}: {
  quiz: Quiz;
  index: number;
  onPick: (a: Answer) => void;
}) {
  return (
    <div key={quiz.id} className="animate-[fadeUp_0.5s_ease-out_both]">
      <p className="font-mono text-[10px] tracking-[0.35em] uppercase text-accent mb-3">
        Question {String(index + 1).padStart(2, "0")}
      </p>
      <h2 className="serif text-ink font-medium leading-[0.95] tracking-tight
                     text-[34px] sm:text-[52px] md:text-[64px]">
        {quiz.prompt}
      </h2>
      <p className="serif italic text-ink/65 text-base sm:text-lg mt-4 max-w-2xl leading-relaxed">
        {quiz.intro}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
        {quiz.answers.map((a, i) => (
          <button
            key={a.key}
            type="button"
            onClick={() => onPick(a)}
            className="group relative text-left border-2 border-ink/15 bg-cream/40 hover:border-accent hover:bg-cream/80
                       rounded-sm p-5 sm:p-6 transition-all hover:-translate-y-0.5 overflow-hidden"
          >
            <span aria-hidden="true"
                  className="serif text-accent/12 group-hover:text-accent/25 transition-colors
                             absolute -right-1 -top-3 leading-none select-none
                             text-[80px] sm:text-[100px]">
              {String.fromCharCode(65 + i)}
            </span>
            <div className="relative">
              <p className="font-mono text-[9px] tracking-[0.32em] uppercase text-accent">
                Option {String.fromCharCode(65 + i)}
              </p>
              <h3 className="serif text-ink text-[22px] sm:text-[26px] leading-[1.05] tracking-tight font-medium mt-2">
                {a.label}
              </h3>
              <p className="serif text-ink/65 text-[13.5px] mt-2 leading-relaxed">
                {a.sub}
              </p>
              <p className="font-mono text-[9px] tracking-widest text-muted uppercase mt-4 opacity-60
                            group-hover:opacity-100 group-hover:text-accent transition">
                Pick this →
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Result({
  topMovie,
  why,
  picks,
  runners,
  onReset,
}: {
  topMovie: CanonMovie | null;
  why: string;
  picks: (Answer | null)[];
  runners: CanonMovie[];
  onReset: () => void;
}) {
  if (!topMovie) {
    return (
      <div className="text-center py-12">
        <p className="serif italic text-muted">No match found. That shouldn&apos;t happen — try again.</p>
        <button onClick={onReset} className="font-mono text-[10px] tracking-widest uppercase
                                              border border-accent text-accent px-4 py-2 rounded mt-6
                                              hover:bg-accent hover:text-paper transition-colors">
          Try again
        </button>
      </div>
    );
  }

  const slug = movieSlug(topMovie.director, topMovie.title);

  return (
    <div className="animate-[fadeUp_0.6s_ease-out_both]">
      <p className="font-mono text-[10px] tracking-[0.35em] uppercase text-accent mb-3">
        Your movie
      </p>
      <h2 className="serif text-ink font-medium leading-[0.92] tracking-tight
                     text-[40px] sm:text-[64px] md:text-[80px]">
        {topMovie.title}
      </h2>
      <p className="font-mono text-[11px] tracking-widest text-accent uppercase mt-3">
        {topMovie.director} · {topMovie.year}
      </p>

      <div className="mt-8 max-w-3xl">
        <p className="serif text-ink text-[17px] sm:text-[18px] leading-[1.78]">
          {why}
        </p>
        <p className="serif italic text-ink/65 text-base mt-4 leading-relaxed">
          {topMovie.note}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/movie/${slug}`}
            className="font-mono text-[10px] tracking-widest uppercase border border-accent text-accent
                       hover:bg-accent hover:text-paper transition-colors px-4 py-2.5 rounded"
          >
            Open the full entry →
          </Link>
          <button
            type="button"
            onClick={onReset}
            className="font-mono text-[10px] tracking-widest uppercase border border-ink/30 text-ink/70
                       hover:border-accent hover:text-accent transition-colors px-4 py-2.5 rounded"
          >
            Take the quiz again
          </button>
        </div>
      </div>

      {/* Your answers */}
      <div className="mt-12 border-t border-ink/15 pt-6">
        <p className="font-mono text-[10px] tracking-[0.35em] uppercase text-accent mb-4">
          Your answers
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {QUIZ.map((q, i) => (
            <div key={q.id} className="border border-ink/15 bg-cream/40 rounded-sm p-4">
              <p className="font-mono text-[9px] tracking-widest uppercase text-accent">
                Q {String(i + 1).padStart(2, "0")}
              </p>
              <p className="serif italic text-ink/60 text-sm mt-1">{q.prompt}</p>
              <p className="serif text-ink text-base mt-2 leading-snug">
                {picks[i]?.label ?? "—"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Runner-ups */}
      {runners.length > 0 && (
        <div className="mt-10 border-t border-ink/15 pt-6">
          <p className="font-mono text-[10px] tracking-[0.35em] uppercase text-accent mb-4">
            Also close — second-reel picks
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {runners.map((m) => (
              <Link
                key={m.title}
                href={`/movie/${movieSlug(m.director, m.title)}`}
                className="group block border border-ink/20 bg-cream/40 hover:border-accent hover:bg-cream/70
                           rounded-sm p-4 transition-colors"
              >
                <p className="font-mono text-[9px] tracking-widest uppercase text-accent">
                  {m.year}
                </p>
                <h3 className="serif text-ink text-lg leading-tight mt-1 group-hover:text-accent transition-colors">
                  {m.title}
                </h3>
                <p className="font-mono text-[9px] tracking-widest text-muted uppercase mt-2">
                  {m.director}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
