# Liner Notes — 10-Minute ODI Demo (SE script)

Personal music persona built on the LinerNotes-ODI-Demo. Audience: data-platform buyer
or technical champion at a company where the DBA or data engineer says "we already have
a warehouse, why would we go open?" The hook: this is *Jason's personal Spotify data*,
not a fabricated enterprise scenario — and the architecture under it is the same one
we'd use for their company.

---

## The one sentence I'm selling

> Fivetran ODI turned Jason's Spotify history and a curated album list into a governed,
> testable Snowflake lakehouse — with dbt shaping the gold layer and Snowflake Cortex
> Analyst reading it — and the app you're about to see reads off that lakehouse right now.

---

## The audience

Someone who's evaluating Fivetran for data ingestion and needs to see what the full
stack looks like when Fivetran owns the connector layer but doesn't own the warehouse.
They probably have Snowflake already and are curious about what "open" actually means
in practice.

If they lead with "what about governance" — go to `/architecture` earlier.
If they lead with "show me the data" — stay on the persona pages longer.

## The setup line (verbatim)

> "This is my personal music site. I have a list of albums I claim to love. I also
> have a Spotify account that knows exactly what I've been listening to. The interesting
> question is whether those two things agree. Let's find out."

That's the whole frame. No architecture slide up front. The demo earns it by minute 7.

## Pre-flight (T-5 min)

- `npm run dev` against the committed snapshot — site loads in under 2 seconds.
- Zoom 110%. Notifications off. Close Slack.
- Confirm `/architecture` engine tabs all swap correctly.
- If presenting over Zoom, share the browser tab, not the desktop.

---

## Minute-by-minute (0:00 to 10:00)

### 0:00 — `/` — The Canon lands (45 sec)

Open the homepage. The album grid populates.

> "This is the canon. Every album on this list earned its place — I wrote a note on each
> one. There are no bad albums here, allegedly. The site exists to make the argument for
> each record and to keep me honest about whether I actually still listen to what I
> claim to love."

Scroll slowly through the grid. Point at a few covers.

> "Cover art and metadata come from MusicBrainz — the open music encyclopedia. Spotify
> provides everything about my listening. Two data sources, two Fivetran custom
> connectors, one lake. We'll see the plumbing in a few minutes."

### 1:00 — Click one album — Canon detail (45 sec)

Click an album you actually listen to (or one you should be embarrassed about).

> "Each card shows when I last played it, how many times I've played it in the last
> 30 days, and whether it's in my saved library. That last column is the tell — if I
> put an album on the canon but never saved it, I have some explaining to do."

Point at the play count.

> "This number comes from a dbt mart — `marts.canon`. It's not a live Spotify query.
> It's a tested, versioned gold table that refreshes on each sync. The site reads a
> pre-built JSON snapshot. The architecture is solid before the first page loads."

### 2:00 — `/now-spinning` — Recent plays (45 sec)

Navigate to Now Spinning.

> "Last 50 plays. Timestamps, track names, albums. This is the raw edge — closest to
> what the Spotify API actually returns. The Fivetran connector hits the recently-played
> endpoint, deduplicates on `(played_at, track_id)` in a dbt silver intermediate,
> and lands the clean version in the `fct_plays` gold table."

Scroll briefly.

> "Notice the variety — or the lack of it. We'll come back to that."

### 3:00 — `/most-played` — Top tracks and artists (1 min)

Navigate to Most Played. The three time windows load.

> "Short term — last four weeks. Medium term — last six months. Long term — all time.
> These are Spotify's own time windows from the top-tracks and top-artists endpoints.
> The connector pulls all three on each sync, lands them as separate rows in
> `raw_spotify.top_tracks` with a `time_range` column, and dbt's `mart_top_tracks`
> aggregates them."

Point at the short-term vs. long-term columns side by side.

> "The interesting comparison is short versus long. My long-term top artists are my
> taste. My short-term top artists are what I've been stress-listening to for the last
> month. These don't always agree."

### 4:00 — `/faves-vs-reality` — The honest page (1 min)

Navigate to Faves vs. Reality.

> "This is the page I built the whole thing for. Left column: albums on the canon,
> sorted by how seriously I take them. Right column: how many times I've actually played
> them in the last 90 days. The gap between those two columns is the entire point."

Scroll slowly. Let the audience spot the discrepancy.

Two outcomes — pick your line based on what the data shows:

**If you've been listening to your canon:**
> "The data says I'm putting in the reps. The albums I claim to love are actually
> getting played. The canon holds up. This is the rare case where the argument and
> the evidence agree."

**If you haven't:**
> "The data caught me slacking. I have nine albums on the canon that I haven't played
> once in the last 90 days. This is what happens when you build a system that keeps
> you honest and then run the system."

Either way:
> "The logic behind this page is one dbt mart — `marts.mart_faves_vs_reality`. It joins
> the canon seed table to `fct_plays`, aggregates by album, and computes the delta.
> If I want to change what counts as 'recent,' I change the WHERE clause in a SQL file.
> That's it."

### 5:00 — `/top-artists` — Genre and taste map (45 sec)

Navigate to Top Artists if there's a visual breakdown by genre.

> "Across the three windows you can see the genre drift. My long-term taste is more
> consistent than my short-term. The `dim_artists` gold table has a genres array pulled
> from Spotify's artist object — that's how we can group by genre without a separate
> API call."

Move quickly. This page supports the "it's a real data model" point; it's not the money
slide.

### 6:00 — `/pipeline` — Four layers, tested (1 min)

Navigate to Pipeline.

> "Four layers. Raw landed by Fivetran — two connectors, one for Spotify, one for
> MusicBrainz, both delivering to Snowflake. Staging built by dbt-Snowflake: views
> that rename and type-cast, plus two intermediate models for deduplication and canon
> enrichment. Gold is Snowflake tables — materialized, tested, clustered. The app reads
> a JSON snapshot extracted from gold by a build script."

Point at the test counts.

> "dbt tests guard the gold layer. If a canonical album lands in the `fct_plays` fact
> with a `NULL` `played_at` — that's a test failure. Gold doesn't promote bad rows.
> The pipeline page shows you the last run timestamp and pass/fail counts by layer."

Optional: simulate a failure if the button is wired up.

> "That's what a bad sync looks like. The silver intermediate fails, gold doesn't
> update, and the snapshot stays on the last clean version. The site keeps working.
> The data doesn't lie."

### 7:00 — `/architecture` — The money slide (90 sec)

Navigate to Architecture. Scroll to the diagram. Slow down here.

> "This is the page I want you to remember. Spotify on the left, MusicBrainz on the
> left. Two Fivetran Connector SDK connectors. Data lands in Snowflake — raw schemas,
> one per source. dbt-Snowflake on the raw-to-staging edge, dbt-Snowflake on the
> staging-to-gold edge. Gold tables are Snowflake tables, tested, versioned, clustered."

Point at the Cortex Analyst callout on the page.

> "Between the gold marts and the app sits Snowflake Cortex Analyst. That's the AI
> layer — natural-language questions answered by SQL generated and executed inside
> Snowflake. Same tested columns the rest of the site reads. No separate vector index,
> no copy of the data, no external API call."

Pause.

> "The stack is Fivetran for ingest, Snowflake for storage and compute, dbt for
> governed transformation, and Cortex Analyst for the AI layer. Each piece does one
> thing. The architecture page shows where each piece sits and what it touches."

### 8:00 — The ODI thesis (45 sec)

Stay on the architecture page. No clicks.

> "The thesis is that the data layer and the AI layer should read the same source of
> truth. The gold tables are tested on every dbt run. If a test fails, the snapshot
> stays on the last clean version. Cortex Analyst reads the same tested columns.
> The AI isn't getting a PDF summary of the data — it's getting the data."

> "Fivetran brings it in. Snowflake holds it. dbt governs the shape.
> Cortex Analyst interprets it. That's the whole stack — and it shows it on something
> real, my actual Spotify history and my actual taste in music."

> "The same pattern that runs here runs on your data."

### 9:00 — `/wizard` — AI on the lakehouse (45 sec)

Navigate to the AI Wizard page if implemented.

> "The AI reads the Snowflake gold layer directly. Not a vector search over PDFs, not
> a summary of a summary — Cortex Analyst generates SQL against the semantic model on
> the marts, runs it inside Snowflake, and returns a structured answer.
> Ask it something like 'what artist do I listen to most in the last month that isn't
> on the canon' and it gives you a number. The lakehouse is the truth. Cortex Analyst
> reads the truth."

If the Wizard page isn't built yet, skip to Q&A and pick up 60 seconds.

### 10:00 — Close (handoff)

> "That's the ten. Two APIs, two connectors, Snowflake as the lakehouse. dbt on both
> transform edges. Cortex Analyst on the AI layer. The app reads a snapshot that
> Snowflake built. And the data kept me honest about what I actually listen to versus
> what I say I love."

> "The story your data is telling about you is in Snowflake. The question is whether
> your architecture governs that data well enough to trust it — as a dashboard source,
> and as an AI source. This is what that looks like. Where do you want to dig in?"

Hand back to AE.

---

## Talking-points cheat sheet (10 one-liners)

1. "Two APIs, two custom Fivetran connectors, one Snowflake lakehouse."
2. "The canon is the claim. The play counts are the evidence. dbt reconciles them."
3. "Raw is Spotify and MusicBrainz landed by Fivetran. Staging is cleaned and conformed.
   Gold is tested, versioned Snowflake tables — the only layer the app touches."
4. "fct_plays is an append-only fact table in Snowflake. The history is permanent. The
   window is a WHERE clause."
5. "dbt tests guard the gold layer. A bad sync fails in staging and doesn't promote.
   The app keeps serving the last clean snapshot."
6. "Snowflake is the lakehouse. dbt-Snowflake is the transform engine. Cortex Analyst
   is the AI layer. Each reads the same tested gold tables."
7. "Cortex Analyst generates SQL against the semantic model, runs it inside Snowflake,
   and returns a structured answer. No external API call. No vector index."
8. "The AI Wizard reads the gold layer. Not a PDF summary. Not a vector blob.
   Tested mart columns, interpreted by Cortex Analyst."
9. "Fivetran lands it. Snowflake holds it. dbt governs the shape. Cortex reads the truth."
10. "The data said I'm either putting in the reps or it caught me slacking.
    Either way, the system worked."

---

## Likely objections + responses

| They say | You say |
|---|---|
| "We already have Snowflake — great, so does this demo." | "Exactly. This is the pattern you'd run in your Snowflake account. Fivetran lands the raw data, dbt-Snowflake governs the transform, Cortex Analyst reads the gold layer. Everything here is already in your stack or available in your Snowflake contract." |
| "Spotify data isn't real enterprise data." | "The connectors and the lakehouse pattern are identical whether the source is Spotify or Salesforce or a proprietary ERP. The persona is personal so it's legible in a 10-minute demo. The architecture is exactly what we'd build for your production pipeline." |
| "Can we run this on our own Snowflake account?" | "That's exactly how it's designed. Point the Fivetran destination at your Snowflake account, run dbt-Snowflake with your credentials, and the same gold tables appear. The SPA hosting stays on CloudFront — that's the only AWS piece." |
| "What about cost?" | "Snowflake at demo scale with an XS warehouse set to auto-suspend is roughly $10-20/month. CloudFront serves the static SPA for pennies. The real Snowflake cost driver is warehouse size and query frequency — you dial both." |
| "How do I know dbt tests are actually running?" | "The pipeline page shows last run timestamp and test pass/fail counts by layer. The GitHub Actions workflow log is the audit trail. If you want alerting, dbt Cloud or a Snowflake task trigger can notify on failure." |

---

## Hard guardrails

- Lead with the canon and the persona. Never open the Fivetran sync UI to a technical
  buyer on a first demo.
- The architecture page earns its place. Don't jump there before minute 7.
- Always say "Snowflake" — not just "the warehouse." The specifics matter here.
- The faves-vs-reality page requires a live read of what the data actually shows.
  Look at it before the call. Know which outcome you're delivering.
- Don't promise the AI Wizard page is live if it isn't built yet. Skip the section
  and spend the time on architecture or Q&A.
- Synthetic snapshot is the offline fallback. If asked: "the committed snapshot is
  deterministic synthetic data so the demo runs without Snowflake credentials. The
  live path reads the same shapes from Snowflake."
