"use client"
import styles from "./navbar.module.css"

import { useState } from "react"
import { motion, AnimatePresence, type Variants } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Menu, X, User, LogOut } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/contexts/AuthContext"
import { logOut } from "@/lib/auth"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "sonner"

const navLinks = [
  { name: "Home", href: "/" },
  { name: "About", href: "#about" },
  { name: "Features", href: "#features" },
  { name: "Contact", href: "#contact" },
]

const navVariants: Variants = {
  hidden: { opacity: 0, y: -8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
}

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    try {
      await logOut()
      toast.success("Logged out successfully")
      router.push("/")
    } catch {
      toast.error("Failed to log out")
    }
  }

  if (pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin")) {
    return null
  }

  return (
    <motion.nav
      className={`${styles.navbar} fixed top-3 left-1/2 z-50 -translate-x-1/2 w-[92vw] max-w-4xl rounded-xl flex items-center justify-between px-4 sm:px-5 py-2.5 transition-all duration-300 glass-navbar`}
      variants={navVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
          <span className="text-[11px] font-bold text-primary-foreground tracking-tight">EP</span>
        </div>
        <span className={`${styles["navbar-logo"]} text-base font-semibold text-foreground tracking-tight`}>
          EPIC
        </span>
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-1">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-150 px-3 py-1.5 rounded-md hover:bg-muted/60"
          >
            {link.name}
          </Link>
        ))}
      </div>

      {/* Desktop Actions */}
      <div className="hidden md:flex items-center gap-2">
        {!loading && (
          user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/8 border border-primary/12">
                <User className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {user.displayName || user.email?.split("@")[0]}
                </span>
              </div>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-sm font-medium rounded-md hover:bg-muted/60"
              >
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-sm font-medium rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Logout
              </Button>
            </div>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/login")}
                className="text-sm font-medium rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground"
              >
                Sign In
              </Button>
              <Button
                size="sm"
                onClick={() => router.push("/register")}
                className="text-sm font-medium rounded-md bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              >
                Get Started
              </Button>
            </>
          )
        )}
        <ThemeToggle />
      </div>

      {/* Mobile: Theme + Hamburger */}
      <div className="flex items-center gap-1 md:hidden">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <AnimatePresence mode="wait">
            {isMobileMenuOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="h-4 w-4" />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Menu className="h-4 w-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="absolute top-14 left-0 right-0 mx-auto w-full rounded-xl bg-card/95 dark:bg-card/95 backdrop-blur-2xl shadow-xl border border-border/60 p-4 flex flex-col gap-1 md:hidden"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 rounded-md hover:bg-muted/60 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="border-t border-border/50 pt-3 mt-2 flex flex-col gap-2">
              {!loading && (
                user ? (
                  <>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/40">
                      <User className="h-3.5 w-3.5 text-primary" />
                      <span className="text-sm font-medium">
                        {user.displayName || user.email?.split("@")[0]}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full rounded-md text-sm justify-start"
                      onClick={() => { router.push("/dashboard"); setIsMobileMenuOpen(false); }}
                    >
                      Dashboard
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full rounded-md text-sm justify-start text-muted-foreground"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-3.5 w-3.5 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="w-full rounded-md text-sm"
                      onClick={() => { router.push("/login"); setIsMobileMenuOpen(false); }}
                    >
                      Sign In
                    </Button>
                    <Button
                      className="w-full rounded-md text-sm"
                      onClick={() => { router.push("/register"); setIsMobileMenuOpen(false); }}
                    >
                      Get Started
                    </Button>
                  </>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
