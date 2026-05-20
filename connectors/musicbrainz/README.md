# MusicBrainz Connector

Fivetran Connector SDK pipeline that pulls canonical music metadata from
MusicBrainz for the LinerNotes-ODI-Demo. No API key required — MusicBrainz
is a public open-data project. A descriptive `User-Agent` header is required
by their usage policy.

## What it syncs

| Table | PK | Source | Notes |
|---|---|---|---|
| `artists` | `mbid` | `/ws/2/artist/{mbid}` | One row per unique artist in the canon |
| `releases` | `mbid` | `/ws/2/release/{mbid}` | One row per canon album |
| `recordings` | `mbid` | Embedded in release response | All tracks for each canon release |

The connector refreshes all tables on every run. The canon is ~90 albums (~90
release lookups + ~1 artist lookup per unique artist + track data embedded in
release responses), so a full sync takes roughly 3-5 minutes at MusicBrainz's
1 req/sec limit.

## Seed list

The album list comes from:
`liner-notes-app/src/lib/albums.ts`

That file is the single source of truth for which releases to index. The
connector parses it at sync time with a regex pass over the TypeScript object
literals (no TS execution required). To add an album to the data pipeline,
add it to `albums.ts` — no connector changes needed.

## Configuration

Only one field required:

```json
{
  "user_agent": "LinerNotes-ODI-Demo/1.0 ( your@email.com )"
}
```

MusicBrainz's policy: the User-Agent must identify your application and
include a contact address so they can reach you if your client misbehaves.
See https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting.

`configuration.json` is gitignored. The placeholder above is safe to commit
as a template.

## Incremental state

`state['last_sync_at']` records the UTC timestamp of the last completed full
pass. It is informational only — the connector always does a full refresh of
the canon list because MusicBrainz does not expose a change-since endpoint
for our use case, and the dataset is small enough to make this practical.

## Run locally

```bash
cd connectors/musicbrainz
pip install -r requirements.txt
python connector.py
```

The Fivetran SDK debug runner writes a local `warehouse.db` you can inspect
with any SQLite client. Expect the run to take ~5 minutes at the 1 req/sec
rate limit.

## Deploy to Fivetran

```bash
fivetran deploy \
  --api-key       "$FIVETRAN_API_KEY" \
  --destination   "$FIVETRAN_DESTINATION_NAME" \
  --connection    liner_notes_musicbrainz \
  --configuration configuration.json
```

## Destination

Fivetran delivers to Snowflake — specifically the `raw_mb` schema in the
`LINER_NOTES` database. The connector code is destination-agnostic (standard
Fivetran Connector SDK); the destination is configured in the Fivetran dashboard
when deploying.

## ODI angle

Lands as `raw_mb.*` in Snowflake. dbt-Snowflake joins:
- `releases` JOIN Spotify `saved_albums` on normalized artist/title — fills
  in canonical MBIDs for the user's Spotify library.
- `recordings` JOIN Spotify `recently_played` via track name + artist MBID
  for listen-count-by-canon-release rollups.
- `artists` provides enrichment columns (country, begin_date, type) for any
  artist-level analytics.
