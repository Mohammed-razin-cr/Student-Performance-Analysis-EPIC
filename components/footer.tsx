"use client"

import Link from "next/link"

const footerLinks = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Use", href: "#" },
  { label: "Support", href: "#" },
]

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/40 backdrop-blur-sm py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Branding */}
          <div className="flex flex-col items-center gap-1 md:items-start">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-sm bg-primary flex items-center justify-center">
                <span className="text-[8px] font-bold text-primary-foreground">EP</span>
              </div>
              <span className="text-sm font-semibold text-foreground tracking-tight">EPIC</span>
              <span className="text-xs text-muted-foreground/50">v1.2</span>
            </div>
            <p className="text-xs text-muted-foreground/60 max-w-[220px] text-center md:text-left leading-relaxed">
              East Point Performance Intelligence &amp; Analytics Dashboard
            </p>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs font-medium text-muted-foreground/60 hover:text-primary transition-colors duration-150"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-border/30 flex justify-center md:justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground/40">
            © {new Date().getFullYear()} EPIC Intelligence. Built for East Point Academic Systems.
          </p>
          <p className="text-xs text-muted-foreground/30 hidden md:block">
            Powered by AI &amp; Next.js
          </p>
        </div>
      </div>
    </footer>
  )
}
