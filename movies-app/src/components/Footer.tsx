import Link from "next/link";

const BUILD_YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="border-t border-ink/15 px-5 pt-14 pb-12 sm:px-6 md:px-16">
      <div className="mx-auto max-w-6xl">

        {/* Colophon top row — editorial identity */}
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between mb-10">
          <div>
            <p className="eyebrow eyebrow--quiet mb-3">
              Peter's Movies &middot; Volume 1
            </p>
            <p className="serif text-2xl sm:text-3xl font-light text-ink/90 leading-snug max-w-md italic">
              It's not what you look at that matters; it's what you see.
            </p>
            <p className="serif mt-3 text-base note">
              Curated by Peter Chletsos · — Henry David Thoreau
            </p>
          </div>

          <nav
            className="flex flex-col gap-3"
            aria-label="Footer navigation"
          >
            <a
              href="https://github.com/fivetran-jasonchletsos/Peters-Must-See-Movies"
              target="_blank"
              rel="noopener noreferrer"
              className="eyebrow note hover:text-accent min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              GitHub
            </a>
            <a
              href="https://www.omdbapi.com"
              target="_blank"
              rel="noopener noreferrer"
              className="eyebrow note hover:text-accent min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              OMDB API
            </a>
            <a
              href="https://www.fivetran.com"
              target="_blank"
              rel="noopener noreferrer"
              className="eyebrow note hover:text-accent min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              Fivetran
            </a>
          </nav>
        </div>

        {/* Divider */}
        <div className="border-t border-ink/10 pt-6" />

        {/* Colophon bottom — typographic credit and build info */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5">
            <p className="eyebrow eyebrow--small eyebrow--quiet">
              Set in Fraunces and JetBrains Mono
            </p>
            <p className="eyebrow eyebrow--small eyebrow--quiet">
              Built with Next.js &middot; Tailwind CSS &middot; Fivetran &middot; dbt &middot; Iceberg &middot; CloudFront
            </p>
          </div>
          <div className="text-right">
            <p className="eyebrow eyebrow--small eyebrow--quiet">
              v1.0 &middot; {BUILD_YEAR}
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
}
