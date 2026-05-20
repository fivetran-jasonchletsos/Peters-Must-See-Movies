{{ config(
    materialized='table'
) }}

with top_artists as (

    select *
    from {{ ref('stg_spotify__top_artists') }}

),

dim_artists as (

    select
        mb_artist_id
        , artist_name
        , artist_type
        , country
        , genres_raw                                    as mb_genres_raw
        , is_ended
    from {{ ref('dim_artists') }}

),

-- Deduplicate within each time_range (same artist can appear via different spelling)
deduped as (

    select
        artist_id
        , artist_name
        , popularity
        , rank
        , time_range
        , genres_raw
        , loaded_at
        , row_number() over (
            partition by artist_id, time_range
            order by rank asc
        )                                               as dedup_rank
    from top_artists

),

enriched as (

    select
        d.artist_id                                     as spotify_artist_id
        , d.artist_name
        , d.popularity                                  as spotify_popularity
        , d.rank
        , d.time_range
        , d.genres_raw                                  as spotify_genres_raw
        , da.mb_artist_id
        , da.artist_type
        , da.country
        , da.mb_genres_raw
        , da.is_ended
        , d.loaded_at
    from deduped d
    left join dim_artists da
        on lower(trim(d.artist_name)) = lower(trim(da.artist_name))
    where d.dedup_rank = 1

)

select * from enriched
