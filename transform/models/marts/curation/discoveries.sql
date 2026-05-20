{{ config(
    materialized='table'
) }}

-- "Discoveries" = artists appearing in your top-artists (any window) who have
-- no matching entry in the canon seed. This surfaces artists you're actively
-- listening to but haven't curated an album for yet — candidates for new canon additions.
-- Matching is done on lowercase artist name; artists like "Various Artists" are excluded.

with top_artists as (

    select
        artist_id                                       as spotify_artist_id
        , artist_name
        , genres_raw
        , max(popularity)                               as max_popularity
        , min(rank)                                     as best_rank_any_window
        , max(case when time_range = 'long_term' then rank end)  as long_term_rank
        , max(case when time_range = 'medium_term' then rank end) as medium_term_rank
        , max(case when time_range = 'short_term' then rank end)  as short_term_rank
    from {{ ref('stg_spotify__top_artists') }}
    group by 1, 2, 3

),

canon_artists as (

    select distinct
        lower(trim(artist))                             as canon_artist_key
    from {{ ref('canon_albums') }}

),

-- Artists in top_artists that have no match in canon
undiscovered as (

    select
        ta.spotify_artist_id
        , ta.artist_name
        , ta.genres_raw
        , ta.max_popularity
        , ta.best_rank_any_window
        , ta.long_term_rank
        , ta.medium_term_rank
        , ta.short_term_rank
    from top_artists ta
    left join canon_artists ca
        on lower(trim(ta.artist_name)) = ca.canon_artist_key
    where ca.canon_artist_key is null
      -- exclude generic/compilation entries
      and lower(trim(ta.artist_name)) not in ('various artists', 'soundtrack', 'anonymous')

)

select * from undiscovered
order by coalesce(long_term_rank, 999) asc
