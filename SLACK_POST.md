# Slack Post Drafts — LinerNotes ODI Demo

---

## SHORT VERSION (~5 lines, for #general)

Built a thing over the last couple weeks: a personal music curation site powered by a real ODI stack (Fivetran connectors, dbt, Iceberg, CloudFront). 125 albums I actually stand behind, with curator notes and Pitchfork scores pulled in for the ones that have them.

Live site: https://fivetran-jasonchletsos.github.io/LinerNotes-ODI-Demo/

The data architecture is all wired up — hit /architecture for the lineage diagram and DQ scorecard, or /wizard for a guided tour. The live warehouse ingestion is the next iteration; the canon itself is the real thing.

If you've got albums that should be on here, send them my way.

---

## LONG VERSION (~10-12 lines, for SE-focused channel)

Built a personal music curation site as the latest ODI demo. Same pattern as FinServ-ODI-Demo and Dropbox-ODI-Demo — Fivetran connector SDK, dbt project with staging/silver/gold layers, Iceberg storage, CloudFront delivery — except the source data is 125 albums I actually chose, with notes I actually wrote.

Live site: https://fivetran-jasonchletsos.github.io/LinerNotes-ODI-Demo/
Repo: https://github.com/fivetran-jasonchletsos/LinerNotes-ODI-Demo

Two custom connector SDK connectors (Spotify and MusicBrainz), dbt project with 91 tests, real album art from MusicBrainz Cover Art Archive (114 out of 125 matched), and Pitchfork scores wired in for the 98 albums that have reviews. The front end has sort by year or artist, decade filter, search, and a cover-size toggle.

For a demo: /architecture has the full SVG lineage graph and a data quality scorecard. /pipeline shows connector and dbt model status. Every page has a /wizard button for the guided tour — useful if you want to walk a prospect through it without babysitting the nav.

One honest caveat: the data layer is scaffolded and the pipeline code is real, but it's not currently running against a live warehouse. The album canon and curator notes are the genuine article; live ingestion is iteration two.

If you've got albums your colleagues swear by that aren't on here, send them over — I'm looking at the next 25 slots.
