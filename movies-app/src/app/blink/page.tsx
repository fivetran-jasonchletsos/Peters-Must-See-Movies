import Link from "next/link";
import { blinkDVDs } from "@/lib/blink";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blink — The 17 DVDs · Must See",
  description:
    "The 17 Doctor Who DVDs that carried the Doctor's Easter-egg commentary in 'Blink'. Pete's list said he'd add them if he knew the titles — here they are.",
};

export default function BlinkPage() {
  return (
    <main className="min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-paper/10 px-5 py-4 sm:px-6 md:px-16">
        <div className="mx-auto max-w-6xl flex items-center gap-3">
          <Link href="/" className="font-mono text-[10px] uppercase tracking-[0.3em] text-paper/40 transition hover:text-accent">
            Must See
          </Link>
          <span className="font-mono text-[10px] text-paper/20">/</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-paper/70">Blink</span>
        </div>
      </div>

      {/* Hero */}
      <header className="border-b border-paper/10 px-5 py-8 sm:px-6 sm:py-10 md:px-16 md:py-14">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
            Must See / Bonus — Doctor Who
          </p>
          <h1 className="serif mt-2 text-3xl font-light leading-tight text-paper sm:text-4xl md:text-5xl">
            Don't blink.
          </h1>
          <p className="serif mt-4 max-w-2xl text-base italic text-paper/75 leading-relaxed sm:text-lg">
            "I could have added the 17 DVDs in Doctor Who's <em>Blink</em>, but I have no idea
            what their titles are." — Pete Chletsos
          </p>
          <p className="serif mt-3 max-w-2xl text-sm text-paper/55 leading-relaxed">
            In the 2007 episode <em>Blink</em>, the Doctor's prerecorded half of a conversation
            with Sally Sparrow appeared as Easter-egg commentary on 17 Doctor Who DVDs that
            were available at the time. Here is the best-effort canonical list.
          </p>
        </div>
      </header>

      {/* List */}
      <section className="px-5 py-12 sm:px-6 md:px-16 md:py-16">
        <div className="mx-auto max-w-6xl">
          <ol className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {blinkDVDs.map((dvd) => (
              <li
                key={dvd.position}
                className="flex flex-col gap-2 border border-paper/10 bg-paper/5 p-5 transition hover:border-accent hover:bg-paper/10"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
                    {dvd.position.toString().padStart(2, "0")} / 17
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-paper/40">
                    {dvd.year}
                  </span>
                </div>
                <h2 className="serif text-xl text-paper leading-snug">{dvd.title}</h2>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper/45">
                  {dvd.doctor}
                </p>
                <p className="serif mt-1 text-sm text-paper/65 leading-snug">{dvd.note}</p>
              </li>
            ))}
          </ol>

          <p className="mt-12 font-mono text-[9px] uppercase tracking-[0.28em] text-paper/30 max-w-2xl">
            The exact 17-DVD list from the Blink Easter egg is debated. This is reconstructed
            from on-screen credits and fan listings. Pete can update.
          </p>
        </div>
      </section>

      <div className="border-t border-paper/10 px-5 py-8 sm:px-6 md:px-16">
        <div className="mx-auto max-w-6xl">
          <Link href="/" className="font-mono text-[10px] uppercase tracking-[0.25em] text-paper/50 hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent/40">
            ← Back to the list
          </Link>
        </div>
      </div>
    </main>
  );
}
