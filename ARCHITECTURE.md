# Liner Notes — Architecture

Fivetran ODI demo on a personal music curation site. Two custom connectors pull from
Spotify and MusicBrainz. Data lands in Snowflake. dbt-Snowflake transforms the raw
tables into a clean gold layer. Snowflake Cortex Analyst provides natural-language
query capability over the marts. The Next.js SPA reads a pre-built JSON snapshot off
CloudFront — no hot Snowflake queries at page load time.

---

## Data flow

```
  ┌──────────────────────────────────────────────────────────────────┐
  │  Spotify Web API                                                 │
  │  recently_played · top_tracks · top_artists · saved_tracks       │
  └───────────────────────────────┬──────────────────────────────────┘
                                  │
  ┌──────────────────────────────────────────────────────────────────┐
  │  MusicBrainz API                                                 │
  │  releases · artists · release_groups · labels                    │
  └───────────────────────────────┬──────────────────────────────────┘
                                  │  2 Fivetran Connector SDK connectors
                                  ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │  Snowflake — LINER_NOTES database (raw schemas)                  │
  │    raw_spotify.recently_played                                   │
  │    raw_spotify.top_tracks                                        │
  │    raw_spotify.top_artists                                       │
  │    raw_spotify.saved_tracks                                      │
  │    raw_mb.releases                                               │
  │    raw_mb.artists                                                │
  │    raw_mb.release_groups                                         │
  │    raw_mb.labels                                                 │
  └───────────────────────────────┬──────────────────────────────────┘
                                  │  dbt-Snowflake (silver = views, gold = tables)
                                  ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │  Silver — staging + intermediate conformed models                │
  │    stg_spotify__recently_played                                  │
  │    stg_spotify__top_tracks                                       │
  │    stg_spotify__top_artists                                      │
  │    stg_spotify__saved_tracks                                     │
  │    stg_mb__releases                                              │
  │    stg_mb__artists                                               │
  │    int_canon_enriched  (curated list joined to MB + Spotify)     │
  │    int_play_history_deduped                                      │
  └───────────────────────────────┬──────────────────────────────────┘
                                  │
                                  ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │  Gold — marts + dbt semantic layer (Snowflake tables)            │
  │    marts.dim_albums        — one row per album in the canon      │
  │    marts.dim_artists       — one row per artist                  │
  │    marts.fct_plays         — one row per play event              │
  │    marts.canon             — curated list enriched + scored      │
  │    marts.mart_top_tracks   — aggregated play counts, 3 windows   │
  │    marts.mart_top_artists  — aggregated play counts, 3 windows   │
  │    marts.mart_faves_vs_reality — canon overlap with actual plays │
  │    marts.mart_pipeline_health  — freshness + test status         │
  └──────────────┬─────────────────────────────┬──────────────────────┘
                 │                             │
                 │  Snowflake Cortex Analyst   │  build_snapshot.py
                 ▼                             ▼
  ┌──────────────────────────┐  ┌──────────────────────────────────────┐
  │  /wizard — natural-      │  │  Static JSON on S3 / CloudFront      │
  │  language queries over   │  │  The Canon · Now Spinning · Top      │
  │  the Snowflake gold      │  │  Tracks · Top Artists · Pipeline     │
  │  marts via Cortex        │  └──────────────────────────────────────┘
  └──────────────────────────┘
                                  ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │  liner-notes-app/ — Next.js 14 SPA on AWS CloudFront            │
  │  The Canon · Now Spinning · Most Played · Top Artists            │
  │  Faves vs. Reality · Architecture · Pipeline · AI Wizard         │
  └──────────────────────────────────────────────────────────────────┘
```

---

## What's in Snowflake

### raw_spotify (Snowflake tables, raw schema)

| Table | Grain | Key fields |
|---|---|---|
| `recently_played` | one row per play event | `played_at`, `track_id`, `track_name`, `artist_id`, `album_id`, `duration_ms` |
| `top_tracks` | track × time_range | `track_id`, `track_name`, `artist_id`, `time_range` (short_term / medium_term / long_term), `rank` |
| `top_artists` | artist × time_range | `artist_id`, `artist_name`, `genres`, `time_range`, `rank` |
| `saved_tracks` | one row per saved track | `track_id`, `track_name`, `artist_id`, `album_id`, `added_at` |

### raw_mb (Snowflake tables, raw schema)

| Table | Grain | Key fields |
|---|---|---|
| `releases` | one row per MB release | `mbid`, `title`, `artist_credit`, `date`, `label`, `country`, `release_group_mbid` |
| `artists` | one row per MB artist | `mbid`, `name`, `sort_name`, `type`, `country`, `begin_date` |
| `release_groups` | one row per release group | `mbid`, `title`, `primary_type`, `first_release_date` |
| `labels` | one row per label | `mbid`, `name`, `label_code`, `country` |

The connector pulls MusicBrainz records for albums in the curated canon only — not a full
MB mirror. Lookup is keyed by MBID stored in the `albums.ts` source list in the app.

---

## What dbt produces

### Silver layer (views over raw Snowflake tables)

Staging models rename and type-cast raw columns. No business logic here — just the
field-rename + cast pattern.

- `stg_spotify__recently_played` — parses `played_at` to a proper timestamp, casts
  `duration_ms` to integer, normalizes `artist_id` to the primary artist only.
- `stg_spotify__top_tracks` and `stg_spotify__top_artists` — pivots the `time_range`
  enum into typed columns where useful, enforces rank as integer.
- `stg_mb__releases` — normalizes MBID to lowercase varchar, parses partial dates
  (MB has year-only and year-month records) to a consistent `release_year` integer.
- `int_canon_enriched` — joins the static canon seed (`seeds/canon.csv`) to
  `stg_mb__releases` and `stg_spotify__saved_tracks`. This is the single source of
  truth for "is this album on the list."
- `int_play_history_deduped` — deduplicates `recently_played` on `(played_at, track_id)`.
  The Spotify recently-played endpoint can return duplicate rows on back-to-back syncs.

### Gold layer (Snowflake materialized tables)

| Model | Grain | Purpose |
|---|---|---|
| `dim_albums` | one row per canon album | Album metadata: title, artist, year, label, MB release type, cover art URL (Spotify), canon note |
| `dim_artists` | one row per artist | Name, MB mbid, Spotify artist_id, genres array, nationality |
| `fct_plays` | one row per deduped play event | play timestamp, track, album, artist, duration — append-only, clustered by played_at |
| `canon` | one row per canon album | `dim_albums` extended with: times_played_30d, times_played_6mo, times_played_all_time, last_played_at, is_in_saved_library |
| `mart_top_tracks` | track × time_range | Aggregated play rank and count per time window |
| `mart_top_artists` | artist × time_range | Same for artists |
| `mart_faves_vs_reality` | one row per canon album | Canon album vs. actual play count — the "am I walking the talk" mart |
| `mart_pipeline_health` | one row per pipeline layer | Layer name, last run timestamp, row count, dbt test pass/fail counts, freshness minutes |

### dbt semantic layer metrics

TBD — planned metrics for the semantic layer:

1. `plays_per_day` — rolling 30-day play rate
2. `canon_coverage_rate` — share of canon albums played at least once in the last 90 days
3. `top_track_consistency` — overlap between short_term and long_term top tracks
4. `faves_reality_gap` — mean rank difference between canon position and actual play count

---

## Snowflake Cortex Analyst

Cortex Analyst sits between the Snowflake gold marts and the `/wizard` page. It accepts
natural-language questions, generates SQL against the semantic model defined on the marts,
executes the query in the Snowflake XS warehouse, and returns a structured narrated answer.

No external API calls are required — inference runs inside Snowflake. The same tested mart
columns the rest of the site reads are the source of truth for the AI layer.

---

## What the app reads

The SPA reads static JSON from `liner-notes-app/public/data/`. `build_snapshot.py`
writes these on each deploy. In offline/synthetic mode, `_synthetic.py` generates
them with `seed=42`.

| File | Contents |
|---|---|
| `canon.json` | Full canon list with metadata, cover art, play counts, faves-vs-reality delta |
| `now_spinning.json` | Last 50 recently-played tracks |
| `top_tracks.json` | Top tracks for all three time windows |
| `top_artists.json` | Top artists for all three time windows |
| `pipeline.json` | Pipeline health: layers, last run, test counts |
| `architecture.json` | Table catalog + lineage edges for the `/architecture` page |
| `summary.json` | KPI tiles: total canon albums, total plays, canon coverage rate, days since last listen |

---

## Where deploys happen

### Infrastructure (Terraform)

`infra/` provisions the AWS hosting layer:

- S3 SPA bucket + CloudFront distribution — serves the Next.js static export
- IAM role for the Fivetran service account (Snowflake is the destination — configured
  in the Fivetran dashboard, not provisioned via Terraform here)

Snowflake objects (database, schemas, warehouse, roles) are provisioned separately via
the Snowflake Terraform provider or manually. Estimated Snowflake cost: ~$10-20/month
at demo scale with an XS warehouse set to auto-suspend after 60 seconds.

### dbt

`transform/` — dbt-Snowflake profile in `profiles.yml.example`.
Silver models are views. Gold models materialize as Snowflake tables, clustered where
beneficial (`fct_plays` clustered by `played_at`, `dim_albums` clustered by `album_id`).

Run order: `dbt run --select staging+` on every Fivetran sync completion (GitHub Actions
webhook or a Snowflake task trigger — TBD). Full `dbt run` on schema changes.

### App

`liner-notes-app/` is a Next.js 14 App Router project. Static export (`next export`)
pushed to the SPA S3 bucket + CloudFront invalidation on each deploy.

`scripts/deploy.sh` orchestrates the full chain:
`terraform → fivetran sync → dbt run → build_snapshot.py → next build + export → s3 sync + CF invalidation`

Supports `--skip=infra,fivetran,dbt,snapshot,build,deploy` for partial runs.

---

## Trust boundaries

- Spotify tokens are user-bound OAuth. The connector holds a refresh token in Fivetran's
  encrypted secret store — never in this repo, never in `.tfvars`.
- MusicBrainz is a public API. Rate limit: 1 req/sec per MB policy. The connector
  enforces this with a configurable `rate_limit_sleep` parameter.
- The dbt Snowflake role has write access scoped to the staging and marts schemas only.
  The raw schemas are read-only from the dbt runner's perspective.
- CloudFront serves the SPA from an S3 bucket that has no connection to Snowflake.
  Snowflake credentials are never embedded in the frontend build.
