{{ config(
    materialized='table'
) }}

with canon as (

    select
        lower(trim(artist))                             as canon_artist_key
        , lower(trim(title))                            as canon_title_key
        , artist                                        as canon_artist
        , title                                         as canon_title
        , cast(year as integer)                         as canon_year
        , note                                          as canon_note
    from {{ ref('canon_albums') }}

),

dim_albums as (

    select
        mb_release_id
        , spotify_album_id
        , release_title
        , artist_name
        , release_year
        , lower(trim(release_title))                    as title_key
        , lower(trim(artist_name))                      as artist_key
    from {{ ref('dim_albums') }}
    where is_canon = true

),

plays as (

    select
        spotify_album_id
        , played_at
        , duration_minutes
    from {{ ref('fct_plays') }}
    where spotify_album_id is not null

),

-- Long-term top-50 albums, derived from top_tracks long_term window grouped to album
long_term_top_tracks as (

    select
        album_id                                        as spotify_album_id
        , count(distinct track_id)                      as tracks_in_top_50_long
    from {{ ref('stg_spotify__top_tracks') }}
    where time_range = 'long_term'
      and rank <= 50
    group by 1

),

-- Play stats per album: last played, 30-day play count
-- "30 days" is relative to the most recent played_at in the dataset
play_stats as (

    select
        spotify_album_id
        , max(played_at)                                as last_played_at
        , count(
            case
                when played_at >= (
                    select date_add('day', -30, max(played_at))
                    from {{ ref('fct_plays') }}
                )
                then 1
            end
        )                                               as play_count_30d
        , sum(duration_minutes)                         as total_play_minutes
    from plays
    group by 1

),

-- Join canon -> dim_albums (to get spotify_album_id) -> play_stats
canon_joined as (

    select
        c.canon_artist
        , c.canon_title
        , c.canon_year
        , c.canon_note
        , da.spotify_album_id
        , da.mb_release_id
        , ps.last_played_at
        , coalesce(ps.play_count_30d, 0)                as play_count_30d
        , ps.total_play_minutes
        , case
            when lt.tracks_in_top_50_long > 0 then true
            else false
          end                                           as in_top_50_long_term
    from canon c
    left join dim_albums da
        on c.canon_title_key = da.title_key
        and c.canon_artist_key = da.artist_key
    left join play_stats ps
        on da.spotify_album_id = ps.spotify_album_id
    left join long_term_top_tracks lt
        on da.spotify_album_id = lt.spotify_album_id

)

select * from canon_joined
