{{ config(materialized='view') }}

with source as (

    select *
    from {{ source('raw_mb', 'releases') }}

),

renamed as (

    select
        cast(id as varchar)                             as mb_release_id
        , trim(title)                                   as release_title
        , cast(artist_credit_id as varchar)             as mb_artist_id
        , trim(artist_credit_name)                      as artist_name
        , trim(status)                                  as release_status
        , cast(date as varchar)                         as release_date_raw
        -- extract 4-digit year from the MB date string (YYYY, YYYY-MM, or YYYY-MM-DD)
        , try_cast(substr(cast(date as varchar), 1, 4) as integer) as release_year
        , trim(country)                                 as country
        , trim(packaging)                               as packaging
        , cast(track_count as integer)                  as track_count
        , trim(label)                                   as label
        , trim(barcode)                                 as barcode
        , trim(asin)                                    as asin
        , trim(disambiguation)                          as disambiguation
        , _fivetran_synced                              as loaded_at
    from source

)

select * from renamed
