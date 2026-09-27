"use client";

import Link from "next/link";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/rankings", label: "Rankings" },
  { href: "/fort", label: "Fort Tracker" },
  { href: "/mge", label: "MGE" },
  { href: "/teleport", label: "Pass 7 Teleport" },
  { href: "/admin", label: "Admin" },
];

export default function NavBar() {
  return (
    <nav className="border-b border-hairline bg-panel">
      <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="font-display text-2xl tracking-[0.2em] text-brassBright">
          KINGDOM 2194
        </Link>
        <div className="flex gap-6 font-mono text-sm">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-steel hover:text-brassBright transition-colors">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
