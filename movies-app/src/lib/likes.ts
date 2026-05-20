"use client";

import { useEffect, useState, useCallback } from "react";

const LS_KEY = "liner-notes:likes:v1";
const BROADCAST_EVENT = "liner-notes:likes-changed";

function albumKey(director: string, title: string) {
  return `${director}__${title}`;
}

function readSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function writeSet(s: Set<string>) {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(Array.from(s)));
    window.dispatchEvent(new Event(BROADCAST_EVENT));
  } catch {
    // ignore quota errors
  }
}

export function useLikes() {
  const [likes, setLikes] = useState<Set<string>>(() => new Set());

  // Hydrate from localStorage on mount
  useEffect(() => {
    setLikes(readSet());
    function onChange() {
      setLikes(readSet());
    }
    window.addEventListener(BROADCAST_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(BROADCAST_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const isLiked = useCallback(
    (director: string, title: string) => likes.has(albumKey(director, title)),
    [likes]
  );

  const toggle = useCallback((director: string, title: string) => {
    const next = new Set(readSet());
    const key = albumKey(director, title);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    writeSet(next);
    setLikes(next);
  }, []);

  return { likes, isLiked, toggle, count: likes.size };
}

// Community vote counts intentionally not implemented as a simulation.
// The /voting page shows real localStorage hearts only. A real community
// version is the next iteration — votes write to a Snowflake table, dbt
// aggregates nightly, the leaderboard reads from a gold mart.
