"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, BarChart3, ShieldCheck } from "lucide-react"
import Link from "next/link"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      damping: 28,
      stiffness: 90,
    },
  },
}

const badges = [
  { icon: BarChart3, text: "AI-Powered Analytics" },
  { icon: ShieldCheck, text: "Secure & Compliant" },
]

export function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden pt-16">
      {/* Subtle background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--foreground) 1px, transparent 1px), linear-gradient(to bottom, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Soft radial glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-20 dark:opacity-15"
        style={{ background: "radial-gradient(ellipse at center, var(--primary) 0%, transparent 65%)" }}
      />

      <div className="container mx-auto px-4 py-24 md:py-36 relative z-10">
        <motion.div
          className="flex flex-col items-center text-center max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Institution Badge */}
          <motion.div variants={itemVariants}>
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-border bg-card/80 px-4 py-2 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
              {badges.map(({ icon: Icon, text }) => (
                <span key={text} className="flex items-center gap-1.5">
                  <Icon className="h-3 w-3 text-primary" />
                  <span>{text}</span>
                </span>
              ))}
            </div>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            className="mb-5 text-4xl font-bold leading-[1.15] tracking-tight text-foreground md:text-5xl lg:text-6xl"
            variants={itemVariants}
          >
            Student Performance Intelligence
            <br />
            <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Powered by AI
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="mb-2 text-sm font-medium uppercase tracking-widest text-primary/70"
            variants={itemVariants}
          >
            East Point College of Higher Education
          </motion.p>

          {/* Description */}
          <motion.p
            className="mb-10 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg"
            variants={itemVariants}
          >
            EPIC delivers institutional-grade analytics to help faculty identify at-risk students early,
            track academic progress, and make data-driven decisions that elevate outcomes.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col gap-3 sm:flex-row"
            variants={itemVariants}
          >
            <Button
              asChild
              size="lg"
              className="gap-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-primary/20 transition-all duration-200 font-semibold"
            >
              <Link href="/login">
                Access Platform
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-lg border-border/70 bg-card/50 hover:bg-muted/60 font-semibold transition-all duration-200"
            >
              <Link href="/register">Create Account</Link>
            </Button>
          </motion.div>

          {/* Trust line */}
          <motion.p
            className="mt-8 text-xs text-muted-foreground/60"
            variants={itemVariants}
          >
            Trusted by faculty &amp; administrators at East Point Academic Systems
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}
