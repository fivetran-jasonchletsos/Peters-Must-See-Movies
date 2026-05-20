"""
MusicBrainz — Fivetran Connector SDK
======================================
Pulls canonical music metadata from the MusicBrainz API (no auth required).

Source: https://musicbrainz.org/doc/MusicBrainz_API

Tables: artists, releases, recordings.

Seed list: the canonical "favorite albums" list lives in the LinerNotes app
at /Users/jason.chletsos/Documents/GitHub/LinerNotes-ODI-Demo/liner-notes-app/src/lib/albums.ts.
That file is the single source of truth for which releases to index. For this
demo the list is parsed from that TypeScript file at sync time; in production
it would be a config input or CSV.

Rate limit: MusicBrainz policy is max 1 request/sec for anonymous access.
We enforce this with a 1.1s sleep between every request. See:
https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting

Incremental: state['last_sync_at'] records the UTC timestamp of the last
successful full pass. On re-runs we still refresh all canon albums (the set
is small — ~90 releases) rather than attempting selective change detection,
which MusicBrainz's API makes impractical for our use case.
"""
from __future__ import annotations

import re
import time
from datetime import datetime, timezone
from typing import Iterator

import requests
from fivetran_connector_sdk import Connector, Operations as op, Logging as log


MB_BASE = "https://musicbrainz.org/ws/2"
HTTP_TIMEOUT = 30
# MusicBrainz requires >= 1 req/sec; 1.1s gives a small buffer.
RATE_SLEEP = 1.1
# Path to the canonical album list — read at sync time.
ALBUMS_TS_PATH = (
    "/Users/jason.chletsos/Documents/GitHub/"
    "LinerNotes-ODI-Demo/liner-notes-app/src/lib/albums.ts"
)


# ---------------------------------------------------------------------------
# HTTP helper — single retry on 429 per MusicBrainz guidelines
# ---------------------------------------------------------------------------

def _get(path: str, params: dict, user_agent: str) -> dict | None:
    url = f"{MB_BASE}/{path}"
    headers = {
        "User-Agent": user_agent,
        "Accept": "application/json",
    }
    params = {**params, "fmt": "json"}

    for attempt in (1, 2):
        try:
            resp = requests.get(url, params=params, headers=headers, timeout=HTTP_TIMEOUT)
        except requests.exceptions.RequestException as exc:
            log.warning(f"Request error {url}: {exc}")
            if attempt == 2:
                return None
            time.sleep(2)
            continue

        if resp.status_code == 429:
            retry_after = int(resp.headers.get("Retry-After", "5"))
            log.warning(f"429 from MusicBrainz, sleeping {retry_after}s")
            time.sleep(retry_after)
            continue
        if resp.status_code == 404:
            log.warning(f"404 not found: {url} params={params}")
            return None
        if resp.status_code >= 400:
            log.warning(f"HTTP {resp.status_code} from MusicBrainz: {resp.text[:200]}")
            return None
        return resp.json()
    return None


# ---------------------------------------------------------------------------
# Seed list parser
# ---------------------------------------------------------------------------

def _parse_albums_ts() -> list[dict]:
    """
    Parse artist/title pairs from albums.ts.

    The TypeScript file is not executed — we extract structured data with a
    simple regex pass over the { artist: "...", title: "..." } object literals.
    This is intentionally fragile-safe: if parsing fails we log a warning and
    return an empty list rather than crashing the sync.
    """
    try:
        with open(ALBUMS_TS_PATH, "r", encoding="utf-8") as fh:
            content = fh.read()
    except OSError as exc:
        log.warning(f"Could not read albums.ts: {exc}")
        return []

    # Match each { artist: "...", title: "...", ... } block.
    # We extract artist and title only; other fields (year, note) are
    # informational and not needed for MusicBrainz lookups.
    pattern = re.compile(
        r'artist:\s*"([^"]+)".*?title:\s*"([^"]+)"',
        re.DOTALL,
    )
    albums = []
    for artist, title in pattern.findall(content):
        albums.append({"artist": artist.strip(), "title": title.strip()})
    log.info(f"Parsed {len(albums)} canon albums from albums.ts")
    return albums


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------

def schema(configuration: dict) -> list[dict]:
    return [
        {
            "table": "artists",
            "primary_key": ["mbid"],
            "columns": {
                "mbid": "STRING",
                "name": "STRING",
                "sort_name": "STRING",
                "country": "STRING",
                "type": "STRING",
                "gender": "STRING",
                "begin_date": "STRING",
                "end_date": "STRING",
                "disambiguation": "STRING",
            },
        },
        {
            "table": "releases",
            "primary_key": ["mbid"],
            "columns": {
                "mbid": "STRING",
                "title": "STRING",
                "artist_mbid": "STRING",
                "artist_name": "STRING",
                "release_date": "STRING",
                "country": "STRING",
                "label": "STRING",
                "packaging": "STRING",
                "status": "STRING",
            },
        },
        {
            "table": "recordings",
            "primary_key": ["mbid"],
            "columns": {
                "mbid": "STRING",
                "title": "STRING",
                "length_ms": "INT",
                "artist_mbid": "STRING",
                "release_mbid": "STRING",
            },
        },
    ]


# ---------------------------------------------------------------------------
# Lookup helpers
# ---------------------------------------------------------------------------

def _search_release(artist: str, title: str, user_agent: str) -> dict | None:
    """
    Search MusicBrainz for a release matching artist + title.

    Returns the best-scoring result's summary dict, or None if no match.
    We ask for inc=artist-credits+labels+recordings to get all the related
    data in one call per release.
    """
    # Lucene query syntax per MusicBrainz search docs.
    query = f'release:"{title}" AND artist:"{artist}"'
    data = _get("release", {"query": query, "limit": 5}, user_agent)
    time.sleep(RATE_SLEEP)
    if not data:
        return None
    releases = data.get("releases") or []
    if not releases:
        log.warning(f"MusicBrainz: no release found for '{title}' by '{artist}'")
        return None
    # The first result is MusicBrainz's highest-scoring match.
    return releases[0]


def _fetch_release_full(mbid: str, user_agent: str) -> dict | None:
    """
    Fetch a full release record by MBID with artist-credits, labels, and recordings.
    """
    data = _get(
        f"release/{mbid}",
        {"inc": "artist-credits labels recordings"},
        user_agent,
    )
    time.sleep(RATE_SLEEP)
    return data


def _fetch_artist(mbid: str, user_agent: str) -> dict | None:
    """Fetch an artist record by MBID."""
    data = _get(f"artist/{mbid}", {}, user_agent)
    time.sleep(RATE_SLEEP)
    return data


def _extract_artist_row(a: dict) -> dict:
    life = a.get("life-span") or {}
    return {
        "mbid": a.get("id", ""),
        "name": a.get("name", ""),
        "sort_name": a.get("sort-name", ""),
        "country": a.get("country", "") or a.get("area", {}).get("iso-3166-1-codes", [""])[0] if a.get("area") else "",
        "type": a.get("type", ""),
        "gender": a.get("gender", "") or "",
        "begin_date": life.get("begin", "") or "",
        "end_date": life.get("end", "") or "",
        "disambiguation": a.get("disambiguation", "") or "",
    }


def _extract_release_row(r: dict, artist_mbid: str, artist_name: str) -> dict:
    label_info = (r.get("label-info") or [{}])[0]
    label = (label_info.get("label") or {}).get("name", "") if label_info else ""
    # release_date may be partial (e.g. "1992" or "1992-10") — store as-is.
    return {
        "mbid": r.get("id", ""),
        "title": r.get("title", ""),
        "artist_mbid": artist_mbid,
        "artist_name": artist_name,
        "release_date": r.get("date", "") or "",
        "country": r.get("country", "") or "",
        "label": label,
        "packaging": r.get("packaging", "") or "",
        "status": r.get("status", "") or "",
    }


def _extract_recording_rows(r: dict, artist_mbid: str) -> Iterator[dict]:
    for medium in r.get("media") or []:
        for track in medium.get("tracks") or []:
            rec = track.get("recording") or {}
            yield {
                "mbid": rec.get("id", ""),
                "title": rec.get("title", "") or track.get("title", ""),
                "length_ms": int(rec.get("length") or track.get("length") or 0),
                "artist_mbid": artist_mbid,
                "release_mbid": r.get("id", ""),
            }


# ---------------------------------------------------------------------------
# update()
# ---------------------------------------------------------------------------

def update(configuration: dict, state: dict):
    user_agent = configuration.get("user_agent")
    if not user_agent:
        raise RuntimeError(
            "configuration.user_agent is required — MusicBrainz requires a "
            "descriptive User-Agent string, e.g. 'LinerNotes/1.0 ( you@example.com )'"
        )

    state = state or {}
    last_sync_at = state.get("last_sync_at", "never")
    log.info(f"MusicBrainz sync starting (last_sync_at={last_sync_at})")

    albums = _parse_albums_ts()
    if not albums:
        log.warning("No albums parsed from albums.ts — nothing to sync")
        return

    seen_artist_mbids: set[str] = set()
    total_releases = 0
    total_recordings = 0
    total_artists = 0

    for album in albums:
        artist_str = album["artist"]
        title_str = album["title"]
        log.info(f"MusicBrainz: searching for '{title_str}' by '{artist_str}'")

        best = _search_release(artist_str, title_str, user_agent)
        if not best:
            continue

        release_mbid = best.get("id")
        if not release_mbid:
            continue

        # Fetch the full release (includes recordings and label info).
        full = _fetch_release_full(release_mbid, user_agent)
        if not full:
            log.warning(f"MusicBrainz: could not fetch full release {release_mbid}")
            continue

        # Resolve artist MBID from artist-credits.
        artist_credits = full.get("artist-credit") or []
        if not artist_credits:
            log.warning(f"MusicBrainz: no artist-credit on release {release_mbid}")
            continue
        artist_obj = artist_credits[0].get("artist") or {}
        artist_mbid = artist_obj.get("id", "")
        artist_name = artist_obj.get("name", artist_str)

        # Upsert release.
        release_row = _extract_release_row(full, artist_mbid, artist_name)
        yield op.upsert("releases", release_row)
        total_releases += 1

        # Upsert recordings (tracks) for this release.
        for rec_row in _extract_recording_rows(full, artist_mbid):
            if rec_row["mbid"]:
                yield op.upsert("recordings", rec_row)
                total_recordings += 1

        # Upsert artist — fetch once per unique MBID to avoid redundant calls.
        if artist_mbid and artist_mbid not in seen_artist_mbids:
            artist_data = _fetch_artist(artist_mbid, user_agent)
            if artist_data:
                yield op.upsert("artists", _extract_artist_row(artist_data))
                total_artists += 1
            seen_artist_mbids.add(artist_mbid)

        # Checkpoint after each album so a partial run preserves progress.
        # We don't update last_sync_at until the full pass completes.
        yield op.checkpoint(state)

    # Mark successful completion.
    state["last_sync_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    yield op.checkpoint(state)
    log.info(
        f"MusicBrainz sync complete — "
        f"releases={total_releases} recordings={total_recordings} artists={total_artists}"
    )


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
connector = Connector(update=update, schema=schema)

if __name__ == "__main__":
    connector.debug()
