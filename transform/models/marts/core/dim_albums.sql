{{ config(
    materialized='table'
    , cluster_by=['release_year']
) }}

with mb_releases as (

    select *
    from {{ ref('stg_mb__releases') }}

),

saved_albums as (

    select *
    from {{ ref('stg_spotify__saved_albums') }}

),

canon as (

    select
        lower(trim(artist))                             as canon_artist_key
        , lower(trim(title))                            as canon_title_key
        , artist                                        as canon_artist
        , title                                         as canon_title
        , cast(year as integer)                         as canon_year
        , note                                          as canon_note
    from {{ ref('canon_albums') }}

),

-- Normalize MB releases for join
mb_normalized as (

    select
        mb_release_id
        , release_title
        , mb_artist_id
        , artist_name
        , release_status
        , release_date_raw
        , release_year
        , country
        , label
        , track_count
        , lower(trim(release_title))                    as title_key
        , lower(trim(artist_name))                      as artist_key
    from mb_releases
    where release_status = 'Official'

),

-- Flag canon albums using lowercase title + artist key
mb_with_canon as (

    select
        m.mb_release_id
        , m.release_title
        , m.mb_artist_id
        , m.artist_name
        , m.release_status
        , m.release_date_raw
        , m.release_year
        , m.country
        , m.label
        , m.track_count
        , case when c.canon_title_key is not null then true else false end as is_canon
        , c.canon_note
    from mb_normalized m
    left join canon c
        on m.title_key = c.canon_title_key
        and m.artist_key = c.canon_artist_key

),

-- Attach Spotify saved-album metadata
spotify_saved_normalized as (

    select
        album_id                                        as spotify_album_id
        , album_name
        , artist_name
        , popularity
        , added_at
        , total_tracks
        , lower(trim(album_name))                       as title_key
        , lower(trim(artist_name))                      as artist_key
    from saved_albums

),

final as (

    select
        m.mb_release_id
        , m.release_title
        , m.mb_artist_id
        , m.artist_name
        , m.release_year
        , m.release_date_raw
        , m.country
        , m.label
        , m.track_count
        , m.is_canon
        , m.canon_note
        , s.spotify_album_id
        , s.popularity                                  as spotify_popularity
        , s.added_at                                    as spotify_saved_at
    from mb_with_canon m
    left join spotify_saved_normalized s
        on m.title_key = s.title_key
        and m.artist_key = s.artist_key

)

select * from final
