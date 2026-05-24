import { movies, type CanonMovie } from "@/lib/movies";

// Five-question movie recommender. Scoring works against the title +
// director + year + note. Notes are short and idiosyncratic; the
// keyword matcher is intentionally generous so a single hit doesn't
// dominate. Director recognition seeds the "familiar" axis.

export type Mood = "escape" | "sharp" | "grace" | "dark-laughs" | "comfort";
export type EraPick = "2010s+" | "90s-00s" | "70s-80s" | "older" | "any";
export type Pacing = "quiet" | "steady" | "kinetic";
export type Load = "background" | "half" | "full" | "wrecked";
export type Familiar = "surprise" | "new" | "comfort";

export type Answers = {
  mood: Mood;
  era: EraPick;
  pacing: Pacing;
  load: Load;
  familiar: Familiar;
};

export type Recommendation = {
  pick: CanonMovie;
  runners: CanonMovie[];
};

// Mood keyword weights. Matched against the note (case-insensitive).
const MOOD_KEYWORDS: Record<Mood, [RegExp, number][]> = {
  escape: [
    [/\b(heist|chase|race|spy|spies|war|western|gun|fight|adventure|escape|outlaw|saga|epic)\b/i, 4],
    [/\b(action|kinetic|explosive|propulsive|kineti)\b/i, 3],
  ],
  sharp: [
    [/\b(mystery|detective|crime|noir|thriller|puzzle|investig|unravel|conspiracy|spi[er])\b/i, 4],
    [/\b(taut|tense|tight|moral|coil)\b/i, 2],
  ],
  grace: [
    [/\b(quiet|patient|slow|tender|grief|loneliness|memory|love|grace|gentle|small|simple|spare)\b/i, 4],
    [/\b(meditation|elegy|portrait|paced)\b/i, 3],
  ],
  "dark-laughs": [
    [/\b(satire|satirical|farce|absurd|absurd|farcical|morbid|black\s*comedy|sardonic|deadpan|cynic)\b/i, 5],
    [/\b(funny|comedy|comic|joke|laugh|wit)\b/i, 2],
  ],
  comfort: [
    [/\b(classic|beloved|Hollywood|favorite|Christmas|musical|family|warm|crowd-pleaser|charming)\b/i, 4],
    [/\b(romantic|tender|sweet)\b/i, 2],
  ],
};

const PACING_KEYWORDS: Record<Pacing, [RegExp, number][]> = {
  quiet: [
    [/\b(quiet|slow|tender|patient|minimal|spare|still|subtle|meditation|elegy|gentle)\b/i, 5],
    [/\b(intimate|small|portrait|study)\b/i, 2],
  ],
  steady: [
    [/\b(paced|measured|deliberate|steady|patient|carefully|sober|grounded)\b/i, 3],
  ],
  kinetic: [
    [/\b(action|kinetic|fast|frenetic|chase|fight|race|explosive|shootout|propulsive|relentless|breakneck)\b/i, 5],
    [/\b(heist|war|gun|battle|brawl)\b/i, 2],
  ],
};

const LOAD_KEYWORDS: Record<Load, [RegExp, number][]> = {
  background: [
    [/\b(easy|breezy|charming|comedy|musical|family|warm|fun)\b/i, 3],
  ],
  half: [
    [/\b(comedy|crime|thriller|mystery|caper|adventure)\b/i, 3],
  ],
  full: [
    [/\b(drama|mystery|thriller|psychological|tense|noir|moral)\b/i, 4],
  ],
  wrecked: [
    [/\b(grief|loneliness|tragedy|tragic|war|death|memory|epic|prestige|monument)\b/i, 5],
  ],
};

function eraScore(year: number, era: EraPick): number {
  if (era === "any") return 0;
  if (era === "2010s+") return year >= 2010 ? 4 : year >= 2005 ? 1 : -2;
  if (era === "90s-00s") return year >= 1990 && year < 2010 ? 4 : Math.abs(year - 2000) <= 7 ? 1 : -2;
  if (era === "70s-80s") return year >= 1970 && year < 1990 ? 4 : Math.abs(year - 1980) <= 7 ? 1 : -2;
  // older
  return year < 1970 ? 4 : year < 1975 ? 1 : -2;
}

// Big-name directors → "comfort"; lesser-known → "new".
const COMFORT_DIRECTORS = new Set([
  "Victor Fleming", "Orson Welles", "Frank Capra", "John Huston", "Stanley Kramer",
  "George Lucas", "Steven Spielberg", "Francis Ford Coppola", "Martin Scorsese",
  "Alfred Hitchcock", "Stanley Kubrick", "Billy Wilder", "Sidney Lumet", "John Ford",
  "Christopher Nolan", "Quentin Tarantino", "James Cameron", "Ridley Scott",
  "Clint Eastwood", "David Fincher",
]);

function familiarScore(director: string, familiar: Familiar): number {
  const known = COMFORT_DIRECTORS.has(director);
  if (familiar === "comfort") return known ? 4 : -1;
  if (familiar === "new")     return known ? -1 : 3;
  return 1;
}

function keywordScore(note: string, keywords: [RegExp, number][]): number {
  return keywords.reduce((s, [rx, w]) => (rx.test(note) ? s + w : s), 0);
}

function jitter(m: CanonMovie): number {
  let h = 5381;
  const s = m.director + m.title;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return (h % 1000) / 10000;
}

export function recommend(answers: Answers): Recommendation {
  const scored = movies.map((m) => {
    const moodS = keywordScore(m.note, MOOD_KEYWORDS[answers.mood]);
    const pacingS = keywordScore(m.note, PACING_KEYWORDS[answers.pacing]);
    const loadS = keywordScore(m.note, LOAD_KEYWORDS[answers.load]);
    const eraS = eraScore(m.year, answers.era);
    const famS = familiarScore(m.director, answers.familiar);
    const score = moodS + pacingS + loadS + eraS + famS + jitter(m);
    return { movie: m, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return {
    pick: scored[0].movie,
    runners: scored.slice(1, 4).map((s) => s.movie),
  };
}

// ---------------------------------------------------------------------------
// Question copy
// ---------------------------------------------------------------------------

export type Choice<T extends string> = { id: T; label: string; hint: string };

export const MOOD_CHOICES: Choice<Mood>[] = [
  { id: "escape",      label: "Pure escape",       hint: "Take me somewhere." },
  { id: "sharp",       label: "Sharp focus",       hint: "I want to think." },
  { id: "grace",       label: "Slow grace",        hint: "Let it breathe." },
  { id: "dark-laughs", label: "Dark laughs",       hint: "Funny and mean." },
  { id: "comfort",     label: "Comfort watch",     hint: "Familiar and warm." },
];

export const ERA_CHOICES: Choice<EraPick>[] = [
  { id: "2010s+",  label: "Modern",        hint: "2010 onward" },
  { id: "90s-00s", label: "90s & 2000s",   hint: "1990 – 2009" },
  { id: "70s-80s", label: "70s & 80s",     hint: "1970 – 1989" },
  { id: "older",   label: "Golden age",    hint: "Before 1970" },
  { id: "any",     label: "Doesn't matter", hint: "Any era" },
];

export const PACING_CHOICES: Choice<Pacing>[] = [
  { id: "quiet",   label: "Quiet",   hint: "Patient, intimate" },
  { id: "steady",  label: "Steady",  hint: "Measured, classical" },
  { id: "kinetic", label: "Kinetic", hint: "Propulsive, fast" },
];

export const LOAD_CHOICES: Choice<Load>[] = [
  { id: "background", label: "Background",        hint: "I'm doing something else" },
  { id: "half",       label: "Half-attention",    hint: "Phone's nearby" },
  { id: "full",       label: "Full attention",    hint: "Lights down" },
  { id: "wrecked",    label: "I want to be wrecked", hint: "Earn the screen" },
];

export const FAMILIAR_CHOICES: Choice<Familiar>[] = [
  { id: "surprise", label: "Surprise me",          hint: "Peter's choice" },
  { id: "new",      label: "Take me somewhere new", hint: "Lesser-traveled" },
  { id: "comfort",  label: "Comfort food",         hint: "A name I'd recognize" },
];
