"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { num: "01", href: "/", label: "The List" },
  { num: "02", href: "/timeline", label: "Timeline" },
  { num: "03", href: "/analytics", label: "Stats" },
  { num: "04", href: "/blink", label: "Blink" },
  { num: "05", href: "/submit", label: "Submit" },
  { num: "06", href: "/voting", label: "Picks" },
  { num: "07", href: "/add", label: "For Pete" },
];

export default function TopNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname?.startsWith(href + "/");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-x-6 gap-y-2 px-4 py-3 overflow-x-auto sm:px-6 sm:py-4 md:px-10">
        <Link
          href="/"
          className="flex-none flex items-center gap-2.5 serif text-lg text-ink hover:text-accent
            focus:outline-none focus:ring-2 focus:ring-accent/40 sm:text-xl"
          aria-label="Must See home"
        >
          <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true" className="flex-none">
            <circle cx="16" cy="16" r="14" fill="#1a1a1a" stroke="#f5f1ea" strokeWidth="0.5" opacity="0.9" />
            <circle cx="16" cy="16" r="11" fill="none" stroke="#f5f1ea" strokeWidth="0.4" opacity="0.25" />
            <circle cx="16" cy="16" r="5" fill="#d94f3a" />
            <circle cx="16" cy="16" r="1.4" fill="#0a0a0a" />
          </svg>
          <span className="hidden sm:inline">Must See</span>
        </Link>

        <nav
          aria-label="Primary"
          className="flex flex-1 flex-nowrap items-center gap-x-5 sm:gap-x-7"
        >
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="group flex flex-none items-baseline gap-2 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-2 focus:ring-offset-ink"
              >
                <span
                  className={
                    "font-mono text-xs tracking-[0.25em] uppercase " +
                    (active ? "text-accent" : "text-accent/60")
                  }
                >
                  {item.num}
                </span>
                <span
                  className={
                    "serif text-base sm:text-lg transition-colors " +
                    (active ? "text-ink" : "text-ink/70 group-hover:text-ink")
                  }
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
