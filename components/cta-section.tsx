"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function CTASection() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-lg"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Subtle background glow */}
          <div
            className="pointer-events-none absolute inset-0 opacity-30 dark:opacity-20"
            style={{
              background:
                "radial-gradient(ellipse at 70% 50%, var(--primary) 0%, transparent 60%)",
            }}
          />

          <div className="relative z-10 flex flex-col items-center text-center px-8 py-16 md:py-20">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">
              East Point Academic Systems
            </p>

            <h2 className="mb-5 text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
              Ready to Elevate <br className="hidden sm:block" />
              <span className="text-primary">Student Performance?</span>
            </h2>

            <p className="mx-auto mb-10 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Join East Point in leveraging state-of-the-art AI-powered analytics to help students
              achieve their academic potential. Simple to deploy, powerful to use.
            </p>

            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="gap-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-md font-semibold px-8 transition-all duration-200"
              >
                <Link href="/register">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-lg border-border/60 font-semibold px-8 transition-all duration-200 hover:bg-muted/60"
              >
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
