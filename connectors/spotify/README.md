# Spotify Connector

Fivetran Connector SDK pipeline that pulls personal listening data from the
Spotify Web API for the LinerNotes-ODI-Demo.

## What it syncs

| Table | PK | Source endpoint | Sync mode |
|---|---|---|---|
| `recently_played` | `played_at` | `/me/player/recently-played` | Incremental (cursor) |
| `top_tracks_short` | `track_id` | `/me/top/tracks?time_range=short_term` | Full refresh |
| `top_tracks_medium` | `track_id` | `/me/top/tracks?time_range=medium_term` | Full refresh |
| `top_tracks_long` | `track_id` | `/me/top/tracks?time_range=long_term` | Full refresh |
| `top_artists_short` | `artist_id` | `/me/top/artists?time_range=short_term` | Full refresh |
| `top_artists_medium` | `artist_id` | `/me/top/artists?time_range=medium_term` | Full refresh |
| `top_artists_long` | `artist_id` | `/me/top/artists?time_range=long_term` | Full refresh |
| `saved_albums` | `album_id` | `/me/albums` | Full refresh |

`recently_played` is incremental: `state['last_played_at_ms']` holds the Unix
millisecond timestamp of the latest play event seen. Each sync passes that
value as the `after` cursor so only new events are fetched. The top_* and
saved_albums tables are small enough to full-refresh every run.

## Configuration

Requires a Spotify app and a refresh token with the following scopes:
`user-read-recently-played`, `user-top-read`, `user-library-read`.

### Step 1: Create a Spotify app

1. Go to https://developer.spotify.com/dashboard and create a new app.
2. Note the **Client ID** and **Client Secret**.
3. Add `http://localhost:8888/callback` as a Redirect URI in the app settings.

### Step 2: Obtain a refresh token

Spotify's Authorization Code flow requires a one-time browser exchange to get
a code, which is then traded for tokens.

```bash
# Replace CLIENT_ID and the scope list if needed.
open "https://accounts.spotify.com/authorize?response_type=code&client_id=CLIENT_ID&scope=user-read-recently-played%20user-top-read%20user-library-read&redirect_uri=http%3A%2F%2Flocalhost%3A8888%2Fcallback"
```

After authorizing, Spotify redirects to `http://localhost:8888/callback?code=<CODE>`.
Copy the `code` value from the URL, then:

```bash
curl -X POST https://accounts.spotify.com/api/token \
  -u "CLIENT_ID:CLIENT_SECRET" \
  -d "grant_type=authorization_code&code=CODE&redirect_uri=http%3A%2F%2Flocalhost%3A8888%2Fcallback"
```

The response contains `refresh_token`. Store it in `configuration.json`. The
connector uses this to obtain a fresh `access_token` on every sync — no manual
token renewal needed.

### configuration.json

```json
{
  "client_id": "REPLACE_WITH_SPOTIFY_CLIENT_ID",
  "client_secret": "REPLACE_WITH_SPOTIFY_CLIENT_SECRET",
  "refresh_token": "REPLACE_WITH_SPOTIFY_REFRESH_TOKEN"
}
```

`configuration.json` is gitignored. Never commit real credentials.

## Run locally

```bash
cd connectors/spotify
pip install -r requirements.txt
python connector.py
```

The Fivetran SDK debug runner writes a local `warehouse.db` you can inspect
with any SQLite client before deploying.

## Deploy to Fivetran

```bash
fivetran deploy \
  --api-key       "$FIVETRAN_API_KEY" \
  --destination   "$FIVETRAN_DESTINATION_NAME" \
  --connection    liner_notes_spotify \
  --configuration configuration.json
```

## Destination

Fivetran delivers to Snowflake — specifically the `raw_spotify` schema in the
`LINER_NOTES` database. The connector code is destination-agnostic (standard
Fivetran Connector SDK); the destination is configured in the Fivetran dashboard
when deploying.

## ODI angle

Lands as `raw_spotify.*` tables in Snowflake. dbt-Snowflake models join
`recently_played` against MusicBrainz `recordings` and `releases` for
canonical metadata enrichment, and against `saved_albums` to flag plays that
are from canon albums vs. discovery listening.
