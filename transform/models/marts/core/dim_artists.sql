{{ config(
    materialized='table'
    , cluster_by=['mb_artist_id']
) }}

with mb_artists as (

    select *
    from {{ ref('stg_mb__artists') }}

),

-- Take the best popularity score across all time_range windows per Spotify artist
spotify_artists_ranked as (

    select
        artist_id                                       as spotify_artist_id
        , artist_name                                   as spotify_artist_name
        , genres_raw
        , max(popularity)                               as max_popularity
        , max(case when time_range = 'long_term' then rank end)  as long_term_rank
        , max(case when time_range = 'medium_term' then rank end) as medium_term_rank
        , max(case when time_range = 'short_term' then rank end)  as short_term_rank
    from {{ ref('stg_spotify__top_artists') }}
    group by 1, 2, 3

),

-- Fuzzy-friendly join: lowercase + trim both sides for matching
mb_normalized as (

    select
        mb_artist_id
        , artist_name
        , artist_sort_name
        , artist_type
        , country
        , begin_date_raw
        , is_ended
        , disambiguation
        , lower(trim(artist_name))                      as artist_name_key
    from mb_artists

),

spotify_normalized as (

    select
        spotify_artist_id
        , spotify_artist_name
        , genres_raw
        , max_popularity
        , long_term_rank
        , medium_term_rank
        , short_term_rank
        , lower(trim(spotify_artist_name))              as artist_name_key
    from spotify_artists_ranked

),

joined as (

    select
        coalesce(m.mb_artist_id, s.spotify_artist_id)  as mb_artist_id
        , coalesce(m.artist_name, s.spotify_artist_name) as artist_name
        , m.artist_sort_name
        , m.artist_type
        , m.country
        , m.begin_date_raw
        , m.is_ended
        , m.disambiguation
        , s.spotify_artist_id
        , s.genres_raw
        , s.max_popularity                              as spotify_popularity
        , s.long_term_rank                              as spotify_long_term_rank
        , s.medium_term_rank                            as spotify_medium_term_rank
        , s.short_term_rank                             as spotify_short_term_rank
    from mb_normalized m
    full outer join spotify_normalized s
        on m.artist_name_key = s.artist_name_key

)

select * from joined
