import type { Metadata } from "next"
import { Toaster } from "sonner"
import { NavHeader } from "@/components/nav-header"
import "./globals.css"

export const metadata: Metadata = {
  title: "Geräteverwaltung",
  description: "Verwaltung von Geräten und Ausleihen",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-background antialiased">
        <NavHeader />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  )
}
