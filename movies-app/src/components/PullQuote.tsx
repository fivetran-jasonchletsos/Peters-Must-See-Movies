// PullQuote — full-width editorial interruption between film grid sections.
// Rendered as a grid-spanning element (col-span-full) inside the film grid.

export default function PullQuote({
  quote,
  attribution,
}: {
  quote: string;
  attribution: string;
}) {
  return (
    <blockquote
      className="col-span-full border-t border-ink/10 py-10 sm:py-14 md:py-16"
      aria-label={`Pull quote: ${quote}`}
    >
      <div className="max-w-4xl mx-auto px-2">
        <p
          className="pull-quote text-4xl leading-[1.12] text-ink/90 sm:text-5xl md:text-6xl"
          style={{ fontStyle: "italic", fontWeight: 300 }}
        >
          &ldquo;{quote}&rdquo;
        </p>
        <footer className="mt-5">
          <cite className="font-mono text-[9px] uppercase tracking-[0.35em] text-accent/70 not-italic">
            {attribution}
          </cite>
        </footer>
      </div>
    </blockquote>
  );
}
