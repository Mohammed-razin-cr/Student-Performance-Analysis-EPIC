"use client"

import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

// Small spinner for buttons
export function SpinnerLoader({ className = "" }: { className?: string }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    >
      <Loader2 className={`h-4 w-4 ${className}`} />
    </motion.div>
  )
}

// Dots loader for inline loading
export function DotsLoader({ color = "current" }: { color?: string }) {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: color === "current" ? "currentColor" : color }}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

// Pulse loader for cards
export function PulseLoader({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: 24, md: 40, lg: 60 }
  const s = sizes[size]

  return (
    <div className="flex items-center justify-center" style={{ width: s, height: s }}>
      <motion.div
        className="absolute rounded-full bg-primary/30"
        style={{ width: s, height: s }}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
      />
      <motion.div
        className="rounded-full bg-gradient-to-br from-violet-500 to-cyan-500"
        style={{ width: s / 2, height: s / 2 }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  )
}

// Skeleton with shimmer
export function ShimmerSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-slate-800/50 ${className}`}>
      <motion.div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent)",
        }}
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      />
    </div>
  )
}

// Card loading skeleton
export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
      <div className="flex items-center gap-4">
        <ShimmerSkeleton className="w-12 h-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <ShimmerSkeleton className="h-4 w-32" />
          <ShimmerSkeleton className="h-3 w-24" />
        </div>
      </div>
      <ShimmerSkeleton className="h-20 w-full" />
      <div className="flex gap-2">
        <ShimmerSkeleton className="h-8 w-20" />
        <ShimmerSkeleton className="h-8 w-20" />
      </div>
    </div>
  )
}

// Dashboard stats skeleton
export function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div 
          key={i} 
          className="rounded-xl border border-slate-800 bg-slate-900/50 p-6"
        >
          <div className="flex items-center justify-between">
            <ShimmerSkeleton className="h-4 w-24" />
            <ShimmerSkeleton className="h-8 w-8 rounded-lg" />
          </div>
          <ShimmerSkeleton className="h-8 w-16 mt-4" />
          <ShimmerSkeleton className="h-3 w-20 mt-2" />
        </div>
      ))}
    </div>
  )
}

// Data loading overlay
export function LoadingOverlay({ message = "Loading..." }: { message?: string }) {
  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 backdrop-blur-sm"
      style={{ background: "rgba(0, 0, 0, 0.7)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative w-16 h-16"
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            border: "3px solid transparent",
            borderTopColor: "#8b5cf6",
            borderRightColor: "#06b6d4",
          }}
        />
      </motion.div>
      <motion.p
        className="text-sm text-slate-400"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {message}
      </motion.p>
    </motion.div>
  )
}

// Page transition loader
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}
