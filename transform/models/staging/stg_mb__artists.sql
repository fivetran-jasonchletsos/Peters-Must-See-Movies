{{ config(materialized='view') }}

with source as (

    select *
    from {{ source('raw_mb', 'artists') }}

),

renamed as (

    select
        cast(id as varchar)                             as mb_artist_id
        , trim(name)                                    as artist_name
        , trim(sort_name)                               as artist_sort_name
        , trim(type)                                    as artist_type
        , trim(country)                                 as country
        , cast(begin_date as varchar)                   as begin_date_raw
        , cast(end_date as varchar)                     as end_date_raw
        , cast(ended as boolean)                        as is_ended
        , trim(disambiguation)                          as disambiguation
        , cast(score as integer)                        as search_score
        , _fivetran_synced                              as loaded_at
    from source

)

select * from renamed
