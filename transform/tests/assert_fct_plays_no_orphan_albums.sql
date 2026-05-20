-- assert_fct_plays_no_orphan_albums
--
-- Fail if any fct_plays row carries a spotify_album_id that does NOT appear
-- in dim_albums.spotify_album_id. This would mean fct_plays references an
-- album that was never loaded into dim_albums, which would cause NULL mb_release_id
-- on every play for that album and silently drop it from decade_distribution.
--
-- We restrict to rows where spotify_album_id is not null — a null album_id
-- simply means the Spotify recently-played event had no album context (e.g.
-- a local file play), which is expected and acceptable.
--
-- Returns one row per distinct orphan spotify_album_id found in fct_plays.

select distinct
    fp.spotify_album_id
    , count(*) over (partition by fp.spotify_album_id) as orphan_play_count
from {{ ref('fct_plays') }} fp
left join {{ ref('dim_albums') }} da
    on fp.spotify_album_id = da.spotify_album_id
where fp.spotify_album_id is not null
  and da.spotify_album_id is null
