import Link from "next/link";

const BUILD_YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="border-t border-paper/10 px-5 pt-12 pb-10 sm:px-6 md:px-16">
      <div className="mx-auto max-w-6xl">

        {/* Colophon top row — editorial identity */}
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between mb-10">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-paper/30 mb-3">
              Must See &middot; Volume 1
            </p>
            <p className="serif text-2xl font-light text-paper/80 leading-snug max-w-xs italic">
              What awesome music looks like.
            </p>
            <p className="serif mt-2 text-sm text-paper/40">
              Curated by Pete Chletsos
            </p>
          </div>

          <nav
            className="flex flex-col gap-2"
            aria-label="Footer navigation"
          >
            <a
              href="https://github.com/fivetran-jasonchletsos/LinerNotes-ODI-Demo"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] uppercase tracking-[0.25em] text-paper/35
                transition hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              GitHub
            </a>
            <a
              href="https://developer.spotify.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] uppercase tracking-[0.25em] text-paper/35
                transition hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              TMDB for Developers
            </a>
            <a
              href="https://www.fivetran.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] uppercase tracking-[0.25em] text-paper/35
                transition hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              Fivetran
            </a>
          </nav>
        </div>

        {/* Divider */}
        <div className="border-t border-paper/8 pt-6" />

        {/* Colophon bottom — typographic credit and build info */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-paper/25">
              Set in Fraunces and JetBrains Mono
            </p>
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-paper/20">
              Built with Next.js &middot; Tailwind CSS &middot; Fivetran &middot; dbt &middot; Iceberg &middot; CloudFront
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-paper/20">
              v1.0 &middot; {BUILD_YEAR}
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
}
