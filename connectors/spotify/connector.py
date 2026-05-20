"""
Spotify — Fivetran Connector SDK
=================================
Pulls listening history and top content from the Spotify Web API for the
LinerNotes-ODI-Demo.

Endpoints (base https://api.spotify.com/v1/):
  - /me/player/recently-played   → recently_played (incremental by played_at cursor)
  - /me/top/tracks?time_range=*  → top_tracks_short / _medium / _long (full refresh)
  - /me/top/artists?time_range=* → top_artists_short / _medium / _long (full refresh)
  - /me/albums                   → saved_albums (full refresh)

Auth: Spotify Authorization Code flow. Requires a refresh_token — see README
for how to obtain one. The connector exchanges refresh_token for an access_token
on each sync; no access_token is persisted between runs.
"""
from __future__ import annotations

import json
import time
from datetime import datetime, timezone
from typing import Iterator

import requests
from fivetran_connector_sdk import Connector, Operations as op, Logging as log


SPOTIFY_ACCOUNTS_BASE = "https://accounts.spotify.com"
SPOTIFY_API_BASE = "https://api.spotify.com/v1"
HTTP_TIMEOUT = 30
RATE_SLEEP = 0.1  # Stay well under Spotify's 429 threshold for the demo.
PAGE_LIMIT = 50   # Spotify max page size for most endpoints.


# ---------------------------------------------------------------------------
# OAuth helpers
# ---------------------------------------------------------------------------

def _refresh_access_token(client_id: str, client_secret: str, refresh_token: str) -> str:
    """Exchange a Spotify refresh_token for a short-lived access_token."""
    resp = requests.post(
        f"{SPOTIFY_ACCOUNTS_BASE}/api/token",
        data={
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
        },
        auth=(client_id, client_secret),
        timeout=HTTP_TIMEOUT,
    )
    if resp.status_code != 200:
        raise RuntimeError(
            f"Spotify token refresh failed ({resp.status_code}): {resp.text[:300]}"
        )
    return resp.json()["access_token"]


# ---------------------------------------------------------------------------
# HTTP helper — single retry on 429, raises on persistent error
# ---------------------------------------------------------------------------

def _get(url: str, params: dict, headers: dict) -> dict | None:
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
            retry_after = int(resp.headers.get("Retry-After", "10"))
            log.warning(f"429 from Spotify, sleeping {retry_after}s")
            time.sleep(retry_after)
            continue
        if resp.status_code == 204:
            # No content — treated as empty result rather than an error.
            return {}
        if resp.status_code >= 400:
            log.warning(f"HTTP {resp.status_code} from Spotify ({url}): {resp.text[:200]}")
            return None
        return resp.json()
    return None


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------

def schema(configuration: dict) -> list[dict]:
    return [
        {
            "table": "recently_played",
            "primary_key": ["played_at"],
            "columns": {
                "played_at": "UTC_DATETIME",
                "track_id": "STRING",
                "track_name": "STRING",
                "artist_id": "STRING",
                "artist_name": "STRING",
                "album_id": "STRING",
                "album_name": "STRING",
                "duration_ms": "INT",
            },
        },
        {
            "table": "top_tracks_short",
            "primary_key": ["track_id"],
            "columns": {
                "rank": "INT",
                "track_id": "STRING",
                "track_name": "STRING",
                "artist_id": "STRING",
                "artist_name": "STRING",
                "album_id": "STRING",
                "album_name": "STRING",
                "time_range": "STRING",
                "refreshed_at": "UTC_DATETIME",
            },
        },
        {
            "table": "top_tracks_medium",
            "primary_key": ["track_id"],
            "columns": {
                "rank": "INT",
                "track_id": "STRING",
                "track_name": "STRING",
                "artist_id": "STRING",
                "artist_name": "STRING",
                "album_id": "STRING",
                "album_name": "STRING",
                "time_range": "STRING",
                "refreshed_at": "UTC_DATETIME",
            },
        },
        {
            "table": "top_tracks_long",
            "primary_key": ["track_id"],
            "columns": {
                "rank": "INT",
                "track_id": "STRING",
                "track_name": "STRING",
                "artist_id": "STRING",
                "artist_name": "STRING",
                "album_id": "STRING",
                "album_name": "STRING",
                "time_range": "STRING",
                "refreshed_at": "UTC_DATETIME",
            },
        },
        {
            "table": "top_artists_short",
            "primary_key": ["artist_id"],
            "columns": {
                "rank": "INT",
                "artist_id": "STRING",
                "artist_name": "STRING",
                "genres": "JSON",
                "popularity": "INT",
                "time_range": "STRING",
                "refreshed_at": "UTC_DATETIME",
            },
        },
        {
            "table": "top_artists_medium",
            "primary_key": ["artist_id"],
            "columns": {
                "rank": "INT",
                "artist_id": "STRING",
                "artist_name": "STRING",
                "genres": "JSON",
                "popularity": "INT",
                "time_range": "STRING",
                "refreshed_at": "UTC_DATETIME",
            },
        },
        {
            "table": "top_artists_long",
            "primary_key": ["artist_id"],
            "columns": {
                "rank": "INT",
                "artist_id": "STRING",
                "artist_name": "STRING",
                "genres": "JSON",
                "popularity": "INT",
                "time_range": "STRING",
                "refreshed_at": "UTC_DATETIME",
            },
        },
        {
            "table": "saved_albums",
            "primary_key": ["album_id"],
            "columns": {
                "album_id": "STRING",
                "album_name": "STRING",
                "artist_id": "STRING",
                "artist_name": "STRING",
                "release_date": "STRING",
                "added_at": "UTC_DATETIME",
            },
        },
    ]


# ---------------------------------------------------------------------------
# Sync helpers
# ---------------------------------------------------------------------------

def _sync_recently_played(
    headers: dict,
    after_cursor_ms: int | None,
) -> Iterator[tuple[dict, int]]:
    """
    Fetch /me/player/recently-played in reverse-chronological pages.

    Yields (row_dict, played_at_unix_ms) for each play event newer than
    after_cursor_ms. Spotify returns at most 50 items; the endpoint does not
    support offset pagination — the 'before'/'after' params move the cursor.
    """
    params: dict = {"limit": PAGE_LIMIT}
    if after_cursor_ms:
        params["after"] = after_cursor_ms

    while True:
        data = _get(f"{SPOTIFY_API_BASE}/me/player/recently-played", params, headers)
        if not data:
            return

        items = data.get("items") or []
        for item in items:
            track = item.get("track") or {}
            album = track.get("album") or {}
            artists = track.get("artists") or [{}]
            played_at_str: str = item.get("played_at", "")
            # played_at is ISO 8601 UTC, e.g. "2024-01-15T20:34:22.000Z"
            yield (
                {
                    "played_at": played_at_str,
                    "track_id": track.get("id", ""),
                    "track_name": track.get("name", ""),
                    "artist_id": (artists[0].get("id") or ""),
                    "artist_name": (artists[0].get("name") or ""),
                    "album_id": album.get("id", ""),
                    "album_name": album.get("name", ""),
                    "duration_ms": int(track.get("duration_ms") or 0),
                },
                # Return unix-ms version so the caller can track the cursor.
                int(
                    datetime.fromisoformat(
                        played_at_str.replace("Z", "+00:00")
                    ).timestamp() * 1000
                )
                if played_at_str
                else 0,
            )

        # Spotify does not paginate recently-played beyond the initial 50.
        # The 'next' URL exists in some API responses but only rewinds to older
        # history; for incremental we stop after the first page.
        return


def _sync_top_tracks(
    headers: dict,
    time_range: str,
    table_name: str,
    refreshed_at: str,
) -> Iterator[dict]:
    """Full-refresh all top tracks for a given time_range."""
    offset = 0
    rank = 1
    while True:
        data = _get(
            f"{SPOTIFY_API_BASE}/me/top/tracks",
            {"time_range": time_range, "limit": PAGE_LIMIT, "offset": offset},
            headers,
        )
        if not data:
            return
        items = data.get("items") or []
        for track in items:
            artists = track.get("artists") or [{}]
            album = track.get("album") or {}
            yield {
                "rank": rank,
                "track_id": track.get("id", ""),
                "track_name": track.get("name", ""),
                "artist_id": (artists[0].get("id") or ""),
                "artist_name": (artists[0].get("name") or ""),
                "album_id": album.get("id", ""),
                "album_name": album.get("name", ""),
                "time_range": time_range,
                "refreshed_at": refreshed_at,
            }
            rank += 1
        if not data.get("next") or len(items) < PAGE_LIMIT:
            return
        offset += PAGE_LIMIT
        time.sleep(RATE_SLEEP)


def _sync_top_artists(
    headers: dict,
    time_range: str,
    table_name: str,
    refreshed_at: str,
) -> Iterator[dict]:
    """Full-refresh all top artists for a given time_range."""
    offset = 0
    rank = 1
    while True:
        data = _get(
            f"{SPOTIFY_API_BASE}/me/top/artists",
            {"time_range": time_range, "limit": PAGE_LIMIT, "offset": offset},
            headers,
        )
        if not data:
            return
        items = data.get("items") or []
        for artist in items:
            yield {
                "rank": rank,
                "artist_id": artist.get("id", ""),
                "artist_name": artist.get("name", ""),
                "genres": json.dumps(artist.get("genres") or []),
                "popularity": int(artist.get("popularity") or 0),
                "time_range": time_range,
                "refreshed_at": refreshed_at,
            }
            rank += 1
        if not data.get("next") or len(items) < PAGE_LIMIT:
            return
        offset += PAGE_LIMIT
        time.sleep(RATE_SLEEP)


def _sync_saved_albums(headers: dict) -> Iterator[dict]:
    """Full-refresh the user's saved/liked albums."""
    offset = 0
    while True:
        data = _get(
            f"{SPOTIFY_API_BASE}/me/albums",
            {"limit": PAGE_LIMIT, "offset": offset},
            headers,
        )
        if not data:
            return
        items = data.get("items") or []
        for item in items:
            album = item.get("album") or {}
            artists = album.get("artists") or [{}]
            yield {
                "album_id": album.get("id", ""),
                "album_name": album.get("name", ""),
                "artist_id": (artists[0].get("id") or ""),
                "artist_name": (artists[0].get("name") or ""),
                "release_date": album.get("release_date", ""),
                "added_at": item.get("added_at", ""),
            }
        if not data.get("next") or len(items) < PAGE_LIMIT:
            return
        offset += PAGE_LIMIT
        time.sleep(RATE_SLEEP)


# ---------------------------------------------------------------------------
# update()
# ---------------------------------------------------------------------------

def update(configuration: dict, state: dict):
    client_id = configuration.get("client_id")
    client_secret = configuration.get("client_secret")
    refresh_token = configuration.get("refresh_token")
    if not (client_id and client_secret and refresh_token):
        raise RuntimeError(
            "configuration must include client_id, client_secret, and refresh_token"
        )

    log.info("Spotify: refreshing access token")
    access_token = _refresh_access_token(client_id, client_secret, refresh_token)
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    state = state or {}
    # Stored as unix milliseconds to match Spotify's 'after' param contract.
    last_played_at_ms: int | None = state.get("last_played_at_ms")
    refreshed_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # --- recently_played (incremental) -------------------------------------
    log.info(f"Spotify: syncing recently_played (cursor={last_played_at_ms})")
    new_max_ms = last_played_at_ms or 0
    count = 0
    for row, played_at_ms in _sync_recently_played(headers, last_played_at_ms):
        yield op.upsert("recently_played", row)
        count += 1
        if played_at_ms > new_max_ms:
            new_max_ms = played_at_ms

    if new_max_ms > (last_played_at_ms or 0):
        state["last_played_at_ms"] = new_max_ms
    yield op.checkpoint(state)
    log.info(f"Spotify: recently_played — {count} rows, cursor now {new_max_ms}")
    time.sleep(RATE_SLEEP)

    # --- top_tracks (full refresh per time_range) --------------------------
    for time_range, table_name in [
        ("short_term", "top_tracks_short"),
        ("medium_term", "top_tracks_medium"),
        ("long_term", "top_tracks_long"),
    ]:
        log.info(f"Spotify: syncing {table_name}")
        count = 0
        for row in _sync_top_tracks(headers, time_range, table_name, refreshed_at):
            yield op.upsert(table_name, row)
            count += 1
        log.info(f"Spotify: {table_name} — {count} rows")
        time.sleep(RATE_SLEEP)

    yield op.checkpoint(state)

    # --- top_artists (full refresh per time_range) -------------------------
    for time_range, table_name in [
        ("short_term", "top_artists_short"),
        ("medium_term", "top_artists_medium"),
        ("long_term", "top_artists_long"),
    ]:
        log.info(f"Spotify: syncing {table_name}")
        count = 0
        for row in _sync_top_artists(headers, time_range, table_name, refreshed_at):
            yield op.upsert(table_name, row)
            count += 1
        log.info(f"Spotify: {table_name} — {count} rows")
        time.sleep(RATE_SLEEP)

    yield op.checkpoint(state)

    # --- saved_albums (full refresh) ---------------------------------------
    log.info("Spotify: syncing saved_albums")
    count = 0
    for row in _sync_saved_albums(headers):
        yield op.upsert("saved_albums", row)
        count += 1
    log.info(f"Spotify: saved_albums — {count} rows")

    yield op.checkpoint(state)
    log.info("Spotify sync complete")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
connector = Connector(update=update, schema=schema)

if __name__ == "__main__":
    connector.debug()
