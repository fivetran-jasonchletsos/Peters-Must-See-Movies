# AGENTS.md

Operator guide for AI coding assistants working in this repo. Keep brief.

## What this is

Liner Notes is Jason Chletsos's personal music site — a hand-picked album canon paired with
live Spotify listening data. The repo is also a Fivetran ODI demo: two custom connectors
(Spotify Web API, MusicBrainz) land data into Snowflake via Fivetran, dbt-Snowflake
transforms it into a governed gold layer, Snowflake Cortex Analyst provides natural-language
query capability, and the Next.js SPA reads a pre-built JSON snapshot off CloudFront.

Stack: Fivetran (ingest) + Snowflake (lakehouse) + dbt-Snowflake (transform) + Snowflake
Cortex Analyst (AI layer) + CloudFront/S3 (SPA hosting).

## Repo layout

| Dir | What |
|---|---|
| `connectors/spotify/` | Fivetran Connector SDK — recently played, top tracks, top artists, saved library. `connector.py` + `configuration.json` + `requirements.txt`. |
| `connectors/musicbrainz/` | Fivetran Connector SDK — album/artist metadata for the curated canon. Same structure. |
| `infra/` | Terraform — S3 SPA bucket, CloudFront distribution, IAM for SPA hosting. Snowflake objects (database, warehouse, roles) provisioned separately. |
| `transform/` | dbt project `liner_notes_odi` on Snowflake. Layers: `models/staging` (source declarations + views), `models/marts` (facts, dims, marts as Snowflake tables). |
| `liner-notes-app/` | Next.js 14 (App Router) + TypeScript + Tailwind. **Off-limits to backend agents** — another agent owns the UI. |
| `liner-notes-app/scripts/` | `build_snapshot.py` (Snowflake gold layer → JSON), `_synthetic.py` (deterministic fallback when Snowflake isn't configured). |
| `scripts/deploy.sh` | One-shot orchestrator: terraform → fivetran → dbt → snapshot → build → deploy. Supports `--skip=infra,fivetran,dbt,snapshot,build,deploy`. |

## Run the demo locally (no creds)

```bash
cd liner-notes-app && npm ci && npm run dev
```

The committed snapshot under `liner-notes-app/public/data/` covers the full canon,
synthetic play history, and fabricated top-track/top-artist data. The full site works.

## Regenerate the snapshot

```bash
cd liner-notes-app && python scripts/build_snapshot.py
```

With Snowflake creds (`SNOWFLAKE_ACCOUNT`, `SNOWFLAKE_USER`, `SNOWFLAKE_PASSWORD`, etc.) it
queries the gold layer. Without, it falls back to `_synthetic.py` (seed=42, stable).

## Adding a 3rd data source

1. `cp -r connectors/musicbrainz connectors/<new_source>` and rewrite `connector.py`.
   Keep `schema()` flat — Snowflake handles column type inference cleanly from flat schemas.
2. Add a bronze source block + a `silver/stg_<new>__*.sql` staging model. Mirror the
   field-rename pattern from existing stg files.
3. If it enriches the canon, join through `silver/int_canon_enriched.sql`.
4. Surface in `gold/` as a fact, dimension, or mart column.
5. Extend `build_snapshot.py` to write the new JSON key; update the frontend data contract.

## Snowflake SQL notes (already audited clean)

- `DATEADD('day', -90, CURRENT_DATE)` — standard Snowflake date arithmetic.
- `CURRENT_DATE` / `CURRENT_TIMESTAMP` — no parentheses needed in Snowflake either.
- `::` cast syntax is fine in Snowflake (e.g. `x::double`).
- `EXTRACT(epoch_second FROM ts)` — Snowflake epoch extraction.
- Gold models use `cluster_by` instead of `partitioned_by` — Snowflake's equivalent.
- MusicBrainz IDs are UUIDs — keep them as `varchar`, not `uuid` type.

## Talking points the site supports

| Pillar | Page |
|---|---|
| Governed ingest (Fivetran Connector SDK, two sources) | `/pipeline` |
| Snowflake as the lakehouse (raw schemas, staging views, gold tables) | `/architecture` |
| dbt-Snowflake transform with full test coverage | `/architecture` |
| Snowflake Cortex Analyst — AI over tested mart columns | `/wizard` |
| Reusable semantics (one metric definition, many consumers) | `transform/metrics/liner_notes_metrics.yml` |

## Guardrails

Never commit secrets or real `.tfvars`. Spotify tokens are user-bound OAuth — never
commit access or refresh tokens. Don't reformat dbt SQL. Frontend belongs to another agent.
