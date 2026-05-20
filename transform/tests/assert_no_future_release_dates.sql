-- assert_no_future_release_dates
--
-- Fail if any dim_albums row has a release_year that is greater than the
-- current calendar year. A future release_year most likely indicates a bad
-- SUBSTR parse on the MusicBrainz date string (e.g. a date field storing
-- something other than YYYY-...) rather than a legitimately future release.
--
-- Returns rows that violate the assertion; dbt will mark the test as failed
-- if this query returns any rows.

select
    mb_release_id
    , release_title
    , artist_name
    , release_year
    , release_date_raw
from {{ ref('dim_albums') }}
where release_year is not null
  and release_year > year(current_date)
