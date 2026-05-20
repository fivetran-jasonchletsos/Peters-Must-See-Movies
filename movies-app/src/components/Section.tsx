export default function Section({
  number,
  title,
  blurb,
  children
}: {
  number: string;
  title: string;
  blurb?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-5 py-12 sm:px-6 sm:py-16 md:px-16 md:py-20">
      {/* Ornament divider */}
      <div className="mx-auto max-w-6xl mb-10 sm:mb-14">
        <div className="section-ornament">
          <span
            className="font-mono text-[10px] text-paper/20 tracking-widest select-none"
            aria-hidden="true"
          >
            &#x2042;
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-3 sm:mb-12 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-accent sm:text-xs">
              {number}
            </p>
            <h2 className="serif mt-2 text-3xl font-light text-paper sm:text-4xl md:text-5xl leading-[1.1]">
              {title}
            </h2>
          </div>
          {blurb ? (
            <p className="max-w-md serif text-sm text-paper/50 sm:text-base md:text-right leading-relaxed italic">
              {blurb}
            </p>
          ) : null}
        </div>
        {children}
      </div>
    </section>
  );
}
