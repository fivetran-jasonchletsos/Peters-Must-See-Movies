import { movies, type CanonMovie } from "./movies";

// Deterministic, URL-safe hash. Must match Hero.tsx and Film page.
function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

export function movieSlug(director: string, title: string): string {
  return djb2(director + "###" + title).toString(16);
}

export function findMovieBySlug(slug: string): CanonMovie | undefined {
  return movies.find((a) => movieSlug(a.director, a.title) === slug);
}

export function allMovieSlugs(): string[] {
  return movies.map((a) => movieSlug(a.director, a.title));
}
