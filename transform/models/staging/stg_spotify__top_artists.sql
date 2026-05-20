{{ config(materialized='view') }}

-- Unions the three time_range slices from Spotify's top-artists endpoint.

with short_term as (

    select
        cast(artist_id as varchar)                      as artist_id
        , trim(artist_name)                             as artist_name
        , cast(popularity as integer)                   as popularity
        , cast(rank as integer)                         as rank
        , 'short_term'                                  as time_range
        , trim(genres)                                  as genres_raw
        , _fivetran_synced                              as loaded_at
    from {{ source('raw_spotify', 'top_artists_short_term') }}

),

medium_term as (

    select
        cast(artist_id as varchar)                      as artist_id
        , trim(artist_name)                             as artist_name
        , cast(popularity as integer)                   as popularity
        , cast(rank as integer)                         as rank
        , 'medium_term'                                 as time_range
        , trim(genres)                                  as genres_raw
        , _fivetran_synced                              as loaded_at
    from {{ source('raw_spotify', 'top_artists_medium_term') }}

),

long_term as (

    select
        cast(artist_id as varchar)                      as artist_id
        , trim(artist_name)                             as artist_name
        , cast(popularity as integer)                   as popularity
        , cast(rank as integer)                         as rank
        , 'long_term'                                   as time_range
        , trim(genres)                                  as genres_raw
        , _fivetran_synced                              as loaded_at
    from {{ source('raw_spotify', 'top_artists_long_term') }}

),

unioned as (

    select * from short_term
    union all
    select * from medium_term
    union all
    select * from long_term

)

select * from unioned
