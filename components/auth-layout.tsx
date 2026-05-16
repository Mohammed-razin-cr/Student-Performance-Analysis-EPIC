"use client"

import type React from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import styles from "./auth-layout.module.css"
import { ChevronLeft } from "lucide-react"

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div
          className={`${styles.gridBackground} absolute inset-0 opacity-[0.1]`}
        />
      </div>

      {/* Header */}
      <header className="fixed left-0 right-0 top-0 z-50 p-6">
        <div className="container mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Link>
          <Link
            href="/"
            className="text-2xl font-black tracking-tighter bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
          >
            EPIC
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-24">
        {children}
      </main>
    </div>
  )
}
