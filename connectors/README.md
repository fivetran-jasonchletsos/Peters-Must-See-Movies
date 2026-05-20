# Connectors — LinerNotes-ODI-Demo

Two custom Fivetran Connector SDK pipelines feeding the LinerNotes Open Data
Infrastructure demo. Each lands raw records in the managed lake as Iceberg
tables; dbt models consume them downstream to produce play-history analytics
enriched with canonical music metadata.

| Directory | Source | Auth | Headline tables | Incremental key |
|---|---|---|---|---|
| `spotify/` | Spotify Web API | OAuth refresh_token | recently_played, top_tracks_*, top_artists_*, saved_albums | `last_played_at_ms` (recently_played only; top_* and saved_albums are full refresh) |
| `musicbrainz/` | MusicBrainz API | User-Agent only | artists, releases, recordings | `last_sync_at` (informational; always full refresh) |

## How they fit together

**Spotify** is the behavioral layer: it captures what you actually listen to
(recently_played), what you keep (saved_albums), and how your taste ranks
over different time horizons (top_tracks_*, top_artists_*).

**MusicBrainz** is the canonical metadata layer: it resolves the artist/title
pairs from `liner-notes-app/src/lib/albums.ts` (the curated "favorite albums"
canon) into stable MusicBrainz IDs (MBIDs), and pulls structured data about
each release — label, country, release date, packaging — and every track on it.

The two connectors are designed to be joined in dbt:
- `spotify.saved_albums` + `musicbrainz.releases` — match the user's Spotify
  library against the canon to see which canon albums are saved.
- `spotify.recently_played` + `musicbrainz.recordings` — join via track name
  and artist to count how many times each canon album has been played.
- `musicbrainz.artists` — enrich any artist-level view with biographical
  metadata (country, active years, type).

## Each connector follows the same shape

- `schema(configuration)` — returns table specs with primary keys and column types.
- `update(configuration, state)` — yields `op.upsert(table, row)` and
  `op.checkpoint(state)` via Python generators.
- `connector = Connector(update=update, schema=schema)` at module scope.
- `connector.debug()` under `if __name__ == "__main__":`.

## Running locally

```bash
cd connectors/spotify       # or musicbrainz
cp configuration.json configuration.json   # already a template — edit in place
pip install -r requirements.txt
python connector.py
```

The Fivetran SDK debug runner writes a local `warehouse.db` so you can inspect
emitted records with any SQLite client before deploying.

## Deploying to Fivetran

From each connector directory:

```bash
fivetran deploy \
  --api-key       "$FIVETRAN_API_KEY" \
  --destination   "$FIVETRAN_DESTINATION_NAME" \
  --connection    liner_notes_spotify \   # or liner_notes_musicbrainz
  --configuration configuration.json
```

## Conventions

- HTTP timeout 30s, single retry on HTTP 429.
- Snake_case table and column names.
- `configuration.json` is gitignored — never commit real credentials or
  personal User-Agent email addresses.
- Rate limiting is enforced inside the connector (RATE_SLEEP constants), not
  by external tooling.
- Each connector is self-contained under 300 lines.
