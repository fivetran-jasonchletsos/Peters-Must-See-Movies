{{ config(
    materialized='table'
    , cluster_by=['played_at']
) }}

with recently_played as (

    select *
    from {{ ref('stg_spotify__recently_played') }}

),

dim_tracks as (

    select
        mb_recording_id
        , recording_title
        , mb_release_id
        , release_title
        , release_year
        , album_is_canon
        , mb_artist_id
        , artist_name
        , genres_raw
        , artist_country
    from {{ ref('dim_tracks') }}

),

dim_albums as (

    select
        spotify_album_id
        , mb_release_id
        , release_year
        , is_canon
    from {{ ref('dim_albums') }}
    where spotify_album_id is not null

),

-- Join recently_played to dim_tracks via Spotify track_id where available,
-- then fall back to album_id -> dim_albums for the album context.
-- Note: Spotify track_ids won't directly map to MB recording ids without
-- a Spotify<->MB bridge; album_id is the more reliable join key here.
enriched as (

    select
        rp.played_at
        , rp.track_id                                   as spotify_track_id
        , rp.track_name
        , rp.artist_id                                  as spotify_artist_id
        , rp.artist_name
        , rp.album_id                                   as spotify_album_id
        , rp.album_name
        , rp.duration_ms
        , rp.duration_minutes
        , rp.explicit
        , rp.context_type
        , da.mb_release_id
        , da.release_year
        , da.is_canon                                   as album_is_canon
        , rp.loaded_at
    from recently_played rp
    left join dim_albums da
        on rp.album_id = da.spotify_album_id

)

select * from enriched
