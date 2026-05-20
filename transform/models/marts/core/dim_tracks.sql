{{ config(
    materialized='table'
    , cluster_by=['mb_recording_id']
) }}

with recordings as (

    select *
    from {{ ref('stg_mb__recordings') }}

),

albums as (

    select
        mb_release_id
        , release_title
        , release_year
        , is_canon
    from {{ ref('dim_albums') }}

),

artists as (

    select
        mb_artist_id
        , artist_name
        , country
        , artist_type
        , genres_raw
        , spotify_popularity
    from {{ ref('dim_artists') }}

),

joined as (

    select
        r.mb_recording_id
        , r.recording_title
        , r.mb_artist_id
        , r.artist_name
        , r.mb_release_id
        , r.length_ms
        , r.length_minutes
        , r.is_video
        , r.disambiguation
        , al.release_title
        , al.release_year
        , al.is_canon                                   as album_is_canon
        , ar.country                                    as artist_country
        , ar.artist_type
        , ar.genres_raw
        , ar.spotify_popularity                         as artist_spotify_popularity
    from recordings r
    left join albums al
        on r.mb_release_id = al.mb_release_id
    left join artists ar
        on r.mb_artist_id = ar.mb_artist_id

)

select * from joined
