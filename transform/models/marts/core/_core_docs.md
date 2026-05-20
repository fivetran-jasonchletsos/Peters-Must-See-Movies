{% docs dim_albums %}
One row per MusicBrainz "Official" release. This is the central dimension table
for album metadata in the Liner Notes project.

**Grain:** `mb_release_id` — one row per MusicBrainz release MBID.

**Key columns:**
- `mb_release_id` — surrogate primary key sourced from MusicBrainz.
- `is_canon` — boolean flag set to `true` when the release title and artist name
  match an entry in `seeds/canon_albums.csv` (lowercase, trimmed comparison).
- `spotify_album_id` — populated via a fuzzy title+artist join to
  `stg_spotify__saved_albums`. Null when the album is not in the saved-albums library.
- `release_year` — integer extracted from the MusicBrainz date string using
  `SUBSTR(date, 1, 4)`; may be null for undated releases.

**Source mapping:**
- Primary source: `raw_mb.releases` via `stg_mb__releases`.
- Canon enrichment: `seeds/canon_albums.csv` via `{{ ref('canon_albums') }}`.
- Spotify enrichment: `raw_spotify.saved_albums` via `stg_spotify__saved_albums`.

**Downstream consumers:** `dim_tracks`, `fct_plays`, `canon_vs_listening`,
`decade_distribution`.
{% enddocs %}


{% docs dim_artists %}
One row per artist entity. Combines MusicBrainz artist metadata with Spotify
top-artist popularity and genre signals via a full outer join on lowercase artist
name.

**Grain:** `mb_artist_id` — one row per distinct artist. For artists that appear
in Spotify but not in MusicBrainz, `mb_artist_id` is set to the `spotify_artist_id`
as a fallback.

**Key columns:**
- `mb_artist_id` — primary key (MB MBID or Spotify ID as fallback).
- `spotify_popularity` — maximum popularity score across all Spotify time windows.
- `spotify_long_term_rank` — rank in the all-time top-artists list; null if the
  artist does not appear in that window.
- `genres_raw` — comma-separated genre string from Spotify top-artists.

**Source mapping:**
- MusicBrainz side: `raw_mb.artists` via `stg_mb__artists`.
- Spotify side: `raw_spotify.top_artists_*` tables via `stg_spotify__top_artists`.

**Downstream consumers:** `dim_tracks`, `agg_top_artists_by_window`, `fct_plays`
(indirectly via dim_tracks).
{% enddocs %}


{% docs dim_tracks %}
One row per MusicBrainz recording (track), enriched with album and artist context.

**Grain:** `mb_recording_id` — one row per MusicBrainz recording MBID.

**Key columns:**
- `mb_recording_id` — primary key.
- `mb_release_id` — foreign key to `dim_albums`.
- `mb_artist_id` — foreign key to `dim_artists`.
- `album_is_canon` — inherited from `dim_albums.is_canon`; null when no album match.
- `length_ms` / `length_minutes` — track duration from MusicBrainz.

**Source mapping:**
- Primary source: `raw_mb.recordings` via `stg_mb__recordings`.
- Album context: `dim_albums` (left join on `mb_release_id`).
- Artist context: `dim_artists` (left join on `mb_artist_id`).

**Note:** Spotify track IDs are not available in this model. The Spotify recently-
played feed does not expose a reliable bridge to MusicBrainz recording IDs, so
`fct_plays` joins to `dim_albums` on `spotify_album_id` rather than to `dim_tracks`.
{% enddocs %}


{% docs fct_plays %}
One row per Spotify recently-played event. This is the primary fact table for
listening analysis in the Liner Notes project.

**Grain:** `played_at` + `spotify_track_id` — each unique play event from the
Spotify recently-played API.

**Key columns:**
- `played_at` — event timestamp; also the Iceberg partition key (truncated to month).
- `spotify_track_id` — Spotify track ID; not mappable to MusicBrainz without an
  external bridge table.
- `spotify_album_id` — join key to `dim_albums.spotify_album_id`.
- `mb_release_id` — populated via the dim_albums left join; null when no album match.
- `album_is_canon` — whether the played album is in the canon seed.
- `duration_minutes` — used for play-time aggregations in `decade_distribution` and
  `canon_vs_listening`.

**Source mapping:**
- Primary source: `raw_spotify.recently_played` via `stg_spotify__recently_played`.
- Album enrichment: `dim_albums` (left join on `spotify_album_id`).

**Downstream consumers:** `canon_vs_listening`, `decade_distribution`.

**Caveat:** The Spotify recently-played endpoint returns at most 50 events per API
call. History is limited to whatever Fivetran has accumulated across all syncs.
{% enddocs %}
