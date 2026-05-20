export default function GroupMarker({
  label,
  count,
  sub,
}: {
  label: string;
  count: number;
  sub?: string;
}) {
  return (
    <div
      className="col-span-full pt-6 pb-2"
      aria-label={`${label} — ${count} films`}
    >
      <div className="flex items-baseline gap-5 border-t-2 border-ink/15 pt-5">
        <h2 className="serif text-5xl font-light leading-none text-ink sm:text-6xl md:text-7xl tracking-tight">
          {label}
        </h2>
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent">
            {count} {count === 1 ? "record" : "records"}
          </span>
          {sub ? (
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-ink/35">
              {sub}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
