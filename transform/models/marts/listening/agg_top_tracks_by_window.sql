{{ config(
    materialized='table'
) }}

with top_tracks as (

    select *
    from {{ ref('stg_spotify__top_tracks') }}

),

-- Rank within each time_range window, deduplicate on track_id + time_range
-- (Spotify can return duplicates if the same track appears via different albums)
deduped as (

    select
        track_id
        , track_name
        , artist_id
        , artist_name
        , album_id
        , album_name
        , duration_ms
        , popularity
        , rank
        , time_range
        , explicit
        , loaded_at
        , row_number() over (
            partition by track_id, time_range
            order by rank asc
        )                                               as dedup_rank
    from top_tracks

),

final as (

    select
        track_id
        , track_name
        , artist_id
        , artist_name
        , album_id
        , album_name
        , duration_ms
        , popularity
        , rank
        , time_range
        , explicit
        , loaded_at
    from deduped
    where dedup_rank = 1

)

select * from final
