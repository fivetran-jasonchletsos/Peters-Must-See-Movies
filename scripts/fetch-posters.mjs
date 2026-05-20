#!/usr/bin/env node
/**
 * Fetch movie posters from OMDB for every entry in movies.ts.
 * Writes posters to movies-app/public/posters/<slug>.jpg and a manifest at
 * movies-app/public/posters/manifest.json keyed by the same slug MovieCard uses.
 *
 * Setup:
 *   1. Get a free key: https://www.omdbapi.com/apikey.aspx
 *   2. Put it in movies-app/.env.local as OMDB_API_KEY=xxxxx
 *
 * Run:
 *   node scripts/fetch-posters.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read API key
const envFile = resolve(__dirname, "../movies-app/.env.local");
const env = Object.fromEntries(
  readFileSync(envFile, "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const [k, ...rest] = l.split("=");
      return [k.trim(), rest.join("=").trim()];
    })
);
const API_KEY = env.OMDB_API_KEY;
if (!API_KEY) {
  console.error("Missing OMDB_API_KEY in movies-app/.env.local");
  process.exit(1);
}

// Parse movies.ts
const moviesTs = readFileSync(resolve(__dirname, "../movies-app/src/lib/movies.ts"), "utf8");
const movies = [];
const re = /title:\s*"([^"]+)"[\s\S]*?director:\s*"([^"]+)"[\s\S]*?year:\s*(\d+)/g;
let m;
while ((m = re.exec(moviesTs)) !== null) {
  movies.push({ title: m[1], director: m[2], year: parseInt(m[3], 10) });
}
console.log(`Found ${movies.length} movies in movies.ts`);

// djb2 — must match MovieCard's slug derivation (director + "///" + title)
function djb2(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}
function posterSlug(director, title) {
  return djb2(director + "///" + title).toString(16);
}

// Output paths
const postersDir = resolve(__dirname, "../movies-app/public/posters");
if (!existsSync(postersDir)) mkdirSync(postersDir, { recursive: true });
const manifestPath = resolve(postersDir, "manifest.json");
const manifest = {};

async function searchOmdb(title, year) {
  // Try title + year first, then fall back to title only
  const queries = [
    `t=${encodeURIComponent(title)}&y=${year}`,
    `t=${encodeURIComponent(title)}`,
  ];
  for (const q of queries) {
    const url = `http://www.omdbapi.com/?${q}&apikey=${API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) continue;
    const data = await res.json();
    if (data.Response === "True" && data.Poster && data.Poster !== "N/A") {
      return { posterUrl: data.Poster, imdbId: data.imdbID, raw: data };
    }
  }
  return null;
}

async function downloadImage(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
  return buf.length;
}

async function main() {
  let okCount = 0;
  let missCount = 0;
  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];
    const slug = posterSlug(movie.director, movie.title);
    const dest = resolve(postersDir, `${slug}.jpg`);
    const prefix = `[${(i + 1).toString().padStart(2)}/${movies.length}]`;

    if (existsSync(dest)) {
      console.log(`${prefix} ${movie.title} (${movie.year}) — already cached`);
      manifest[slug] = { found: true, title: movie.title, director: movie.director };
      okCount++;
      continue;
    }

    try {
      const result = await searchOmdb(movie.title, movie.year);
      if (!result) {
        console.log(`${prefix} ${movie.title} (${movie.year}) — NOT FOUND`);
        manifest[slug] = { found: false, title: movie.title, director: movie.director };
        missCount++;
      } else {
        const size = await downloadImage(result.posterUrl, dest);
        const kb = (size / 1024).toFixed(0);
        console.log(`${prefix} ${movie.title} (${movie.year}) — ${kb}KB ${result.imdbId ? `[${result.imdbId}]` : ""}`);
        manifest[slug] = {
          found: true,
          title: movie.title,
          director: movie.director,
          imdbId: result.imdbId,
        };
        okCount++;
      }
    } catch (err) {
      console.log(`${prefix} ${movie.title} (${movie.year}) — ERROR: ${err.message}`);
      manifest[slug] = { found: false, title: movie.title, director: movie.director };
      missCount++;
    }
    // Polite spacing
    await new Promise((r) => setTimeout(r, 250));
  }

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`\n${okCount} found · ${missCount} missing`);
  console.log(`Manifest: ${manifestPath}`);
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
