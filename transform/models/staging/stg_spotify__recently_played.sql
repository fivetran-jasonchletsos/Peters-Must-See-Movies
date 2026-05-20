{{ config(materialized='view') }}

with source as (

    select *
    from {{ source('raw_spotify', 'recently_played') }}

),

renamed as (

    select
        cast(played_at as timestamp)                    as played_at
        , cast(track_id as varchar)                     as track_id
        , trim(track_name)                              as track_name
        , trim(artist_id)                               as artist_id
        , trim(artist_name)                             as artist_name
        , trim(album_id)                                as album_id
        , trim(album_name)                              as album_name
        , cast(duration_ms as bigint)                   as duration_ms
        , cast(duration_ms as double) / 60000.0         as duration_minutes
        , cast(explicit as boolean)                     as explicit
        , trim(context_type)                            as context_type
        , trim(context_uri)                             as context_uri
        , _fivetran_synced                              as loaded_at
    from source

)

select * from renamed
