{{ config(
    materialized='table'
) }}

-- Compares two distributions:
--   canon_pct   — share of canon albums released in each decade
--   play_pct    — share of total play minutes from albums whose release_year falls in each decade
-- Useful for spotting mismatches: e.g. heavy '90s listening vs a canon that skews '00s.

with plays as (

    select
        duration_minutes
        , release_year
    from {{ ref('fct_plays') }}
    where release_year is not null

),

canon as (

    select
        cast(year as integer)                           as release_year
    from {{ ref('canon_albums') }}

),

-- Assign decade bucket
plays_with_decade as (

    select
        duration_minutes
        , (release_year / 10) * 10                     as decade
    from plays

),

canon_with_decade as (

    select
        release_year
        , (release_year / 10) * 10                     as decade
    from canon

),

play_by_decade as (

    select
        decade
        , sum(duration_minutes)                         as total_play_minutes
    from plays_with_decade
    group by 1

),

canon_by_decade as (

    select
        decade
        , count(*)                                      as canon_album_count
    from canon_with_decade
    group by 1

),

-- Full outer join to include decades that appear in only one side
joined as (

    select
        coalesce(p.decade, c.decade)                    as decade
        , coalesce(p.total_play_minutes, 0.0)           as total_play_minutes
        , coalesce(c.canon_album_count, 0)              as canon_album_count
    from play_by_decade p
    full outer join canon_by_decade c
        on p.decade = c.decade

),

totals as (

    select
        sum(total_play_minutes)                         as grand_total_play_minutes
        , sum(canon_album_count)                        as grand_total_canon_albums
    from joined

),

final as (

    select
        j.decade
        , j.total_play_minutes
        , j.canon_album_count
        , round(
            j.total_play_minutes / nullif(t.grand_total_play_minutes, 0) * 100
          , 1)                                          as play_pct
        , round(
            cast(j.canon_album_count as double) / nullif(t.grand_total_canon_albums, 0) * 100
          , 1)                                          as canon_pct
        , t.grand_total_play_minutes
        , t.grand_total_canon_albums
    from joined j
    cross join totals t

)

select * from final
order by decade asc
