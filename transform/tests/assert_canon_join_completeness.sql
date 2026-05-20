-- assert_canon_join_completeness
--
-- Fail if more than 50% of canon seed entries could not be matched to a
-- dim_albums row. canon_vs_listening.mb_release_id is null when no MusicBrainz
-- release matched the canon title + artist pair.
--
-- A high miss rate (> 50%) means the MusicBrainz data load is incomplete or
-- the canonical name normalization is broken. We tolerate some misses because
-- a handful of canon entries are compilations that legitimately lack MB records.
--
-- Returns one row per unmatched canon entry, but the test only fires if the
-- unmatched fraction exceeds the 50% threshold.

with unmatched as (

    select
        canon_artist
        , canon_title
        , canon_year
        , mb_release_id
    from {{ ref('canon_vs_listening') }}
    where mb_release_id is null

),

totals as (

    select count(*) as total_canon_rows
    from {{ ref('canon_vs_listening') }}

)

select
    u.canon_artist
    , u.canon_title
    , u.canon_year
    , t.total_canon_rows
    , count(*) over ()          as unmatched_count
from unmatched u
cross join totals t
where (
    select cast(count(*) as double) / nullif(t2.total_canon_rows, 0)
    from unmatched u2
    cross join totals t2
    limit 1
) > 0.5
