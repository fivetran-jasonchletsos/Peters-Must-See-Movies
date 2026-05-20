# LinerNotes dbt Transform

dbt project that turns raw Spotify and MusicBrainz data (landed by Fivetran into Snowflake) into analytics-ready Snowflake tables.

## Setup

**Prerequisites:** Python 3.9+, dbt-snowflake, Snowflake credentials configured.

```bash
pip install dbt-snowflake
cd transform
cp profiles.yml.example profiles.yml   # fill in your env vars (or export them)
dbt deps                                # installs dbt_utils
```

Environment variables used by `profiles.yml.example`:

- `SNOWFLAKE_ACCOUNT` — e.g. `xy12345.us-east-1`
- `SNOWFLAKE_USER` — Snowflake username for the dbt runner
- `SNOWFLAKE_PASSWORD` — password (or use key-pair auth)
- `SNOWFLAKE_ROLE` — e.g. `LINER_NOTES_DBT_ROLE`
- `SNOWFLAKE_WAREHOUSE` — e.g. `LINER_NOTES_WH` (XS, auto-suspend recommended)
- `SNOWFLAKE_DATABASE` — e.g. `LINER_NOTES`
- `SNOWFLAKE_SCHEMA` — default schema (overridden per layer in dbt_project.yml)

## Running

```bash
# Full build
dbt run

# Staging layer only
dbt run --select staging

# Mart layer only
dbt run --select marts

# Seeds (canon album list)
dbt seed

# Tests
dbt test
```

## Layer overview

### seeds/

`canon_albums.csv` — Jason's curated list of 96 albums. Loaded as a static Snowflake table. The curation marts join against this to compare taste against listening behavior.

### models/staging/

Views over raw source tables. One model per source table. Responsibilities:

- Cast columns to correct types (timestamps, integers, booleans)
- Rename to snake_case
- No business logic

Sources declared in `_sources.yml`:

- `raw_spotify` — recently_played, top_tracks (three windows), top_artists (three windows), saved_albums
- `raw_mb` — artists, releases, recordings

### models/marts/

Snowflake materialized tables. Split into three sub-schemas:

**core/** — dimension tables shared across all downstream marts. Clustered by primary key.

- `dim_artists` — one row per artist, full outer join of MB and Spotify top-artists on lowercase name
- `dim_albums` — one row per official MB release, with `is_canon` flag and `canon_note` from the seed
- `dim_tracks` — one row per MB recording with album and artist context

**listening/** — play activity and Spotify charts. `fct_plays` clustered by `played_at`.

- `fct_plays` — one row per recently-played event, joined to `dim_albums` for release year and canon flag
- `agg_top_tracks_by_window` — deduped top tracks per Spotify time window (short/medium/long term)
- `agg_top_artists_by_window` — deduped top artists per Spotify time window, joined to `dim_artists`

**curation/** — answers about taste vs. canon.

- `canon_vs_listening` — for every canon album: last played, 30-day play count, whether it appears in the long-term top-50 tracks
- `discoveries` — top artists from Spotify listening that have no canon entry (artists you play but haven't curated)
- `decade_distribution` — play minutes and canon album counts by decade, with percentage shares for comparison

## Notes

- The Spotify recently_played API returns only the last 50 events. `fct_plays` reflects that window; `play_count_30d` in `canon_vs_listening` is accurate only if Fivetran syncs frequently enough to capture all plays.
- Artist matching between Spotify and MusicBrainz uses lowercase exact name match. Aliases and alternate spellings will produce unmatched rows. A Spotify-to-MB MBID bridge table would improve accuracy.
- Gold models use `cluster_by` (Snowflake) rather than `partitioned_by`. Snowflake handles micro-partitioning automatically; `cluster_by` is a pruning hint for range-based queries on `played_at` and primary key columns.
