"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";

const PASSWORD = "Elektra1948";
const STORAGE_AUTH = "pete-add-authed";
const STORAGE_LIST = "pete-pending-additions";
const ISSUE_URL = "https://github.com/fivetran-jasonchletsos/Peters-Must-See-Movies/issues/new";

type Submission = {
  title: string;
  year: string;
  director: string;
  why: string;
  submitted_at: string;
};

export default function AddPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [pending, setPending] = useState<Submission[]>([]);
  const [justAdded, setJustAdded] = useState<Submission | null>(null);

  // Read auth state + pending list from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(STORAGE_AUTH) === "yes") {
      setAuthed(true);
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_LIST);
      if (raw) setPending(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  function tryUnlock(e: FormEvent) {
    e.preventDefault();
    if (password === PASSWORD) {
      window.localStorage.setItem(STORAGE_AUTH, "yes");
      setAuthed(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const sub: Submission = {
      title:    String(data.get("title") || "").trim(),
      year:     String(data.get("year") || "").trim(),
      director: String(data.get("director") || "").trim(),
      why:      String(data.get("why") || "").trim(),
      submitted_at: new Date().toISOString(),
    };
    if (!sub.title) return;

    // Save locally so Pete sees it immediately
    const next = [sub, ...pending];
    setPending(next);
    window.localStorage.setItem(STORAGE_LIST, JSON.stringify(next));
    setJustAdded(sub);

    // Open a pre-filled GitHub issue in a new tab so Jason can merge it to the canon
    const issueTitle = `Pete suggests: ${sub.title}${sub.year ? ` (${sub.year})` : ""}`;
    const issueBody = [
      `**Title:** ${sub.title}`,
      sub.year     ? `**Year:** ${sub.year}` : "",
      sub.director ? `**Director:** ${sub.director}` : "",
      "",
      sub.why ? `**Pete's note:**\n${sub.why}` : "",
      "",
      `Submitted from /add at ${sub.submitted_at}.`,
    ]
      .filter(Boolean)
      .join("\n");

    const url =
      `${ISSUE_URL}?` +
      new URLSearchParams({
        title: issueTitle,
        body: issueBody,
        labels: "movie-submission,from-pete",
      }).toString();

    window.open(url, "_blank", "noopener,noreferrer");
    form.reset();
  }

  if (!authed) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-xl px-6 py-16 sm:py-24">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-3">
            Must See / Add
          </p>
          <h1 className="serif text-3xl sm:text-4xl text-ink leading-tight mb-4">
            For Pete.
          </h1>
          <p className="text-ink/70 text-lg leading-relaxed mb-8">
            Enter the password to add a film to the suggestion list.
          </p>
          <form onSubmit={tryUnlock} className="space-y-4">
            <label className="block">
              <span className="block font-mono text-xs uppercase tracking-[0.25em] text-ink/50 mb-2">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(false);
                }}
                autoFocus
                className="w-full text-lg px-4 py-3 bg-ink/5 border border-ink/20 rounded text-ink focus:outline-none focus:border-accent"
              />
            </label>
            {passwordError && (
              <p className="text-accent text-sm">That's not the password.</p>
            )}
            <button
              type="submit"
              className="px-5 py-3 text-lg font-medium bg-accent text-ink rounded hover:bg-ember transition"
            >
              Unlock
            </button>
          </form>
          <p className="text-ink/40 text-sm mt-10">
            <Link href="/" className="underline underline-offset-4 hover:text-accent">← Back to the list</Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-3">
          Must See / Add
        </p>
        <h1 className="serif text-3xl sm:text-4xl text-ink leading-tight mb-3">
          Add a film to the list.
        </h1>
        <p className="text-ink/70 text-lg leading-relaxed mb-10">
          Welcome, Pete. Type a film below and click "Submit." Your suggestion is saved here
          on your screen right away, and a note is opened so Jason can add it to the
          canonical list.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 mb-12">
          <div>
            <label htmlFor="title" className="block font-mono text-xs uppercase tracking-[0.25em] text-ink/50 mb-2">
              Title <span className="text-accent">*</span>
            </label>
            <input
              id="title"
              name="title"
              required
              autoFocus
              className="w-full text-lg px-4 py-3 bg-ink/5 border border-ink/20 rounded text-ink focus:outline-none focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="year" className="block font-mono text-xs uppercase tracking-[0.25em] text-ink/50 mb-2">
                Year
              </label>
              <input
                id="year"
                name="year"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full text-lg px-4 py-3 bg-ink/5 border border-ink/20 rounded text-ink focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label htmlFor="director" className="block font-mono text-xs uppercase tracking-[0.25em] text-ink/50 mb-2">
                Director
              </label>
              <input
                id="director"
                name="director"
                className="w-full text-lg px-4 py-3 bg-ink/5 border border-ink/20 rounded text-ink focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="why" className="block font-mono text-xs uppercase tracking-[0.25em] text-ink/50 mb-2">
              Why does it deserve a spot?
            </label>
            <textarea
              id="why"
              name="why"
              rows={4}
              className="w-full text-lg px-4 py-3 bg-ink/5 border border-ink/20 rounded text-ink focus:outline-none focus:border-accent"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-3 text-lg font-medium bg-accent text-ink rounded hover:bg-ember transition"
          >
            Submit suggestion
          </button>
        </form>

        {justAdded && (
          <div className="mb-10 p-5 border border-accent/40 bg-accent/5 rounded">
            <p className="serif text-lg text-ink mb-1">
              Saved: <span className="italic">{justAdded.title}</span>
              {justAdded.year ? ` (${justAdded.year})` : ""}
            </p>
            <p className="text-ink/60 text-sm">
              A new tab opened with a pre-filled note for Jason. If it didn't open,
              that's okay — your suggestion is still saved here.
            </p>
          </div>
        )}

        {pending.length > 0 && (
          <div>
            <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-ink/50 mb-4">
              Your suggestions so far
            </h2>
            <ul className="space-y-3">
              {pending.map((s, i) => (
                <li
                  key={i}
                  className="p-4 border border-ink/10 rounded"
                >
                  <p className="serif text-lg text-ink">
                    {s.title}
                    {s.year ? ` (${s.year})` : ""}
                    {s.director ? ` — dir. ${s.director}` : ""}
                  </p>
                  {s.why && <p className="text-ink/70 mt-1 text-base leading-relaxed">{s.why}</p>}
                  <p className="text-ink/30 text-xs font-mono mt-2">
                    {new Date(s.submitted_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-ink/40 text-sm mt-12">
          <Link href="/" className="underline underline-offset-4 hover:text-accent">← Back to the list</Link>
        </p>
      </div>
    </main>
  );
}
