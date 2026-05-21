# Must See — Peter Chletsos's Must See Movies

> "It's not what you look at that matters; it's what you see." — Henry David Thoreau

A site for Peter Chletsos's list of must-see movies, built as an ODI demo on the Fivetran + dbt + Snowflake stack.

Live: https://fivetran-jasonchletsos.github.io/Peters-Must-See-Movies/

## What's here

- **The List** — 57 films Peter says you should see. Each card opens a detail view with the curator's note, year, director, and IMDb / Letterboxd links.
- **Stats** — by-the-numbers breakdown of the list.
- **Blink** — the 17 Doctor Who DVDs that carried the Doctor's Easter-egg commentary in the 2007 episode "Blink." Peter wanted to add them but didn't know the titles; here they are.
- **Submit** — pitch a film for the list. Snowflake Cortex returns a (snobby) verdict referencing films already on Peter's shelf.
- **Picks** — heart any poster on the site; your picks aggregate here.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS, Fraunces + JetBrains Mono via next/font
- Static export, mobile-first
- ODI story: TMDB + OMDB → Fivetran connectors → Snowflake gold marts → dbt-Snowflake transforms → CloudFront / GitHub Pages

## Setup

```bash
cd movies-app
npm install
npm run dev
```

## Deploy

```bash
cd movies-app
NEXT_PUBLIC_BASE_PATH=/Peters-Must-See-Movies npm run build
# out/ is ready to drop into S3 or push to a gh-pages branch
```
