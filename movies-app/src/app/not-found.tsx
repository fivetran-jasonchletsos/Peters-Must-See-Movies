import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 sm:px-6 md:px-16">
      <div className="mx-auto max-w-xl text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
          Error / 404
        </p>
        <h1 className="serif mt-4 text-6xl leading-none text-ink sm:text-8xl">
          Side not found.
        </h1>
        <p className="serif mt-6 text-lg text-ink/60">
          This track isn't in the list. Try flipping the record.
        </p>
        <Link
          href="/"
          className="mt-10 inline-block border border-ink/20 px-6 py-3
            font-mono text-[10px] uppercase tracking-[0.25em] text-ink/70
            transition hover:border-accent hover:text-accent
            focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          Back to Side A
        </Link>
      </div>
    </main>
  );
}
