{{ config(materialized='view') }}

with source as (

    select *
    from {{ source('raw_spotify', 'saved_albums') }}

),

renamed as (

    select
        cast(album_id as varchar)                       as album_id
        , trim(album_name)                              as album_name
        , trim(album_type)                              as album_type
        , trim(artist_id)                               as artist_id
        , trim(artist_name)                             as artist_name
        , cast(release_date as varchar)                 as release_date_raw
        , cast(total_tracks as integer)                 as total_tracks
        , cast(added_at as timestamp)                   as added_at
        , trim(label)                                   as label
        , cast(popularity as integer)                   as popularity
        , trim(genres)                                  as genres_raw
        , _fivetran_synced                              as loaded_at
    from source

)

select * from renamed
