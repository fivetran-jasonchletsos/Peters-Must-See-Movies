{{ config(materialized='view') }}

-- Unions the three time_range slices from Spotify's top-tracks endpoint.
-- Each slice is a separate Fivetran table; rank and time_range are preserved
-- so downstream models can filter or pivot by window.

with short_term as (

    select
        cast(track_id as varchar)                       as track_id
        , trim(track_name)                              as track_name
        , trim(artist_id)                               as artist_id
        , trim(artist_name)                             as artist_name
        , trim(album_id)                                as album_id
        , trim(album_name)                              as album_name
        , cast(duration_ms as bigint)                   as duration_ms
        , cast(popularity as integer)                   as popularity
        , cast(rank as integer)                         as rank
        , 'short_term'                                  as time_range
        , cast(explicit as boolean)                     as explicit
        , _fivetran_synced                              as loaded_at
    from {{ source('raw_spotify', 'top_tracks_short_term') }}

),

medium_term as (

    select
        cast(track_id as varchar)                       as track_id
        , trim(track_name)                              as track_name
        , trim(artist_id)                               as artist_id
        , trim(artist_name)                             as artist_name
        , trim(album_id)                                as album_id
        , trim(album_name)                              as album_name
        , cast(duration_ms as bigint)                   as duration_ms
        , cast(popularity as integer)                   as popularity
        , cast(rank as integer)                         as rank
        , 'medium_term'                                 as time_range
        , cast(explicit as boolean)                     as explicit
        , _fivetran_synced                              as loaded_at
    from {{ source('raw_spotify', 'top_tracks_medium_term') }}

),

long_term as (

    select
        cast(track_id as varchar)                       as track_id
        , trim(track_name)                              as track_name
        , trim(artist_id)                               as artist_id
        , trim(artist_name)                             as artist_name
        , trim(album_id)                                as album_id
        , trim(album_name)                              as album_name
        , cast(duration_ms as bigint)                   as duration_ms
        , cast(popularity as integer)                   as popularity
        , cast(rank as integer)                         as rank
        , 'long_term'                                   as time_range
        , cast(explicit as boolean)                     as explicit
        , _fivetran_synced                              as loaded_at
    from {{ source('raw_spotify', 'top_tracks_long_term') }}

),

unioned as (

    select * from short_term
    union all
    select * from medium_term
    union all
    select * from long_term

)

select * from unioned
