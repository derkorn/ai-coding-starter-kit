"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function NavHeader() {
  const pathname = usePathname()

  const links = [
    { href: "/", label: "Geräte" },
    { href: "/loans", label: "Aktive Ausleihen" },
    { href: "/stats", label: "Statistiken" },
    { href: "/import", label: "Import" },
  ]

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-8 px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Geräteverwaltung
        </Link>
        <nav className="flex items-center gap-1" aria-label="Hauptnavigation">
          {links.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
