{{ config(materialized='view') }}

with source as (

    select *
    from {{ source('raw_mb', 'recordings') }}

),

renamed as (

    select
        cast(id as varchar)                             as mb_recording_id
        , trim(title)                                   as recording_title
        , cast(artist_credit_id as varchar)             as mb_artist_id
        , trim(artist_credit_name)                      as artist_name
        , cast(release_id as varchar)                   as mb_release_id
        , cast(length as bigint)                        as length_ms
        , cast(length as double) / 60000.0              as length_minutes
        , cast(video as boolean)                        as is_video
        , trim(disambiguation)                          as disambiguation
        , _fivetran_synced                              as loaded_at
    from source

)

select * from renamed
