# Refreshing the submissions ticker

The `/submit` page renders a live ticker of recent Cortex verdicts. It
merges two data sources:

1. `public/recent_submissions.json` — a snapshot the site bundles
2. `localStorage` writes from `SubmissionRejector` — verdicts the viewer
   has generated in their own browser

The seed JSON is what every visitor sees. There are three paths to keep
it fresh:

## Path 1: real Snowflake backend (recommended)

A Cloudflare Worker accepts submissions and writes to Snowflake. See
`scripts/submissions-worker.template.ts` for the Worker code and the
Snowflake table definition.

Once the Worker is deployed:

1. Add `NEXT_PUBLIC_SUBMISSIONS_URL=https://<your-worker>.workers.dev/submissions`
   to `.env.local`.
2. Rebuild + deploy. The ticker now reads live data from Snowflake every
   60s. `recent_submissions.json` becomes unused.

## Path 2: managed form receiver → Fivetran → Snowflake

Point the Cortex rejector at a Tally / Formspree webhook. Use Fivetran's
existing Tally / Formspree connectors to ingest into a Snowflake table.
Export the table to `public/recent_submissions.json` daily via dbt + a
small node script. Commit, redeploy.

## Path 3: keep it bundled

Hand-edit `public/recent_submissions.json` whenever you want a fresh
batch. The simplest option; useful for stage demos when you want a
controlled set of verdicts.
